import { beforeEach, describe, expect, it } from 'vitest'
import { createSessionOrderStore } from '../../../app/services/session-order-store'
import { EMPTY_CART, addLine } from '../../../app/domain/cart'
import { confirmOrder } from '../../../app/domain/order'
import { toProductId, type Draft, type Order } from '../../../app/domain/types'

/**
 * Stockage en mémoire conforme à l'interface `Storage`. Les tests n'ont donc
 * besoin d'aucun navigateur, et le service reste vérifiable dans Node.
 */
const createMemoryStorage = (): Storage => {
  const entries = new Map<string, string>()

  return {
    get length() {
      return entries.size
    },
    clear: () => entries.clear(),
    getItem: (key) => entries.get(key) ?? null,
    key: (index) => [...entries.keys()][index] ?? null,
    removeItem: (key) => {
      entries.delete(key)
    },
    setItem: (key, value) => {
      entries.set(key, value)
    },
  }
}

const commandeEnCours = (): Draft => ({
  cart: addLine(EMPTY_CART, {
    productId: toProductId('classique'),
    customisation: { removedIds: [], extraIds: [] },
  }),
  serviceMode: 'eat-in',
})

const commande = (numero: number): Order =>
  confirmOrder(commandeEnCours(), 'card', numero, '2026-11-27T12:00:00.000Z')

let storage: Storage

beforeEach(() => {
  storage = createMemoryStorage()
})

describe('commande confirmée', () => {
  it('relit ce qu’elle a écrit', () => {
    const magasin = createSessionOrderStore(storage)
    magasin.write(commande(142))

    const relue = magasin.read()
    expect(relue?.number).toBe(142)
    expect(relue?.paymentMode).toBe('card')
    expect(relue?.serviceMode).toBe('eat-in')
    expect(relue?.cart.lines).toHaveLength(1)
  })

  it('rend indéfini quand il n’y a rien', () => {
    expect(createSessionOrderStore(storage).read()).toBeUndefined()
  })

  it('rend indéfini sur un contenu illisible plutôt que de lever', () => {
    storage.setItem('bun-and-co:order', '{ ceci n’est pas du JSON')
    expect(createSessionOrderStore(storage).read()).toBeUndefined()
  })

  it('rend indéfini sur une forme périmée', () => {
    // Le stockage survit à un déploiement : un contenu écrit par une version
    // précédente ne doit pas faire tomber la borne.
    storage.setItem('bun-and-co:order', JSON.stringify({ number: 142 }))
    expect(createSessionOrderStore(storage).read()).toBeUndefined()

    storage.setItem(
      'bun-and-co:order',
      JSON.stringify({ ...commande(142), paymentMode: 'bitcoin' }),
    )
    expect(createSessionOrderStore(storage).read()).toBeUndefined()
  })
})

describe('numéros émis', () => {
  it('part de zéro et compte chaque écriture', () => {
    const magasin = createSessionOrderStore(storage)
    expect(magasin.issuedCount()).toBe(0)

    magasin.write(commande(100))
    expect(magasin.issuedCount()).toBe(1)

    magasin.write(commande(101))
    expect(magasin.issuedCount()).toBe(2)
  })

  it('garde le compte quand la commande est effacée', () => {
    // C'est le point de l'exigence EF-032 : le client suivant de la même
    // session ne doit pas reprendre un numéro déjà appelé.
    const magasin = createSessionOrderStore(storage)
    magasin.write(commande(100))
    magasin.clear()

    expect(magasin.read()).toBeUndefined()
    expect(magasin.issuedCount()).toBe(1)
  })

  it('repart de zéro sur un compte illisible', () => {
    // Propager un `NaN` jusqu’au numéro produirait un ticket sans numéro.
    storage.setItem('bun-and-co:orders-issued', 'beaucoup')
    expect(createSessionOrderStore(storage).issuedCount()).toBe(0)

    storage.setItem('bun-and-co:orders-issued', '-3')
    expect(createSessionOrderStore(storage).issuedCount()).toBe(0)
  })
})
