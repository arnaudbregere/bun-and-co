// @vitest-environment nuxt

// Le retour en veille touche trois choses : la commande en cours, la commande
// confirmée et la route. Les deux premières passent par le stockage de session,
// que cet environnement fournit ; la troisième est espionnée, faute de routeur.
//
// La carte est remplacée, et non passée en argument : `useVeille` n'en a pas
// besoin, mais `useDraft` en dépend pour ses totaux, et la passerelle réseau
// par défaut n'a ici aucun serveur à interroger.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { Product } from '../../../app/domain/types'
import { toProductId } from '../../../app/domain/types'
import { useVeille } from '../../../app/composables/useVeille'
import { useDraft } from '../../../app/composables/useDraft'
import { useReglement } from '../../../app/composables/useReglement'

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

const { navigateTo } = vi.hoisted(() => ({ navigateTo: vi.fn() }))

mockNuxtImport('navigateTo', () => navigateTo)

mockNuxtImport('useCatalogue', () => () => ({
  produits: computed(() => [BURGER]),
  chargement: computed(() => false),
  erreur: computed(() => ''),
  recharger: async () => {},
}))

const SANS_CUSTOMISATION = { removedIds: [], extraIds: [] }

beforeEach(() => {
  sessionStorage.clear()
  navigateTo.mockClear()
})

describe('composable Retour en veille', () => {
  it('efface la commande en cours, la commande confirmée, et revient à l’accueil', async () => {
    const commande = useDraft()
    commande.ajouter({ productId: BURGER.id, customisation: SANS_CUSTOMISATION })

    const reglement = useReglement()
    expect(reglement.confirmer('card')).toBeDefined()
    expect(reglement.commande.value).toBeDefined()

    await useVeille().retourEnVeille()

    // Une borne ne présente jamais au client suivant ce que le précédent a
    // commandé, exigences EF-028 et EF-037.
    expect(commande.panier.value.lines).toEqual([])
    expect(reglement.commande.value).toBeUndefined()
    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('laisse survivre le compte des numéros émis', async () => {
    const commande = useDraft()
    commande.ajouter({ productId: BURGER.id, customisation: SANS_CUSTOMISATION })

    const premiere = useReglement().confirmer('card')

    await useVeille().retourEnVeille()

    commande.ajouter({ productId: BURGER.id, customisation: SANS_CUSTOMISATION })
    const seconde = useReglement().confirmer('card')

    // Le numéro porte l'unicité de l'exigence EF-032 au sein de la session : le
    // client suivant ne doit pas reprendre un numéro déjà appelé au comptoir.
    expect(premiere?.number).toBeDefined()
    expect(seconde?.number).not.toBe(premiere?.number)
  })
})
