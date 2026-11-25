<script setup lang="ts">
/**
 * Affichage d'un montant.
 *
 * Les montants sont des entiers de centimes partout ailleurs : dans le domaine,
 * dans les services, dans les propriétés des composants. Ce composant est le
 * seul endroit du projet où un montant est divisé par cent, et le seul où il
 * devient une chaîne.
 *
 * Centraliser la conversion n'est pas une coquetterie : `5.90 + 1.20 + 0.80`
 * vaut `7.9000000000000004` en JavaScript, et une division dispersée dans les
 * composants ramène les flottants dans le calcul.
 */

import type { Cents } from '../../domain/money'

const { amountCents, variant = 'inline' } = defineProps<{
  amountCents: Cents
  /** `total` porte le corps de 49 px réservé au total du panier. */
  variant?: 'inline' | 'total'
}>()

// Une seule instance : construire un formateur est coûteux, et la carte en
// affiche vingt-sept.
const formateur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

const affichage = computed(() => formateur.format(amountCents / 100))

// Valeur lisible par une machine, en euros décimaux, conformément à l'attribut
// `value` de l'élément `<data>`.
const valeurMachine = computed(() => (amountCents / 100).toFixed(2))
</script>

<template>
  <data class="c-price" :class="`c-price--${variant}`" :value="valeurMachine">
    {{ affichage }}
  </data>
</template>
