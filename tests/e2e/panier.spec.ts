import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { waitForHydration } from './hydration'

// Écran du panier, demande #125. Le titre, le retour et l'audit de l'écran vide
// sont vérifiés par `parcours.spec.ts` ; ce fichier porte ce qui lui est
// propre : les lignes, leur correction, les confirmations et le refus de payer
// un panier vide.

const CLASSIQUE = '/produit/classique'

/**
 * Ajoute un burger au panier depuis sa fiche, en cochant les options nommées.
 *
 * Le panier se remplit par le parcours réel, et non par une écriture directe
 * dans le stockage de session : un test qui court-circuite la fiche ne
 * vérifierait pas que les deux écrans s'accordent sur la forme d'une ligne.
 */
const ajouter = async (page: Page, options: readonly string[] = []) => {
  await page.goto(CLASSIQUE)
  await waitForHydration(page)

  for (const option of options) {
    await page.getByRole('checkbox', { name: new RegExp(option) }).check()
  }

  await page.getByRole('button', { name: /Ajouter au panier/ }).click()
  await expect(page).toHaveURL(/\/carte$/)
}

const ouvrirLePanier = async (page: Page) => {
  await page.goto('/panier')
  await waitForHydration(page)
}

/**
 * Le dialogue de confirmation, désigné par sa classe.
 *
 * `getByRole('dialog')` ne suffit pas : le panneau d'accueil de Nuxt DevTools
 * en est un aussi sur le serveur de développement, et le rôle à lui seul en
 * désigne deux.
 */
const confirmation = (page: Page) => page.locator('dialog.c-confirm')

/**
 * Le bouton de retrait de la ligne, distingué de celui du sélecteur de
 * quantité.
 *
 * À une unité, la corbeille du sélecteur porte le même nom accessible que le
 * bouton « Retirer » de la ligne — les deux demandent le même retrait. Les
 * tests désignent donc chacun par sa classe, faute de quoi le rôle et le nom
 * en désignent deux.
 */
const retraitDeLaLigne = (page: Page) => page.locator('.c-cart-line__controls > .c-button--quiet')

/** La corbeille du sélecteur de quantité, visible à une unité seulement. */
const corbeilleDuSelecteur = (page: Page) =>
  page.locator('.c-quantity .c-button--secondary').first()

test('un panier vide propose la carte plutôt qu’un cul-de-sac', async ({ page }) => {
  await ouvrirLePanier(page)

  await expect(page.locator('main')).toContainText('Votre panier est vide')
  await expect(page.getByRole('link', { name: 'Revenir à la carte' })).toBeVisible()

  // Exigence EF-026 : le paiement est refusé, et la raison est donnée. Le
  // bouton reste atteignable au clavier, critère WCAG 3.3.1, donc il est
  // présent et porte `aria-disabled`.
  const payer = page.getByRole('button', { name: /Payer/ })
  await expect(payer).toHaveAttribute('aria-disabled', 'true')
  await expect(payer).toContainText('Ajoutez un article pour payer')

  // `force` contourne le contrôle d'actionnabilité de Playwright, qui refuse
  // de cliquer un élément `aria-disabled`. C'est précisément ce que le test
  // doit provoquer : le verrou est dans le composant, et non dans le refus de
  // l'outil de test.
  await payer.click({ force: true })
  await expect(page).toHaveURL(/\/panier$/)
})

test('deux personnalisations du même produit forment deux lignes', async ({ page }) => {
  await ajouter(page, ['Bacon'])
  await ajouter(page, ['Cheddar'])

  await ouvrirLePanier(page)

  // Exigences EF-020 et EF-021 : sans la mention des suppléments, le panier
  // afficherait deux fois « Le Classique » et le client ne saurait pas
  // laquelle retirer.
  const lignes = page.locator('.c-cart-line')
  await expect(lignes).toHaveCount(2)
  await expect(lignes.first()).toContainText('Avec bacon')
  await expect(lignes.last()).toContainText('Avec cheddar')
})

test('le même produit personnalisé à l’identique rejoint sa ligne', async ({ page }) => {
  await ajouter(page, ['Bacon'])
  await ajouter(page, ['Bacon'])

  await ouvrirLePanier(page)

  await expect(page.locator('.c-cart-line')).toHaveCount(1)
  await expect(page.locator('.c-quantity__value')).toHaveText('2')
})

test('un retrait s’écrit en toutes lettres, pas en identifiant', async ({ page }) => {
  await page.goto(CLASSIQUE)
  await waitForHydration(page)
  await page.getByRole('checkbox', { name: /Oignons/ }).check()
  await page.getByRole('button', { name: /Ajouter au panier/ }).click()

  await ouvrirLePanier(page)

  // Le libellé vient du produit : « Sans oignons », et non « Sans onions ».
  await expect(page.locator('.c-cart-line')).toContainText('Sans oignons')
})

test('la quantité se corrige, et le total suit', async ({ page }) => {
  await ajouter(page)
  await ouvrirLePanier(page)

  const total = page.locator('.c-cart-summary .c-price--total')
  await expect(total).toHaveAttribute('value', '5.90')

  // Exigence EF-023 : la quantité se modifie depuis le panier.
  await page.getByRole('button', { name: /Augmenter la quantité/ }).click()
  await expect(page.locator('.c-quantity__value')).toHaveText('2')
  await expect(total).toHaveAttribute('value', '11.80')

  // Exigence EF-040 : chaque changement est annoncé, avec l'état du panier.
  await expect(page.locator('[aria-live="polite"]')).toContainText('Quantité portée à 2')

  await page.getByRole('button', { name: /Diminuer la quantité/ }).click()
  await expect(total).toHaveAttribute('value', '5.90')
})

