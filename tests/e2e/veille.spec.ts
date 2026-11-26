import { expect, test } from '@playwright/test'
import { waitForHydration } from './hydration'

// Écran de veille, demande #120. Le parcours et l'audit axe de cet écran sont
// vérifiés par `parcours.spec.ts` ; ce fichier porte ce qui lui est propre :
// la taille de la cible, le clavier, le mouvement et l'absence de commande
// restaurée.

test('le démarrage s’actionne au clavier seul', async ({ page }) => {
  await page.goto('/')
  await waitForHydration(page)

  // Premier arrêt : le lien d'évitement de la mise en page. Second : le
  // démarrage, seul élément interactif de l'écran.
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')

  const demarrage = page.getByRole('link', { name: 'Commander' })
  await expect(demarrage).toBeFocused()

  await page.keyboard.press('Enter')

  // Exigence EF-039 : actionnable au clavier seul, sans souris ni doigt.
  await expect(page).toHaveURL(/\/mode$/)
})

test('la cible de démarrage dépasse largement les 44 pixels exigés', async ({ page }) => {
  await page.goto('/')

  const cadre = await page.getByRole('link', { name: 'Commander' }).boundingBox()

  // Exigence EF-043 : 44 × 44 est le plancher. Sur une borne tenue à bout de
  // bras, l'invite d'accueil est la cible la plus large de l'application.
  expect(cadre?.width).toBeGreaterThan(300)
  expect(cadre?.height).toBeGreaterThan(100)
})

test('rien ne se déclenche au survol du démarrage', async ({ page }) => {
  await page.goto('/')
  await waitForHydration(page)

  await page.getByRole('link', { name: 'Commander' }).hover()

  // Une borne n'a pas de pointeur : un déclenchement au survol serait
  // injouable au doigt comme au clavier.
  await expect(page).toHaveURL(/\/$/)
})

test('un rafraîchissement ne restaure aucune commande antérieure', async ({ page }) => {
  await page.goto('/')

  // Une commande laissée par un parcours précédent, écrite à la main dans le
  // stockage de session.
  await page.evaluate(() => {
    sessionStorage.setItem(
      'bun-and-co:draft',
      JSON.stringify({
        serviceMode: 'takeaway',
        cart: {
          lines: [
            {
              id: 'classique#seul#-#+',
              productId: 'classique',
              quantity: 2,
              customisation: { removedIds: [], extraIds: [] },
            },
          ],
        },
      }),
    )
  })

  await page.reload()
  await waitForHydration(page)

  // La veille ne lit pas la commande en cours : elle n'en montre rien et n'en
  // annonce rien.
  await expect(page.locator('main')).not.toContainText('article')
  await expect(page.locator('[aria-live="polite"]')).toHaveText('')
})

test.describe('mouvement réduit', () => {
  test.use({ reducedMotion: 'reduce' })

  test('l’invite d’accueil cesse de battre', async ({ page }) => {
    await page.goto('/')

    const animation = await page
      .getByRole('link', { name: 'Commander' })
      .evaluate((element) => getComputedStyle(element).animationName)

    expect(animation).toBe('none')
  })
})

test('l’invite d’accueil bat par défaut', async ({ page }) => {
  await page.goto('/')

  const animation = await page
    .getByRole('link', { name: 'Commander' })
    .evaluate((element) => getComputedStyle(element).animationName)

  // Sans ce test, la règle de mouvement réduit passerait aussi sur un écran
  // qui n'anime rien du tout.
  expect(animation).toBe('c-standby-appel')
})
