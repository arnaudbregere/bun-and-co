<script setup lang="ts">
/**
 * Fiche produit, demande #123.
 *
 * Squelette : le titre, la structure et le retour à la carte. Les allergènes,
 * les options et le prix mis à jour arrivent avec sa propre demande de fusion.
 *
 * La route est dynamique dans les sources, jamais à l'exécution : les
 * vingt-sept fiches sont rendues au build, listées dans
 * `nitro.prerender.routes`. L'hébergement est statique, et aucun processus ne
 * répondra à une fiche absente du rendu.
 */

const route = useRoute()

const identifiant = computed(() => String(route.params.id))

useHead({ title: () => `${identifiant.value} — Bun & Co` })
</script>

<template>
  <main class="o-container o-stack">
    <h1>{{ identifiant }}</h1>
    <p>Le détail du produit arrive avec la demande #123.</p>
  </main>
</template>
