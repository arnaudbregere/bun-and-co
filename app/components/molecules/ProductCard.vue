<script setup lang="ts">
/**
 * Carte d'un produit dans la carte de l'enseigne.
 *
 * La carte entière est une cible unique. Un titre cliquable entouré de zones
 * mortes multiplie les appuis manqués sur une borne, où l'on vise avec un doigt
 * et non avec un curseur.
 *
 * Une seule prise de focus par carte, pour la même raison : un client au clavier
 * qui traverse trois arrêts par produit abandonne avant la fin de la carte.
 *
 * Le composant ne calcule aucun prix, ne décide d'aucune navigation et
 * n'interroge aucun service : il reçoit ce qu'il affiche et émet la sélection.
 * L'écran décide de la suite.
 *
 * Le visuel porte un texte alternatif vide, à dessein : le nom du produit figure
 * juste en dessous, et le répéter le ferait annoncer deux fois.
 *
 * Le corps est enveloppé : le visuel occupe toute la largeur de la carte, bord
 * à bord, et seul le texte reçoit une marge intérieure. Sans cette enveloppe,
 * une marge commune réduirait la photographie, qui est ce que le client
 * regarde en premier.
 */

import type { Cents } from '../../domain/money'

const {
  name,
  priceCents,
  src = '',
  available = true,
  loading = 'lazy',
} = defineProps<{
  name: string
  priceCents: Cents
  src?: string
  available?: boolean
  loading?: 'lazy' | 'eager'
}>()

const emit = defineEmits<{ select: [] }>()

const onClick = (event: MouseEvent) => {
  // Exigence EF-009 : un produit indisponible ne peut pas être ajouté. La carte
  // reste atteignable au clavier et annonce son état, mais n'émet rien.
  if (!available) {
    event.preventDefault()
    return
  }

  emit('select')
}
</script>

<template>
  <button
    type="button"
    class="c-product-card"
    :aria-disabled="available ? undefined : 'true'"
    @click="onClick"
  >
    <ProductImage :src="src" alt="" :loading="loading" />
    <span class="c-product-card__body">
      <span class="c-product-card__name">{{ name }}</span>
      <span class="c-product-card__foot">
        <PriceTag :amount-cents="priceCents" />
        <StatusBadge v-if="!available" state="unavailable" />
      </span>
    </span>
  </button>
</template>
