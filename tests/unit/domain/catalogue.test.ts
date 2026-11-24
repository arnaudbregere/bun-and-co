import { describe, expect, it } from 'vitest'
import { findProduct, productsOfCategory } from '../../../app/domain/catalogue'
import { toProductId, type Product } from '../../../app/domain/types'

// Jeu de produits minimal, construit pour ces tests. Le domaine ne dépend
// d'aucun catalogue réel : le vérifier avec les vingt-sept références
// masquerait un couplage au lieu de le révéler.
const produit = (id: string, category: Product['category'], available = true): Product => ({
  id: toProductId(id),
  name: id,
  category,
  priceCents: 100,
  allergens: [],
  available,
  removables: [],
  extras: [],
})

const PRODUITS: readonly Product[] = [
  produit('a', 'burgers'),
  produit('b', 'burgers', false),
  produit('c', 'drinks'),
]

describe('consultation du catalogue', () => {
  it('retrouve un produit par son identifiant', () => {
    expect(findProduct(PRODUITS, toProductId('c'))?.category).toBe('drinks')
  })

  it('rend undefined pour un identifiant inconnu, plutôt que de lever', () => {
    expect(findProduct(PRODUITS, toProductId('inexistant'))).toBeUndefined()
  })

  it('filtre par catégorie en conservant l’ordre du catalogue', () => {
    expect(productsOfCategory(PRODUITS, 'burgers').map((p) => p.id)).toEqual(['a', 'b'])
    expect(productsOfCategory(PRODUITS, 'desserts')).toEqual([])
  })
})
