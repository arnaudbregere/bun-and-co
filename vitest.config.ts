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

      // La couverture porte sur le domaine et sur les services : du code sans
      // DOM ni réseau, où le seuil est atteignable et significatif. L'imposer
      // aux composants produirait des tests écrits pour la métrique.
      include: ['app/domain/**/*.ts', 'app/services/**/*.ts'],

      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
})
