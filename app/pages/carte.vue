<script setup lang="ts">
/**
 * Carte, demande #122.
 *
 * Squelette : le titre, la structure et les sorties de l'écran. Les onglets de
 * catégories et les cartes de produit arrivent avec sa propre demande de
 * fusion.
 *
 * L'écran consomme déjà la carte, demande #118 : il ne connaît ni la route
 * `/api/catalogue.json`, ni la passerelle qui la consomme, et ne garde rien de
 * ce qu'il reçoit. La carte indisponible est dite ici, à l'écran, en plus de
 * l'annonce faite au lecteur d'écran.
 */

const { produits, chargement, erreur, recharger } = useCatalogue()

useHead({ title: 'Carte — Bun & Co' })
</script>

<template>
  <main class="o-container o-stack">
    <h1>Carte</h1>

    <p v-if="chargement">Chargement de la carte…</p>

    <template v-else-if="erreur !== ''">
      <p>{{ erreur }}</p>

      <p>
        <button type="button" class="c-button c-button--primary" @click="recharger()">
          Réessayer
        </button>
      </p>
    </template>

    <p v-else>Six catégories, {{ produits.length }} références, et l'accès au panier.</p>

    <p>
      <NuxtLink class="c-button c-button--primary" to="/panier">Voir le panier</NuxtLink>
    </p>
  </main>
</template>
