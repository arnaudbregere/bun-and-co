<script setup lang="ts">
/**
 * Carte, demande #122.
 *
 * Squelette : le titre, la structure et les sorties de l'écran. Le contenu
 * arrive avec sa propre demande de fusion.
 */

useHead({ title: 'Carte — Bun & Co' })
</script>

<template>
  <main class="o-container o-stack">
    <h1>Carte</h1>
    <p>Six catégories, vingt-sept références, et l'accès au panier.</p>

    <p>
      <NuxtLink class="c-button c-button--primary" to="/panier">Voir le panier</NuxtLink>
    </p>
  </main>
</template>
