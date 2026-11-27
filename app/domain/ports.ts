// =============================================================================
// Ports
// =============================================================================
// Frontières du domaine avec le monde extérieur. Le domaine déclare ce dont il
// a besoin ; la couche services fournit les implémentations.
//
// L'inversion est le point important : c'est le domaine qui dicte le contrat, et
// non le service qui impose sa forme. Brancher plus tard un catalogue servi par
// une API se fait en écrivant une seconde implémentation, sans toucher une seule
// règle métier.

import type { Draft, Order, Product } from './types'

/**
 * Accès en lecture au catalogue.
 *
 * La méthode est asynchrone bien que l'implémentation de la version 1 soit
 * immédiate : le catalogue sera servi par une route préconstruite, donc par un
 * appel réseau. Déclarer le port synchrone obligerait à réécrire tous les
 * appelants le jour où cette route arrive.
 */
export interface CatalogueGateway {
  all(): Promise<readonly Product[]>
}

/**
 * Persistance de la commande en cours.
 *
 * Le contrat est synchrone : l'implémentation écrit dans le stockage de
 * session du navigateur, opération immédiate. La rendre asynchrone obligerait
 * chaque écran à gérer une attente qui n'existe pas.
 *
 * `read` rend `undefined` plutôt que de lever : un contenu absent est le cas
 * normal au premier écran, et un contenu illisible ne doit pas empêcher le
 * client de commander.
 */
export interface DraftStore {
  read(): Draft | undefined
  write(draft: Draft): void
  clear(): void
}

/**
 * Persistance de la commande confirmée, et mémoire des numéros déjà émis.
 *
 * Les deux vivent dans le même port parce qu'ils répondent à la même question :
 * ce que la session sait des commandes confirmées. `issuedCount` ne compte pas
 * les commandes conservées, mais celles qui ont été émises ; `nextOrderNumber`
 * en dérive le numéro suivant, et l'unicité de l'exigence EF-032 tient à ce
 * compte, non au contenu.
 *
 * La portée est la session, comme pour la commande en cours : la borne
 * recommence à la première valeur de la plage au client suivant, et deux
 * clients d'une même session ne reçoivent jamais le même numéro.
 */
export interface OrderStore {
  read(): Order | undefined
  write(order: Order): void
  clear(): void
  issuedCount(): number
}

/**
 * Lecture de l'heure, en ISO 8601.
 *
 * Une fonction et non une interface : il n'y a qu'une opération, et déclarer
 * un objet à méthode unique ajouterait une forme sans ajouter de sens. Le
 * domaine ne lit jamais l'horloge lui-même — `confirmOrder` reçoit
 * l'horodatage en argument — et ce port sert à la couche qui le lui fournit.
 */
export type Clock = () => string
