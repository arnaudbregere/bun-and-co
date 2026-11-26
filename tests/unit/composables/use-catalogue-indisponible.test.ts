// @vitest-environment nuxt

// L'échec de la carte a son propre fichier : l'appel est rangé sous une clé
// partagée par toute la session, et une session ne peut pas à la fois réussir
// et échouer. Un seul fichier mêlant les deux cas ferait lire au second test la
// réponse du premier.

import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import type { CatalogueGateway } from '../../../app/domain/ports'
import { MESSAGE_CARTE_INDISPONIBLE, useCatalogue } from '../../../app/composables/useCatalogue'

/**
 * Passerelle en panne, comme une route absente d'un déploiement partiel ou un
 * fichier statique illisible.
 */
const passerelleEnPanne: CatalogueGateway = {
  all: async () => {
    throw new TypeError('Catalogue illisible.')
  },
}

describe('composable Catalogue, carte indisponible', () => {
  it('rend un message qui dit ce qui s’est passé et ce qui reste possible', async () => {
    const { produits, erreur } = useCatalogue(passerelleEnPanne)
    await flushPromises()

    // Un écran vide sans explication laisserait le client sans savoir s'il doit
    // attendre ou s'adresser au comptoir.
    expect(erreur.value).toBe(MESSAGE_CARTE_INDISPONIBLE)
    expect(produits.value).toEqual([])
  })

  it('annonce l’échec par la région d’alerte', async () => {
    useCatalogue(passerelleEnPanne)
    await flushPromises()

    // Exigence EF-041 : l'erreur passe par la région `role="alert"` unique de
    // la mise en page, et non par la région courtoise, qui attendrait la fin
    // de la lecture en cours.
    expect(useAnnonces().alerte.value).toBe(MESSAGE_CARTE_INDISPONIBLE)
    expect(useAnnonces().message.value).toBe('')
  })
})
