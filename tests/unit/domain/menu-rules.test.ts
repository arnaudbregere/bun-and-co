import { describe, expect, it } from 'vitest'
import {
  DRINK_SUBSTITUTIONS,
  MENU_SIZE_RULES,
  SIDE_SUBSTITUTIONS,
} from '../../../app/domain/menu-rules'
import { findProduct } from '../../../app/domain/catalogue'
import { MENU_SIZES } from '../../../app/domain/types'
import { PRODUCTS } from '../../../app/services/catalogue-data'

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
  // Ces tests croisent une règle du domaine avec les données du catalogue : ils
  // vérifient que la règle reste applicable à la carte réellement vendue.
  it('ne propose que des produits existants', () => {
    for (const substitution of [...SIDE_SUBSTITUTIONS, ...DRINK_SUBSTITUTIONS]) {
      expect(findProduct(PRODUCTS, substitution.productId), substitution.productId).toBeDefined()
    }
  })

  it('ne propose en accompagnement que des accompagnements, et en boisson que des boissons', () => {
    for (const substitution of SIDE_SUBSTITUTIONS) {
      expect(findProduct(PRODUCTS, substitution.productId)?.category).toBe('sides')
    }
    for (const substitution of DRINK_SUBSTITUTIONS) {
      expect(findProduct(PRODUCTS, substitution.productId)?.category).toBe('drinks')
    }
  })

  it('n’applique aucun supplément négatif', () => {
    for (const substitution of [...SIDE_SUBSTITUTIONS, ...DRINK_SUBSTITUTIONS]) {
      expect(Number.isInteger(substitution.surchargeCents)).toBe(true)
      expect(substitution.surchargeCents).toBeGreaterThanOrEqual(0)
    }
  })
})
