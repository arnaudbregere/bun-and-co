<script setup lang="ts">
/**
 * Mise en page commune aux sept écrans.
 *
 * Elle porte quatre choses que chaque écran aurait sinon à réécrire : le lien
 * d'évitement, le retour à l'écran précédent, les régions d'annonce et la
 * limite d'inactivité.
 *
 * Une seule région courtoise pour toute la borne, exigence EF-040, et une
 * seule région d'alerte, exigence EF-041. Deux régions d'un même mode
 * annonceraient deux fois le même changement, ou se voleraient la parole.
 *
 * Le lien d'évitement est le premier élément focalisable du document, critère
 * WCAG 2.4.1 : sur la carte, il épargne au client au clavier la traversée des
 * six onglets et des vingt-sept produits avant d'atteindre le contenu.
 *
 * La limite d'inactivité vit ici et nulle part ailleurs : un minuteur par écran
 * repartirait de zéro à chaque navigation, et un client qui hésite entre la
 * carte et le panier n'atteindrait jamais les quatre-vingt-dix secondes.
 * `useInactivity` sait de lui-même sur quels écrans il ne court pas, exigence
 * EF-038.
 */

const { precedent } = useParcours()
const { message, alerte } = useAnnonces()

const { avertit, restant, prolonger } = useInactivity()

/**
 * Ouverture du dialogue, lue depuis la limite d'inactivité.
 *
 * Toute fermeture venue du dialogue est une prolongation, exigence EF-036 : le
 * bouton et Échap y mènent tous deux. L'expiration, elle, ferme en amont, par
 * `avertit`, et ne repasse pas par ce passage.
 */
const avertissementOuvert = computed({
  get: () => avertit.value,
  set: (ouvert) => {
    if (!ouvert) prolonger()
  },
})
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

    <InactivityDialog v-model:open="avertissementOuvert" :remaining-seconds="restant" />

    <LiveRegion :message="message" />
    <LiveRegion :message="alerte" mode="alert" />
  </div>
</template>
