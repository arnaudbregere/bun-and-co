// =============================================================================
// Consultation du catalogue
// =============================================================================
// Fonctions pures de lecture. Elles reçoivent les produits en argument : le
// domaine ne détient aucun catalogue et n'en charge aucun, il sait seulement
// comment interroger une liste de produits.
//
// C'est ce qui rend ces fonctions testables sans service, et réutilisables quel
// que soit l'endroit d'où viennent les produits.

import type { Category, Product, ProductId } from './types'

/**
 * Produit portant cet identifiant, ou `undefined` s'il n'existe pas.
 *
 * L'absence est une valeur que l'appelant doit traiter, et non une exception à
 * rattraper : une borne ne doit pas tomber parce qu'un identifiant est obsolète.
 */
export const findProduct = (products: readonly Product[], id: ProductId): Product | undefined =>
  products.find((product) => product.id === id)

/**
 * Produits d'une catégorie, dans l'ordre du catalogue.
 */
export const productsOfCategory = (
  products: readonly Product[],
  category: Category,
): readonly Product[] => products.filter((product) => product.category === category)
