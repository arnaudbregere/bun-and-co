// @vitest-environment nuxt

// La restauration a son propre fichier : elle se joue à la première lecture de
// la session, et la mêler aux autres tests ferait dépendre son résultat de leur
// ordre.
//
// Exigence EF-027 : la commande survit à un rafraîchissement de page. La page
// servie est préconstruite, donc identique pour tous ; c'est le stockage du
// navigateur qui sait ce que ce client avait commencé.
//
// Dans un écran, la relecture part après le premier rendu, pour que ce rendu
// coïncide avec celui du serveur, demande #139. Hors d'un composant il n'y a
// pas de rendu à attendre : ces tests appellent `restaurer` eux-mêmes, ce que
// l'écran n'a pas à faire.
//
// Exigence EF-028 : la commande ne survit jamais à une session antérieure.
// C'est le choix du stockage de session qui le garantit, et il est vérifié là
// où il est écrit, dans les tests de `createSessionDraftStore` : un test de
// plus ici ne prouverait que le comportement du magasin qu'on lui passe.

import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import type { CatalogueGateway, DraftStore } from '../../../app/domain/ports'
import type { Draft, Product } from '../../../app/domain/types'
import { toCartLineId, toProductId } from '../../../app/domain/types'
import { useDraft } from '../../../app/composables/useDraft'

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

/** Commande laissée par le rafraîchissement : deux burgers, à emporter. */
const COMMENCEE: Draft = {
  serviceMode: 'takeaway',
  cart: {
    lines: [
      {
        id: toCartLineId('classique#seul#-#+'),
        productId: BURGER.id,
        quantity: 2,
        customisation: { removedIds: [], extraIds: [] },
      },
    ],
  },
}

const magasinRempli: DraftStore = {
  read: () => COMMENCEE,
  write: () => {},
  clear: () => {},
}

describe('composable Commande en cours, restauration', () => {
  it('reprend la commande laissée par le rafraîchissement', async () => {
    const { articles, mode, totalCentimes, restaurer } = useDraft({
      magasin: magasinRempli,
      catalogue,
    })
    restaurer()
    await flushPromises()

    expect(articles.value).toBe(2)
    expect(mode.value).toBe('takeaway')
    expect(totalCentimes.value).toBe(1180)
  })

  it('ne relit le stockage qu’une fois par session', async () => {
    // Le second écran lit l'état déjà restauré. Relire à chaque appel
    // écraserait, au retour sur la carte, ce que le client vient de changer au
    // panier.
    const premier = useDraft({ magasin: magasinRempli, catalogue })
    premier.restaurer()
    premier.vider()

    const second = useDraft({ magasin: magasinRempli, catalogue })
    second.restaurer()
    await flushPromises()

    const { articles } = second

    expect(articles.value).toBe(0)
  })
})
