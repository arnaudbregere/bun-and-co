// =============================================================================
// Parcours entre les écrans
// =============================================================================
// L'ordre des sept écrans, exigence EF-001, et le retour à l'écran précédent,
// exigence EF-002.
//
// Le retour ne consulte pas l'historique du navigateur. Un client qui revient
// en arrière trois fois, ajoute un produit puis revient encore remonterait une
// pile dont il n'a pas conscience ; la borne, elle, a un ordre d'écrans fixe et
// connu. `router.back()` est donc écarté au profit d'une destination explicite.
//
// Aucune règle métier ici : la navigation est une affaire d'interface. Ce
// composable ne décide ni du prix, ni du contenu du panier.

import { computed } from 'vue'
import { useRoute } from 'vue-router'

/** Écrans du parcours, dans l'ordre, exigence EF-001. */
const PARCOURS = [
  { chemin: '/', titre: 'Veille' },
  { chemin: '/mode', titre: 'Mode de consommation' },
  { chemin: '/carte', titre: 'Carte' },
  { chemin: '/panier', titre: 'Panier' },
  { chemin: '/paiement', titre: 'Paiement' },
  { chemin: '/ticket', titre: 'Ticket' },
] as const

/**
 * Écran de retour de chaque écran hors du parcours linéaire.
 *
 * La fiche produit s'ouvre depuis la carte et y ramène : elle n'a pas de rang
 * dans la suite, puisqu'on la traverse autant de fois qu'on choisit de
 * produits.
 */
const RETOURS_HORS_PARCOURS: Readonly<Record<string, string>> = {
  '/produit': '/carte',
}

export interface EcranPrecedent {
  readonly chemin: string
  readonly titre: string
}

export const useParcours = () => {
  const route = useRoute()

  const precedent = computed<EcranPrecedent | undefined>(() => {
    const chemin = route.path

    // Le ticket est un cul-de-sac assumé : aucun retour après la confirmation
    // du paiement, exigences EF-002 et EF-004. Une commande confirmée est
    // partie en cuisine.
    if (chemin === '/ticket') return undefined

    const horsParcours = Object.entries(RETOURS_HORS_PARCOURS).find(([prefixe]) =>
      chemin.startsWith(`${prefixe}/`),
    )

    if (horsParcours !== undefined) {
      const cible = PARCOURS.find((ecran) => ecran.chemin === horsParcours[1])
      return cible === undefined ? undefined : { ...cible }
    }

    const rang = PARCOURS.findIndex((ecran) => ecran.chemin === chemin)
    const ecran = rang <= 0 ? undefined : PARCOURS[rang - 1]

    return ecran === undefined ? undefined : { ...ecran }
  })

  return { precedent }
}
