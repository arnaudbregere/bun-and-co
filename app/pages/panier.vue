<script setup lang="ts">
/**
 * Panier, demande #125.
 *
 * Squelette : le titre, la structure et les sorties de l'écran. Le contenu
 * arrive avec sa propre demande de fusion.
 */

useHead({ title: 'Panier — Bun & Co' })
</script>

<template>
  <main class="o-container o-stack">
    <h1>Panier</h1>
    <p>Le récapitulatif de la commande, et sa correction.</p>

    <p>
      <NuxtLink class="c-button c-button--primary" to="/paiement">Payer</NuxtLink>
    </p>
  </main>
</template>
