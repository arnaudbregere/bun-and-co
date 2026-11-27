import { expect, test, type Page } from '@playwright/test'
import { waitForHydration } from './hydration'

// Divergence serveur/client, demande #139.
//
// Vue ne signale ces écarts qu'en développement : le rendu de production ne
// porte pas la vérification. Ce fichier tourne donc contre le serveur de
// développement, par `E2E_SERVER=dev`, et s'abstient ailleurs plutôt que de
// rendre un vert qui ne prouverait rien.
//
// Les écrans concernés sont ceux qui affichent la commande en cours au premier
// rendu : la carte, une fiche produit, le panier et le paiement. Le serveur les
// écrit au build, où aucune session de navigateur n'existe ; un panier restauré
// pendant le premier rendu client donnait donc deux rendus différents, et Vue
// réemployait les nœuds du serveur sans les rectifier.

test.skip(
  process.env.E2E_SERVER !== 'dev',
  'Les avertissements d’hydratation n’existent que sur le serveur de développement.',
)

/** Écrans à visiter avec un panier non vide. */
const ECRANS = ['/carte', '/produit/fermier', '/panier', '/paiement']

/** Messages d'hydratation vus pendant une navigation. */
const avertissementsPendant = async (page: Page, aller: () => Promise<unknown>) => {
  const messages: string[] = []

  const ecouter = (texte: string) => {
    if (/hydrat/i.test(texte)) messages.push(texte.replace(/\s+/g, ' ').slice(0, 200))
  }

  page.on('console', (message) => ecouter(message.text()))
  page.on('pageerror', (erreur) => ecouter(erreur.message))

  await aller()
  await page.waitForTimeout(500)

  page.removeAllListeners('console')
  page.removeAllListeners('pageerror')

  return messages
}

test('aucun écart serveur/client avec un panier restauré', async ({ page }) => {
  await page.goto('/produit/classique')
  await waitForHydration(page)
  await page.getByRole('button', { name: /Ajouter au panier/ }).click()
  await expect(page).toHaveURL(/\/carte$/)

  for (const ecran of ECRANS) {
    // Chaque écran est rechargé depuis le serveur, et non atteint par le
    // routeur : c'est le rechargement qui met les deux rendus face à face.
    const messages = await avertissementsPendant(page, async () => {
      await page.goto(ecran, { waitUntil: 'networkidle' })
      await waitForHydration(page)
    })

    expect(messages, `${ecran} : ${messages.join(' | ')}`).toEqual([])
  }
})

test('le panier restauré est bien affiché après le premier rendu', async ({ page }) => {
  await page.goto('/produit/classique')
  await waitForHydration(page)
  await page.getByRole('button', { name: /Ajouter au panier/ }).click()

  await page.goto('/carte')
  await waitForHydration(page)

  // La relecture est repoussée après le premier rendu : elle doit tout de même
  // aboutir, sans quoi la correction aurait échangé un écart contre une perte.
  // Exigence EF-027.
  const resume = page.locator('.c-cart-summary')
  await expect(resume).toContainText('1 article')
  await expect(resume).toContainText('5,90')
})
