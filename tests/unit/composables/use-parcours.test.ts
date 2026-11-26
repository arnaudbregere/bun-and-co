import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

// `useRoute` est fourni par vue-router. Le composable l'importe explicitement,
// et non par l'auto-import de Nuxt : il est donc remplaçable ici sans monter
// d'application.
const chemin = ref('/')

vi.mock('vue-router', () => ({
  useRoute: () => ({
    get path() {
      return chemin.value
    },
  }),
}))

const { useParcours } = await import('../../../app/composables/useParcours')

const precedentDe = (route: string) => {
  chemin.value = route
  return useParcours().precedent.value
}

describe('composable Parcours', () => {
  it('remonte l’écran précédent du parcours linéaire', () => {
    // Exigence EF-001 : veille, mode, carte, panier, paiement, ticket.
    expect(precedentDe('/mode')?.chemin).toBe('/')
    expect(precedentDe('/carte')?.chemin).toBe('/mode')
    expect(precedentDe('/panier')?.chemin).toBe('/carte')
    expect(precedentDe('/paiement')?.chemin).toBe('/panier')
  })

  it('nomme l’écran de retour, plutôt que de dire « retour »', () => {
    // Un lecteur d'écran qui ne lit que le lien doit savoir où il mène.
    expect(precedentDe('/carte')?.titre).toBe('Mode de consommation')
  })

  it('ramène une fiche produit à la carte', () => {
    // La fiche n'a pas de rang dans la suite : on la traverse autant de fois
    // qu'on choisit de produits.
    expect(precedentDe('/produit/classique')?.chemin).toBe('/carte')
    expect(precedentDe('/produit/sundae')?.chemin).toBe('/carte')
  })

  it('n’offre aucun retour depuis la veille', () => {
    expect(precedentDe('/')).toBeUndefined()
  })

  it('n’offre aucun retour depuis le ticket', () => {
    // Exigences EF-002 et EF-004 : une commande confirmée est partie en
    // cuisine, le parcours ne revient pas en arrière.
    expect(precedentDe('/ticket')).toBeUndefined()
  })

  it('n’offre aucun retour depuis une route hors parcours', () => {
    expect(precedentDe('/workshop')).toBeUndefined()
  })
})
