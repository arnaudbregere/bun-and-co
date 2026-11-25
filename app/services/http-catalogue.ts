// =============================================================================
// Catalogue servi par le réseau
// =============================================================================
// Implémentation du port `CatalogueGateway` sur la route préconstruite
// `/api/catalogue.json`. C'est la passerelle que consomme l'interface :
// `createStaticCatalogueGateway` reste pour les tests et les démonstrations,
// qui n'ont ni serveur ni fichier construit.
//
// Le client HTTP est injecté, comme le stockage l'est pour la commande en
// cours : le service reste testable sans réseau, et rien ici ne dépend de Nuxt.
// L'appelant passe `$fetch`.
//
// L'URL est le seul endroit du projet où le chemin du catalogue est écrit, et le
// seul où `baseURL` est préfixé. Sur GitHub Pages le site est servi sous
// `/bun-and-co/` : une URL absolue partant de la racine renverrait un 404.

import type { CatalogueGateway } from '../domain/ports'
import { CATEGORIES, FORMATS, type Product } from '../domain/types'

/** Chemin de la route préconstruite, relatif à `baseURL`. */
const PATH = 'api/catalogue.json'

/**
 * Client HTTP attendu. La signature est celle de `$fetch` réduite à ce que la
 * passerelle utilise : une URL, une réponse déjà désérialisée.
 */
export type HttpClient = (url: string) => Promise<unknown>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isStringArray = (value: unknown): boolean =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

/**
 * Vérifie qu'une réponse a bien la forme d'un produit.
 *
 * La réponse est écrite au build, donc par le même code que celui qui la lit :
 * la vérification ne protège pas d'un service tiers, mais d'un déploiement
 * partiel, où le fichier statique date d'une version précédente du type. Sans
 * elle, l'écart ne se verrait qu'au calcul tarifaire, loin de sa cause.
 */
const isProduct = (value: unknown): value is Product => {
  if (!isRecord(value)) return false

  if (typeof value.id !== 'string' || value.id === '') return false
  if (typeof value.name !== 'string') return false
  if (!CATEGORIES.includes(value.category as Product['category'])) return false
  if (!Number.isInteger(value.priceCents)) return false
  if (typeof value.available !== 'boolean') return false
  if (!isStringArray(value.allergens)) return false
  if (!Array.isArray(value.removables) || !Array.isArray(value.extras)) return false
  if (value.format !== undefined && !FORMATS.includes(value.format as Product['format'] & string)) {
    return false
  }

  return true
}

export const createHttpCatalogueGateway = (
  client: HttpClient,
  baseURL: string,
): CatalogueGateway => ({
  all: async () => {
    const payload = await client(`${baseURL.endsWith('/') ? baseURL : `${baseURL}/`}${PATH}`)

    if (!Array.isArray(payload) || !payload.every(isProduct)) {
      throw new TypeError(
        'Catalogue illisible : la réponse de /api/catalogue.json ne décrit pas une liste de produits.',
      )
    }

    return payload
  },
})
