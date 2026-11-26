<script setup lang="ts">
/**
 * Paiement, demande #126.
 *
 * Squelette : le titre, la structure et les sorties de l'écran. Le contenu
 * arrive avec sa propre demande de fusion.
 */

useHead({ title: 'Paiement — Bun & Co' })
</script>

<template>
  <main class="o-container o-stack">
    <h1>Paiement</h1>
    <p>Carte bancaire sur la borne, ou règlement en caisse. Paiement simulé.</p>

    <p>
      <NuxtLink class="c-button c-button--primary" to="/ticket">Confirmer</NuxtLink>
    </p>
  </main>
</template>
