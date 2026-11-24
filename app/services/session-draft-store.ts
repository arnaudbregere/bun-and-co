// =============================================================================
// Persistance de la commande en cours
// =============================================================================
// Implémentation du port `DraftStore` sur un stockage de session.
//
// Le stockage est injecté, et non lu depuis `window` : le service reste
// testable sans navigateur, et la borne peut en changer sans que le domaine
// bouge. L'appelant passe `sessionStorage`.
//
// Le choix du stockage de session est fonctionnel, pas technique. La commande
// doit survivre à un rafraîchissement accidentel et disparaître à la fin de la
// session : une borne ne doit jamais présenter au client suivant le panier du
// client précédent.

import type { DraftStore } from '../domain/ports'
import type { Draft } from '../domain/types'

const KEY = 'bun-and-co:draft'

/**
 * Vérifie qu'un contenu relu a bien la forme attendue.
 *
 * Le stockage est modifiable par l'utilisateur et survit à un déploiement : un
 * contenu écrit par une version précédente peut ne plus correspondre au type
 * d'aujourd'hui. Faire confiance au `JSON.parse` ferait tomber la borne sur une
 * donnée périmée.
 */
const isDraft = (value: unknown): value is Draft => {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Partial<Draft>
  if (candidate.serviceMode !== 'eat-in' && candidate.serviceMode !== 'takeaway') return false
  if (typeof candidate.cart !== 'object' || candidate.cart === null) return false

  return Array.isArray(candidate.cart.lines)
}

export const createSessionDraftStore = (storage: Storage): DraftStore => ({
  read: () => {
    const raw = storage.getItem(KEY)
    if (raw === null) return undefined

    try {
      const parsed: unknown = JSON.parse(raw)
      return isDraft(parsed) ? parsed : undefined
    } catch {
      // Contenu illisible : la borne repart d'un panier vide plutôt que de
      // refuser de servir le client.
      return undefined
    }
  },

  write: (draft) => {
    storage.setItem(KEY, JSON.stringify(draft))
  },

  clear: () => {
    storage.removeItem(KEY)
  },
})
