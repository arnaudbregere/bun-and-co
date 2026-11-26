import { expect, test } from '@playwright/test'
import { waitForHydration } from './hydration'

// Fiche produit, demande #123. Le titre, le retour et l'audit axe sont
// vérifiés par `parcours.spec.ts` ; ce fichier porte ce qui lui est propre :
// les allergènes, les options, le prix qui suit, et l'ajout au panier.

const CLASSIQUE = '/produit/classique'

test('les allergènes sont donnés en toutes lettres', async ({ page }) => {
  await page.goto(CLASSIQUE)

  // Exigence EF-008 : un pictogramme d'épi ne nomme rien, et une personne
  // allergique ne devine pas un risque.
  const allergenes = page.locator('.c-allergens')
  await expect(allergenes).toContainText('Gluten')
  await expect(allergenes).toContainText('Moutarde')
})

test('les options sont des groupes nommés, pas des cases anonymes', async ({ page }) => {
  await page.goto(CLASSIQUE)

  // Exigences EF-017 et EF-018 : sans la légende, « bacon » suit « sans
  // cornichons » dans la même liste plate, et rien ne dit que l'un retire et
  // que l'autre ajoute.
  await expect(page.getByRole('group', { name: 'Retirer un ingrédient' })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Ajouter un supplément' })).toBeVisible()
})

test('un supplément change le prix, et le changement est annoncé', async ({ page }) => {
  await page.goto(CLASSIQUE)
  await waitForHydration(page)

  const prix = page.locator('.c-product__price .c-price')
  await expect(prix).toHaveAttribute('value', '5.90')

  await page
    .getByRole('group', { name: 'Ajouter un supplément' })
    .getByRole('checkbox', { name: /Bacon/ })
    .check()

  // 5,90 € plus 1,20 € : le calcul vient de `unitPriceCents`, la page
  // n'additionne rien.
  await expect(prix).toHaveAttribute('value', '7.10')

  // Un client qui coche un supplément sans voir l'écran doit savoir ce que sa
  // commande lui coûte désormais.
  await expect(page.locator('[aria-live="polite"]')).toContainText('Prix mis à jour')
  await expect(page.locator('[aria-live="polite"]')).toContainText('7,10')
})

test('un retrait ne coûte rien', async ({ page }) => {
  await page.goto(CLASSIQUE)
  await waitForHydration(page)

  await page
    .getByRole('group', { name: 'Retirer un ingrédient' })
    .getByRole('checkbox', { name: 'Oignons' })
    .check()

  // Exigence EF-017 : un retrait est sans frais, et le prix ne bouge pas.
  await expect(page.locator('.c-product__price .c-price')).toHaveAttribute('value', '5.90')
})

test('les allergènes d’un supplément sont signalés comme tels', async ({ page }) => {
  // Le Végétal ne contient pas d'œuf, et son supplément « Œuf » en apporte :
  // c'est le seul cas où la distinction se voit.
  await page.goto('/produit/vegetal')
  await waitForHydration(page)

  await page
    .getByRole('group', { name: 'Ajouter un supplément' })
    .getByRole('checkbox', { name: /Œuf/ })
    .check()

  // Le client qui retire le supplément retire aussi l'allergène : une liste
  // fondue en une seule ne le dirait pas.
  await expect(page.locator('.c-allergens__item', { hasText: 'Œufs' })).toContainText(
    'apporté par un supplément',
  )

  // Un allergène déjà présent dans le produit n'est pas imputé au supplément :
  // le retirer ne l'enlèverait pas.
  await expect(page.locator('.c-allergens__item', { hasText: 'Lait' })).not.toContainText(
    'apporté par un supplément',
  )
})

test('l’ajout au panier est annoncé, et ramène à la carte', async ({ page }) => {
  await page.goto(CLASSIQUE)
  await waitForHydration(page)

  await page.getByRole('button', { name: /Ajouter au panier/ }).click()

  // Exigence EF-040 : l'annonce dit ce que le client a et ce qu'il doit.
  await expect(page).toHaveURL(/\/carte$/)
  await expect(page.locator('[aria-live="polite"]')).toContainText('Le Classique ajouté au panier')

  // La barre de panier porte le nouvel état, et l'accès n'est plus refusé.
  const barre = page.locator('.c-cart-summary')
  await expect(barre).toContainText('1 article')
  await expect(barre.getByRole('button')).not.toHaveAttribute('aria-disabled', 'true')
})

test('le panier retient les options choisies', async ({ page }) => {
  await page.goto(CLASSIQUE)
  await waitForHydration(page)

  await page
    .getByRole('group', { name: 'Ajouter un supplément' })
    .getByRole('checkbox', { name: /Bacon/ })
    .check()

  await page.getByRole('button', { name: /Ajouter au panier/ }).click()
  await expect(page).toHaveURL(/\/carte$/)

  // Le total de la barre vient du domaine : 5,90 € plus 1,20 € de bacon.
  await expect(page.locator('.c-cart-summary .c-price--total')).toHaveAttribute('value', '7.10')
})

test('la barre de panier donne accès au panier depuis la fiche', async ({ page }) => {
  await page.goto(CLASSIQUE)
  await waitForHydration(page)

  await page.getByRole('button', { name: /Ajouter au panier/ }).click()
  await page.goto(CLASSIQUE)
  await waitForHydration(page)

  // Exigence EF-003 : le panier s'atteint sans perdre la navigation en cours.
  await page.locator('.c-cart-summary').getByRole('button', { name: 'Voir le panier' }).click()

  await expect(page).toHaveURL(/\/panier$/)
})

test('une référence inconnue ne laisse pas le client sans issue', async ({ page }) => {
  await page.goto('/produit/inconnu')
  await waitForHydration(page)

  // La route est dynamique dans les sources et rendue au build pour les
  // vingt-sept références. Une référence absente de la carte ne doit pas rendre
  // une fiche vide : elle le dit, et ramène à la carte.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Produit introuvable')
  await expect(page.getByRole('link', { name: 'Revenir à la carte' })).toBeVisible()
})
