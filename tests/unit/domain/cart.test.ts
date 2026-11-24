import { describe, expect, it } from 'vitest'
import {
  EMPTY_CART,
  MAX_ITEMS_PER_ORDER,
  MAX_QUANTITY_PER_LINE,
  addLine,
  clear,
  isEmpty,
  itemCount,
  removeLine,
  setQuantity,
} from '../../../app/domain/cart'
import { CartLimitError, InvalidLineError } from '../../../app/domain/errors'
import {
  toCartLineId,
  toProductId,
  type Cart,
  type CartLineId,
  type Customisation,
} from '../../../app/domain/types'

const sans = (): Customisation => ({ removedIds: [], extraIds: [] })

const avec = (removedIds: string[], extraIds: string[]): Customisation => ({
  removedIds,
  extraIds,
})

/**
 * Identifiant d'une ligne du panier. `noUncheckedIndexedAccess` rend l'accès
 * indexé possiblement indéfini : le lever ici évite d'éparpiller des assertions
 * de type dans chaque test.
 */
const idOf = (cart: Cart, index = 0): CartLineId => {
  const line = cart.lines[index]
  if (line === undefined) throw new Error(`aucune ligne à l’index ${index}`)
  return line.id
}

const classique = toProductId('classique')
const cookie = toProductId('cookie')

const panierAvec = (...quantites: number[]): Cart =>
  quantites.reduce(
    (cart, quantity, index) =>
      addLine(cart, {
        productId: toProductId(`produit-${index}`),
        customisation: sans(),
        quantity,
      }),
    EMPTY_CART,
  )

describe('panier vide', () => {
  it('ne contient aucune ligne ni aucun article', () => {
    expect(isEmpty(EMPTY_CART)).toBe(true)
    expect(itemCount(EMPTY_CART)).toBe(0)
  })
})

describe('ajout', () => {
  it('crée une ligne en quantité 1 par défaut', () => {
    const cart = addLine(EMPTY_CART, { productId: classique, customisation: sans() })

    expect(cart.lines).toHaveLength(1)
    expect(cart.lines[0]?.quantity).toBe(1)
    expect(isEmpty(cart)).toBe(false)
  })

  it('ne modifie pas le panier d’origine', () => {
    const avant = addLine(EMPTY_CART, { productId: classique, customisation: sans() })
    addLine(avant, { productId: cookie, customisation: sans() })

    expect(avant.lines).toHaveLength(1)
  })

  it('regroupe un produit identique personnalisé à l’identique', () => {
    let cart = addLine(EMPTY_CART, { productId: classique, customisation: sans() })
    cart = addLine(cart, { productId: classique, customisation: sans(), quantity: 2 })

    expect(cart.lines).toHaveLength(1)
    expect(cart.lines[0]?.quantity).toBe(3)
  })

  it('ignore l’ordre des options pour décider du regroupement', () => {
    // Cocher « sans oignons » puis « sans cornichons », ou l'inverse, donne le
    // même produit : ce doit être une seule ligne.
    let cart = addLine(EMPTY_CART, {
      productId: classique,
      customisation: avec(['onions', 'pickles'], []),
    })
    cart = addLine(cart, {
      productId: classique,
      customisation: avec(['pickles', 'onions'], []),
    })

    expect(cart.lines).toHaveLength(1)
    expect(cart.lines[0]?.quantity).toBe(2)
  })

  it('sépare deux personnalisations différentes du même produit', () => {
    let cart = addLine(EMPTY_CART, { productId: classique, customisation: sans() })
    cart = addLine(cart, { productId: classique, customisation: avec(['onions'], []) })

    expect(cart.lines).toHaveLength(2)
    expect(itemCount(cart)).toBe(2)
  })

  it('sépare un produit seul de ce même produit en menu', () => {
    let cart = addLine(EMPTY_CART, { productId: classique, customisation: sans() })
    cart = addLine(cart, {
      productId: classique,
      customisation: sans(),
      menu: { size: 'M', sideId: toProductId('fries-small'), drinkId: toProductId('soda-33') },
    })

    expect(cart.lines).toHaveLength(2)
  })

  it('refuse une quantité nulle ou fractionnaire', () => {
    expect(() =>
      addLine(EMPTY_CART, { productId: classique, customisation: sans(), quantity: 0 }),
    ).toThrow(InvalidLineError)
    expect(() =>
      addLine(EMPTY_CART, { productId: classique, customisation: sans(), quantity: 1.5 }),
    ).toThrow(InvalidLineError)
  })
})

describe('quantité', () => {
  it('remplace la quantité d’une ligne', () => {
    const cart = addLine(EMPTY_CART, { productId: classique, customisation: sans() })

    expect(setQuantity(cart, idOf(cart), 4).lines[0]?.quantity).toBe(4)
  })

  it('retire la ligne à la quantité zéro', () => {
    // C'est le résultat attendu quand le client décrémente une ligne à une
    // unité : la confirmation relève de l'interface, pas du domaine.
    const cart = addLine(EMPTY_CART, { productId: classique, customisation: sans() })

    expect(isEmpty(setQuantity(cart, idOf(cart), 0))).toBe(true)
  })

  it('refuse une quantité négative ou fractionnaire', () => {
    const cart = addLine(EMPTY_CART, { productId: classique, customisation: sans() })

    expect(() => setQuantity(cart, idOf(cart), -1)).toThrow(InvalidLineError)
    expect(() => setQuantity(cart, idOf(cart), 2.5)).toThrow(InvalidLineError)
  })

  it('refuse une ligne inconnue plutôt que de l’ignorer', () => {
    expect(() => setQuantity(EMPTY_CART, toCartLineId('fantome'), 1)).toThrow(InvalidLineError)
    expect(() => removeLine(EMPTY_CART, toCartLineId('fantome'))).toThrow(InvalidLineError)
  })
})

describe('limites', () => {
  it('refuse de dépasser dix unités sur une ligne', () => {
    const cart = addLine(EMPTY_CART, {
      productId: classique,
      customisation: sans(),
      quantity: MAX_QUANTITY_PER_LINE,
    })

    expect(itemCount(cart)).toBe(10)
    expect(() => setQuantity(cart, idOf(cart), MAX_QUANTITY_PER_LINE + 1)).toThrow(CartLimitError)
    expect(() => addLine(cart, { productId: classique, customisation: sans() })).toThrow(
      CartLimitError,
    )
  })

  it('refuse de dépasser trente articles sur la commande', () => {
    const cart = panierAvec(10, 10, 10)
    expect(itemCount(cart)).toBe(MAX_ITEMS_PER_ORDER)

    expect(() => addLine(cart, { productId: cookie, customisation: sans() })).toThrow(
      CartLimitError,
    )
  })

  it('autorise de redescendre après avoir atteint une limite', () => {
    const cart = panierAvec(10, 10, 10)
    const allege = setQuantity(cart, idOf(cart), 5)

    expect(itemCount(allege)).toBe(25)
    expect(itemCount(addLine(allege, { productId: cookie, customisation: sans() }))).toBe(26)
  })
})

describe('retrait et vidage', () => {
  it('retire une ligne sans toucher aux autres', () => {
    const cart = panierAvec(1, 2)

    const apres = removeLine(cart, idOf(cart))
    expect(apres.lines).toHaveLength(1)
    expect(itemCount(apres)).toBe(2)
  })

  it('vide le panier', () => {
    expect(isEmpty(clear())).toBe(true)
  })
})
