<script setup lang="ts">
/**
 * Boîte de confirmation d'une action destructrice : retrait d'une ligne,
 * panier vidé, exigence EF-024.
 *
 * L'élément `<dialog>` natif porte le dialogue, et `showModal()` apporte
 * gratuitement ce qu'un `div` oblige à réécrire : le piégeage de la tabulation,
 * l'inertie du reste de la page, la fermeture par Échap et la restitution du
 * focus à l'élément déclencheur. Un dialogue modal réécrit à la main est un
 * piège à clavier dans la plupart des cas ; celui-ci n'en est pas un parce
 * qu'il ne réécrit rien.
 *
 * Le bouton d'annulation précède le bouton destructeur dans le balisage, donc
 * reçoit le focus à l'ouverture. L'action destructrice n'est jamais le choix
 * par défaut : un appui machinal sur Entrée doit annuler, pas supprimer.
 *
 * Les libellés nomment l'action — « Supprimer Le Classique », et non « OK ».
 * Un lecteur d'écran qui ne lit que le bouton doit savoir ce qu'il déclenche.
 *
 * Le composant n'exécute rien : il émet la décision. C'est l'écran qui retire
 * la ligne, et le domaine qui recalcule le panier.
 */

const {
  title,
  confirmLabel,
  message = '',
  cancelLabel = 'Annuler',
} = defineProps<{
  /** Question posée, par exemple « Retirer cet article ? ». */
  title: string
  /** Libellé de l'action destructrice. Il la nomme, il ne dit pas « OK ». */
  confirmLabel: string
  /** Précision facultative sous la question. */
  message?: string
  cancelLabel?: string
}>()

const emit = defineEmits<{ confirm: []; cancel: [] }>()

/** Ouverture du dialogue, pilotée par l'écran. */
const ouvert = defineModel<boolean>('open', { required: true })

const dialogue = useTemplateRef<HTMLDialogElement>('dialogue')

const titreId = useId()

// `showModal()` n'existe pas au rendu serveur, et le dialogue ne doit s'ouvrir
// qu'une fois monté. L'état initial est donc appliqué à la montée, et non par
// un `immediate: true` : Vue exécuterait ce dernier dès la mise en place, quand
// la référence au dialogue est encore nulle.
const refleterLOuverture = () => {
  const element = dialogue.value
  if (element === null) return

  if (ouvert.value && !element.open) element.showModal()
  if (!ouvert.value && element.open) element.close()
}

onMounted(refleterLOuverture)

// `flush: 'post'` attend que le gabarit soit rendu avant d'ouvrir ou de fermer.
watch(ouvert, refleterLOuverture, { flush: 'post' })

// Échap ferme le dialogue sans passer par nos boutons : l'événement `close` est
// le seul endroit qui voie toutes les fermetures.
const onClose = () => {
  if (!ouvert.value) return
  ouvert.value = false
  emit('cancel')
}

const annuler = () => {
  ouvert.value = false
  emit('cancel')
}

const confirmer = () => {
  ouvert.value = false
  emit('confirm')
}
</script>

<template>
  <dialog ref="dialogue" class="c-confirm" :aria-labelledby="titreId" @close="onClose">
    <h2 :id="titreId" class="c-confirm__title">{{ title }}</h2>
    <p v-if="message !== ''" class="c-confirm__message">{{ message }}</p>

    <div class="c-confirm__actions">
      <BaseButton variant="secondary" @activate="annuler">{{ cancelLabel }}</BaseButton>
      <BaseButton @activate="confirmer">{{ confirmLabel }}</BaseButton>
    </div>
  </dialog>
</template>
