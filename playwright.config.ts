import { defineConfig, devices } from '@playwright/test'

/**
 * Serveurs possibles pour la suite.
 *
 * `build` construit puis sert : c'est le défaut, et ce qu'une personne lance
 * avant de proposer une fusion. `prebuilt` sert un rendu déjà construit, pour
 * l'intégration continue, qui récupère celui du job de construction plutôt que
 * d'en bâtir un second. `dev` rend le serveur de développement, dont le lot 8
 * aura besoin pour les règles du détecteur de design qui dépendent des états
 * d'interaction.
 */
const COMMANDES_DE_SERVEUR: Record<string, string> = {
  build: 'pnpm generate && pnpm serve:static',
  prebuilt: 'pnpm serve:static',
  dev: 'pnpm dev',
}

// Un seul navigateur. Une borne est un appareil unique, dont le navigateur est
// connu : multiplier les moteurs allongerait le pipeline sans couvrir un risque
// réel.

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),

  // Aucune reprise, demande #138. La reprise sous intégration continue
  // masquait l'instabilité que le serveur de développement provoquait : le
  // pipeline restait vert là où la suite locale échouait, et un échec réel se
  // serait confondu avec ce bruit. La cause est supprimée, le filet n'a plus à
  // être rattrapé.
  retries: 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: 'http://localhost:3000',
    // Aucune reprise ne suit un échec : la trace est conservée au premier, ou
    // elle n'existerait pour personne.
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'borne',
      use: {
        ...devices['Desktop Chrome'],
        // Format d'une borne réelle : écran portrait 1080 × 1920.
        viewport: { width: 1080, height: 1920 },
        // Entrée tactile, comme sur l'appareil cible : les tests ne doivent pas
        // réussir grâce à un survol qui n'existe pas en vrai.
        hasTouch: true,
        isMobile: false,
      },
    },
  ],

  // La suite tourne contre le rendu construit, et non contre le serveur de
  // développement, demande #138. `pnpm dev` compile les routes à la demande :
  // plusieurs navigateurs qui réclament ensemble des routes jamais compilées
  // dépassaient les délais d'attente, et la suite échouait en parallèle alors
  // qu'elle passait en série. Le rendu construit n'a plus rien à compiler, et
  // c'est aussi ce que GitHub Pages servira.
  webServer: {
    command: COMMANDES_DE_SERVEUR[process.env.E2E_SERVER ?? 'build'] ?? COMMANDES_DE_SERVEUR.build,
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
