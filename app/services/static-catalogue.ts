// =============================================================================
// Catalogue statique
// =============================================================================
// Implémentation du port `CatalogueGateway` sur les données livrées avec
// l'application.
//
// Elle reste asynchrone bien que la lecture soit immédiate : le contrat du port
// est asynchrone, parce que le catalogue sera servi par une route préconstruite
// au build. Les appelants écrits aujourd'hui n'auront donc rien à changer le
// jour où cette route remplacera cette implémentation.

import type { CatalogueGateway } from '../domain/ports'
import type { Product } from '../domain/types'
import { PRODUCTS } from './catalogue-data'

export const createStaticCatalogueGateway = (
  products: readonly Product[] = PRODUCTS,
): CatalogueGateway => ({
  all: async () => products,
})
