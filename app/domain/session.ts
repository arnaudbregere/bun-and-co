// =============================================================================
// Règles de session de la borne
// =============================================================================
// Combien de temps la borne attend un client, et quand elle se rend au suivant.
// Deux limites de temps cohabitent, et elles ne se confondent pas :
//
//   - la limite d'inactivité, exigences EF-035 à EF-037, qui court sur les
//     écrans de commande et avertit avant d'effacer ;
//   - le retour en veille du ticket, exigence EF-034, qui court une fois la
//     commande confirmée et n'avertit pas, parce qu'il n'y a plus rien à
//     perdre.
//
// Les deux vivent ici parce qu'elles disent la même chose du même objet : la
// durée de vie d'une session de borne. Les voir côte à côte est le seul moyen
// de remarquer qu'un avertissement de vingt secondes ne tiendrait pas dans un
// retour en veille de quinze.
//
// Aucun effet, aucun minuteur : les délais sont des nombres, et c'est
// `app/composables/useInactivity.ts` qui les fait courir.

/** Inactivité tolérée avant l'avertissement, exigence EF-035, en secondes. */
export const SECONDES_AVANT_AVERTISSEMENT = 90

/**
 * Sursis accordé par l'avertissement, exigence EF-035, en secondes.
 *
 * Vingt secondes sont le minimum du test RGAA 13.1.3 pour un avertissement
 * préalable. C'est aussi ce qu'il faut à un client qui lève les yeux de son
 * écran, lit la question et trouve le bouton.
 */
export const SECONDES_DE_SURSIS = 20

/**
 * Secondes restantes auxquelles le sursis est annoncé au lecteur d'écran.
 *
 * Le compte à rebours ne s'annonce pas chaque seconde : vingt annonces
 * courtoises en vingt secondes couvriraient la question posée par
 * l'avertissement, et le client n'entendrait ni ce qui se passe ni comment
 * l'éviter. Le dialogue dit le sursis entier à son ouverture, et deux paliers
 * suffisent ensuite à marquer que le temps court.
 */
export const PALIERS_DE_SURSIS: readonly number[] = [10, 5]

/** Affichage du ticket avant le retour en veille, exigence EF-034, en secondes. */
export const SECONDES_AVANT_VEILLE = 15

/**
 * Durée du ticket après prolongation, exigence EF-034 et test RGAA 13.1.3.
 *
 * Exactement le décuple de la durée initiale : le test exige « dix fois, au
 * moins », et une valeur ronde choisie à l'œil se serait éloignée du texte
 * sans rien apporter au client.
 */
export const SECONDES_APRES_PROLONGATION = SECONDES_AVANT_VEILLE * 10

/**
 * Écrans sur lesquels aucune limite d'inactivité ne court, exigence EF-038.
 *
 * La veille n'a rien à effacer et attend déjà un client. Le ticket a son
 * propre retour en veille, exigence EF-034 : un client qui lit son numéro
 * n'interagit pas, et un avertissement l'en détournerait au pire moment.
 *
 * L'atelier des composants n'est pas un écran du parcours client : une page de
 * vérification qui se renverrait seule en veille au bout de quatre-vingt-dix
 * secondes serait inutilisable, à l'œil comme pour un audit automatique.
 */
const ECRANS_SANS_LIMITE: readonly string[] = ['/', '/ticket', '/workshop']

/**
 * La limite d'inactivité court-elle sur cet écran, exigence EF-038.
 *
 * Le chemin est comparé tel quel, sans préfixe de base : l'appelant lit
 * `route.path`, que Vue Router rend déjà dépouillé du `baseURL`.
 */
export const limiteDInactiviteCourt = (chemin: string): boolean =>
  !ECRANS_SANS_LIMITE.includes(chemin)
