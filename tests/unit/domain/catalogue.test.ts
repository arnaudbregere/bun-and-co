import { describe, expect, it } from 'vitest'
import {
  DRINK_SUBSTITUTIONS,
  MENU_SIZE_RULES,
  PRODUCTS,
  SIDE_SUBSTITUTIONS,
  findProduct,
  productsOfCategory,
} from '../../../app/domain/catalogue'
import { ALLERGENS, MENU_SIZES, toProductId, type Allergen } from '../../../app/domain/types'

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
    const burgers = productsOfCategory('burgers')
    expect(burgers).toHaveLength(6)
    expect(burgers.map((product) => product.id)).toContain(toProductId('vegetal'))
    expect(burgers.map((product) => product.id)).toContain(toProductId('mariner'))
  })

  it('répartit les vingt-sept références entre les cinq catégories', () => {
    expect(PRODUCTS).toHaveLength(27)
    expect(productsOfCategory('chicken')).toHaveLength(4)
    expect(productsOfCategory('sides')).toHaveLength(6)
    expect(productsOfCategory('desserts')).toHaveLength(4)
    expect(productsOfCategory('drinks')).toHaveLength(7)
  })

  it('propose la personnalisation sur les seuls burgers', () => {
    for (const product of PRODUCTS) {
      const customisable = product.removables.length > 0 || product.extras.length > 0
      expect(customisable, product.name).toBe(product.category === 'burgers')
    }
  })

  it('refuse le steak supplémentaire au Végétal et au Mariner, et le bacon au seul Végétal', () => {
    const extrasOf = (id: string) =>
      findProduct(toProductId(id))?.extras.map((extra) => extra.id) ?? []

    expect(extrasOf('vegetal')).not.toContain('bacon')
    expect(extrasOf('vegetal')).not.toContain('extra-steak')
    expect(extrasOf('mariner')).toContain('bacon')
    expect(extrasOf('mariner')).not.toContain('extra-steak')
    expect(extrasOf('classique')).toContain('extra-steak')
  })
})

describe('règles de menu', () => {
  it('décrit les trois tailles avec un forfait croissant', () => {
    const surcharges = MENU_SIZES.map((size) => MENU_SIZE_RULES[size].surchargeCents)
    expect(surcharges).toEqual([400, 490, 690])
  })

  it('n’inclut un dessert que dans la taille XL', () => {
    expect(MENU_SIZE_RULES.M.includesDessert).toBe(false)
    expect(MENU_SIZE_RULES.L.includesDessert).toBe(false)
    expect(MENU_SIZE_RULES.XL.includesDessert).toBe(true)
  })

  it('fait grandir l’accompagnement avec la taille', () => {
    expect(MENU_SIZE_RULES.M.sideFormat).toBe('small')
    expect(MENU_SIZE_RULES.L.sideFormat).toBe('medium')
    expect(MENU_SIZE_RULES.XL.sideFormat).toBe('large')
  })
})

describe('substitutions', () => {
  it('ne propose que des produits existants', () => {
    for (const substitution of [...SIDE_SUBSTITUTIONS, ...DRINK_SUBSTITUTIONS]) {
      expect(findProduct(substitution.productId), substitution.productId).toBeDefined()
    }
  })

  it('ne propose en accompagnement que des accompagnements, et en boisson que des boissons', () => {
    for (const substitution of SIDE_SUBSTITUTIONS) {
      expect(findProduct(substitution.productId)?.category).toBe('sides')
    }
    for (const substitution of DRINK_SUBSTITUTIONS) {
      expect(findProduct(substitution.productId)?.category).toBe('drinks')
    }
  })

  it('n’applique aucun supplément négatif', () => {
    for (const substitution of [...SIDE_SUBSTITUTIONS, ...DRINK_SUBSTITUTIONS]) {
      expect(Number.isInteger(substitution.surchargeCents)).toBe(true)
      expect(substitution.surchargeCents).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('consultation du catalogue', () => {
  it('retrouve un produit par son identifiant', () => {
    expect(findProduct(toProductId('classique'))?.priceCents).toBe(590)
  })

  it('rend undefined pour un identifiant inconnu, plutôt que de lever', () => {
    // L'absence est une valeur que l'appelant doit traiter, pas une exception
    // à rattraper : une borne ne doit pas tomber parce qu'un identifiant est
    // obsolète.
    expect(findProduct(toProductId('inexistant'))).toBeUndefined()
  })
})
