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
  //
  // Les onglets sont exclus, et c'est le motif d'onglets du guide ARIA qui le
  // veut : la barre n'offre qu'un arrêt de tabulation, ses autres onglets
  // s'atteignant aux flèches. Le test des onglets couvre ce parcours.
  const boutons = page.locator('main button:not([role="tab"])')
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

  // La recherche est bornée à la section : le résumé du panier affiche lui
  // aussi son total dans cette variante.
  const total = page.locator('[aria-labelledby="titre-prix"] .c-price--total')

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

  expect(familles.corps).toContain('Figtree')
  expect(familles.titre).toContain('Fredoka')
  expect(familles.chargees).toContain('Fredoka')

  // Le cache des navigateurs est partitionné par site depuis 2020 : un lien vers
  // un hébergeur de polices n'apporte aucun gain et ajoute une requête bloquante.
  expect(requetes.filter((url) => /fonts\.(googleapis|gstatic)\.com/.test(url))).toEqual([])
})

test('une option se coche par son étiquette, pas seulement par sa case', async ({ page }) => {
  await page.goto('/workshop')
  await waitForHydration(page)

  // La recherche est bornée à la section : le groupe d'options propose lui
  // aussi le retrait des oignons.
  const section = page.locator('[aria-labelledby="titre-option"]')
  const option = section.getByRole('checkbox', { name: 'Sans oignons' })
  await expect(option).not.toBeChecked()

  // Le clic porte sur le texte, hors de la case : l'enveloppement par
  // l'étiquette est ce qui rend toute la ligne cliquable.
  await section.getByText('Sans oignons').click()

  await expect(option).toBeChecked()
})

