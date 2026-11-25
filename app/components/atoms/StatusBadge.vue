<script setup lang="ts">
/**
 * Étiquette d'état.
 *
 * Trois états, et un libellé pour chacun. Le libellé n'est pas une politesse :
 * le critère WCAG 1.4.1 interdit de porter une information par la couleur
 * seule, et le mode `forced-colors` des systèmes d'exploitation écrase les
 * couleurs d'auteur. Une pastille rouge sans texte ne dit plus rien ni à un
 * lecteur d'écran, ni à un client daltonien, ni à un écran en contraste élevé.
 *
 * L'étiquette ne porte aucune icône : un atome ne consomme pas un autre atome.
 * Le texte suffit, et `pnpm component-levels` refuserait la composition.
 */

const LABELS = {
  unavailable: 'Indisponible',
  included: 'Inclus',
  surcharge: 'Supplément',
} as const

export type StatusState = keyof typeof LABELS

const { state } = defineProps<{ state: StatusState }>()

const label = computed(() => LABELS[state])
</script>

<template>
  <span class="c-status" :class="`c-status--${state}`">{{ label }}</span>
</template>
