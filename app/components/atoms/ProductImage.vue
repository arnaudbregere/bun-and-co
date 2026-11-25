<script setup lang="ts">
/**
 * Visuel d'un produit.
 *
 * Le rapport d'affichage est réservé avant le chargement : sans lui, la grille
 * de la carte saute à l'arrivée de chaque image, et le client appuie sur un
 * produit qui vient de se déplacer.
 *
 * Un produit sans visuel garde sa place dans la grille, derrière un substitut
 * qui porte le nom du produit — l'information que l'image aurait donnée. Les
 * commentaires restent ici et non dans le gabarit : un commentaire HTML y
 * compte comme un nœud racine, et le composant cesserait d'avoir une racine
 * unique.
 *
 * Le composant ne va pas chercher l'image : il reçoit sa source. Un composant
 * qui interrogerait la couche services contournerait les composables, et
 * `pnpm lint` le refuse.
 *
 * Le texte alternatif est obligatoire par le typage. Une image de produit n'est
 * jamais décorative : le client qui ne la voit pas doit savoir ce qu'elle
 * montre.
 */

const {
  src = '',
  alt,
  ratio = '4 / 3',
  loading = 'lazy',
} = defineProps<{
  /** Source du visuel. Vide, le substitut s'affiche. */
  src?: string
  /**
   * Texte alternatif. Vide uniquement lorsque le nom du produit figure déjà
   * à côté du visuel : répéter ce nom dans l'image le ferait annoncer deux
   * fois.
   */
  alt: string
  /** Rapport d'affichage, pour réserver la place avant le chargement. */
  ratio?: string
  /** `eager` pour les visuels visibles au premier rendu, `lazy` pour le reste. */
  loading?: 'lazy' | 'eager'
}>()
</script>

<template>
  <img
    v-if="src !== ''"
    class="c-product-image"
    :src="src"
    :alt="alt"
    :loading="loading"
    decoding="async"
    :style="{ aspectRatio: ratio }"
  />

  <div
    v-else
    class="c-product-image c-product-image--placeholder"
    :role="alt === '' ? undefined : 'img'"
    :aria-label="alt === '' ? undefined : alt"
    :aria-hidden="alt === '' ? 'true' : undefined"
    :style="{ aspectRatio: ratio }"
  >
    <span aria-hidden="true">{{ alt.slice(0, 1) }}</span>
  </div>
</template>
