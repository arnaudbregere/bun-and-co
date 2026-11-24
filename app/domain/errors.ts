// =============================================================================
// Erreurs du domaine
// =============================================================================
// Le domaine lève plutôt que de rendre une valeur par défaut. Un panier tarifé
// à zéro ou une ligne silencieusement ignorée produiraient un ticket faux, bien
// plus difficile à diagnostiquer qu'une erreur levée au premier appel.
//
// Ces erreurs signalent des fautes de programmation ou des états que l'interface
// aurait dû empêcher, jamais une saisie utilisateur ordinaire.

/**
 * Une ligne ne correspond à aucune règle : supplément refusé par le produit,
 * composant de menu hors substitutions autorisées, dessert manquant ou en trop,
 * produit absent du catalogue, ligne inconnue du panier.
 */
export class InvalidLineError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidLineError'
  }
}

/**
 * Une limite du panier est atteinte. L'interface doit la prévenir en désactivant
 * la commande concernée avec sa raison affichée, plutôt que d'accepter puis de
 * refuser.
 */
export class CartLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CartLimitError'
  }
}
