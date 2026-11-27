// @vitest-environment nuxt

// Le composable appelle `useState`, la carte et la commande en cours : il lui
// faut une application Nuxt, que cet environnement fournit sans navigateur.
//
// Ni stockage de session ni horloge réelle. Le magasin et l'horloge sont des
// paramètres, et ces tests passent un magasin en mémoire et une horloge figée :
// la confirmation est alors vérifiable à la date près, sans geler le temps.

import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import type { CatalogueGateway, DraftStore, OrderStore } from '../../../app/domain/ports'
import type { Draft, Order, Product } from '../../../app/domain/types'
import { toProductId } from '../../../app/domain/types'
import { useDraft } from '../../../app/composables/useDraft'
import { useReglement, MESSAGE_REGLEMENT_REFUSE } from '../../../app/composables/useReglement'
import { useAnnonces } from '../../../app/composables/useAnnonces'

const BURGER: Product = {
  id: toProductId('classique'),
  name: 'Le Classique',
  category: 'burgers',
  priceCents: 590,
  available: true,
  allergens: ['gluten'],
  removables: [],
  extras: [],
}

const catalogue: CatalogueGateway = { all: async () => [BURGER] }

const INSTANT = '2026-11-27T12:00:00.000Z'

/** Magasin de la commande en cours, en mémoire. */
let enCours: Draft | undefined

const magasinCommande: DraftStore = {
  read: () => enCours,
  write: (commande) => {
    enCours = commande
  },
  clear: () => {
    enCours = undefined
  },
}

/** Magasin de la commande confirmée, en mémoire. */
let confirmee: Order | undefined
let emises: number

const magasin: OrderStore = {
  read: () => confirmee,
  write: (commande) => {
    confirmee = commande
    emises += 1
  },
  clear: () => {
    confirmee = undefined
  },
  issuedCount: () => emises,
}

/** Prépare un panier non vide, par le chemin que les écrans empruntent. */
const avecUnArticle = async () => {
  const commande = useDraft({ magasin: magasinCommande, catalogue })
  await flushPromises()

  commande.ajouter({
    productId: BURGER.id,
    customisation: { removedIds: [], extraIds: [] },
  })

  return commande
}

// L'environnement Nuxt partage l'application entre les tests d'un fichier, donc
// `useState` leur survit. Vider le panier et les régions d'annonce après chaque
// test évite que l'un hérite de ce que le précédent a laissé.
afterEach(() => {
  useDraft({ magasin: magasinCommande, catalogue }).vider()

  const { message, alerte } = useAnnonces()
  message.value = ''
  alerte.value = ''

  enCours = undefined
  confirmee = undefined
  emises = 0
})

describe('confirmation du règlement', () => {
  it('reprend le panier, le mode de consommation et le règlement', async () => {
    await avecUnArticle()

    const { confirmer } = useReglement({ magasin, horloge: () => INSTANT })
    const commande = confirmer('card')

    expect(commande?.paymentMode).toBe('card')
    expect(commande?.serviceMode).toBe('eat-in')
    expect(commande?.confirmedAt).toBe(INSTANT)
    expect(commande?.cart.lines).toHaveLength(1)
  })

  it('attribue le premier numéro de la plage, puis le suivant', async () => {
    await avecUnArticle()
    const premiere = useReglement({ magasin, horloge: () => INSTANT }).confirmer('card')
    expect(premiere?.number).toBe(100)

    await avecUnArticle()
    const seconde = useReglement({ magasin, horloge: () => INSTANT }).confirmer('counter')
    expect(seconde?.number).toBe(101)
  })

  it('persiste la commande et vide le panier', async () => {
    const commande = await avecUnArticle()

    useReglement({ magasin, horloge: () => INSTANT }).confirmer('counter')

    expect(confirmee?.paymentMode).toBe('counter')
    expect(commande.articles.value).toBe(0)
  })

  it('annonce la confirmation avec le numéro', async () => {
    await avecUnArticle()

    useReglement({ magasin, horloge: () => INSTANT }).confirmer('card')

    expect(useAnnonces().message.value).toContain('100')
  })
})

describe('refus', () => {
  it('refuse un panier vide, et le dit par la région d’alerte', () => {
    const { confirmer, reglable } = useReglement({ magasin, horloge: () => INSTANT })

    expect(reglable.value).toBe(false)
    expect(confirmer('card')).toBeUndefined()

    // Exigence EF-041 : le refus interrompt la lecture, il ne se glisse pas
    // dans la région courtoise.
    expect(useAnnonces().alerte.value).toContain('panier est vide')
    expect(confirmee).toBeUndefined()
  })

  it('annonce une panne du stockage sans laisser l’écran muet', async () => {
    await avecUnArticle()

    const enPanne: OrderStore = {
      ...magasin,
      write: () => {
        throw new Error('quota dépassé')
      },
    }

    const { confirmer } = useReglement({ magasin: enPanne, horloge: () => INSTANT })

    expect(confirmer('card')).toBeUndefined()
    expect(useAnnonces().alerte.value).toBe(MESSAGE_REGLEMENT_REFUSE)
  })

  it('garde le panier quand la confirmation échoue', async () => {
    const commande = await avecUnArticle()

    const enPanne: OrderStore = {
      ...magasin,
      write: () => {
        throw new Error('quota dépassé')
      },
    }

    useReglement({ magasin: enPanne, horloge: () => INSTANT }).confirmer('card')

    // Le client doit pouvoir réessayer : un panier vidé par un échec le
    // renverrait à la carte pour tout recomposer.
    expect(commande.articles.value).toBe(1)
  })
})

describe('disponibilité', () => {
  it('devient réglable dès qu’un article est au panier', async () => {
    const { reglable } = useReglement({ magasin, horloge: () => INSTANT })
    expect(reglable.value).toBe(false)

    await avecUnArticle()
    expect(reglable.value).toBe(true)
  })
})
