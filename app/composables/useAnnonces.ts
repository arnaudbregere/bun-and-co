// =============================================================================
// Annonces courtoises
// =============================================================================
// Une seule région `aria-live="polite"` pour toute la borne, exigence EF-040.
//
// Deux régions annonceraient deux fois le même changement, ou se voleraient la
// parole. La région vit dans la mise en page, et ce composable est le seul
// chemin pour lui écrire.
//
// `useState` plutôt qu'une variable de module : l'état est alors propre à la
// requête au rendu serveur, et deux rendus concurrents ne partagent pas le
// dernier message annoncé.

export const useAnnonces = () => {
  const message = useState('annonce-courtoise', () => '')

  /** Annonce un changement au lecteur d'écran, sans interrompre la lecture. */
  const annoncer = (texte: string) => {
    message.value = texte
  }

  return { message, annoncer }
}
