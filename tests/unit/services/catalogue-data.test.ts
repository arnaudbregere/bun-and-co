import { describe, expect, it } from 'vitest'
import { findProduct, productsOfCategory } from '../../../app/domain/catalogue'
import { ALLERGENS, toProductId, type Allergen } from '../../../app/domain/types'
import { PRODUCTS } from '../../../app/services/catalogue-data'

describe('intégrité du catalogue', () => {
  it('ne contient que des prix en centimes entiers et positifs', () => {
    // La règle de calcul du projet. Un prix à virgule ici contaminerait tous
    // les totaux, et l'erreur ne se verrait qu'après plusieurs lignes.
    for (const product of PRODUCTS) {
      expect(Number.isInteger(product.priceCents), product.name).toBe(true)
      expect(product.priceCents, product.name).toBeGreaterThan(0)
    }
  })

  it('n’attribue aucun identifiant en double', () => {
    const ids = PRODUCTS.map((product) => product.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('ne déclare que des allergènes réglementaires', () => {
    const regulatory = new Set<Allergen>(ALLERGENS)

    for (const product of PRODUCTS) {
      for (const allergen of product.allergens) {
        expect(regulatory.has(allergen), `${product.name} : ${allergen}`).toBe(true)
      }
      expect(new Set(product.allergens).size, product.name).toBe(product.allergens.length)
    }
  })

  it('déclare des suppléments à prix entier, positif ou nul', () => {
    for (const product of PRODUCTS) {
      for (const extra of product.extras) {
        expect(Number.isInteger(extra.priceCents), extra.label).toBe(true)
        expect(extra.priceCents, extra.label).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('couvre dix des quatorze catégories d’allergènes', () => {
    // Une enseigne de burgers n'emploie ni arachides, ni crustacés, ni
    // mollusques, ni lupin. Ce test fige ce constat : s'il échoue, c'est qu'un
    // produit a changé d'allergènes sans que la carte soit relue.
    const used = new Set(PRODUCTS.flatMap((product) => product.allergens))
    expect([...used].sort()).toEqual(
      [
        'celery',
        'eggs',
        'fish',
        'gluten',
        'milk',
        'mustard',
        'nuts',
        'sesame',
        'soy',
        'sulphites',
      ].sort(),
    )
  })
})

describe('composition de la carte', () => {
  it('compte six burgers, dont un sans viande et un au poisson', () => {
    const burgers = productsOfCategory(PRODUCTS, 'burgers')
    expect(burgers).toHaveLength(6)
    expect(burgers.map((product) => product.id)).toContain(toProductId('vegetal'))
    expect(burgers.map((product) => product.id)).toContain(toProductId('mariner'))
  })

  it('répartit les vingt-sept références entre les cinq catégories', () => {
    expect(PRODUCTS).toHaveLength(27)
    expect(productsOfCategory(PRODUCTS, 'chicken')).toHaveLength(4)
    expect(productsOfCategory(PRODUCTS, 'sides')).toHaveLength(6)
    expect(productsOfCategory(PRODUCTS, 'desserts')).toHaveLength(4)
    expect(productsOfCategory(PRODUCTS, 'drinks')).toHaveLength(7)
  })

  it('propose la personnalisation sur les seuls burgers', () => {
    for (const product of PRODUCTS) {
      const customisable = product.removables.length > 0 || product.extras.length > 0
      expect(customisable, product.name).toBe(product.category === 'burgers')
    }
  })

  it('refuse le steak supplémentaire au Végétal et au Mariner, et le bacon au seul Végétal', () => {
    const extrasOf = (id: string) =>
      findProduct(PRODUCTS, toProductId(id))?.extras.map((extra) => extra.id) ?? []

    expect(extrasOf('vegetal')).not.toContain('bacon')
    expect(extrasOf('vegetal')).not.toContain('extra-steak')
    expect(extrasOf('mariner')).toContain('bacon')
    expect(extrasOf('mariner')).not.toContain('extra-steak')
    expect(extrasOf('classique')).toContain('extra-steak')
  })
})
