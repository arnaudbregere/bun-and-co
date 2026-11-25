import type { Page } from '@playwright/test'

/**
 * Attend que Vue ait pris la main sur le balisage rendu par le serveur.
 *
 * Les pages sont rendues côté serveur : le balisage est présent, et donc
 * cliquable, avant que le code client ne soit attaché. Un clic envoyé dans cet
 * intervalle n'appelle aucun gestionnaire, et le test échoue sans qu'aucune
 * régression n'existe.
 *
 * Le repère est la propriété que Vue pose sur son conteneur de montage.
 */
export const waitForHydration = async (page: Page) => {
  await page.waitForFunction(() => {
    const racine = document.getElementById('__nuxt')
    return racine !== null && '__vue_app__' in racine
  })
}
