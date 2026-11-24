// =============================================================================
// Panier
// =============================================================================
// Mutations en fonctions pures : chaque opération rend un nouveau panier et ne
// modifie jamais celui qu'on lui passe. Aucun état caché, aucune horloge, aucun
// générateur aléatoire.
//
// L'identité d'une ligne est calculée à partir de son contenu, et non tirée au
// hasard. Deux ajouts du même produit personnalisé à l'identique produisent donc
// la même identité, ce qui rend le regroupement immédiat et les tests
// déterministes.

import { CartLimitError, InvalidLineError } from './errors'
import {
  toCartLineId,
  type Cart,
  type CartLine,
  type CartLineId,
  type Customisation,
  type MenuComposition,
  type ProductId,
} from './types'

/** Unités d'une même ligne. Au-delà, l'ajout est refusé. */
export const MAX_QUANTITY_PER_LINE = 10

/** Articles d'une commande, toutes lignes confondues. */
export const MAX_ITEMS_PER_ORDER = 30

export const EMPTY_CART: Cart = { lines: [] }

/**
 * Signature du contenu d'une ligne.
 *
 * Les identifiants sont triés : l'ordre dans lequel le client coche ses options
 * ne doit pas créer deux lignes là où il n'y a qu'un seul produit identique.
 */
const signatureOf = (
  productId: ProductId,
  customisation: Customisation,
  menu?: MenuComposition,
): CartLineId => {
  const removed = [...customisation.removedIds].sort().join('+')
  const extras = [...customisation.extraIds].sort().join('+')
  const composition =
    menu === undefined
      ? 'seul'
      : [menu.size, menu.sideId, menu.drinkId, menu.dessertId ?? 'sans-dessert'].join('|')

  return toCartLineId(`${productId}#${composition}#-${removed}#+${extras}`)
}

/** Nombre d'articles, toutes lignes confondues. */
export const itemCount = (cart: Cart): number =>
  cart.lines.reduce((total, line) => total + line.quantity, 0)

export const isEmpty = (cart: Cart): boolean => cart.lines.length === 0

const findLine = (cart: Cart, lineId: CartLineId): CartLine => {
  const line = cart.lines.find((candidate) => candidate.id === lineId)
  if (line === undefined) {
    throw new InvalidLineError(`La ligne ${lineId} n’existe pas dans le panier.`)
  }
  return line
}

const checkQuantity = (line: CartLine, quantity: number, cart: Cart): void => {
  if (quantity > MAX_QUANTITY_PER_LINE) {
    throw new CartLimitError(
      `Une ligne ne peut pas dépasser ${MAX_QUANTITY_PER_LINE} unités du même article.`,
    )
  }

  const futureCount = itemCount(cart) - line.quantity + quantity
  if (futureCount > MAX_ITEMS_PER_ORDER) {
    throw new CartLimitError(`Une commande ne peut pas dépasser ${MAX_ITEMS_PER_ORDER} articles.`)
  }
}

/**
 * Ajoute un produit au panier.
 *
 * Un produit identique personnalisé à l'identique rejoint la ligne existante,
 * dont la quantité augmente. Personnalisé différemment, il forme une ligne
 * distincte : le client doit pouvoir modifier l'un sans toucher à l'autre.
 */
export const addLine = (
  cart: Cart,
  input: {
    readonly productId: ProductId
    readonly customisation: Customisation
    readonly menu?: MenuComposition
    readonly quantity?: number
  },
): Cart => {
  const quantity = input.quantity ?? 1
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new InvalidLineError(`Quantité invalide à l’ajout : ${quantity}.`)
  }

  const id = signatureOf(input.productId, input.customisation, input.menu)
  const existing = cart.lines.find((line) => line.id === id)

  if (existing !== undefined) {
    return setQuantity(cart, id, existing.quantity + quantity)
  }

  const line: CartLine = {
    id,
    productId: input.productId,
    quantity,
    customisation: input.customisation,
    ...(input.menu === undefined ? {} : { menu: input.menu }),
  }

  checkQuantity({ ...line, quantity: 0 }, quantity, cart)

  return { lines: [...cart.lines, line] }
}

/**
 * Fixe la quantité d'une ligne. La quantité zéro retire la ligne : c'est le
 * résultat attendu quand le client décrémente une ligne à une unité.
 */
export const setQuantity = (cart: Cart, lineId: CartLineId, quantity: number): Cart => {
  const line = findLine(cart, lineId)

  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new InvalidLineError(`Quantité invalide : ${quantity}.`)
  }
  if (quantity === 0) return removeLine(cart, lineId)

  checkQuantity(line, quantity, cart)

  return {
    lines: cart.lines.map((candidate) =>
      candidate.id === lineId ? { ...candidate, quantity } : candidate,
    ),
  }
}

export const removeLine = (cart: Cart, lineId: CartLineId): Cart => {
  findLine(cart, lineId)
  return { lines: cart.lines.filter((line) => line.id !== lineId) }
}

export const clear = (): Cart => EMPTY_CART
