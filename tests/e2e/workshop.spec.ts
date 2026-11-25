import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { waitForHydration } from './hydration'

// L'atelier rassemble tous les composants livrés. Un audit sur cette page couvre
// donc, en une fois, ce que chaque composant apporte de balisage — et il le fait
// sur une page rendue, états d'interaction compris, ce qu'une analyse de fichiers
// source ne peut pas faire.

test('l’atelier ne présente aucune violation détectée par axe', async ({ page }) => {
  await page.goto('/workshop')

  const resultats = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  expect(resultats.violations).toEqual([])
})

test('chaque bouton de l’atelier est atteignable au clavier', async ({ page }) => {
  await page.goto('/workshop')

  // La recherche est bornée au contenu de la page : en développement, Nuxt
  // ajoute hors de `main` un bouton flottant qui n'appartient pas à l'atelier.
  const boutons = page.locator('main').getByRole('button')
  const total = await boutons.count()
  expect(total).toBeGreaterThan(0)

  const focusables = await page.locator('main button, main input, main a[href]').count()

  for (let rang = 0; rang < total; rang += 1) {
    const bouton = boutons.nth(rang)

    // Les boutons ne se suivent pas dans le parcours de tabulation : des cases
    // à cocher s'intercalent. On avance jusqu'au bouton visé, sans supposer
    // qu'il est le suivant.
    for (let essai = 0; essai < focusables; essai += 1) {
      if (await bouton.evaluate((element) => element === document.activeElement)) break
      await page.keyboard.press('Tab')
    }

    await expect(bouton).toBeFocused()
  }
})

test('un bouton indisponible garde sa place dans la tabulation et n’agit pas', async ({ page }) => {
  await page.goto('/workshop')

  const paiement = page.getByRole('button', { name: /Payer/ })

  // Critère WCAG 3.3.1 : la raison du refus doit être atteignable. Un bouton
  // retiré de la tabulation ne l'est pas.
  await expect(paiement).toHaveAttribute('aria-disabled', 'true')
  await expect(paiement).not.toHaveAttribute('disabled', '')
  await paiement.focus()
  await expect(paiement).toBeFocused()
  await expect(paiement).toContainText('Panier vide')

  await waitForHydration(page)
  // `force` est nécessaire : Playwright tient un élément portant
  // `aria-disabled="true"` pour désactivé et refuse de le cliquer. C'est
  // précisément ce que le composant veut dire, et le verrou est dans son
  // gestionnaire de clic, pas dans l'attribut.
  await paiement.click({ force: true })
  await expect(page.getByText('Aucun bouton activé.')).toBeVisible()
})

test('activer un bouton disponible est annoncé par une région polie', async ({ page }) => {
  await page.goto('/workshop')
  await waitForHydration(page)

  await page.getByRole('button', { name: 'Ajouter au panier' }).click()

  // La page compte deux régions polies : la note visible de ce spécimen, et la
  // région d'annonce invisible du spécimen suivant.
  const note = page.locator('.c-specimen__note[aria-live="polite"]')
  await expect(note).toHaveText('Bouton activé : Ajouter au panier.')
})

test('un montant est rendu en euros et porte sa valeur machine', async ({ page }) => {
  await page.goto('/workshop')

  const total = page.locator('.c-price--total')

  // Le séparateur avant le symbole est une espace insécable, dont le point de
  // code dépend de la version d'ICU du navigateur.
  await expect(total).toHaveText(/24,70\s€/)
  await expect(total).toHaveAttribute('value', '24.70')
})

test('un bouton reçoit un indicateur de focus visible', async ({ page }) => {
  await page.goto('/workshop')

  const bouton = page.getByRole('button', { name: 'Ajouter au panier' })
  // `:focus-visible` ne s'applique qu'à un focus clavier : un appui ne doit pas
  // marquer le bouton.
  await page.keyboard.press('Tab')
  await expect(bouton).toBeFocused()

  const indicateur = await bouton.evaluate((element) => {
    const style = getComputedStyle(element)
    return { outline: style.outlineWidth, ombre: style.boxShadow }
  })

  // L'indicateur vient de la couche `elements`, qui l'applique à tout élément
  // recevant le focus. Aucun composant ne le redéclare : ce test est ce qui
  // garantit qu'il arrive bien jusqu'au bouton.
  expect(Number.parseFloat(indicateur.outline)).toBeGreaterThan(0)
  expect(indicateur.ombre).not.toBe('none')
})

