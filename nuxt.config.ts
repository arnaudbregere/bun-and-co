// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-11-24',

  // Génération statique : aucun serveur applicatif à l'exécution, conformément
  // au principe III de la constitution. Les routes serveur sont autorisées à la
  // seule condition d'être préconstruites ici.
  ssr: true,

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
      routes: ['/'],
      failOnError: true,
    },
  },
})
