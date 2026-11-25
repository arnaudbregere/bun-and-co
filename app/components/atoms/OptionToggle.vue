<script setup lang="ts">
/**
 * Option à cocher : un ingrédient retiré, un supplément ajouté.
 *
 * La case est native. Un faux interrupteur en `div` coûterait le rôle, l'état
 * coché, la touche Espace et le mode contraste élevé, qu'il faudrait tous
 * réécrire à la main pour revenir à ce que le navigateur donne gratuitement.
 *
 * L'étiquette enveloppe la case : toute la zone est cliquable, et aucun
 * identifiant n'est à inventer pour les relier. Une case étiquetée par le seul
 * `aria-label` serait annoncée mais pas cliquable sur son texte, ce qui réduit
 * la cible utile bien en dessous des 48 px.
 *
 * Le prix d'un supplément arrive par l'emplacement `price`, et non par une
 * propriété : seul l'atome Prix convertit des centimes en euros, et un atome ne
 * consomme pas un autre atome. C'est le composant appelant qui place l'un dans
 * l'autre.
 */

const { label } = defineProps<{ label: string }>()

const coche = defineModel<boolean>({ default: false })
</script>

<template>
  <label class="c-option">
    <input v-model="coche" class="c-option__input" type="checkbox" />
    <span class="c-option__label">{{ label }}</span>
    <span v-if="$slots.price" class="c-option__price"><slot name="price" /></span>
  </label>
</template>
