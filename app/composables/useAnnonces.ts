// =============================================================================
// Annonces courtoises et alertes
// =============================================================================
// Une seule région `aria-live="polite"` pour toute la borne, exigence EF-040,
// et une seule région `role="alert"`, exigence EF-041.
//
// Deux régions d'un même mode annonceraient deux fois le même changement, ou se
// voleraient la parole. Les deux régions vivent dans la mise en page, et ce
// composable est le seul chemin pour leur écrire.
//
// Les deux modes restent séparés : un changement de panier ne doit pas
// interrompre la lecture en cours, alors qu'un refus ou une erreur doit couper
// la parole. Mélanger les deux reviendrait à choisir le plus brutal des deux
// pour tout.
//
// `useState` plutôt qu'une variable de module : l'état est alors propre à la
// requête au rendu serveur, et deux rendus concurrents ne partagent pas le
// dernier message annoncé.

export const useAnnonces = () => {
  const message = useState('annonce-courtoise', () => '')
  const alerte = useState('annonce-alerte', () => '')

  /** Annonce un changement au lecteur d'écran, sans interrompre la lecture. */
  const annoncer = (texte: string) => {
    message.value = texte
  }

  /** Annonce un refus ou une erreur, en interrompant la lecture. */
  const alerter = (texte: string) => {
    alerte.value = texte
  }

  return { message, alerte, annoncer, alerter }
}
