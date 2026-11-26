<script setup lang="ts">
/**
 * Mode de consommation, demande #121.
 *
 * Squelette : le titre, la structure et les sorties de l'écran. Le contenu
 * arrive avec sa propre demande de fusion.
 */

useHead({ title: 'Mode de consommation — Bun & Co' })
</script>

<template>
  <main class="o-container o-stack">
    <h1>Mode de consommation</h1>
    <p>Sur place ou à emporter : le choix suit la commande jusqu'au ticket.</p>

    <p>
      <NuxtLink class="c-button c-button--primary" to="/carte">Voir la carte</NuxtLink>
    </p>
  </main>
</template>
