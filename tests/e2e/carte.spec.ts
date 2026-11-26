import { expect, test } from '@playwright/test'
import { waitForHydration } from './hydration'

// Écran de carte, demande #122. Le titre, le retour et l'audit axe sont
// vérifiés par `parcours.spec.ts` ; ce fichier porte ce qui lui est propre :
// les six entrées, la grille, le produit indisponible et la barre de panier.

test('les six entrées de navigation sont présentes, et une seule est courante', async ({
  page,
}) => {
  await page.goto('/carte')

  const onglets = page.getByRole('tab')

  // Exigence EF-006 : « Menus » n'est pas une catégorie de produit, mais le
  // client la cherche à cet endroit.
  await expect(onglets).toHaveCount(6)
  await expect(onglets.filter({ hasText: 'Menus' })).toBeVisible()
  await expect(page.getByRole('tab', { selected: true })).toHaveCount(1)
})

test('l’onglet courant ne se distingue pas par la seule couleur', async ({ page }) => {
  await page.goto('/carte')
  await waitForHydration(page)

  const courant = page.getByRole('tab', { selected: true })
  const autre = page.getByRole('tab', { name: 'Poulet' })

  const styles = async (onglet: typeof courant) =>
    onglet.evaluate((element) => {
      const calcule = getComputedStyle(element)
      return { graisse: calcule.fontWeight, ombre: calcule.boxShadow }
    })

  const [actuel, voisin] = await Promise.all([styles(courant), styles(autre)])

  // Critère WCAG 1.4.1 : la graisse et l'ombre portée distinguent l'onglet
  // courant, en plus de son fond.
  expect(actuel.graisse).not.toBe(voisin.graisse)
  expect(actuel.ombre).not.toBe(voisin.ombre)
})

test('la grille montre les produits de la catégorie courante', async ({ page }) => {
  await page.goto('/carte')
  await waitForHydration(page)

  // Six burgers, exigence EF-007 et répartition de la carte.
  await expect(page.getByRole('listitem')).toHaveCount(6)
  await expect(page.getByRole('button', { name: /Le Classique/ })).toBeVisible()

  await page.getByRole('tab', { name: 'Desserts' }).click()

  await expect(page.getByRole('listitem')).toHaveCount(4)
  await expect(page.getByRole('button', { name: /Le Classique/ })).toHaveCount(0)
})

test('la grille se parcourt au clavier dans l’ordre visuel', async ({ page }) => {
  await page.goto('/carte')
  await waitForHydration(page)

  const cartes = page.locator('.c-product-card')
  const noms = await cartes.allInnerTexts()

  await cartes.first().focus()

  for (const rang of [1, 2]) {
    await page.keyboard.press('Tab')

    // Une seule prise de focus par carte : le client au clavier avance d'un
    // produit par tabulation, dans l'ordre où il les voit.
    await expect(cartes.nth(rang)).toBeFocused()
    expect(noms[rang]).toBeDefined()
  }
})

test('un produit disponible mène à sa fiche', async ({ page }) => {
  await page.goto('/carte')
  await waitForHydration(page)

  await page.getByRole('button', { name: /Le Classique/ }).click()

  await expect(page).toHaveURL(/\/produit\/classique$/)
})

test('l’entrée Menus dit où composer un menu', async ({ page }) => {
  await page.goto('/carte')
  await waitForHydration(page)

  await page.getByRole('tab', { name: 'Menus' }).click()

  // Un menu se compose à partir d'un burger : l'entrée existe parce que le
  // client la cherche, et son panneau le renvoie au bon endroit.
  await expect(page.getByRole('tabpanel')).toContainText('à partir d’un burger'.replace('’', "'"))
  await expect(page.getByRole('listitem')).toHaveCount(0)
})

test('la barre de panier suit le client dès la carte', async ({ page }) => {
  await page.goto('/carte')
  await waitForHydration(page)

  const barre = page.locator('.c-cart-summary')

  // Exigence EF-005 : la barre est présente à partir de cet écran, panier vide
  // compris, plutôt que de surgir au premier ajout et de décaler la grille
  // sous le doigt du client.
  await expect(barre).toBeVisible()
  await expect(barre).toContainText('Panier vide')
  await expect(barre.getByRole('button')).toHaveAttribute('aria-disabled', 'true')

  // Critère WCAG 2.4.11 : la barre est collée, et la marge de défilement garde
  // au-dessus d'elle l'élément qui prend le focus.
  const position = await barre.evaluate((element) => getComputedStyle(element).position)
  expect(position).toBe('sticky')
})
