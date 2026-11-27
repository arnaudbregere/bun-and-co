// =============================================================================
// Persistance de la commande confirmée
// =============================================================================
// Implémentation du port `OrderStore` sur un stockage de session.
//
// Le stockage est injecté, et non lu depuis `window` : le service reste
// testable sans navigateur. L'appelant passe `sessionStorage`.
//
// La commande confirmée y survit à un rafraîchissement de l'écran de ticket,
// et disparaît avec la session. Un client qui recharge son ticket le retrouve ;
// le client suivant ne le voit pas.
//
// Le compte des numéros émis est conservé à part de la commande. Les deux
// n'ont pas la même durée de vie : la commande est remplacée à chaque
// confirmation, alors que le compte ne cesse de croître tant que la session
// dure. Les fondre en une seule entrée ferait repartir les numéros à la
// première valeur dès qu'une commande serait effacée, et deux clients de la
// même session recevraient le même numéro, contre l'exigence EF-032.

import type { OrderStore } from '../domain/ports'
import type { Order } from '../domain/types'

const KEY_ORDER = 'bun-and-co:order'
const KEY_ISSUED = 'bun-and-co:orders-issued'

/**
 * Vérifie qu'un contenu relu a bien la forme attendue.
 *
 * Le stockage est modifiable par l'utilisateur et survit à un déploiement : un
 * contenu écrit par une version précédente peut ne plus correspondre au type
 * d'aujourd'hui. Faire confiance au `JSON.parse` ferait tomber la borne sur
 * une donnée périmée.
 */
const isOrder = (value: unknown): value is Order => {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Partial<Order>
  if (candidate.serviceMode !== 'eat-in' && candidate.serviceMode !== 'takeaway') return false
  if (candidate.paymentMode !== 'card' && candidate.paymentMode !== 'counter') return false
  if (typeof candidate.number !== 'number' || !Number.isInteger(candidate.number)) return false
  if (typeof candidate.confirmedAt !== 'string') return false
  if (typeof candidate.cart !== 'object' || candidate.cart === null) return false

  return Array.isArray(candidate.cart.lines)
}

export const createSessionOrderStore = (storage: Storage): OrderStore => {
  const readIssued = (): number => {
    const raw = storage.getItem(KEY_ISSUED)
    if (raw === null) return 0

    const parsed = Number(raw)

    // Un compte illisible repart de zéro plutôt que de propager un `NaN`
    // jusqu'au numéro de commande, où il deviendrait un ticket sans numéro.
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0
  }

  return {
    read: () => {
      const raw = storage.getItem(KEY_ORDER)
      if (raw === null) return undefined

      try {
        const parsed: unknown = JSON.parse(raw)
        return isOrder(parsed) ? parsed : undefined
      } catch {
        // Contenu illisible : l'écran de ticket dira qu'il n'y a pas de
        // commande à montrer, plutôt que de tomber.
        return undefined
      }
    },

    write: (order) => {
      storage.setItem(KEY_ORDER, JSON.stringify(order))
      storage.setItem(KEY_ISSUED, String(readIssued() + 1))
    },

    // Seule la commande est effacée. Le compte des numéros émis reste, sans
    // quoi le client suivant de la même session reprendrait un numéro déjà
    // appelé.
    clear: () => {
      storage.removeItem(KEY_ORDER)
    },

    issuedCount: readIssued,
  }
}