test('la limite de dix unités par ligne refuse l’augmentation, avec sa raison', async ({
  page,
}) => {
  await ajouter(page)
  await ouvrirLePanier(page)

  const augmenter = page.getByRole('button', { name: /Augmenter la quantité/ })

  for (let unite = 1; unite < 10; unite += 1) await augmenter.click()

  await expect(page.locator('.c-quantity__value')).toHaveText('10')

  // Exigence EF-025 : la limite vient du domaine, et le bouton l'annonce au
  // lieu de laisser le client la découvrir par un refus.
  await expect(augmenter).toHaveAttribute('aria-disabled', 'true')
  await expect(augmenter).toContainText('Maximum 10 unités par article')

  await augmenter.click({ force: true })
  await expect(page.locator('.c-quantity__value')).toHaveText('10')
})

test('le retrait d’une ligne passe par une confirmation, et l’annulation la garde', async ({
  page,
}) => {
  await ajouter(page)
  await ouvrirLePanier(page)

  // Exigence EF-024 : le retrait est confirmé.
  await retraitDeLaLigne(page).click()

  const dialogue = confirmation(page)
  await expect(dialogue).toBeVisible()
  await expect(dialogue).toContainText('Retirer cet article ?')

  await dialogue.getByRole('button', { name: 'Annuler' }).click()
  await expect(page.locator('.c-cart-line')).toHaveCount(1)

  await retraitDeLaLigne(page).click()
  await dialogue.getByRole('button', { name: 'Retirer Le Classique' }).click()

  await expect(page.locator('.c-cart-line')).toHaveCount(0)
  await expect(page.locator('main')).toContainText('Votre panier est vide')
})

test('le focus revient au déclencheur après la fermeture d’une confirmation', async ({ page }) => {
  await ajouter(page)
  await ouvrirLePanier(page)

  const declencheur = retraitDeLaLigne(page)
  await declencheur.click()

  // Le bouton d'annulation précède le bouton destructeur : un appui machinal
  // sur Entrée annule, il ne supprime pas.
  await expect(confirmation(page).getByRole('button', { name: 'Annuler' })).toBeFocused()

  // Échap ferme le dialogue, et l'élément `<dialog>` natif rend le focus à son
  // déclencheur sans qu'une ligne de code s'en charge.
  await page.keyboard.press('Escape')
  await expect(confirmation(page)).toBeHidden()
  await expect(declencheur).toBeFocused()
})

test('décrémenter depuis une unité demande le retrait, il ne vide pas la ligne', async ({
  page,
}) => {
  await ajouter(page)
  await ouvrirLePanier(page)

  await corbeilleDuSelecteur(page).click()

  // Le sélecteur de quantité ne supprime rien de lui-même : il demande, et
  // l'écran confirme.
  await expect(confirmation(page)).toBeVisible()
  await expect(page.locator('.c-cart-line')).toHaveCount(1)
})

test('le vidage du panier est confirmé, et nomme ce qu’il détruit', async ({ page }) => {
  await ajouter(page, ['Bacon'])
  await ajouter(page, ['Cheddar'])

  await ouvrirLePanier(page)

  await page.locator('.c-cart__clear').getByRole('button', { name: 'Vider le panier' }).click()

  const dialogue = confirmation(page)
  await expect(dialogue).toContainText('Vider le panier ?')
  await expect(dialogue).toContainText('Tous les articles seront retirés')

  await dialogue.getByRole('button', { name: 'Vider le panier' }).click()

  await expect(page.locator('.c-cart-line')).toHaveCount(0)
  await expect(page.locator('[aria-live="polite"]')).toContainText('Panier vidé')
})

test('un menu se lit avec sa taille et ses substitutions', async ({ page }) => {
  await page.goto(CLASSIQUE)
  await waitForHydration(page)

  await page.getByRole('radio', { name: 'En menu' }).check()
  await page.getByRole('radio', { name: /Potatoes/ }).check()
  await page.getByRole('radio', { name: /Soda, 33 cl/ }).check()
  await page.getByRole('button', { name: /Ajouter au panier/ }).click()

  await ouvrirLePanier(page)

  const ligne = page.locator('.c-cart-line')
  await expect(ligne).toContainText('Menu M')

  // Les potatoes remplacent les frites comprises dans le forfait : la ligne
  // porte le remplacement et son supplément de 0,60 €, exigence EF-015. La
  // boisson comprise, elle, n'est pas mentionnée — le client n'a rien
  // remplacé.
  await expect(ligne).toContainText('Potatoes')
  await expect(ligne).not.toContainText('Soda')

  // 5,90 € de burger, 4,00 € de forfait M, 0,60 € de substitution.
  await expect(page.locator('.c-cart-summary .c-price--total')).toHaveAttribute('value', '10.50')
})

test('le panier rempli ne présente aucune violation détectée par axe', async ({ page }) => {
  await ajouter(page, ['Bacon'])
  await ouvrirLePanier(page)

  const resultats = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  expect(resultats.violations).toEqual([])
})

test('la confirmation ouverte ne présente aucune violation détectée par axe', async ({ page }) => {
  await ajouter(page)
  await ouvrirLePanier(page)

  await retraitDeLaLigne(page).click()
  await expect(confirmation(page)).toBeVisible()

  const resultats = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  expect(resultats.violations).toEqual([])
})