test('un bouton réduit à son icône garde un nom pour un lecteur d’écran', async ({ page }) => {
  await page.goto('/workshop')

  const bouton = page.getByRole('button', { name: 'Vider le panier' })
  await expect(bouton).toBeVisible()

  // Le nom vient d'un texte masqué à l'écran, pas de l'icône : aucune icône ne
  // porte seule le sens d'une action.
  await expect(bouton.locator('svg')).toHaveAttribute('aria-hidden', 'true')
})

test('une étiquette d’état porte son libellé et ne s’active pas', async ({ page }) => {
  await page.goto('/workshop')

  const indisponible = page.locator('.c-status--unavailable').first()

  await expect(indisponible).toHaveText('Indisponible')
  // Aucun rôle interactif : l'étiquette qualifie ce qui l'entoure.
  await expect(indisponible).not.toHaveAttribute('tabindex', /.*/)
})

test('les polices auto-hébergées sont chargées, sans requête à un tiers', async ({ page }) => {
  const requetes: string[] = []
  page.on('request', (requete) => requetes.push(requete.url()))

  await page.goto('/workshop')
  await page.waitForFunction(() => document.fonts.status === 'loaded')

  const familles = await page.evaluate(() => {
    const titre = document.querySelector('h1')
    return {
      corps: getComputedStyle(document.body).fontFamily,
      titre: titre === null ? '' : getComputedStyle(titre).fontFamily,
      chargees: [...document.fonts].map((face) => face.family),
    }
  })

  expect(familles.corps).toContain('Archivo')
  expect(familles.titre).toContain('Archivo Narrow')
  expect(familles.chargees).toContain('Archivo')

  // Le cache des navigateurs est partitionné par site depuis 2020 : un lien vers
  // un hébergeur de polices n'apporte aucun gain et ajoute une requête bloquante.
  expect(requetes.filter((url) => /fonts\.(googleapis|gstatic)\.com/.test(url))).toEqual([])
})

test('une option se coche par son étiquette, pas seulement par sa case', async ({ page }) => {
  await page.goto('/workshop')
  await waitForHydration(page)

  const option = page.getByRole('checkbox', { name: 'Sans oignons' })
  await expect(option).not.toBeChecked()

  // Le clic porte sur le texte, hors de la case : l'enveloppement par
  // l'étiquette est ce qui rend toute la ligne cliquable.
  await page.getByText('Sans oignons').click()

  await expect(option).toBeChecked()
})

test('un supplément affiche son prix à côté de son libellé', async ({ page }) => {
  await page.goto('/workshop')

  const bacon = page.getByText('Bacon', { exact: false }).first()

  await expect(bacon).toContainText(/1,20\s€/)
})

test('une alerte est portée par une région assertive, invisible à l’écran', async ({ page }) => {
  await page.goto('/workshop')
  await waitForHydration(page)

  const region = page.locator('[role="alert"]')
  await expect(region).toHaveText('')

  await page.getByRole('button', { name: 'Dépasser la limite' }).click()

  await expect(region).toHaveText('Quantité maximale atteinte')
  await expect(region).toHaveAttribute('aria-live', 'assertive')

  // Masquée à l'écran, mais jamais par `display: none`, qui la retirerait aussi
  // aux lecteurs d'écran. Playwright tient d'ailleurs la région pour visible,
  // et c'est exact : elle occupe un pixel découpé, elle n'est pas retirée du
  // rendu. La vérification porte donc sur ses dimensions réelles.
  const cadre = await region.boundingBox()
  expect(cadre?.width).toBeLessThanOrEqual(1)
  expect(cadre?.height).toBeLessThanOrEqual(1)
})

test('la hiérarchie des titres de l’atelier est continue', async ({ page }) => {
  await page.goto('/workshop')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Atelier des composants')
  // Les sections sont rangées par ordre alphabétique, pour qu'un composant
  // ajouté trouve sa place sans discussion.
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    'Bouton',
    "Étiquette d'état",
    'Icône',
    'Montant',
    'Option à cocher',
    "Région d'annonce",
    'Visuel de produit',
  ])
  // Aucun niveau sauté entre les titres : chaque h3 suit un h2.
  const niveaux = await page
    .locator('h1, h2, h3')
    .evaluateAll((titres) => titres.map((titre) => Number(titre.tagName.slice(1))))
  for (const [rang, niveau] of niveaux.entries()) {
    if (rang === 0) continue
    expect(niveau - niveaux[rang - 1]!).toBeLessThanOrEqual(1)
  }
})
