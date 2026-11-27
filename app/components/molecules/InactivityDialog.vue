<script setup lang="ts">
/**
 * Avertissement de limite d'inactivité, exigences EF-035, EF-036 et EF-045.
 *
 * L'élément `<dialog>` natif porte le dialogue, comme pour la boîte de
 * confirmation : `showModal()` apporte le piégeage de la tabulation, l'inertie
 * du reste de la page, la fermeture par Échap et le focus posé sur le premier
 * élément focalisable. Rien de tout cela n'est réécrit ici.
 *
 * Une chose ne vient pas gratuitement, et c'est le propre de cet
 * avertissement : il surgit sans déclencheur. La restitution du focus de
 * `<dialog>` suppose un élément qui a ouvert le dialogue ; ici personne ne l'a
 * ouvert. L'élément actif avant l'apparition est donc relevé à la main et
 * refocalisé à la fermeture, exigence EF-045 — sans quoi un client qui
 * prolonge sa session repartirait du haut de l'écran, et non du bouton qu'il
 * s'apprêtait à activer.
 *
 * Le compte à rebours ne vit pas dans une région d'annonce. Il change chaque
 * seconde : une région courtoise redirait vingt fois la même chose et
 * couvrirait la question posée. Le décompte est donc `aria-hidden`, le texte du
 * dialogue dit le sursis entier à l'ouverture, et `useInactivity` annonce deux
 * paliers ensuite.
 *
 * Échap prolonge au lieu d'effacer. C'est une frappe, donc un client présent,
 * et l'issue la moins destructrice de deux touches voisines est la bonne.
 *
 * Le composant n'efface rien et ne navigue pas. Toute fermeture — le bouton
 * comme Échap — passe par le modèle d'ouverture, et c'est l'appelant qui en
 * tire la prolongation : une fermeture et un événement séparés offriraient
 * deux chemins pour le même geste, dont un à oublier de brancher.
 *
 * `useInactivity` tient les délais, et le domaine connaît le panier.
 */

const { remainingSeconds } = defineProps<{
  /** Secondes de sursis restantes, affichées en clair et masquées à l'oral. */
  remainingSeconds: number
}>()

/** Ouverture du dialogue, pilotée par la limite d'inactivité. */
const ouvert = defineModel<boolean>('open', { required: true })

const dialogue = useTemplateRef<HTMLDialogElement>('dialogue')

const titreId = useId()
const messageId = useId()

/**
 * Élément actif avant l'apparition de l'avertissement.
 *
 * Relevé à l'ouverture, refocalisé à la fermeture. `<dialog>` ne peut pas le
 * faire pour nous : il restitue le focus à l'élément qui a appelé
 * `showModal()`, et l'appel vient d'un minuteur.
 */
let origineDuFocus: HTMLElement | undefined

/**
 * Sursis relevé à l'ouverture, en secondes.
 *
 * Le message est écrit une fois, avec le sursis entier, et ne bouge plus
 * ensuite : un texte qui se réécrit chaque seconde changerait sous les doigts
 * d'un client qui relit le dialogue au lecteur d'écran. Seul le décompte
 * `aria-hidden` suit le temps.
 */
const sursis = ref(remainingSeconds)

const rendreLeFocus = () => {
  const origine = origineDuFocus
  origineDuFocus = undefined

  // Un élément retiré du document entre-temps ne peut plus rien recevoir, et
  // le corps de page n'est pas une destination : le navigateur y pose le focus
  // de lui-même.
  if (origine === undefined || !origine.isConnected) return
  if (origine === document.body) return

  origine.focus()
}

// `showModal()` n'existe pas au rendu serveur, et le dialogue ne doit s'ouvrir
// qu'une fois monté. L'état initial est donc appliqué à la montée, et non par
// un `immediate: true` : Vue exécuterait ce dernier dès la mise en place, quand
// la référence au dialogue est encore nulle.
const refleterLOuverture = () => {
  const element = dialogue.value
  if (element === null) return

  if (ouvert.value && !element.open) {
    const actif = document.activeElement
    origineDuFocus = actif instanceof HTMLElement ? actif : undefined
    sursis.value = remainingSeconds
    element.showModal()
  }

  if (!ouvert.value && element.open) element.close()
}

onMounted(refleterLOuverture)

// `flush: 'post'` attend que le gabarit soit rendu avant d'ouvrir ou de fermer.
watch(ouvert, refleterLOuverture, { flush: 'post' })

// Échap ferme le dialogue sans passer par notre bouton : l'événement `close`
// est le seul endroit qui voie toutes les fermetures, et donc le seul où le
// focus se restitue.
const onClose = () => {
  rendreLeFocus()

  // L'expiration ferme le dialogue par son propre état : le modèle est déjà
  // faux ici, et il n'y a pas de prolongation à en tirer.
  if (!ouvert.value) return

  ouvert.value = false
}

const prolonger = () => {
  ouvert.value = false
}
</script>

<template>
  <dialog
    ref="dialogue"
    class="c-inactivity"
    :aria-labelledby="titreId"
    :aria-describedby="messageId"
    @close="onClose"
  >
    <h2 :id="titreId" class="c-inactivity__title">Êtes-vous toujours là ?</h2>

    <!-- Le sursis entier est dit une fois, en toutes lettres : c'est ce que le
         lecteur d'écran lit à l'ouverture, et il n'a pas à suivre le décompte
         pour comprendre ce qui va se passer. -->
    <p :id="messageId" class="c-inactivity__message">
      Sans action de votre part, votre commande sera effacée et la borne reviendra à l'accueil dans
      {{ sursis }} secondes.
    </p>

    <p class="c-inactivity__countdown" aria-hidden="true">{{ remainingSeconds }}</p>

    <div class="c-inactivity__actions">
      <BaseButton @activate="prolonger">Je continue ma commande</BaseButton>
    </div>
  </dialog>
</template>
