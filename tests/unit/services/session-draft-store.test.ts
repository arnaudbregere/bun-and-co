import { beforeEach, describe, expect, it } from 'vitest'
import { createSessionDraftStore } from '../../../app/services/session-draft-store'
import { EMPTY_CART, addLine } from '../../../app/domain/cart'
import { toProductId, type Draft } from '../../../app/domain/types'

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

const draft = (): Draft => ({
  cart: addLine(EMPTY_CART, {
    productId: toProductId('classique'),
    customisation: { removedIds: [], extraIds: [] },
  }),
  serviceMode: 'eat-in',
})

let storage: Storage

beforeEach(() => {
  storage = createMemoryStorage()
})

describe('persistance de la commande en cours', () => {
  it('rend undefined quand rien n’est enregistré', () => {
    expect(createSessionDraftStore(storage).read()).toBeUndefined()
  })

  it('relit ce qui a été écrit', () => {
    const store = createSessionDraftStore(storage)
    store.write(draft())

    expect(store.read()).toEqual(draft())
  })

  it('oublie après effacement', () => {
    const store = createSessionDraftStore(storage)
    store.write(draft())
    store.clear()

    expect(store.read()).toBeUndefined()
  })

  it('ignore un contenu illisible plutôt que de lever', () => {
    // Le stockage est modifiable par l'utilisateur. La borne repart d'un panier
    // vide, elle ne refuse pas de servir le client.
    storage.setItem('bun-and-co:draft', '{ ceci n’est pas du JSON')

    expect(createSessionDraftStore(storage).read()).toBeUndefined()
  })

  it('ignore un contenu de forme inattendue', () => {
    // Cas réel après un déploiement : une commande écrite par une version
    // précédente, dont la forme a changé depuis.
    storage.setItem('bun-and-co:draft', JSON.stringify({ cart: { lines: [] } }))
    expect(createSessionDraftStore(storage).read()).toBeUndefined()

    storage.setItem('bun-and-co:draft', JSON.stringify({ serviceMode: 'eat-in' }))
    expect(createSessionDraftStore(storage).read()).toBeUndefined()

    storage.setItem(
      'bun-and-co:draft',
      JSON.stringify({ cart: { lines: 'non' }, serviceMode: 'eat-in' }),
    )
    expect(createSessionDraftStore(storage).read()).toBeUndefined()

    storage.setItem('bun-and-co:draft', JSON.stringify(null))
    expect(createSessionDraftStore(storage).read()).toBeUndefined()
  })
})
