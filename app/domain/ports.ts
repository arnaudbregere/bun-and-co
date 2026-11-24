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

import type { Draft, Product } from './types'

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
