// =============================================================================
// Règlement
// =============================================================================
// Le passage de la commande en cours à la commande confirmée, exposé aux
// écrans. Ce composable ne décide rien : il délègue la confirmation à
// `app/domain/order.ts` et la persistance au port `OrderStore`.
//
// Le règlement est simulé, exigence EF-030. Aucune donnée bancaire n'est
// saisie, demandée ni transmise, et aucun appel réseau n'a lieu : choisir un
// mode de règlement ne fait qu'enregistrer lequel. Ce fichier est le seul
// endroit où cette simulation est écrite, et il n'y a rien à y brancher plus
// tard sans repasser par le port.
//
// Le numéro de commande et l'horodatage sont les deux entrées non
// déterministes de l'opération. Le domaine ne les produit pas : `confirmOrder`
// les reçoit en argument, et `nextOrderNumber` dérive le numéro d'un compte
// que le port conserve. L'horloge est un paramètre, avec l'horloge réelle par
// défaut, donc les tests confirment une commande à une date fixe sans geler le
// temps.

import { EmptyCartError } from '../domain/errors'
import { confirmOrder, nextOrderNumber } from '../domain/order'
import type { Clock, OrderStore } from '../domain/ports'
import type { Order, PaymentMode } from '../domain/types'
import { createSessionOrderStore } from '../services/session-order-store'

/** Clé de la commande confirmée, partagée par le paiement et le ticket. */
const CLE = 'commande-confirmee'

/** Clé de la restauration, pour ne relire le stockage qu'une fois. */
const CLE_RESTAURATION = 'commande-confirmee-restauree'

/**
 * Message rendu au client quand la confirmation échoue.
 *
 * Il dit ce qui s'est passé et ce qui reste possible. « Erreur » ne répond ni
 * à l'un ni à l'autre, et laisserait le client devant un écran immobile sans
 * savoir s'il doit réessayer ou appeler quelqu'un.
 */
export const MESSAGE_REGLEMENT_REFUSE =
  'Le règlement n’a pas abouti. Réessayez, ou adressez-vous au comptoir.'

export interface DependancesReglement {
  /** Stockage de la commande confirmée. Par défaut, celui de la session. */
  readonly magasin?: OrderStore
  /** Lecture de l'heure. Par défaut, l'horloge du système. */
  readonly horloge?: Clock
}

export const useReglement = (dependances: DependancesReglement = {}) => {
  const { commande: enCours, panier, vider } = useDraft()
  const { annoncer, alerter } = useAnnonces()

  // Le stockage n'existe pas au rendu : la page est écrite au build, où aucune
  // session de navigateur n'est ouverte.
  const magasin =
    dependances.magasin ??
    (import.meta.client ? createSessionOrderStore(sessionStorage) : undefined)

  const horloge: Clock = dependances.horloge ?? (() => new Date().toISOString())

  const confirmee = useState<Order | undefined>(CLE, () => undefined)
  const restauree = useState(CLE_RESTAURATION, () => false)

  // La relecture a lieu une seule fois, et sert au client qui rafraîchit son
  // ticket : la page servie est préconstruite, donc identique pour tous, et
  // c'est le navigateur qui sait ce que ce client a confirmé.
  if (magasin !== undefined && !restauree.value) {
    restauree.value = true
    confirmee.value = magasin.read()
  }

  return {
    commande: computed<Order | undefined>(() => confirmee.value),

    /**
     * Confirme le règlement, exigence EF-029.
     *
     * Rend la commande confirmée, ou `undefined` si elle a été refusée. Le
     * refus est annoncé par la région d'alerte, exigence EF-041, et l'appelant
     * ne navigue pas.
     *
     * Le panier est vidé après l'écriture, et dans cet ordre : une commande
     * confirmée dont le panier serait déjà vide ne pourrait pas être réécrite
     * si le stockage refusait.
     */
    confirmer: (mode: PaymentMode): Order | undefined => {
      try {
        const numero = nextOrderNumber(magasin?.issuedCount() ?? 0)
        const commande = confirmOrder(enCours.value, mode, numero, horloge())

        magasin?.write(commande)
        confirmee.value = commande
        vider()

        annoncer(`Commande ${commande.number} confirmée.`)
        return commande
      } catch (refus) {
        // Un panier vide est le seul refus que l'interface aurait dû
        // empêcher : le paiement est indisponible dans ce cas, et son message
        // le dit déjà. Les autres sont des pannes, et portent le même message
        // au client, qui n'a que faire de la distinction.
        if (refus instanceof EmptyCartError) {
          alerter('Votre panier est vide. Ajoutez un article avant de régler.')
          return undefined
        }

        alerter(MESSAGE_REGLEMENT_REFUSE)
        return undefined
      }
    },

    /** Le règlement est refusé tant que le panier est vide, exigence EF-026. */
    reglable: computed(() => panier.value.lines.length > 0),

    /**
     * Oublie la commande confirmée, au retour en veille.
     *
     * Le compte des numéros émis survit, lui : il porte l'unicité de
     * l'exigence EF-032 au sein de la session, et le client suivant ne doit
     * pas reprendre un numéro déjà appelé au comptoir.
     */
    oublier: () => {
      magasin?.clear()
      confirmee.value = undefined
    },
  }
}
