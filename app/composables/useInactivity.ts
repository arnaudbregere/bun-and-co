// =============================================================================
// Limite d'inactivité
// =============================================================================
// Une borne laissée en plan ne garde pas la commande d'un client parti. Après
// quatre-vingt-dix secondes sans interaction, un avertissement s'ouvre avec un
// sursis de vingt secondes, exigence EF-035 ; le client peut le prolonger,
// exigence EF-036 ; sinon le panier est vidé et la borne revient en veille,
// exigence EF-037.
//
// Les délais ne sont pas écrits ici : ils viennent de `app/domain/session.ts`,
// avec le retour en veille du ticket, parce que les trois disent la même chose
// du même objet. Ce composable ne décide que du moment où ils courent.
//
// Un seul minuteur, qui bat la seconde, plutôt que deux `setTimeout`
// imbriqués : le compte à rebours a besoin de la seconde de toute façon, et un
// seul battement rend l'état lisible — un compteur d'inactivité qui monte, un
// sursis qui descend.
//
// Pendant l'avertissement, toucher l'écran ne prolonge rien. L'exigence EF-036
// veut une prolongation décidée depuis l'avertissement : un client qui frôle
// la dalle en récupérant son sac ne doit pas effacer l'avertissement sans
// l'avoir lu, et un client parti ne doit pas voir sa session prolongée par le
// suivant qui s'approche.
//
// Le retour en veille est un paramètre, avec le retour réel par défaut. Les
// tests vérifient alors l'expiration sans routeur ni stockage de session.

import {
  limiteDInactiviteCourt,
  PALIERS_DE_SURSIS,
  SECONDES_AVANT_AVERTISSEMENT,
  SECONDES_DE_SURSIS,
} from '../domain/session'

/**
 * Interactions qui remettent le compteur à zéro.
 *
 * `pointerdown` couvre la dalle tactile et la souris, `keydown` le clavier et
 * le lecteur d'écran. Le défilement est écouté séparément : un client qui
 * parcourt la carte à la molette ou au doigt sans rien activer est bien
 * présent.
 */
const EVENEMENTS_DACTIVITE = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const

export interface DependancesInactivite {
  /** Retour en veille à l'expiration. Par défaut, celui de `useVeille`. */
  readonly surExpiration?: () => void | Promise<void>
}

export const useInactivity = (dependances: DependancesInactivite = {}) => {
  const route = useRoute()
  const { annoncer } = useAnnonces()

  // `??` ne construit la dépendance par défaut que si l'appelant n'en a pas
  // fourni : un test qui passe son propre retour en veille ne touche ni au
  // stockage de session, ni au routeur.
  const surExpiration = dependances.surExpiration ?? useVeille().retourEnVeille

  /** L'avertissement est-il ouvert. */
  const avertit = ref(false)

  /** Secondes de sursis restantes, affichées par l'avertissement. */
  const restant = ref(SECONDES_DE_SURSIS)

  /** Secondes écoulées depuis la dernière interaction. */
  const inactif = ref(0)

  let battement: ReturnType<typeof setInterval> | undefined

  const arreter = () => {
    if (battement !== undefined) clearInterval(battement)
    battement = undefined
  }

  /** Remet la borne au premier jour : plus d'avertissement, plus d'inactivité. */
  const reprendre = () => {
    avertit.value = false
    restant.value = SECONDES_DE_SURSIS
    inactif.value = 0
  }

  const expirer = async () => {
    arreter()
    avertit.value = false
    await surExpiration()
  }

  const tic = () => {
    if (!avertit.value) {
      inactif.value += 1
      if (inactif.value < SECONDES_AVANT_AVERTISSEMENT) return

      // L'avertissement s'ouvre, exigence EF-035. Il dit son sursis entier à
      // son ouverture ; le décompte qui suit n'est pas annoncé seconde par
      // seconde.
      avertit.value = true
      restant.value = SECONDES_DE_SURSIS
      return
    }

    restant.value -= 1

    if (restant.value <= 0) {
      void expirer()
      return
    }

    if (PALIERS_DE_SURSIS.includes(restant.value)) {
      annoncer(`Sans action, la borne revient à l’accueil dans ${restant.value} secondes.`)
    }
  }

  const demarrer = () => {
    // Le minuteur n'existe que dans le navigateur. Les pages sont écrites au
    // build, où aucun client n'attend devant la borne.
    if (!import.meta.client) return

    arreter()
    reprendre()
    battement = setInterval(tic, 1000)
  }

  const surInteraction = () => {
    if (avertit.value) return
    inactif.value = 0
  }

  // Le changement d'écran arrête ou relance la limite, exigence EF-038, et
  // remet le compteur à zéro : naviguer est une interaction.
  watch(
    () => route.path,
    (chemin) => {
      if (limiteDInactiviteCourt(chemin)) {
        demarrer()
        return
      }

      arreter()
      reprendre()
    },
    { immediate: true },
  )

  if (import.meta.client) {
    for (const evenement of EVENEMENTS_DACTIVITE) {
      window.addEventListener(evenement, surInteraction, { passive: true })
    }
  }

  // Le minuteur et les écouteurs meurent avec la portée qui les a créés. Un
  // intervalle laissé derrière soi ferait repartir un écran déjà quitté.
  onScopeDispose(() => {
    arreter()

    if (!import.meta.client) return

    for (const evenement of EVENEMENTS_DACTIVITE) {
      window.removeEventListener(evenement, surInteraction)
    }
  })

  return {
    avertit: computed(() => avertit.value),
    restant: computed(() => restant.value),

    /** Prolonge la session depuis l'avertissement, exigence EF-036. */
    prolonger: () => {
      if (!avertit.value) return

      reprendre()
      annoncer('Session prolongée. Vous pouvez reprendre votre commande.')
    },

    /** Vide le panier et revient en veille, exigence EF-037. */
    expirer,
  }
}
