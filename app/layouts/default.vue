<script setup lang="ts">
/**
 * Mise en page commune aux sept écrans.
 *
 * Elle porte trois choses que chaque écran aurait sinon à réécrire : le lien
 * d'évitement, le retour à l'écran précédent et la région d'annonce courtoise.
 *
 * Une seule région d'annonce pour toute la borne, exigence EF-040. Deux
 * régions annonceraient deux fois le même changement, ou se voleraient la
 * parole.
 *
 * Le lien d'évitement est le premier élément focalisable du document, critère
 * WCAG 2.4.1 : sur la carte, il épargne au client au clavier la traversée des
 * six onglets et des vingt-sept produits avant d'atteindre le contenu.
 */

const { precedent } = useParcours()
const { message } = useAnnonces()
</script>

<template>
  <div class="o-screen">
    <a class="c-skip-link" href="#contenu">Aller au contenu</a>

    <header v-if="precedent !== undefined" class="o-container o-screen__back">
      <NuxtLink class="c-button c-button--quiet" :to="precedent.chemin">
        Retour : {{ precedent.titre }}
      </NuxtLink>
    </header>

    <div id="contenu" class="o-screen__content">
      <slot />
    </div>

    <LiveRegion :message="message" />
  </div>
</template>
