<script setup lang="ts">
/**
 * Choix de la taille d'un menu : M, L ou XL, exigence EF-011.
 *
 * Des boutons radio natifs, dans un `fieldset` nommé par sa `legend`. Le
 * navigateur donne alors gratuitement ce qu'il faudrait sinon réécrire : un
 * seul arrêt de tabulation pour le groupe, le passage d'une taille à l'autre
 * aux flèches, l'exclusivité du choix et le rendu en contraste élevé.
 *
 * Aucun forfait ni aucun format n'est écrit ici. Ils viennent des règles du
 * domaine, `MENU_SIZE_RULES` : le forfait détermine le prix, exigence EF-012,
 * et la taille détermine les formats, exigence EF-013. Les coder ici en ferait
 * une seconde source de vérité, qui divergerait au premier changement de grille.
 *
 * Chaque taille annonce ce qu'elle comprend, et pas seulement sa lettre : « XL,
 * plus 6,90 €, accompagnement grand format, boisson format moyen, dessert
 * inclus ». Une lettre seule n'est pas un choix éclairé, et c'est la seule
 * information dont dispose un client qui n'a pas la grille en tête.
 *
 * Les libellés français des formats vivent ici : le domaine nomme les formats
 * par des identifiants stables et ne connaît pas la langue d'affichage.
 */

import type { Format, MenuSize, MenuSizeRule } from '../../domain/types'

const FORMATS: Readonly<Record<Format, string>> = {
  small: 'petit format',
  medium: 'format moyen',
  large: 'grand format',
}

const { legend, rules } = defineProps<{
  /** Nom du groupe, annoncé avant la première taille. */
  legend: string
  /** Règles des tailles proposées, dans l'ordre où elles s'affichent. */
  rules: readonly MenuSizeRule[]
}>()

/** Taille retenue. */
const taille = defineModel<MenuSize>({ required: true })

// Un nom par instance : deux sélecteurs rendus sur le même écran partageraient
// sinon un groupe, et choisir une taille dans l'un décocherait l'autre.
const groupe = useId()
</script>

<template>
  <fieldset class="c-menu-size">
    <legend class="c-menu-size__legend">{{ legend }}</legend>

    <label v-for="rule of rules" :key="rule.size" class="c-menu-size__option">
      <input
        v-model="taille"
        class="c-menu-size__input"
        type="radio"
        :name="groupe"
        :value="rule.size"
      />

      <span class="c-menu-size__size">{{ rule.size }}</span>

      <span class="c-menu-size__detail">
        <PriceTag :amount-cents="rule.surchargeCents" />
        <span class="c-menu-size__includes">
          Accompagnement {{ FORMATS[rule.sideFormat] }}, boisson {{ FORMATS[rule.drinkFormat] }}
        </span>
      </span>

      <span v-if="rule.includesDessert" class="c-menu-size__dessert">
        Dessert <StatusBadge state="included" />
      </span>
    </label>
  </fieldset>
</template>
