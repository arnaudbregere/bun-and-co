import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { waitForHydration } from './hydration'

// Écran de ticket, demande #127. Le titre et l'absence de retour sont vérifiés
// par `parcours.spec.ts` ; ce fichier porte ce qui lui est propre : le numéro,
// le mode de consommation, le retour en veille et ce qu'il efface.

/** Confirme une commande par le parcours réel, et s'arrête sur le ticket. */
const avecUnTicket = async (page: Page) => {
  await page.goto('/produit/classique')
  await waitForHydration(page)
  await page.getByRole('button', { name: /Ajouter au panier/ }).click()
  await expect(page).toHaveURL(/\/carte$/)

  await page.goto('/paiement')
  await waitForHydration(page)
  await page.getByRole('button', { name: 'Confirmer' }).click()
  await expect(page).toHaveURL(/\/ticket\/?$/)
}

test('le numéro à trois chiffres est affiché, et lisible de loin', async ({ page }) => {
  await avecUnTicket(page)

  const numero = page.locator('.c-ticket__number')

  // Exigence EF-032 : un numéro à trois chiffres.
  await expect(numero).toHaveText(/^\d{3}$/)

  // C'est l'information que le client montre au comptoir : elle doit se lire à
  // deux mètres, donc au plus grand corps de l'échelle.
  const taille = await numero.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  )
  expect(taille).toBeGreaterThan(48)
})

test('le mode de consommation retenu figure sur le ticket', async ({ page }) => {
  await page.goto('/mode')
  await waitForHydration(page)
  await page.getByRole('button', { name: /À emporter/ }).click()

  await avecUnTicket(page)

  // Exigence EF-033 : le choix suit la commande jusqu'au ticket.
  await expect(page.locator('.c-ticket__service')).toHaveText('À emporter')
})

test('le compte à rebours n’est pas une région d’annonce', async ({ page }) => {
  await avecUnTicket(page)

  // Critère d'acceptation de la demande : le décompte change chaque seconde,
  // et une région courtoise redirait quinze fois la même chose par-dessus la
  // lecture du numéro.
  const decompte = page.locator('.c-ticket__countdown')
  await expect(decompte).toHaveAttribute('aria-hidden', 'true')

  // La phrase qui le porte, elle, est fixe et lisible par un lecteur d'écran.
  await expect(page.locator('.c-ticket__wait')).toContainText("revient à l'accueil")

  // L'unique région courtoise de l'application n'a pas été détournée pour le
  // décompte : elle porte encore la confirmation.
  await expect(page.locator('[aria-live="polite"]')).toContainText(/Commande \d{3} confirmée/)
})

test('le décompte diminue', async ({ page }) => {
  await avecUnTicket(page)

  const decompte = page.locator('.c-ticket__countdown')
  await expect(decompte).toHaveText('15 s')
  await expect(decompte).toHaveText('13 s', { timeout: 4000 })
})

test('le retour en veille immédiat efface la commande', async ({ page }) => {
  await avecUnTicket(page)

  await page.getByRole('button', { name: 'Nouvelle commande' }).click()
  await expect(page).toHaveURL(/\/$/)

  // Critère d'acceptation : le retour en veille vide la commande en cours. Une
  // borne ne présente jamais au client suivant ce que le précédent a commandé.
  const restes = await page.evaluate(() => ({
    draft: sessionStorage.getItem('bun-and-co:draft'),
    order: sessionStorage.getItem('bun-and-co:order'),
  }))

  expect(restes.order).toBeNull()
  expect(restes.draft === null || !restes.draft.includes('classique')).toBe(true)
})

test('le compte des numéros émis survit au retour en veille', async ({ page }) => {
  await avecUnTicket(page)
  const premier = await page.locator('.c-ticket__number').textContent()

  await page.getByRole('button', { name: 'Nouvelle commande' }).click()
  await expect(page).toHaveURL(/\/$/)

  await avecUnTicket(page)
  const second = await page.locator('.c-ticket__number').textContent()

  // Exigence EF-032 : unique au sein de la session. Le client suivant ne doit
  // pas reprendre un numéro déjà appelé au comptoir.
  expect(premier).not.toBe(second)
})

test('le délai se prolonge au décuple, test RGAA 13.1.3', async ({ page }) => {
  await avecUnTicket(page)

  const decompte = page.locator('.c-ticket__countdown')
  await expect(decompte).toHaveText('15 s')

  // Le test 13.1.3 exige que l'utilisateur puisse augmenter la limite de temps
  // avant la redirection « de dix fois, au moins ». 15 s portées à 150 s.
  await page.getByRole('button', { name: /Plus de temps/ }).click()
  await expect(decompte).toHaveText('150 s')
})

test('la prolongation ne vaut qu’une fois, et le bouton le dit', async ({ page }) => {
  await avecUnTicket(page)

  const prolonger = page.getByRole('button', { name: /Plus de temps/ })
  await prolonger.click()

  // Le bouton reste atteignable au clavier une fois consommé, critère
  // WCAG 3.3.1 : il annonce pourquoi il ne répond plus plutôt que de
  // disparaître du parcours de tabulation.
  await expect(prolonger).toHaveAttribute('aria-disabled', 'true')
  await expect(prolonger).toContainText('Délai déjà prolongé')

  await prolonger.click({ force: true })
  await expect(page.locator('.c-ticket__countdown')).not.toHaveText('150 s')
})

test('le ticket revient seul en veille', async ({ page }) => {
  await avecUnTicket(page)

  // Exigence EF-034 : quinze secondes après l'affichage. Le délai mesuré
  // laisse la marge d'une machine lente, mais reste sous la trentaine de
  // secondes qui signalerait un minuteur absent.
  await expect(page).toHaveURL(/\/$/, { timeout: 25_000 })
  await expect(page.getByRole('link', { name: 'Commander' })).toBeVisible()
})

test('un ticket sans commande ne laisse pas le client en cul-de-sac', async ({ page }) => {
  await page.goto('/ticket')
  await waitForHydration(page)

  await expect(page.locator('main')).toContainText('Aucune commande à afficher')
  await expect(page.getByRole('link', { name: 'Nouvelle commande' })).toBeVisible()
})

test('le ticket ne présente aucune violation détectée par axe', async ({ page }) => {
  await avecUnTicket(page)

  const resultats = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  expect(resultats.violations).toEqual([])
})
