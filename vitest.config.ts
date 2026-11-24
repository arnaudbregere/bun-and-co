import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    // Les tests du domaine ne touchent ni Vue, ni le DOM : ils tournent dans
    // l'environnement Node par défaut. Un test de composable déclare
    // explicitement son environnement par un commentaire de fichier.
    include: ['tests/unit/**/*.test.ts'],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],

      // La couverture ne porte que sur le domaine métier. L'imposer aux
      // composants produirait des tests écrits pour la métrique.
      include: ['app/domain/**/*.ts'],

      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
})
