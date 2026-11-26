<script setup lang="ts">
/**
 * Écran de veille, demande #120.
 *
 * Premier écran du parcours, exigence EF-001. Il invite à commander et ne fait
 * rien d'autre : aucune limite d'inactivité ne court ici, exigence EF-038, et
 * aucune commande n'est lue. Un client qui rafraîchit la veille ne retrouve
 * donc rien d'une commande antérieure ; le panier est vidé là où le parcours se
 * termine, au ticket et à l'expiration de la limite d'inactivité.
 *
 * Le démarrage est un lien, et non un bouton : il mène à l'écran suivant. Un
 * lien est actionnable au doigt comme au clavier, exigence EF-039, et rien ne
 * se déclenche au survol, qui n'existe pas sur une borne.
 */

useHead({ title: 'Bun & Co — Commander' })
</script>

<template>
  <main class="o-container c-standby">
    <h1 class="c-standby__title">Bun &amp; Co</h1>

    <div class="c-band c-standby__band" aria-hidden="true" />

    <p class="c-standby__lead">Commandez ici, retirez au comptoir.</p>

    <NuxtLink class="c-button c-button--primary c-standby__start" to="/mode"> Commander </NuxtLink>
  </main>
</template>
