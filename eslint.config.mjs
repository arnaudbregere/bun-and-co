import vuejsAccessibility from 'eslint-plugin-vuejs-accessibility'
import prettier from 'eslint-config-prettier'
import withNuxt from './.nuxt/eslint.config.mjs'

// Un composant ne va pas chercher ses données lui-même : l'interface connaît les
// services, mais passe par un composable. Un `fetch` écrit dans un composant
// contournerait la passerelle du catalogue, donc le préfixe `baseURL`, et
// casserait sur GitHub Pages.
const LAYER_PATTERN = {
  group: ['**/services/**', '**/pages/**'],
  message:
    'Un composant ne dépend ni d’un service ni d’une page. Les données arrivent en propriétés, ou par un composable.',
}

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

  // Niveaux d'Atomic Design. Un composant ne consomme que des composants d'un
  // niveau strictement inférieur : sans cette règle, les trois dossiers ne sont
  // qu'un rangement, et un atome finit par dépendre d'une molécule.
  //
  // Ces règles n'attrapent que les imports explicites. Les composants Vue sont
  // auto-importés par Nuxt, donc utilisés dans un gabarit sans ligne d'import :
  // c'est `scripts/verify-component-levels.mjs` qui couvre ce cas, et le
  // pipeline l'exécute.
  //
  // Chaque bloc répète les motifs du précédent à dessein : en configuration
  // plate, le dernier bloc qui correspond à un fichier emporte la règle entière
  // et n'y ajoute rien.
  {
    files: ['app/components/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [LAYER_PATTERN] }],
    },
  },

  {
    files: ['app/components/molecules/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            LAYER_PATTERN,
            {
              group: ['**/organisms/**'],
              message: 'Une molécule ne consomme pas un organisme, qui la compose.',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['app/components/atoms/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            LAYER_PATTERN,
            {
              group: ['**/molecules/**', '**/organisms/**'],
              message:
                'Un atome ne consomme aucun niveau supérieur. Il reçoit ce qu’il affiche en propriétés.',
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

      // Une étiquette qui enveloppe son contrôle est aussi valide qu'une
      // étiquette reliée par `for` : la spécification HTML nomme les deux
      // formes, et l'enveloppement rend tout le texte cliquable sans inventer
      // d'identifiant. La valeur par défaut de la règle n'accepte que `for`,
      // ce qui est plus strict que la norme.
      'vuejs-accessibility/label-has-for': ['error', { required: { some: ['nesting', 'id'] } }],

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
