<script setup lang="ts">
/**
 * Affichage d'un montant.
 *
 * Les montants sont des entiers de centimes partout ailleurs : dans le domaine,
 * dans les services, dans les propriétés des composants. La conversion en euros
 * vit dans `app/utils/format-euros.ts`, seul endroit du projet où un montant est
 * divisé par cent.
 *
 * Ce composant est le seul à afficher un montant. La région d'annonce du
 * résumé du panier emploie la même fonction sans passer par lui : une région
 * d'annonce ne contient que du texte, pas un composant.
 */

import type { Cents } from '../../domain/money'
import { formatEuros, machineEuros } from '../../utils/format-euros'

const { amountCents, variant = 'inline' } = defineProps<{
  amountCents: Cents
  /** `total` porte le corps de 49 px réservé au total du panier. */
  variant?: 'inline' | 'total'
}>()

const affichage = computed(() => formatEuros(amountCents))

// Valeur lisible par une machine, en euros décimaux, conformément à l'attribut
// `value` de l'élément `<data>`.
const valeurMachine = computed(() => machineEuros(amountCents))
</script>

<template>
  <data class="c-price" :class="`c-price--${variant}`" :value="valeurMachine">
    {{ affichage }}
  </data>
</template>
