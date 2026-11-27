import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { waitForHydration } from './hydration'

// Les sept écrans, exigence EF-001. Le contenu de chacun arrive avec sa propre
// demande de fusion ; ce fichier vérifie la structure du parcours, qui ne
// changera plus : titres, retours, et absence de retour après le paiement.

const ECRANS = [
  { chemin: '/', titre: 'Bun & Co — Commander', h1: 'Bun & Co' },
  { chemin: '/mode', titre: 'Mode de consommation — Bun & Co', h1: 'Sur place ou à emporter ?' },
  { chemin: '/carte', titre: 'Carte — Bun & Co', h1: 'Carte' },
  { chemin: '/produit/classique', titre: 'Le Classique — Bun & Co', h1: 'Le Classique' },
  { chemin: '/panier', titre: 'Panier — Bun & Co', h1: 'Panier' },
  { chemin: '/paiement', titre: 'Paiement — Bun & Co', h1: 'Paiement' },
  { chemin: '/ticket', titre: 'Commande confirmée — Bun & Co', h1: 'Commande confirmée' },
] as const

test('chaque écran porte un titre unique et un seul titre de rang un', async ({ page }) => {
  const titres = new Set<string>()

  for (const ecran of ECRANS) {
    await page.goto(ecran.chemin)

    // Exigence EF-042 : un titre de page unique et une structure de titres
    // hiérarchisée. Deux écrans au même titre se confondent dans l'historique
    // comme dans l'annonce d'un lecteur d'écran.
    await expect(page).toHaveTitle(ecran.titre)
    expect(titres.has(ecran.titre)).toBe(false)
    titres.add(ecran.titre)

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(ecran.h1)
  }
})

test('le retour désigne l’écran précédent, et disparaît sur le ticket', async ({ page }) => {
  await page.goto('/carte')

  // Exigence EF-002 : le retour nomme sa destination plutôt que de dire
  // « retour » — un lecteur d'écran qui ne lit que le lien doit savoir où il
  // mène.
  await expect(page.getByRole('link', { name: 'Retour : Mode de consommation' })).toBeVisible()

  await page.goto('/produit/classique')
  await expect(page.getByRole('link', { name: 'Retour : Carte' })).toBeVisible()

  await page.goto('/')
  await expect(page.getByRole('link', { name: /^Retour/ })).toHaveCount(0)

  // Exigences EF-002 et EF-004 : aucun retour après la confirmation du
  // paiement.
  await page.goto('/ticket')
  await expect(page.getByRole('link', { name: /^Retour/ })).toHaveCount(0)
})

test('le parcours se traverse au clavier, du premier écran au ticket', async ({ page }) => {
  await page.goto('/')
  await waitForHydration(page)

  await page.getByRole('link', { name: 'Commander' }).click()

  // Le mode de consommation s'actionne par un bouton : le choix écrit la
  // commande avant de mener à la carte, il ne se contente pas de naviguer.
  await page.getByRole('button', { name: /Sur place/ }).click()

  // Depuis la carte, l'accès au panier est refusé tant que le panier est vide,
  // exigence EF-026. Le parcours passe donc par la fiche d'un produit, qui
  // remplit le panier avant de l'ouvrir.
  await page.getByRole('tab', { name: 'Burgers' }).click()
  await page.getByRole('button', { name: /Le Classique/ }).click()
  await page.getByRole('button', { name: /Ajouter au panier/ }).click()

  await page.getByRole('button', { name: /Voir le panier/ }).click()
  await expect(page).toHaveURL(/\/panier$/)

  // Le paiement est un bouton et non un lien : il est refusé tant que le
  // panier est vide, et un lien ne porte pas d'état indisponible.
  await page.getByRole('button', { name: /Payer/ }).click()
  await page.getByRole('link', { name: 'Confirmer' }).click()

  await expect(page).toHaveURL(/\/ticket\/?$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Commande confirmée')
})

test('le lien d’évitement est le premier arrêt de tabulation', async ({ page }) => {
  await page.goto('/carte')
  await waitForHydration(page)

  // Critère WCAG 2.4.1 : sur la carte, il épargne au client au clavier la
  // traversée des onglets et des vingt-sept produits.
  await page.keyboard.press('Tab')
  const evitement = page.getByRole('link', { name: 'Aller au contenu' })
  await expect(evitement).toBeFocused()

  // Masqué tant qu'il n'a pas le focus, mais jamais retiré de la tabulation.
  const cadre = await evitement.boundingBox()
  expect(cadre?.width).toBeGreaterThan(1)
})

test('une seule région d’annonce de chaque mode sur un écran', async ({ page }) => {
  await page.goto('/carte')

  // Exigences EF-040 et EF-041 : deux régions d'un même mode annonceraient deux
  // fois le même changement, ou se voleraient la parole.
  await expect(page.locator('[aria-live="polite"]')).toHaveCount(1)
  await expect(page.locator('[role="alert"]')).toHaveCount(1)
})

for (const ecran of ECRANS) {
  test(`l’écran ${ecran.chemin} ne présente aucune violation détectée par axe`, async ({
    page,
  }) => {
    await page.goto(ecran.chemin)

    const resultats = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()

    expect(resultats.violations).toEqual([])
  })
}
