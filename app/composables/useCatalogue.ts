// =============================================================================
// Carte de l'enseigne
// =============================================================================
// Les écrans demandent les produits ici, et ignorent d'où ils viennent. La
// route préconstruite `/api/catalogue.json` et la passerelle qui la consomme
// restent derrière ce composable : un écran qui écrirait son propre `fetch`
// contournerait le préfixe `baseURL`, donc casserait sur GitHub Pages.
//
// Aucune règle métier ici. Chercher un produit par identifiant ou filtrer par
// catégorie appartient à `app/domain/catalogue.ts`, qui reçoit la liste en
// argument.
//
// La passerelle est un paramètre, avec la passerelle réseau par défaut. Les
// tests passent alors une passerelle immédiate, sans réseau ni serveur, et le
// composable testé est bien celui que les écrans appellent.

import type { CatalogueGateway } from '../domain/ports'
import type { Product } from '../domain/types'
import { createHttpCatalogueGateway } from '../services/http-catalogue'

/**
 * Clé de l'appel, partagée par tous les écrans.
 *
 * `useAsyncData` range la réponse sous cette clé dans la charge utile de la
 * page. La carte, une fiche produit et le panier demandent donc la même chose
 * une seule fois, et le rendu statique l'écrit dans la page : sur un site
 * préconstruit, le client ne redemande rien.
 */
const CLE = 'catalogue'

/**
 * Message rendu au client quand la carte manque.
 *
 * Il dit ce qui s'est passé et ce qui reste possible. « Erreur réseau » ne
 * répond ni à l'un ni à l'autre, et laisserait le client devant un écran vide,
 * sans savoir s'il doit attendre ou appeler un employé.
 */
export const MESSAGE_CARTE_INDISPONIBLE =
  'La carte n’a pas pu être chargée. Réessayez, ou adressez-vous au comptoir.'

/** Passerelle réseau, celle des écrans. */
const passerelleReseau = (): CatalogueGateway => {
  const { app } = useRuntimeConfig()

  return createHttpCatalogueGateway((url) => $fetch(url), app.baseURL)
}

export const useCatalogue = (passerelle?: CatalogueGateway) => {
  const { alerter } = useAnnonces()

  const { data, error, status, refresh } = useAsyncData<readonly Product[]>(
    CLE,
    () => (passerelle ?? passerelleReseau()).all(),
    {
      default: () => [],

      // Un seul appel par session, exigence de la demande #118. Sans cette
      // lecture explicite, chaque écran qui monte redemanderait la carte,
      // alors qu'elle ne change pas sans nouveau déploiement.
      getCachedData: (cle, nuxt) => nuxt.payload.data[cle] ?? nuxt.static.data[cle],
    },
  )

  // L'erreur est annoncée dès qu'elle paraît, exigence EF-041. L'annonce passe
  // par la région unique de la mise en page : deux régions se voleraient la
  // parole.
  watch(
    error,
    (echec) => {
      if (echec !== null && echec !== undefined) alerter(MESSAGE_CARTE_INDISPONIBLE)
    },
    { immediate: true },
  )

  return {
    produits: computed<readonly Product[]>(() => data.value ?? []),
    chargement: computed(() => status.value === 'pending'),

    /** Message à afficher, vide tant que la carte répond. */
    erreur: computed(() => (error.value ? MESSAGE_CARTE_INDISPONIBLE : '')),

    /** Nouvelle tentative, pour le bouton que l'écran de carte offrira. */
    recharger: refresh,
  }
}
