import { describe, expect, it } from 'vitest'
import { createStaticCatalogueGateway } from '../../../app/services/static-catalogue'
import { PRODUCTS } from '../../../app/services/catalogue-data'
import { toProductId, type Product } from '../../../app/domain/types'

describe('catalogue statique', () => {
  it('rend les produits livrés avec l’application', async () => {
    const gateway = createStaticCatalogueGateway()
    await expect(gateway.all()).resolves.toEqual(PRODUCTS)
  })

  it('accepte un jeu de produits fourni, pour les tests et les démonstrations', async () => {
    const produit: Product = {
      id: toProductId('x'),
      name: 'X',
      category: 'drinks',
      priceCents: 100,
      allergens: [],
      available: true,
      removables: [],
      extras: [],
    }

    const gateway = createStaticCatalogueGateway([produit])
    await expect(gateway.all()).resolves.toEqual([produit])
  })
})
