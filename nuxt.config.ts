// https://nuxt.com/docs/api/configuration/nuxt-config
import { PRODUCTS } from './app/services/catalogue-data'

// Les vingt-sept fiches produit, rendues au build. La liste vient de la carte
// elle-même : un produit ajouté au catalogue obtient sa fiche sans que
// personne ait à penser à ce fichier.
const FICHES_PRODUIT = PRODUCTS.map((produit) => `/produit/${produit.id}`)

export default defineNuxtConfig({
  compatibilityDate: '2026-11-24',

  // Génération statique : aucun serveur applicatif à l'exécution, conformément
  // au principe III de la constitution. Les routes serveur sont autorisées à la
  // seule condition d'être préconstruites ici.
  ssr: true,

  modules: ['@nuxt/eslint'],

  eslint: {
    config: {
      // Le formatage est confié à Prettier. Laisser ESLint le faire aussi
      // produirait deux sources de vérité en conflit.
      stylistic: false,
    },
  },

  app: {
    // Sur GitHub Pages, le site est servi sous /bun-and-co/. La valeur est
    // fournie par variable d'environnement au moment du déploiement, et vaut la
    // racine en développement.
    baseURL: process.env.NUXT_APP_BASE_URL ?? '/',
    head: {
      htmlAttrs: { lang: 'fr' },
      meta: [
        { charset: 'utf-8' },
        // Une borne est un écran fixe, où le pincement pour zoomer n'a guère de
        // sens. Le bloquer violerait pourtant le critère WCAG 1.4.4 :
        // `maximum-scale` reste donc absent.
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },

  // Atomic Design : trois niveaux, et aucun préfixe de dossier dans le nom du
  // composant. `<BaseButton>` plutôt que `<AtomsBaseButton>` : le niveau est un
  // plan de classement, pas une partie du nom.
  // Un niveau est déclaré le jour où il a un composant : un dossier vide n'a
  // rien à faire dans le dépôt.
  components: [
    { path: '~/components/atoms', pathPrefix: false },
    { path: '~/components/molecules', pathPrefix: false },
  ],

  css: ['~/assets/scss/main.scss'],

  typescript: {
    strict: true,
    // La vérification de types tourne en intégration continue par un script
    // dédié, et non à chaque démarrage du serveur de développement.
    typeCheck: false,
    tsConfig: {
      compilerOptions: {
        // Un accès indexé peut rendre `undefined` : indispensable sur un
        // catalogue interrogé par identifiant.
        noUncheckedIndexedAccess: true,
        // Distingue « propriété absente » de « propriété valant undefined ».
        exactOptionalPropertyTypes: true,
        noImplicitOverride: true,
        noFallthroughCasesInSwitch: true,
      },
    },
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      // L'exploration suit les liens : les six écrans du parcours linéaire s'y
      // trouvent. Trois routes ne sont désignées par aucun lien et sont donc
      // déclarées ici — la route du catalogue, l'atelier, et chaque fiche
      // produit, qui n'existera en fichier que si elle est listée.
      //
      // L'hébergement est statique : une fiche absente du rendu rendrait un
      // 404, puisque aucun processus ne répond à l'exécution.
      routes: ['/', '/workshop', '/api/catalogue.json', ...FICHES_PRODUIT],
      failOnError: true,
    },
  },
})