test('un supplément affiche son prix à côté de son libellé', async ({ page }) => {
  await page.goto('/workshop')

  // La recherche est bornée à la section : le groupe d'options montre lui aussi
  // le supplément bacon, avec son prix.
  const bacon = page
    .locator('[aria-labelledby="titre-option"]')
    .locator('.c-option', { hasText: 'Bacon' })

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

test('une carte de produit est une cible unique, et refuse l’indisponible', async ({ page }) => {
  await page.goto('/workshop')
  await waitForHydration(page)

  // La recherche est bornée à la section : le sélecteur de quantité nomme lui
  // aussi « Le Classique » sur ses deux boutons.
  const section = page.locator('[aria-labelledby="titre-carte"]')
  const classique = section.getByRole('button', { name: /Le Classique/ })
  await expect(classique).toHaveCount(1)

  // La région d'annonce de l'atelier, et non celles du résumé du panier, qui
  // portent l'état du panier.
  const annonce = page.locator('[aria-labelledby="titre-annonce"] [role="status"]')

  // L'appui porte sur le visuel, loin du nom : toute la carte est la cible.
  await classique.locator('img').click()
  await expect(annonce).toHaveText('Le Classique sélectionné')

  const montagnard = section.getByRole('button', { name: /Le Montagnard/ })
  await expect(montagnard).toHaveAttribute('aria-disabled', 'true')
  await expect(montagnard).toContainText('Indisponible')

  await montagnard.click({ force: true })
  await expect(annonce).toHaveText('Le Classique sélectionné')
})

test('les cartes d’une rangée ont la même hauteur, visuel bord à bord', async ({ page }) => {
  await page.goto('/workshop')

  const cartes = page.locator('[aria-labelledby="titre-carte"] .c-product-card')
  await expect(cartes).toHaveCount(5)

  const mesures = await cartes.evaluateAll((elements) =>
    elements.map((element) => {
      const visuel = element.querySelector('.c-product-image')
      return {
        hauteur: Math.round(element.getBoundingClientRect().height),
        haut: Math.round(element.getBoundingClientRect().top),
        largeurVisuel: Math.round(visuel?.getBoundingClientRect().width ?? 0),
        largeurInterieure: Math.round(element.clientWidth),
      }
    }),
  )

  // Les quatre premières cartes forment une rangée : un nom sur deux lignes ne
  // doit pas rendre sa carte plus haute que ses voisines, sans quoi la rangée
  // part en escalier.
  const rangee = mesures.filter((mesure) => mesure.haut === mesures[0]!.haut)
  expect(rangee.length).toBeGreaterThan(1)
  for (const mesure of rangee) expect(mesure.hauteur).toBe(rangee[0]!.hauteur)

  // Le visuel occupe toute la largeur intérieure de la carte : une
  // photographie entourée de marges perd la moitié de sa force.
  for (const mesure of mesures) expect(mesure.largeurVisuel).toBe(mesure.largeurInterieure)
})

test('un sélecteur de quantité compte, et refuse au-delà de la limite', async ({ page }) => {
  await page.goto('/workshop')
  await waitForHydration(page)

  // La recherche est bornée à la section : les lignes de panier portent elles
  // aussi un sélecteur de quantité nommant Le Classique.
  const section = page.locator('[aria-labelledby="titre-quantite"]')
  const valeur = section.locator('.c-quantity__value').first()
  await expect(valeur).toHaveText('2')

  await section.getByRole('button', { name: 'Augmenter la quantité de Le Classique' }).click()
  await expect(valeur).toHaveText('3')

  await section.getByRole('button', { name: 'Diminuer la quantité de Le Classique' }).click()
  await expect(valeur).toHaveText('2')

  const refus = section.getByRole('button', { name: /Augmenter la quantité de Le Végétal/ })
  await expect(refus).toHaveAttribute('aria-disabled', 'true')
  await expect(refus).toContainText('Maximum de 10 par ligne')
})

test('les onglets de catégories se parcourent aux flèches', async ({ page }) => {
  await page.goto('/workshop')
  await waitForHydration(page)

  const barre = page.getByRole('tablist', { name: 'Catégories de la carte' })
  const panneau = page.getByRole('tabpanel')

  await expect(barre.getByRole('tab')).toHaveCount(6)
  await expect(barre.getByRole('tab', { name: 'Burgers' })).toHaveAttribute('aria-selected', 'true')
  await expect(panneau).toContainText('Le Classique')

  // Un seul arrêt de tabulation dans la barre : les cinq autres onglets portent
  // `tabindex="-1"` et ne s'atteignent qu'aux flèches.
  await barre.getByRole('tab', { name: 'Burgers' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(barre.getByRole('tab', { name: 'Menus' })).toBeFocused()
  await expect(barre.getByRole('tab', { name: 'Menus' })).toHaveAttribute('aria-selected', 'true')

  await page.keyboard.press('End')
  const boissons = barre.getByRole('tab', { name: 'Boissons' })
  await expect(boissons).toBeFocused()
  await expect(boissons).toHaveAttribute('aria-selected', 'true')
  await expect(panneau).toContainText('Soda, 33 cl')
  // Le panneau porte le nom de l'onglet courant : c'est ce lien qui fait
  // annoncer la catégorie en entrant dans le contenu.
  await expect(panneau).toHaveAttribute('aria-labelledby', (await boissons.getAttribute('id'))!)

  // L'onglet courant ne se distingue pas par la seule couleur, critère WCAG
  // 1.4.1 : sa graisse et son ombre portée changent aussi.
  const marques = await boissons.evaluate((element) => {
    const style = getComputedStyle(element)
    return { graisse: style.fontWeight, ombre: style.boxShadow }
  })
  expect(Number(marques.graisse)).toBe(700)
  expect(marques.ombre).not.toBe('none')
})

test('les allergènes sont nommés en texte, et leur absence mentionnée', async ({ page }) => {
  await page.goto('/workshop')

  const section = page.locator('[aria-labelledby="titre-allergenes"]')
  const premiere = section.getByRole('list').first()

  // Exigence EF-008 : chaque allergène porte son libellé, aucun pictogramme ne
  // le remplace. La liste est un `ul`, pour que son nombre d'éléments soit
  // annoncé.
  // L'ordre est celui du règlement 1169/2011 — œufs avant lait — et non celui
  // des données du produit.
  // Les motifs tolèrent l'espace laissé par l'indentation du gabarit : une
  // comparaison par chaîne la compterait comme du texte.
  await expect(premiere.getByRole('listitem')).toHaveText([
    /^\s*Gluten\s*$/,
    /^\s*Œufs\s*$/,
    /^\s*Lait\s*$/,
    /^\s*Moutarde\s*$/,
    /^\s*Graines de sésame\s*$/,
    /^\s*Anhydride sulfureux et sulfites\s*$/,
  ])
  await expect(premiere.locator('svg, img')).toHaveCount(0)

  await expect(
    section.getByText('Aucun allergène des quatorze catégories réglementaires.'),
  ).toBeVisible()

  // Histoire 5 : l'allergène venu d'un supplément est signalé par un mot, pas
  // par une couleur.
  const venuDuSupplement = section.locator('.c-allergens__source')
  await expect(venuDuSupplement).toHaveText('apporté par un supplément')
  await expect(venuDuSupplement.locator('..')).toContainText('Lait')
})

test('un groupe d’options est annoncé par sa légende, et son total vient du domaine', async ({
  page,
}) => {
  await page.goto('/workshop')
  await waitForHydration(page)

  const section = page.locator('[aria-labelledby="titre-groupe"]')
  const ajouter = section.getByRole('group', { name: 'Ajouter' })

  // Le `fieldset` rattache chaque case à son groupe : « Bacon » appartient aux
  // ajouts, « Sans cornichons » aux retraits.
  await expect(ajouter.getByRole('checkbox', { name: /Bacon/ })).toBeChecked()
  await expect(section.getByRole('group', { name: 'Retirer' })).toBeVisible()

  const total = section.locator('.c-option-group__total')
  await expect(total).toContainText(/1,20\s€/)

  await ajouter.getByRole('checkbox', { name: /Cheddar/ }).check()

  // 1,20 € et 0,80 € : la somme est calculée par `extrasTotalCents`, le
  // composant ne fait que l'afficher.
  await expect(total).toContainText(/2,00\s€/)

  // Un produit sans personnalisation ne produit pas de groupe vide.
  await expect(section.getByRole('group')).toHaveCount(2)
})

test('les tailles de menu se parcourent aux flèches, un seul arrêt de tabulation', async ({
  page,
}) => {
  await page.goto('/workshop')
  await waitForHydration(page)

  const groupe = page.getByRole('group', { name: 'Taille du menu' })
  const tailles = groupe.getByRole('radio')
  await expect(tailles).toHaveCount(3)

  // Le nom accessible porte la lettre, le forfait et ce que la taille comprend.
  await expect(tailles.nth(2)).toHaveAccessibleName(/XL/)
  await expect(tailles.nth(2)).toHaveAccessibleName(/grand format/)
  await expect(tailles.nth(2)).toHaveAccessibleName(/Dessert/)

  const retenue = groupe.getByRole('radio', { checked: true })
  await expect(retenue).toHaveCount(1)
  await retenue.focus()

  // Comportement natif des boutons radio : la flèche change de taille, sans
  // appui supplémentaire.
  await page.keyboard.press('ArrowDown')
  await expect(tailles.nth(2)).toBeChecked()

  // Un seul arrêt de tabulation pour le groupe : Tab en sort, il ne passe pas
  // d'une taille à l'autre.
  await page.keyboard.press('Tab')
  await expect(tailles.nth(0)).not.toBeFocused()
  await expect(tailles.nth(1)).not.toBeFocused()
  await expect(tailles.nth(2)).not.toBeFocused()
})

test('deux lignes du même produit se distinguent par leurs mentions', async ({ page }) => {
  await page.goto('/workshop')
  await waitForHydration(page)

  const section = page.locator('[aria-labelledby="titre-ligne"]')
  const lignes = section.locator('.c-cart-line')
  await expect(lignes).toHaveCount(2)

  // Exigence EF-021 : le même produit, deux personnalisations, deux lignes.
  await expect(lignes.nth(0)).not.toContainText('Sans oignons')
  await expect(lignes.nth(1)).toContainText('Sans oignons')
  await expect(lignes.nth(1)).toContainText('Avec bacon')

  // Le prix de ligne vient du domaine : 5,90 € l'unité, deux articles.
  await expect(lignes.nth(0)).toContainText(/11,80\s€/)

  // Le bouton de retrait nomme sa ligne : un panier en compte plusieurs.
  const retrait = lignes.nth(0).getByRole('button', { name: 'Retirer Le Classique du panier' })
  await expect(retrait).toBeVisible()

  // Augmenter la quantité porte le total à 17,70 €, sans qu'aucune
  // multiplication soit écrite dans le composant.
  await lignes
    .nth(0)
    .getByRole('button', { name: /Augmenter la quantité/ })
    .click()
  await expect(lignes.nth(0)).toContainText(/17,70\s€/)
})

test('le résumé du panier refuse l’accès à vide et ne masque pas le focus', async ({ page }) => {
  await page.goto('/workshop')
  await waitForHydration(page)

  const section = page.locator('[aria-labelledby="titre-resume"]')
  const barres = section.locator('.c-cart-summary')
  await expect(barres).toHaveCount(2)

  // Panier rempli : les trois articles du spécimen précédent, soit deux
  // Classique nature à 5,90 € et un garni de bacon à 7,10 €. Le total vient de
  // `cartTotalCents`, la barre ne l'additionne pas.
  await expect(barres.nth(0)).toContainText('3 articles')
  await expect(barres.nth(0).locator('.c-price--total')).toHaveAttribute('value', '18.90')

  // Exigence EF-026 : l'accès est refusé et donne sa raison, sans sortir du
  // parcours de tabulation.
  const refus = barres.nth(1).getByRole('button')
  await expect(refus).toHaveAttribute('aria-disabled', 'true')
  await expect(refus).toContainText('Panier vide')
  await expect(barres.nth(1)).not.toContainText('0 article')

  // Critère WCAG 2.4.11 : la barre colle au bas du cadre, et la marge de
  // défilement garde au-dessus d'elle l'élément qui prend le focus.
  const mesures = await barres.nth(0).evaluate((element) => ({
    position: getComputedStyle(element).position,
    hauteur: element.getBoundingClientRect().height,
    marge: getComputedStyle(document.documentElement).scrollPaddingBottom,
  }))
  expect(mesures.position).toBe('sticky')
  expect(Number.parseFloat(mesures.marge)).toBeGreaterThanOrEqual(mesures.hauteur)
})

test('la hiérarchie des titres de l’atelier est continue', async ({ page }) => {
  await page.goto('/workshop')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Atelier des composants')
  // Les sections sont rangées par ordre alphabétique, pour qu'un composant
  // ajouté trouve sa place sans discussion.
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    'Bouton',
    'Carte de produit',
    "Étiquette d'état",
    "Groupe d'options",
    'Icône',
    'Ligne de panier',
    "Liste d'allergènes",
    'Montant',
    'Onglets de catégories',
    'Option à cocher',
    "Région d'annonce",
    'Résumé du panier',
    'Sélecteur de quantité',
    'Sélecteur de taille de menu',
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
