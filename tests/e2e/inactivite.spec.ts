import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { waitForHydration } from './hydration'

// Limite d'inactivité, demande #128, exigences EF-035 à EF-038 et EF-045.
//
// L'horloge de la page est remplacée par celle de Playwright : attendre
// réellement quatre-vingt-dix secondes par test rendrait la suite inutilisable,
// et c'est le comportement de la borne qui est vérifié, pas la précision de
// `setInterval`.
//
// Les minuteurs ne partent qu'après l'hydratation. L'horloge est donc installée
// avant la navigation, et avancée seulement une fois Vue aux commandes.

/** Avance l'horloge de la page d'un nombre entier de secondes. */
const secondes = async (page: Page, combien: number) => {
  await page.clock.runFor(combien * 1000)
}

/** Ouvre un écran de commande, horloge sous contrôle, panier garni. */
const avecUnPanier = async (page: Page) => {
  await page.clock.install()

  await page.goto('/produit/classique')
  await waitForHydration(page)
  await page.getByRole('button', { name: /Ajouter au panier/ }).click()
  await expect(page).toHaveURL(/\/carte$/)
}

const avertissement = (page: Page) => page.locator('dialog.c-inactivity')

test('l’avertissement paraît après quatre-vingt-dix secondes sans interaction', async ({
  page,
}) => {
  await avecUnPanier(page)

  // Exigence EF-035.
  await secondes(page, 89)
  await expect(avertissement(page)).toBeHidden()

  await secondes(page, 1)
  await expect(avertissement(page)).toBeVisible()

  // Le sursis est de vingt secondes, et le dialogue le dit en toutes lettres.
  await expect(avertissement(page)).toContainText('20 secondes')
  await expect(page.locator('.c-inactivity__countdown')).toHaveText('20')
})

test('l’avertissement reçoit le focus et le rend à son origine', async ({ page }) => {
  await avecUnPanier(page)

  // L'avertissement surgit sans déclencheur : l'origine du focus est l'élément
  // que le client venait d'atteindre au clavier.
  const origine = page.getByRole('tab', { name: 'Burgers' })
  await origine.focus()

  await secondes(page, 90)
  await expect(avertissement(page)).toBeVisible()

  // Exigence EF-045, première moitié : le focus entre dans le dialogue.
  const bouton = page.getByRole('button', { name: 'Je continue ma commande' })
  await expect(bouton).toBeFocused()

  await bouton.click()
  await expect(avertissement(page)).toBeHidden()

  // Exigence EF-045, seconde moitié : le focus revient là où il était, et non
  // en haut de l'écran.
  await expect(origine).toBeFocused()
})

test('la prolongation rend ses quatre-vingt-dix secondes à la session', async ({ page }) => {
  await avecUnPanier(page)

  await secondes(page, 90)
  await page.getByRole('button', { name: 'Je continue ma commande' }).click()
  await expect(avertissement(page)).toBeHidden()

  // Exigence EF-036 : le délai entier repart, et non un sursis de plus.
  await secondes(page, 89)
  await expect(avertissement(page)).toBeHidden()

  await secondes(page, 1)
  await expect(avertissement(page)).toBeVisible()
})

test('Échap prolonge au lieu d’effacer', async ({ page }) => {
  await avecUnPanier(page)

  await secondes(page, 90)
  await expect(avertissement(page)).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(avertissement(page)).toBeHidden()

  // De deux touches voisines, l'issue la moins destructrice est la bonne : une
  // frappe est un client présent.
  await expect(page).toHaveURL(/\/carte$/)
  await expect(page.locator('[aria-live="polite"]')).toContainText('prolongée')
})

test('une interaction repousse l’avertissement, mais ne le ferme pas', async ({ page }) => {
  await avecUnPanier(page)

  await secondes(page, 80)
  await page.getByRole('tab', { name: 'Desserts' }).click()

  await secondes(page, 80)
  await expect(avertissement(page)).toBeHidden()

  await secondes(page, 10)
  await expect(avertissement(page)).toBeVisible()

  // Exigence EF-036 : la prolongation se décide depuis l'avertissement. Un
  // client qui frôle la dalle en récupérant son sac ne l'efface pas sans
  // l'avoir lu.
  await page.mouse.click(540, 1800)
  await expect(avertissement(page)).toBeVisible()
})

test('le sursis épuisé vide le panier et revient en veille', async ({ page }) => {
  await avecUnPanier(page)

  await secondes(page, 90)
  await expect(avertissement(page)).toBeVisible()

  await secondes(page, 20)

  // Exigence EF-037.
  await expect(page).toHaveURL(/\/$/)
  await expect(avertissement(page)).toBeHidden()

  const restes = await page.evaluate(() => ({
    draft: sessionStorage.getItem('bun-and-co:draft'),
    order: sessionStorage.getItem('bun-and-co:order'),
  }))

  expect(restes.order).toBeNull()
  expect(restes.draft === null || !restes.draft.includes('classique')).toBe(true)
})

test('le décompte est masqué au lecteur d’écran, et annoncé par paliers', async ({ page }) => {
  await avecUnPanier(page)

  await secondes(page, 90)

  // Critère d'acceptation : vingt annonces en vingt secondes couvriraient la
  // question posée par le dialogue.
  const decompte = page.locator('.c-inactivity__countdown')
  await expect(decompte).toHaveAttribute('aria-hidden', 'true')

  const courtoise = page.locator('[aria-live="polite"]')
  await secondes(page, 1)
  await expect(decompte).toHaveText('19')
  await expect(courtoise).not.toContainText('19 secondes')

  await secondes(page, 9)
  await expect(decompte).toHaveText('10')
  await expect(courtoise).toContainText('10 secondes')

  await secondes(page, 5)
  await expect(courtoise).toContainText('5 secondes')
})

test('aucune limite ne court sur la veille ni sur le ticket', async ({ page }) => {
  await page.clock.install()

  await page.goto('/')
  await waitForHydration(page)

  // Exigence EF-038 : la veille attend déjà un client, et n'a rien à effacer.
  await secondes(page, 200)
  await expect(avertissement(page)).toBeHidden()
  await expect(page).toHaveURL(/\/$/)

  await page.goto('/produit/classique')
  await waitForHydration(page)
  await page.getByRole('button', { name: /Ajouter au panier/ }).click()

  await page.goto('/paiement')
  await waitForHydration(page)
  await page.getByRole('button', { name: 'Confirmer' }).click()
  await expect(page).toHaveURL(/\/ticket\/?$/)

  // Exigence EF-038 : le ticket a son propre retour en veille, exigence
  // EF-034, et un avertissement détournerait le client de son numéro. Le
  // décompte du ticket, lui, court bien.
  await secondes(page, 14)
  await expect(avertissement(page)).toBeHidden()
  await expect(page.locator('.c-ticket__countdown')).toHaveText('1 s')
})

test('l’avertissement passe l’audit axe-core', async ({ page }) => {
  await avecUnPanier(page)

  await secondes(page, 90)
  await expect(avertissement(page)).toBeVisible()

  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  expect(audit.violations).toEqual([])
})
