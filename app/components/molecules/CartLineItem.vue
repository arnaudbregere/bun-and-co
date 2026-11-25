<script setup lang="ts">
/**
 * Ligne de panier : un produit retenu, sa personnalisation, sa quantité et son
 * prix.
 *
 * La racine est un `li` : une ligne de panier n'existe que dans la liste des
 * lignes, et un lecteur d'écran y annonce « 2 sur 5 » avant de la lire.
 *
 * Les retraits et les suppléments sont écrits en toutes lettres, exigence
 * EF-020 : « sans oignons », « avec bacon ». Deux lignes du même produit
 * personnalisé différemment se distinguent alors à la lecture, exigence
 * EF-021 — sans ces mentions, le panier afficherait deux fois « Le Classique »
 * et le client ne saurait pas laquelle retirer.
 *
 * Le composant ne multiplie rien. Le prix unitaire et le prix de ligne viennent
 * du domaine, `unitPriceCents` et `lineTotalCents` : une multiplication écrite
 * ici serait une seconde source de vérité, et c'est le ticket qui trancherait.
 *
 * Le sélecteur de quantité arrive par un emplacement, et non par composition :
 * c'est une molécule, et une molécule ne consomme pas une molécule. L'écran
 * place l'un dans l'autre, comme il place l'atome Prix dans l'option à cocher.
 *
 * Le bouton de retrait ne retire rien : il demande le retrait, et l'écran en
 * demande confirmation, exigence EF-024. Son libellé nomme la ligne, parce
 * qu'un panier en compte plusieurs et qu'une croix seule ne dit pas laquelle.
 */

import type { Cents } from '../../domain/money'

export interface LineExtra {
  readonly id: string
  readonly label: string
  readonly priceCents: Cents
}

const {
  name,
  quantity,
  unitPriceCents,
  totalPriceCents,
  menuLabel = '',
  removed = [],
  extras = [],
  substitutions = [],
} = defineProps<{
  name: string
  quantity: number
  /** Prix d'une unité, personnalisation comprise. Calculé par le domaine. */
  unitPriceCents: Cents
  /** Prix de la ligne entière. Calculé par le domaine. */
  totalPriceCents: Cents
  /** Taille du menu, vide pour un produit commandé seul. */
  menuLabel?: string
  /** Libellés des ingrédients retirés. */
  removed?: readonly string[]
  /** Suppléments retenus, avec leur prix. */
  extras?: readonly LineExtra[]
  /** Composants de menu remplacés, avec le supplément de la substitution. */
  substitutions?: readonly LineExtra[]
}>()

const emit = defineEmits<{ remove: [] }>()

const personnalise = computed(
  () => removed.length > 0 || extras.length > 0 || substitutions.length > 0,
)
</script>

<template>
  <li class="c-cart-line">
    <div class="c-cart-line__head">
      <span class="c-cart-line__name">{{ name }}</span>
      <span v-if="menuLabel !== ''" class="c-cart-line__menu">{{ menuLabel }}</span>
    </div>

    <ul v-if="personnalise" class="c-cart-line__details">
      <li v-for="retrait of removed" :key="retrait">Sans {{ retrait.toLowerCase() }}</li>
      <li v-for="supplement of extras" :key="supplement.id">
        Avec {{ supplement.label.toLowerCase() }}
        <PriceTag :amount-cents="supplement.priceCents" />
      </li>
      <li v-for="substitution of substitutions" :key="substitution.id">
        {{ substitution.label }}
        <PriceTag :amount-cents="substitution.priceCents" />
      </li>
    </ul>

    <div class="c-cart-line__controls">
      <slot name="quantity" />

      <BaseButton variant="quiet" @activate="emit('remove')">
        Retirer
        <span class="u-visually-hidden">{{ name }} du panier</span>
      </BaseButton>
    </div>

    <div class="c-cart-line__prices">
      <span class="c-cart-line__unit">
        <PriceTag :amount-cents="unitPriceCents" /> l'unité, {{ quantity }}
        {{ quantity > 1 ? 'articles' : 'article' }}
      </span>
      <PriceTag :amount-cents="totalPriceCents" />
    </div>
  </li>
</template>
