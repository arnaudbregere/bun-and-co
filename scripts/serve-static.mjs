// =============================================================================
// Serveur de fichiers du rendu statique
// =============================================================================
// Sert `.output/public` tel qu'un hébergeur statique le servirait, pour les
// tests end-to-end.
//
// Pourquoi pas le serveur de développement : `pnpm dev` compile les routes à la
// demande, et huit navigateurs qui réclament ensemble des routes jamais
// compilées dépassent les délais d'attente. La suite échouait donc en parallèle
// et passait en série, demande #138. Le rendu construit n'a plus rien à
// compiler, et c'est aussi ce que GitHub Pages servira.
//
// Pourquoi pas `nuxt preview` : il lance `node .output/server/index.mjs`, qui
// n'existe pas après `nuxt generate` — la sortie statique n'a pas de serveur.
//
// Aucune dépendance : le besoin tient en une table de types de contenu et une
// résolution de chemin. Un paquet de plus serait une dépendance sans besoin
// démontré, et le pipeline la téléchargerait à chaque exécution.

import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'

const RACINE = resolve('.output/public')
const PORT = Number(process.env.PORT ?? 3000)

/**
 * Types de contenu servis.
 *
 * L'extension porte le type, comme chez un hébergeur statique. Un type manquant
 * serait servi en `application/octet-stream`, et le navigateur refuserait la
 * feuille de style ou le script.
 */
const TYPES = new Map(
  Object.entries({
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
  }),
)

/** Le chemin désigne-t-il un fichier lisible. */
const estUnFichier = async (chemin) => {
  try {
    return (await stat(chemin)).isFile()
  } catch {
    return false
  }
}

/**
 * Fichier à servir pour une URL, ou `undefined`.
 *
 * `nuxt generate` écrit chaque route en `<route>/index.html`. Une URL sans
 * extension est donc cherchée d'abord comme dossier, puis comme fichier
 * `.html` : c'est la résolution des hébergeurs statiques.
 */
const resoudre = async (chemin) => {
  // `normalize` réduit les `..` avant la comparaison : une URL ne doit pas
  // sortir du dossier servi.
  const demande = normalize(decodeURIComponent(chemin)).replace(/^(\.\.[/\\])+/, '')
  const cible = join(RACINE, demande)

  if (!cible.startsWith(RACINE)) return undefined

  if (extname(cible) !== '') return (await estUnFichier(cible)) ? cible : undefined

  const index = join(cible, 'index.html')
  if (await estUnFichier(index)) return index

  const page = `${cible.replace(/\/$/, '')}.html`
  return (await estUnFichier(page)) ? page : undefined
}

/**
 * Coquille rendue pour une URL sans fichier.
 *
 * `nuxt generate` écrit `404.html`, et GitHub Pages la sert pour toute URL
 * inconnue : l'application démarre alors côté client et résout la route
 * elle-même. C'est ainsi qu'une fiche produit inexistante affiche « Produit
 * introuvable » plutôt qu'une page d'hébergeur. Servir ici un texte brut
 * donnerait aux tests un comportement que la production n'a pas.
 */
const COQUILLE_404 = join(RACINE, '404.html')

const serveur = createServer(async (requete, reponse) => {
  const chemin = new URL(requete.url ?? '/', `http://localhost:${PORT}`).pathname
  const fichier = await resoudre(chemin)

  if (fichier === undefined) {
    if (await estUnFichier(COQUILLE_404)) {
      reponse.writeHead(404, {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      })
      createReadStream(COQUILLE_404).pipe(reponse)
      return
    }

    reponse.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    reponse.end(`Aucun fichier pour ${chemin}\n`)
    return
  }

  reponse.writeHead(200, {
    'content-type': TYPES.get(extname(fichier)) ?? 'application/octet-stream',
    // Les tests doivent voir le rendu qu'ils viennent de construire, et non
    // celui d'une exécution précédente.
    'cache-control': 'no-store',
  })

  createReadStream(fichier).pipe(reponse)
})

serveur.listen(PORT, () => {
  console.log(`Rendu statique servi sur http://localhost:${PORT} depuis ${RACINE}`)
})
