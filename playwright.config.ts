import { defineConfig, devices } from '@playwright/test'

// Un seul navigateur. Une borne est un appareil unique, dont le navigateur est
// connu : multiplier les moteurs allongerait le pipeline sans couvrir un risque
// réel.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
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

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
