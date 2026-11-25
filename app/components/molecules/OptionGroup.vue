<script setup lang="ts">
/**
 * Groupe d'options d'une fiche produit : les retraits sans frais, exigence
 * EF-017, ou les suppléments payants, exigence EF-018.
 *
 * Le groupe est un `fieldset` nommé par sa `legend`. Un lecteur d'écran annonce
 * alors le nom du groupe avant la première case, puis le rappelle à chaque
 * option : sans lui, « bacon » suit « sans cornichons » dans la même liste
 * plate, et rien ne dit que l'un retire et que l'autre ajoute.
 *
 * Le composant n'additionne rien. Le total des suppléments est calculé par le
 * domaine, `extrasTotalCents`, et reçu en propriété : deux endroits qui
 * additionnent les mêmes montants finissent par ne plus être d'accord, et c'est
 * le ticket qui tranche.
 *
 * Aucun ordre n'est imposé : le composant affiche la liste qu'on lui passe,
 * dans l'ordre où la carte la déclare.
 *
 * Un produit sans personnalisation ne produit pas un groupe vide : le
 * `fieldset` disparaît avec sa légende, plutôt que d'annoncer un groupe de zéro
 * option.
 */

import type { Cents } from '../../domain/money'

export interface GroupOption {
  readonly id: string
  readonly label: string
  /** Prix du supplément. Absent pour un retrait, qui est sans frais. */
  readonly priceCents?: Cents
}

const {
  legend,
  options,
  totalCents = undefined,
  totalLabel = 'Total des suppléments',
} = defineProps<{
  /** Nom du groupe, annoncé avant sa première option. */
  legend: string
  options: readonly GroupOption[]
  /** Somme des options retenues, calculée par le domaine. Absente, rien ne s'affiche. */
  totalCents?: Cents
  /** Libellé qui précède le total. */
  totalLabel?: string
}>()

/** Identifiants des options retenues. */
const selection = defineModel<readonly string[]>({ required: true })

const estRetenue = (id: string) => selection.value.includes(id)

// La sélection est remplacée, jamais modifiée sur place : une propriété que le
// composant muterait changerait sous les pieds de l'appelant, qui n'en serait
// pas averti.
const basculer = (id: string, retenue: boolean) => {
  selection.value = retenue
    ? [...selection.value, id]
    : selection.value.filter((candidat) => candidat !== id)
}
</script>

<template>
  <fieldset v-if="options.length > 0" class="c-option-group">
    <legend class="c-option-group__legend">{{ legend }}</legend>

    <div class="c-option-group__list">
      <OptionToggle
        v-for="option of options"
        :key="option.id"
        :label="option.label"
        :model-value="estRetenue(option.id)"
        @update:model-value="basculer(option.id, $event)"
      >
        <template v-if="option.priceCents !== undefined" #price>
          <PriceTag :amount-cents="option.priceCents" />
        </template>
      </OptionToggle>
    </div>

    <p v-if="totalCents !== undefined" class="c-option-group__total">
      {{ totalLabel }} <PriceTag :amount-cents="totalCents" />
    </p>
  </fieldset>
</template>
