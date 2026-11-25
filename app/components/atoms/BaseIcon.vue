<script setup lang="ts">
/**
 * Symbole de l'interface.
 *
 * Le jeu est fermé et limité aux symboles que le parcours emploie réellement.
 * Six formes ne justifient pas une dépendance d'icônes, dont le poids et la
 * surface dépassent de loin ce qu'on en utiliserait.
 *
 * Le symbole est toujours décoratif : il accompagne un libellé, il ne le
 * remplace pas. Un bouton réduit à son icône porte donc son libellé dans un
 * élément `.u-visually-hidden`, lu par un lecteur d'écran et absent de l'écran.
 * D'où `aria-hidden` sans condition : une icône annoncée en plus de son libellé
 * produirait une annonce en double.
 */

const ICONS = {
  'arrow-left': ['M19 12H5', 'm12 19-7-7 7-7'],
  cart: [
    'M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L21 8H6',
    'M9.5 20.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0',
    'M19 20.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0',
  ],
  plus: ['M12 5v14', 'M5 12h14'],
  minus: ['M5 12h14'],
  trash: ['M4 7h16', 'M9 7V4h6v3', 'm6 7 1 13h10l1-13', 'M10 11v6', 'M14 11v6'],
  alert: ['M12 3 2 20h20Z', 'M12 9v5', 'M12 17.5h0'],
} as const

export type IconName = keyof typeof ICONS

const { name } = defineProps<{ name: IconName }>()

const paths = computed<readonly string[]>(() => ICONS[name])
</script>

<template>
  <svg
    class="c-icon"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path v-for="path of paths" :key="path" :d="path" />
  </svg>
</template>
