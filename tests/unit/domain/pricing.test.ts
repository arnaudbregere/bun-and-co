import { describe, expect, it } from 'vitest'
import {
  InvalidLineError,
  cartTotalCents,
  extrasTotalCents,
  lineTotalCents,
  menuSurchargeCents,
  unitPriceCents,
} from '../../../app/domain/pricing'
import { findProduct } from '../../../app/domain/catalogue'
import { MENU_SIZE_RULES } from '../../../app/domain/menu-rules'
import { PRODUCTS } from '../../../app/services/catalogue-data'
import {
  toCartLineId,
  toExtraId,
  toProductId,
  toRemovableId,
  type CartLine,
  type MenuSize,
  type Product,
} from '../../../app/domain/types'

const product = (id: string): Product => {
  const found = findProduct(PRODUCTS, toProductId(id))
  if (found === undefined) throw new Error(`produit absent du catalogue : ${id}`)
  return found
}

const line = (overrides: Partial<CartLine> = {}): CartLine => ({
  id: toCartLineId('ligne-1'),
  productId: toProductId('classique'),
  quantity: 1,
  customisation: { removedIds: [], extraIds: [] },
  ...overrides,
})

const menuOf = (size: MenuSize) => {
  const rule = MENU_SIZE_RULES[size]
  return {
    size,
    sideId: rule.defaultSideId,
    drinkId: rule.defaultDrinkId,
    ...(rule.includesDessert ? { dessertId: toProductId('cookie') } : {}),
  }
}

describe('suppléments', () => {
  it('ne coûte rien sans supplément retenu', () => {
    expect(extrasTotalCents(product('classique'), { removedIds: [], extraIds: [] })).toBe(0)
  })

  it('additionne les suppléments retenus', () => {
    const total = extrasTotalCents(product('classique'), {
      removedIds: [],
      extraIds: [toExtraId('bacon'), toExtraId('cheddar')],
    })
    expect(total).toBe(200)
  })

  it('ne facture pas les retraits', () => {
    const total = extrasTotalCents(product('classique'), {
      removedIds: [toRemovableId('onions'), toRemovableId('pickles')],
      extraIds: [],
    })
    expect(total).toBe(0)
  })

  it('refuse un supplément que le produit n’accepte pas', () => {
    // Le Végétal refuse le bacon : un produit végétal personnalisable en
    // non-végétal serait un défaut, pas une liberté offerte au client.
    expect(() =>
      extrasTotalCents(product('vegetal'), { removedIds: [], extraIds: [toExtraId('bacon')] }),
    ).toThrow(InvalidLineError)
  })
})

describe('forfait de menu', () => {
  it('applique le forfait de la taille, sans supplément sur les composants inclus', () => {
    expect(menuSurchargeCents(menuOf('M'))).toBe(400)
    expect(menuSurchargeCents(menuOf('L'))).toBe(490)
    expect(menuSurchargeCents(menuOf('XL'))).toBe(690)
  })

  it('facture une substitution d’accompagnement', () => {
    expect(menuSurchargeCents({ ...menuOf('M'), sideId: toProductId('potatoes') })).toBe(460)
    expect(menuSurchargeCents({ ...menuOf('M'), sideId: toProductId('apple-slices') })).toBe(400)
  })

  it('facture une substitution de boisson', () => {
    expect(menuSurchargeCents({ ...menuOf('L'), drinkId: toProductId('milkshake') })).toBe(600)
    expect(menuSurchargeCents({ ...menuOf('L'), drinkId: toProductId('coffee') })).toBe(490)
  })

  it('refuse un composant hors des substitutions autorisées', () => {
    expect(() => menuSurchargeCents({ ...menuOf('M'), sideId: toProductId('cookie') })).toThrow(
      InvalidLineError,
    )
    expect(() => menuSurchargeCents({ ...menuOf('M'), drinkId: toProductId('brownie') })).toThrow(
      InvalidLineError,
    )
  })

  it('exige un dessert en XL, et le refuse ailleurs', () => {
    const { dessertId: _dessertId, ...sansDessert } = menuOf('XL')
    expect(() => menuSurchargeCents(sansDessert)).toThrow(InvalidLineError)
    expect(() => menuSurchargeCents({ ...menuOf('M'), dessertId: toProductId('cookie') })).toThrow(
      InvalidLineError,
    )
  })
})

describe('prix d’une ligne', () => {
  it('vaut le prix du produit seul, sans menu ni supplément', () => {
    expect(unitPriceCents(product('classique'), line())).toBe(590)
  })

  it('ajoute les suppléments', () => {
    const avecBacon = line({ customisation: { removedIds: [], extraIds: [toExtraId('bacon')] } })
    expect(unitPriceCents(product('classique'), avecBacon)).toBe(710)
  })

  it('ajoute le forfait de menu', () => {
    expect(unitPriceCents(product('classique'), line({ menu: menuOf('M') }))).toBe(990)
  })

  it('multiplie par la quantité', () => {
    expect(lineTotalCents(product('classique'), line({ quantity: 3 }))).toBe(1770)
  })
})

describe('total du panier', () => {
  it('additionne les lignes', () => {
    const lignes: CartLine[] = [
      line({ quantity: 2 }),
      line({ id: toCartLineId('ligne-2'), productId: toProductId('cookie') }),
    ]
    expect(cartTotalCents(PRODUCTS, lignes)).toBe(1370)
  })

  it('vaut zéro sur un panier vide', () => {
    expect(cartTotalCents(PRODUCTS, [])).toBe(0)
  })

  it('refuse une ligne qui désigne un produit absent du catalogue', () => {
    expect(() => cartTotalCents(PRODUCTS, [line({ productId: toProductId('fantome') })])).toThrow(
      InvalidLineError,
    )
  })
})

describe('invariant métier : l’économie du menu croît avec la taille', () => {
  // Propriété commerciale inscrite dans la spécification. Un forfait mal réglé
  // rendrait un grand menu moins avantageux qu'un petit, ce qu'aucune relecture
  // n'attrape sur six burgers et trois tailles.
  it.each(['classique', 'fermier', 'vegetal', 'mariner', 'montagnard', 'double-smoky'])(
    'sur %s',
    (id) => {
      const burger = product(id)

      const economies = (['M', 'L', 'XL'] as const).map((size) => {
        const rule = MENU_SIZE_RULES[size]
        const pieces = [
          product(rule.defaultSideId).priceCents,
          product(rule.defaultDrinkId).priceCents,
          ...(rule.includesDessert ? [product('cookie').priceCents] : []),
        ].reduce((total, value) => total + value, 0)

        return pieces - rule.surchargeCents
      })

      expect(economies).toEqual([90, 110, 150])
      expect(economies[0]).toBeLessThan(economies[1] as number)
      expect(economies[1] as number).toBeLessThan(economies[2] as number)
    },
  )
})
