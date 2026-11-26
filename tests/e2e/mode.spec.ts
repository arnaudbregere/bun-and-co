import { expect, test } from '@playwright/test'
import { waitForHydration } from './hydration'

// Écran du mode de consommation, demande #121. Le titre, le retour et l'audit
// axe de cet écran sont vérifiés par `parcours.spec.ts` ; ce fichier porte ce
// qui lui est propre : le choix, sa persistance et son annonce.

const CLE_STOCKAGE = 'bun-and-co:draft'

const modeStocke = (page: import('@playwright/test').Page) =>
  page.evaluate((cle) => {
    const brut = sessionStorage.getItem(cle)
    return brut === null ? undefined : (JSON.parse(brut) as { serviceMode: string }).serviceMode
  }, CLE_STOCKAGE)

test('les deux cibles dépassent la taille exigée et portent leur conséquence', async ({ page }) => {
  await page.goto('/mode')

  for (const libelle of ['Sur place', 'À emporter']) {
    const cadre = await page.getByRole('button', { name: new RegExp(libelle) }).boundingBox()

    // Exigence EF-043 : 44 × 44 est le plancher, et la demande #121 porte ces
    // cibles à la hauteur des actions principales.
    expect(cadre?.height).toBeGreaterThanOrEqual(56)
    expect(cadre?.width).toBeGreaterThan(300)
  }

  // Le libellé seul ne dit pas ce qui change : chaque choix porte sa
  // conséquence.
  await expect(page.getByRole('button', { name: /Sur place/ })).toContainText(
    'Servi sur un plateau',
  )
  await expect(page.getByRole('button', { name: /À emporter/ })).toContainText(
    'Emballé pour la route',
  )
})

test('choisir un mode écrit la commande et mène à la carte', async ({ page }) => {
  await page.goto('/mode')
  await waitForHydration(page)

  await page.getByRole('button', { name: /À emporter/ }).click()

  await expect(page).toHaveURL(/\/carte$/)
  expect(await modeStocke(page)).toBe('takeaway')
})

test('le choix survit à un rafraîchissement', async ({ page }) => {
  await page.goto('/mode')
  await waitForHydration(page)

  await page.getByRole('button', { name: /À emporter/ }).click()
  await expect(page).toHaveURL(/\/carte$/)

  // Exigence EF-027 : un rafraîchissement accidentel ne doit pas renvoyer le
  // client au début de sa commande.
  await page.reload()
  await waitForHydration(page)

  expect(await modeStocke(page)).toBe('takeaway')
})

test('le choix est annoncé par la région courtoise', async ({ page }) => {
  await page.goto('/mode')
  await waitForHydration(page)

  await page.getByRole('button', { name: /Sur place/ }).click()

  // Exigence EF-040 : l'annonce est courtoise, elle n'interrompt pas la
  // lecture en cours.
  await expect(page.locator('[aria-live="polite"]')).toHaveText('Commande sur place.')
})

test('les deux choix s’actionnent au clavier seul', async ({ page }) => {
  await page.goto('/mode')
  await waitForHydration(page)

  // Lien d'évitement, retour vers la veille, puis les deux choix.
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')

  await expect(page.getByRole('button', { name: /Sur place/ })).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: /À emporter/ })).toBeFocused()

  // Exigence EF-039 : actionnable au clavier seul.
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/carte$/)
})
