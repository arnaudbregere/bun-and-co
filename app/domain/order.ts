// =============================================================================
// Commande
// =============================================================================
// Passage de la commande en cours à la commande confirmée.

import { isEmpty } from './cart'
import { EmptyCartError } from './errors'
import type { Draft, Order, PaymentMode } from './types'

/** Première valeur de la plage des numéros de commande. */
export const FIRST_ORDER_NUMBER = 100

/** Dernière valeur de la plage, incluse. */
export const LAST_ORDER_NUMBER = 999

/**
 * Numéro suivant, attribué à la prochaine commande confirmée.
 *
 * La suite est séquentielle et non tirée au hasard : un client comprend
 * immédiatement l'ordre d'appel, et la fonction reste pure, donc testable sans
 * injecter de générateur. Elle revient au début une fois la plage parcourue,
 * ce qu'aucune session de borne n'atteint en pratique.
 */
export const nextOrderNumber = (issuedCount: number): number => {
  if (!Number.isInteger(issuedCount) || issuedCount < 0) {
    throw new RangeError(`Nombre de commandes émises invalide : ${issuedCount}.`)
  }

  const range = LAST_ORDER_NUMBER - FIRST_ORDER_NUMBER + 1
  return FIRST_ORDER_NUMBER + (issuedCount % range)
}

/**
 * Confirme une commande en cours.
 *
 * L'horodatage est passé en argument : le domaine ne lit pas l'horloge, sans
 * quoi la fonction ne serait plus pure ni testable sans geler le temps.
 */
export const confirmOrder = (
  draft: Draft,
  paymentMode: PaymentMode,
  orderNumber: number,
  confirmedAt: string,
): Order => {
  if (isEmpty(draft.cart)) {
    throw new EmptyCartError('Une commande vide ne peut pas être confirmée.')
  }
  if (
    !Number.isInteger(orderNumber) ||
    orderNumber < FIRST_ORDER_NUMBER ||
    orderNumber > LAST_ORDER_NUMBER
  ) {
    throw new RangeError(`Numéro de commande hors plage : ${orderNumber}.`)
  }

  return {
    cart: draft.cart,
    serviceMode: draft.serviceMode,
    paymentMode,
    number: orderNumber,
    confirmedAt,
  }
}
