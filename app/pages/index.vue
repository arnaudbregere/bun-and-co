<script setup lang="ts">
/**
 * Écran de veille, demande #120.
 *
 * Squelette : le titre, la structure et la sortie vers le mode de
 * consommation. L'invite animée et le détail de l'écran arrivent avec sa
 * propre demande de fusion.
 */

useHead({ title: 'Bun & Co — Commander' })
</script>

<template>
  <main class="o-container o-stack">
    <h1>Bun &amp; Co</h1>
    <div class="c-band" aria-hidden="true" />
    <p>Commandez ici, retirez au comptoir.</p>

    <p>
      <NuxtLink class="c-button c-button--primary" to="/mode">Commander</NuxtLink>
    </p>
  </main>
</template>
