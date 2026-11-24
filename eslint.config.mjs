import vuejsAccessibility from 'eslint-plugin-vuejs-accessibility'
import prettier from 'eslint-config-prettier'
import withNuxt from './.nuxt/eslint.config.mjs'

// Configuration plate ESLint. `withNuxt` apporte les règles Vue, TypeScript et
// Nuxt, puis nos ajouts viennent par-dessus.
export default withNuxt(
  {
    // Outillage livré par des vendors, et artefacts de construction : ce code
    // n'est pas le nôtre et n'a pas à suivre nos règles.
    ignores: ['.claude/**', '.specify/**', '.impeccable/**', '.nuxt/**', '.output/**', 'dist'],
  },

  // Règles d'accessibilité applicables au balisage. Elles ne remplacent pas
  // l'audit du lot 7 : elles attrapent au plus tôt ce qui se voit dans le
  // gabarit, comme une image sans texte alternatif ou un gestionnaire de clic
  // posé sur un élément non interactif.
  ...vuejsAccessibility.configs['flat/recommended'],

  // Frontières d'architecture, appliquées et non seulement documentées. Une
  // architecture tenue par la seule bonne volonté se dégrade au premier coup de
  // pression ; le pipeline refuse désormais la fusion.
  {
    files: ['app/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/services/**', '**/composables/**', '**/components/**', '**/pages/**'],
              message:
                'Le domaine ne dépend d’aucune couche extérieure. Déclarer un port dans app/domain/ports.ts et le laisser implémenter par un service.',
            },
            {
              group: ['vue', 'vue-router', '#app', '#imports', 'nuxt/*'],
              message:
                'Le domaine ne connaît ni Vue, ni Nuxt, ni le navigateur. Cette logique relève d’un composable ou d’un service.',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['app/services/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/composables/**', '**/components/**', '**/pages/**'],
              message:
                'Un service ne dépend pas de l’interface. Les dépendances vont de l’interface vers les services, jamais l’inverse.',
            },
          ],
        },
      ],
    },
  },

  {
    rules: {
      // Le projet n'a pas de composant à nom unique imposé par Nuxt.
      'vue/multi-word-component-names': 'off',

      // Une borne n'a pas de texte en anglais : laisser passer les apostrophes
      // typographiques dans les gabarits.
      'vue/no-irregular-whitespace': 'error',

      // Interdit les variables inutilisées, sauf celles préfixées d'un tiret
      // bas, convention explicite pour un paramètre volontairement ignoré.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Doit rester en dernier : désactive les règles ESLint qui entreraient en
  // conflit avec le formatage de Prettier.
  prettier,
)
