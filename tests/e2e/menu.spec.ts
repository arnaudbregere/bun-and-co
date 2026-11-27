import { expect, test } from '@playwright/test'
import { waitForHydration } from './hydration'

// Composition de menu, demande #124. L'étape vit dans la fiche d'un burger :
// un menu se compose à partir d'un burger, et de lui seul.

const CLASSIQUE = '/produit/classique'

const passerEnMenu = async (page: import('@playwright/test').Page) => {
  await page.goto(CLASSIQUE)
  await waitForHydration(page)
  await page.getByRole('radio', { name: 'En menu' }).check()
}

test('la composition n’est offerte que sur un burger', async ({ page }) => {
  await page.goto('/produit/cookie')
  await waitForHydration(page)

  // Un dessert ne se compose pas en menu : il en est un composant.
  await expect(page.getByRole('group', { name: 'Formule' })).toHaveCount(0)

  await page.goto(CLASSIQUE)
  await waitForHydration(page)
  await expect(page.getByRole('group', { name: 'Formule' })).toBeVisible()
})

test('les trois tailles viennent du domaine, avec leur forfait', async ({ page }) => {
  await passerEnMenu(page)

  const tailles = page.getByRole('group', { name: 'Taille du menu' })

  // Forfaits de `menu-rules.ts` : 4,00 € en M, 4,90 € en L, 6,90 € en XL,
  // exigences EF-011 et EF-012.
  await expect(tailles).toContainText('4,00')
  await expect(tailles).toContainText('4,90')
  await expect(tailles).toContainText('6,90')
})

test('rien n’est choisi d’avance, et le menu incomplet est refusé', async ({ page }) => {
  await passerEnMenu(page)

  await expect(page.getByRole('radio', { name: /Frites maison, petite/ })).not.toBeChecked()

  await page.getByRole('button', { name: /Ajouter au panier/ }).click()

  // Exigence EF-016 : le refus nomme l'étape qui manque, il ne dit pas
  // « formulaire invalide ». Exigence EF-041 : il passe par la région
  // d'alerte.
  await expect(page.locator('[role="alert"]')).toContainText('choisissez un accompagnement')
  await expect(page.locator('main')).toContainText('Il reste un accompagnement à choisir')

  // Et le panier n'a rien reçu : la page reste la fiche.
  await expect(page).toHaveURL(/\/produit\/classique$/)
})

test('le refus désigne chaque étape à son tour', async ({ page }) => {
  await passerEnMenu(page)

  await page.getByRole('radio', { name: /Frites maison, petite/ }).check()
  await page.getByRole('button', { name: /Ajouter au panier/ }).click()
  await expect(page.locator('[role="alert"]')).toContainText('choisissez une boisson')

  await page.getByRole('radio', { name: /Soda, 33 cl/ }).check()

  // Taille XL : elle comprend un dessert, exigence EF-014, et le groupe
  // n'apparaît qu'ici.
  await page.getByRole('radio', { name: /^XL/ }).check()
  await page.getByRole('radio', { name: /Frites maison, grande/ }).check()
  await page.getByRole('radio', { name: /Soda, 50 cl/ }).check()

  await page.getByRole('button', { name: /Ajouter au panier/ }).click()
  await expect(page.locator('[role="alert"]')).toContainText('choisissez un dessert')
})

test('le prix suit la taille et les substitutions', async ({ page }) => {
  await passerEnMenu(page)

  const prix = page.locator('.c-product__price .c-price')

  await page.getByRole('radio', { name: /Frites maison, petite/ }).check()
  await page.getByRole('radio', { name: /Soda, 33 cl/ }).check()

  // 5,90 € de burger plus 4,00 € de forfait M, calculés par `unitPriceCents`.
  await expect(prix).toHaveAttribute('value', '9.90')

  // Potatoes à la place des frites : 0,60 € de substitution, exigence EF-015.
  await page.getByRole('radio', { name: /Potatoes/ }).check()
  await expect(prix).toHaveAttribute('value', '10.50')
})

test('un menu complet rejoint le panier avec son prix', async ({ page }) => {
  await passerEnMenu(page)

  await page.getByRole('radio', { name: /Frites maison, petite/ }).check()
  await page.getByRole('radio', { name: /Soda, 33 cl/ }).check()

  await page.getByRole('button', { name: /Ajouter au panier/ }).click()

  await expect(page).toHaveURL(/\/carte$/)
  await expect(page.locator('.c-cart-summary .c-price--total')).toHaveAttribute('value', '9.90')
})

test('changer de taille oublie un composant qui n’est plus proposé', async ({ page }) => {
  await passerEnMenu(page)

  // Potatoes figure parmi les substitutions de toutes les tailles ; le soda
  // 33 cl n'est compris qu'en M, et ne figure pas parmi les substitutions de L.
  await page.getByRole('radio', { name: /Potatoes/ }).check()
  await page.getByRole('radio', { name: /Soda, 33 cl/ }).check()

  await page.getByRole('radio', { name: /^L\b/ }).check()

  await expect(page.getByRole('radio', { name: /Soda, 33 cl/ })).toHaveCount(0)
  await expect(page.getByRole('radio', { name: /Potatoes/ })).toBeChecked()

  // Le composant oublié est redemandé, plutôt que de voyager jusqu'au panier
  // où le domaine le refuserait.
  await expect(page.locator('main')).toContainText('Il reste une boisson à choisir')
})
