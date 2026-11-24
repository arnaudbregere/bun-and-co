import { describe, expect, it } from 'vitest'
import {
  FIRST_ORDER_NUMBER,
  LAST_ORDER_NUMBER,
  confirmOrder,
  nextOrderNumber,
} from '../../../app/domain/order'
import { EMPTY_CART, addLine } from '../../../app/domain/cart'
import { EmptyCartError } from '../../../app/domain/errors'
import { toProductId, type Draft } from '../../../app/domain/types'

const draft = (): Draft => ({
  cart: addLine(EMPTY_CART, {
    productId: toProductId('classique'),
    customisation: { removedIds: [], extraIds: [] },
  }),
  serviceMode: 'eat-in',
})

describe('numéro de commande', () => {
  it('commence à la première valeur de la plage', () => {
    expect(nextOrderNumber(0)).toBe(FIRST_ORDER_NUMBER)
    expect(nextOrderNumber(1)).toBe(101)
  })

  it('revient au début une fois la plage parcourue', () => {
    const range = LAST_ORDER_NUMBER - FIRST_ORDER_NUMBER + 1
    expect(nextOrderNumber(range - 1)).toBe(LAST_ORDER_NUMBER)
    expect(nextOrderNumber(range)).toBe(FIRST_ORDER_NUMBER)
  })

  it('refuse un compte invalide', () => {
    expect(() => nextOrderNumber(-1)).toThrow(RangeError)
    expect(() => nextOrderNumber(1.5)).toThrow(RangeError)
  })
})

describe('confirmation', () => {
  it('reprend le panier, le mode de consommation et le règlement', () => {
    const order = confirmOrder(draft(), 'card', 142, '2026-11-24T18:00:00.000Z')

    expect(order.number).toBe(142)
    expect(order.serviceMode).toBe('eat-in')
    expect(order.paymentMode).toBe('card')
    expect(order.confirmedAt).toBe('2026-11-24T18:00:00.000Z')
    expect(order.cart.lines).toHaveLength(1)
  })

  it('refuse un panier vide', () => {
    // L'interface rend déjà le paiement indisponible dans ce cas. Cette
    // vérification est la dernière barrière, pas la première.
    const vide: Draft = { cart: EMPTY_CART, serviceMode: 'takeaway' }
    expect(() => confirmOrder(vide, 'counter', 100, '2026-11-24T18:00:00.000Z')).toThrow(
      EmptyCartError,
    )
  })

  it('refuse un numéro hors de la plage à trois chiffres', () => {
    expect(() => confirmOrder(draft(), 'card', 99, '2026-11-24T18:00:00.000Z')).toThrow(RangeError)
    expect(() => confirmOrder(draft(), 'card', 1000, '2026-11-24T18:00:00.000Z')).toThrow(
      RangeError,
    )
    expect(() => confirmOrder(draft(), 'card', 100.5, '2026-11-24T18:00:00.000Z')).toThrow(
      RangeError,
    )
  })
})
