import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// Test témoin du harnais end-to-end. Il vérifie que le serveur démarre, que la
// page se rend et que l'audit d'accessibilité s'exécute. Les parcours de
// commande viendront au lot 8.
test('la page d’accueil se rend', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bun & Co')
  await expect(page).toHaveTitle(/Bun & Co/)
})

test('la page d’accueil ne présente aucune violation détectée par axe', async ({ page }) => {
  await page.goto('/')

  const resultats = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  expect(resultats.violations).toEqual([])
})

test('la langue du document est déclarée', async ({ page }) => {
  await page.goto('/')

  // Critère RGAA 8.3 : la langue par défaut doit être indiquée, faute de quoi
  // un lecteur d'écran prononce le français avec une phonétique anglaise.
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
})
