// =============================================================================
// Route du catalogue
// =============================================================================
// Rend la carte de l'enseigne en JSON. La route est déclarée dans
// `nitro.prerender.routes` : elle est donc exécutée une fois au build, et sa
// réponse écrite en fichier statique. Aucun processus Node ne tourne à
// l'exécution, ce que l'hébergement sur GitHub Pages ne permettrait pas.
//
// Les données viennent de la couche services, seule détentrice de ce que
// l'enseigne vend aujourd'hui. La route n'ajoute aucune règle : elle expose.
//
// Le chemin porte l'extension `.json` à dessein. Le préconstruit écrit la
// réponse dans un fichier du même nom, et un hébergeur statique déduit le type
// de contenu de l'extension : sans elle, GitHub Pages servirait du
// `application/octet-stream`, et le client recevrait une chaîne au lieu d'un
// tableau de produits.

import { PRODUCTS } from '../../app/services/catalogue-data'

export default defineEventHandler(() => PRODUCTS)
