// =============================================================================
// Visuels des produits
// =============================================================================
// Les photographies sont des fichiers livrés avec l'application, pas des
// données du catalogue : leur URL est forgée par le bundler au build, et elle
// change à chaque modification du fichier. Elles n'ont donc pas leur place dans
// le type `Product`, que la route du catalogue sérialise en JSON.
//
// Ce composable est le seul chemin des écrans vers `PRODUCT_IMAGES` : une page
// qui importerait le service court-circuiterait la règle des trois couches.

import { PRODUCT_IMAGES, type ProductImage } from '../services/product-images'

export const useVisuels = () => ({
  /**
   * Visuel d'un produit, ou `undefined` s'il n'en a pas.
   *
   * L'absence est une valeur que l'appelant traite : le fichier des visuels est
   * produit par un script, et un produit ajouté à la carte peut attendre sa
   * photographie. La carte affiche alors le substitut de `ProductImage`.
   */
  visuelDe: (id: string): ProductImage | undefined => PRODUCT_IMAGES[id],
})
