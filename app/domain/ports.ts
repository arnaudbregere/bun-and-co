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

import type { Order, Product } from './types'

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
 * Persistance de la commande en cours, et remise de la commande confirmée.
 *
 * La version 1 écrit dans `sessionStorage` : la commande survit à un
 * rafraîchissement de page et disparaît avec la session, comportement attendu
 * d'une borne, dont le client suivant ne doit jamais hériter du panier.
 */
export interface OrderGateway {
  submit(order: Order): Promise<void>
}
