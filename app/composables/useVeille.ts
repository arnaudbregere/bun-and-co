// =============================================================================
// Retour en veille
// =============================================================================
// Rendre la borne au client suivant. Deux chemins y mènent — le ticket lu
// jusqu'au bout, exigence EF-034, et la limite d'inactivité expirée, exigence
// EF-037 — et tous deux doivent effacer exactement les mêmes choses.
//
// Un oubli d'un côté laisserait la commande d'un client parti sous les yeux du
// suivant. L'ordre et la liste des effacements vivent donc à un seul endroit,
// celui-ci.
//
// Aucune règle métier : effacer et naviguer sont des gestes d'interface. Ce que
// contient le panier et ce que vaut la commande appartiennent au domaine.

export const useVeille = () => {
  const { vider } = useDraft()
  const { oublier } = useReglement()

  return {
    /**
     * Rend la borne au client suivant.
     *
     * La commande en cours et la commande confirmée sont toutes deux effacées.
     * Le compte des numéros émis, lui, survit à la session : il porte
     * l'unicité de l'exigence EF-032, et le client suivant ne doit pas
     * reprendre un numéro déjà appelé au comptoir.
     */
    retourEnVeille: async () => {
      vider()
      oublier()
      await navigateTo('/')
    },
  }
}
