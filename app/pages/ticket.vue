<script setup lang="ts">
/**
 * Écran de ticket, demande #127.
 *
 * Squelette : le titre et la structure. Le numéro de commande, le mode de
 * consommation et le retour en veille arrivent avec sa propre demande de
 * fusion.
 *
 * Aucune sortie de retour : après la confirmation du paiement, le parcours ne
 * revient pas en arrière, exigences EF-002 et EF-004.
 */

useHead({ title: 'Commande confirmée — Bun & Co' })
</script>

<template>
  <main class="o-container o-stack">
    <h1>Commande confirmée</h1>
    <p>Le numéro de commande et le retour en veille arrivent avec la demande #127.</p>

    <p>
      <NuxtLink class="c-button c-button--primary" to="/">Nouvelle commande</NuxtLink>
    </p>
  </main>
</template>
