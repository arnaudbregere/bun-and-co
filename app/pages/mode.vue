<script setup lang="ts">
/**
 * Mode de consommation, demande #121.
 *
 * Deuxième écran du parcours : le choix suit la commande jusqu'au ticket,
 * exigence EF-033, et la cuisine en dépend autant que l'emballage.
 *
 * Deux actions, et non un groupe de boutons radio suivi d'un bouton de
 * validation. Le client ne compare pas deux options à la manière d'un
 * formulaire : il sait déjà s'il reste ou s'il emporte. Un choix qui avance
 * aussitôt épargne un appui à tout le monde, et l'écran précédent reste
 * accessible par le retour de la mise en page, exigence EF-002.
 *
 * Le mode est écrit dans la commande en cours, qui le persiste pour la durée de
 * la session, exigence EF-027. L'écran ne touche ni le stockage ni le domaine :
 * il appelle `useDraft`.
 *
 * Chaque choix porte sa conséquence en toutes lettres plutôt qu'un seul mot.
 * Rien n'est distingué par la couleur : les deux cibles sont identiques, et
 * seuls leurs libellés les séparent, exigence EF-044.
 */

import type { ServiceMode } from '../domain/types'

const CHOIX: readonly { mode: ServiceMode; libelle: string; consequence: string }[] = [
  { mode: 'eat-in', libelle: 'Sur place', consequence: 'Servi sur un plateau' },
  { mode: 'takeaway', libelle: 'À emporter', consequence: 'Emballé pour la route' },
]

const { definirMode } = useDraft()

const choisir = async (mode: ServiceMode) => {
  definirMode(mode)
  await navigateTo('/carte')
}

useHead({ title: 'Mode de consommation — Bun & Co' })
</script>

<template>
  <main class="o-container o-stack c-mode">
    <h1>Sur place ou à emporter ?</h1>

    <p>Votre choix suit la commande jusqu'au ticket.</p>

    <div class="c-mode__choices">
      <button
        v-for="choix of CHOIX"
        :key="choix.mode"
        type="button"
        class="c-button c-button--primary c-mode__choice"
        @click="choisir(choix.mode)"
      >
        {{ choix.libelle }}
        <span class="c-mode__consequence">{{ choix.consequence }}</span>
      </button>
    </div>
  </main>
</template>
