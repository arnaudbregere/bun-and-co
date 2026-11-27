<script setup lang="ts">
/**
 * Écran de ticket, demande #127.
 *
 * Le dernier écran : le numéro de commande, exigence EF-032, le mode de
 * consommation retenu, exigence EF-033, et le retour en veille après quinze
 * secondes, exigence EF-034.
 *
 * Le numéro est l'information que le client montre au comptoir. Il est donc au
 * plus grand corps de l'échelle, comme l'enseigne sur l'écran de veille, et
 * rien ne le dispute à l'écran.
 *
 * Aucun retour en arrière, exigences EF-002 et EF-004 : `useParcours` n'en
 * donne pas au ticket, et la commande est partie en cuisine. Aucune limite
 * d'inactivité ne court ici non plus, exigence EF-038 — un client qui lit son
 * numéro n'interagit pas, et l'avertissement d'inactivité l'en détournerait.
 *
 * Le compte à rebours ne vit pas dans une région d'annonce. Il change chaque
 * seconde : une région courtoise redirait quinze fois la même chose et
 * couvrirait la lecture du numéro, ce que le critère d'acceptation de la
 * demande interdit. Le décompte est donc `aria-hidden`, et une phrase unique,
 * fixe, dit au lecteur d'écran ce qui va se passer.
 *
 * Le retour en veille est une redirection déclenchée par script, donc le test
 * RGAA 13.1.3 s'applique. Il ouvre quatre voies, et une seule est praticable
 * ici : porter le délai au décuple par une action simple, d'où le bouton
 * « Plus de temps » et les cent cinquante secondes.
 *
 * La voie de l'avertissement préalable, que la limite d'inactivité emprunte
 * aux exigences EF-035 et EF-036, réclame au moins vingt secondes pour
 * réagir — davantage que le délai lui-même. Celle de l'arrêt pur laisserait
 * la borne figée sur le ticket d'un client parti, et l'exigence EF-038
 * interdit justement toute limite d'inactivité sur cet écran : rien ne
 * viendrait la débloquer. Celle des vingt heures viderait l'exigence EF-034
 * de son sens.
 *
 * La prolongation ne vaut qu'une fois. La renouveler sans fin reviendrait à
 * l'arrêt pur, avec le même écueil : une commande exposée au client suivant.
 */

import { SECONDES_APRES_PROLONGATION, SECONDES_AVANT_VEILLE } from '~/domain/session'

const { commande } = useReglement()
const { retourEnVeille } = useVeille()

const restant = ref(SECONDES_AVANT_VEILLE)

const prolonge = ref(false)

const prolonger = () => {
  if (prolonge.value) return

  prolonge.value = true
  restant.value = SECONDES_APRES_PROLONGATION
}

const libelleDeConsommation = computed(() =>
  commande.value?.serviceMode === 'takeaway' ? 'À emporter' : 'Sur place',
)

// Le minuteur ne vit que dans le navigateur, et seulement tant que l'écran est
// monté. Un intervalle laissé derrière soi ferait repartir un écran que le
// client vient de quitter.
let battement: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  battement = setInterval(() => {
    restant.value -= 1
    if (restant.value > 0) return

    clearInterval(battement)
    void retourEnVeille()
  }, 1000)
})

onBeforeUnmount(() => {
  clearInterval(battement)
})

useHead({ title: 'Commande confirmée — Bun & Co' })
</script>

<template>
  <main class="o-container o-stack c-ticket">
    <h1>Commande confirmée</h1>

    <!-- La commande vient de `sessionStorage`, que le serveur ne connaît pas :
         la page est écrite au build. Sans `ClientOnly`, les deux arbres
         diffèrent par leur structure, et Vue réemploie les nœuds rendus plutôt
         que de rectifier l'écart. -->
    <ClientOnly>
      <template v-if="commande === undefined">
        <p>Aucune commande à afficher. Elle a peut-être déjà été retirée.</p>

        <p>
          <NuxtLink class="c-button c-button--primary" to="/">Nouvelle commande</NuxtLink>
        </p>
      </template>

      <template v-else>
        <p class="c-ticket__lead">Votre numéro d'appel</p>

        <p class="c-ticket__number">{{ commande.number }}</p>

        <div class="c-band c-ticket__band" aria-hidden="true" />

        <p class="c-ticket__service">{{ libelleDeConsommation }}</p>

        <p>Présentez ce numéro au comptoir.</p>

        <!-- Phrase fixe pour le lecteur d'écran : elle dit ce qui va se passer
             une fois, là où le décompte le redirait quinze fois. -->
        <p class="c-ticket__wait">
          Cet écran revient à l'accueil dans un instant.
          <span class="c-ticket__countdown" aria-hidden="true">{{ restant }} s</span>
        </p>

        <div class="c-ticket__actions">
          <!-- Test RGAA 13.1.3 : le délai avant la redirection peut être porté
               au décuple par une action simple. Le bouton reste atteignable au
               clavier une fois la prolongation consommée, et dit pourquoi il
               ne répond plus. -->
          <BaseButton
            variant="secondary"
            :disabled="prolonge"
            reason="Délai déjà prolongé"
            @activate="prolonger"
          >
            Plus de temps
          </BaseButton>

          <BaseButton @activate="retourEnVeille">Nouvelle commande</BaseButton>
        </div>
      </template>

      <template #fallback>
        <p>Préparation de votre ticket…</p>
      </template>
    </ClientOnly>
  </main>
</template>
