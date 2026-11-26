// @vitest-environment nuxt

// Le composable appelle `useAsyncData`, `useState` et `useRuntimeConfig` : il
// lui faut une application Nuxt, que cet environnement fournit sans navigateur.
//
// Aucun réseau ici. La passerelle est un paramètre du composable, et le test
// passe une passerelle immédiate : ce qui est vérifié est bien le composable
// que les écrans appellent, et non une copie écrite pour le test.
//
// La carte n'est demandée qu'une fois par session : l'appel est rangé sous une
// clé partagée, et le second écran lit la réponse du premier. Ce fichier ne
// couvre donc que le cas où la carte répond ; l'échec a le sien, parce qu'une
// session ne peut pas à la fois réussir et échouer.

import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import type { CatalogueGateway } from '../../../app/domain/ports'
import type { Product } from '../../../app/domain/types'
import { toProductId } from '../../../app/domain/types'
import { useCatalogue } from '../../../app/composables/useCatalogue'

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

const FRITES: Product = {
  id: toProductId('fries-medium'),
  name: 'Frites moyennes',
  category: 'sides',
  priceCents: 290,
  available: true,
  allergens: [],
  removables: [],
  extras: [],
  format: 'medium',
}

let appels = 0

const passerelle: CatalogueGateway = {
  all: async () => {
    appels += 1
    return [BURGER, FRITES]
  },
}

describe('composable Catalogue', () => {
  it('ne demande la carte qu’une fois, quel que soit le nombre d’écrans', async () => {
    // Deux écrans successifs, la carte puis une fiche produit, demandent la
    // même chose. Le catalogue ne change pas sans nouveau déploiement : une
    // seconde demande serait du réseau dépensé pour la même réponse.
    const premier = useCatalogue(passerelle)
    await flushPromises()

    const second = useCatalogue(passerelle)
    await flushPromises()

    expect(appels).toBe(1)
    expect(second.produits.value).toEqual(premier.produits.value)
  })

  it('rend les produits servis par la passerelle, dans l’ordre du catalogue', async () => {
    const { produits, erreur, chargement } = useCatalogue(passerelle)
    await flushPromises()

    expect(produits.value.map((produit) => produit.id)).toEqual(['classique', 'fries-medium'])
    expect(erreur.value).toBe('')
    expect(chargement.value).toBe(false)
  })

  it('rend la liste entière : filtrer par catégorie appartient au domaine', async () => {
    const { produits } = useCatalogue(passerelle)
    await flushPromises()

    // Le burger et les frites sont de deux catégories, et les deux sont rendus.
    // L'écran passe ensuite cette liste à `productsOfCategory`.
    expect(produits.value).toHaveLength(2)
  })
})
