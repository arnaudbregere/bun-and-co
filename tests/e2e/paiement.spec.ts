import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { waitForHydration } from './hydration'

// Écran de paiement, demande #126. Le titre, le retour et l'audit de l'écran
// vide sont vérifiés par `parcours.spec.ts` ; ce fichier porte ce qui lui est
// propre : le récapitulatif, les deux modes, la simulation du règlement et
// l'absence de retour après la confirmation.

const CLASSIQUE = '/produit/classique'

/**
 * Remplit le panier par le parcours réel, puis ouvre le paiement.
 *
 * Écrire directement dans le stockage de session ne vérifierait pas que les
 * trois écrans s'accordent sur la forme d'une ligne.
 */
const avecUneCommande = async (page: Page, options: readonly string[] = []) => {
  await page.goto(CLASSIQUE)
  await waitForHydration(page)

  for (const option of options) {
    await page.getByRole('checkbox', { name: new RegExp(option) }).check()
  }

  await page.getByRole('button', { name: /Ajouter au panier/ }).click()
  await expect(page).toHaveURL(/\/carte$/)

  await page.goto('/paiement')
  await waitForHydration(page)
}

test('aucun champ de saisie bancaire, ni réel ni simulé', async ({ page }) => {
  await avecUneCommande(page)

  // Exigence EF-030 : aucune donnée bancaire n'est saisie, demandée ni
  // transmise. Les seuls contrôles de saisie sont les deux boutons radio du
  // mode de règlement.
  await expect(page.locator('input[type="text"]')).toHaveCount(0)
  await expect(page.locator('input[type="number"]')).toHaveCount(0)
  await expect(page.locator('input[type="password"]')).toHaveCount(0)
  await expect(page.locator('input[type="tel"]')).toHaveCount(0)
  await expect(page.locator('textarea')).toHaveCount(0)

  await expect(page.locator('input')).toHaveCount(2)
  await expect(page.locator('main')).toContainText('Paiement simulé')
})

test('les deux modes de règlement sont proposés, un seul retenu', async ({ page }) => {
  await avecUneCommande(page)

  const modes = page.getByRole('group', { name: 'Mode de règlement' })

  // Exigence EF-029.
  await expect(modes.getByRole('radio')).toHaveCount(2)
  await expect(page.getByRole('radio', { name: 'Carte bancaire sur la borne' })).toBeChecked()
  await expect(page.getByRole('radio', { name: 'Règlement en caisse' })).not.toBeChecked()

  await page.getByRole('radio', { name: 'Règlement en caisse' }).check()
  await expect(page.getByRole('radio', { name: 'Carte bancaire sur la borne' })).not.toBeChecked()
})

test('le récapitulatif reprend lignes, personnalisations, quantités et total', async ({ page }) => {
  await avecUneCommande(page, ['Bacon'])

  const recapitulatif = page.getByRole('region', { name: 'Votre commande' })

  // Exigence EF-031 : le récapitulatif est complet avant la confirmation.
  await expect(recapitulatif).toContainText('1 × Le Classique')
  await expect(recapitulatif).toContainText('Avec bacon')
  await expect(recapitulatif).toContainText('Sur place')

  // 5,90 € de burger plus 1,20 € de bacon, calculés par le domaine.
  await expect(recapitulatif.locator('.c-price--total')).toHaveAttribute('value', '7.10')
})

test('le récapitulatif suit la quantité corrigée au panier', async ({ page }) => {
  await avecUneCommande(page)

  await page.goto('/panier')
  await waitForHydration(page)
  await page.getByRole('button', { name: /Augmenter la quantité/ }).click()

  await page.goto('/paiement')
  await waitForHydration(page)

  const recapitulatif = page.getByRole('region', { name: 'Votre commande' })
  await expect(recapitulatif).toContainText('2 × Le Classique')
  await expect(recapitulatif.locator('.c-price--total')).toHaveAttribute('value', '11.80')
})

test('un menu se lit avec sa taille et ses substitutions', async ({ page }) => {
  await page.goto(CLASSIQUE)
  await waitForHydration(page)

  await page.getByRole('radio', { name: 'En menu' }).check()
  await page.getByRole('radio', { name: /Potatoes/ }).check()
  await page.getByRole('radio', { name: /Soda, 33 cl/ }).check()
  await page.getByRole('button', { name: /Ajouter au panier/ }).click()

  await page.goto('/paiement')
  await waitForHydration(page)

  const recapitulatif = page.getByRole('region', { name: 'Votre commande' })
  await expect(recapitulatif).toContainText('Menu M')
  await expect(recapitulatif).toContainText('Potatoes')

  // La boisson comprise dans le forfait n'est pas mentionnée : le client n'a
  // rien remplacé.
  await expect(recapitulatif).not.toContainText('Soda')
})

test('un panier vide ne propose rien à régler, et mène à la carte', async ({ page }) => {
  await page.goto('/paiement')
  await waitForHydration(page)

  await expect(page.locator('main')).toContainText("Il n'y a rien à régler")
  await expect(page.getByRole('link', { name: 'Revenir à la carte' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmer' })).toHaveCount(0)
})

test('la confirmation mène au ticket et vide le panier', async ({ page }) => {
  await avecUneCommande(page)

  await page.getByRole('button', { name: 'Confirmer' }).click()
  await expect(page).toHaveURL(/\/ticket\/?$/)

  // La commande confirmée est partie en cuisine : le panier ne la contient
  // plus, et revenir au paiement ne permet pas de régler deux fois.
  await page.goto('/paiement')
  await waitForHydration(page)
  await expect(page.locator('main')).toContainText("Il n'y a rien à régler")
})

test('la confirmation est annoncée avec son numéro', async ({ page }) => {
  await avecUneCommande(page)

  await page.getByRole('button', { name: 'Confirmer' }).click()

  // Exigences EF-032 et EF-040 : le numéro à trois chiffres de la session,
  // annoncé par la région courtoise.
  await expect(page.locator('[aria-live="polite"]')).toContainText(/Commande \d{3} confirmée/)
})

test('deux commandes d’une même session reçoivent deux numéros', async ({ page }) => {
  await avecUneCommande(page)
  await page.getByRole('button', { name: 'Confirmer' }).click()
  const premier = await page.locator('[aria-live="polite"]').textContent()

  await avecUneCommande(page)
  await page.getByRole('button', { name: 'Confirmer' }).click()
  const second = await page.locator('[aria-live="polite"]').textContent()

  // Exigence EF-032 : le numéro est unique au sein de la session.
  expect(premier).not.toBe(second)
})

test('aucun retour en arrière après la confirmation', async ({ page }) => {
  await avecUneCommande(page)
  await page.getByRole('button', { name: 'Confirmer' }).click()
  await expect(page).toHaveURL(/\/ticket\/?$/)

  // Exigences EF-002 et EF-004 : une commande confirmée est partie en
  // cuisine.
  await expect(page.getByRole('link', { name: /^Retour/ })).toHaveCount(0)
})

test('l’écran de paiement ne présente aucune violation détectée par axe', async ({ page }) => {
  await avecUneCommande(page, ['Bacon'])

  const resultats = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  expect(resultats.violations).toEqual([])
})
