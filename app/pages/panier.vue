<script setup lang="ts">
/**
 * Panier, demande #125.
 *
 * Squelette : le titre, la structure et les sorties de l'écran. Les lignes, leur
 * correction et le résumé arrivent avec sa propre demande de fusion.
 *
 * L'écran lit déjà la commande en cours, demande #119 : il ne connaît ni le
 * stockage de session, ni les limites du panier, et ne calcule aucun total.
 */

const { articles, totalCentimes } = useDraft()

useHead({ title: 'Panier — Bun & Co' })
</script>

<template>
  <main class="o-container o-stack">
    <h1>Panier</h1>

    <p v-if="articles === 0">Votre panier est vide.</p>
    <p v-else>
      {{ articles }} article{{ articles > 1 ? 's' : '' }}, {{ formatEuros(totalCentimes) }}.
    </p>

    <p>
      <NuxtLink class="c-button c-button--primary" to="/paiement">Payer</NuxtLink>
    </p>
  </main>
</template>
