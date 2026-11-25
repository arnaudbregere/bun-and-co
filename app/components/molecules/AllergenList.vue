<script setup lang="ts">
/**
 * Liste des allergènes d'un produit.
 *
 * Les allergènes sont donnés en texte, exigence EF-008 : un pictogramme d'épi
 * ou de poisson ne nomme rien, et une personne allergique ne devine pas un
 * risque. Aucun symbole n'apparaît donc sans son libellé.
 *
 * Un produit sans allergène porte une mention explicite. Une liste vide se lit
 * comme un oubli de la borne, et personne ne commande sur une absence
 * d'information.
 *
 * Les suppléments retenus apportent leurs propres allergènes, histoire 5 du
 * parcours. Ils sont signalés comme tels : le client qui retire le supplément
 * retire aussi l'allergène, ce qu'une liste fondue en une seule ne dirait pas.
 *
 * La liste est rendue par `<ul>` et non par une suite de paragraphes : un
 * lecteur d'écran annonce alors le nombre d'allergènes avant de les énumérer.
 *
 * Les libellés français vivent ici, et non dans le domaine : le domaine ne
 * connaît pas la langue d'affichage. Il nomme les quatorze catégories du
 * règlement 1169/2011 par des identifiants stables, et cette table les traduit.
 */

import { ALLERGENS, type Allergen } from '../../domain/types'

const LIBELLES: Readonly<Record<Allergen, string>> = {
  gluten: 'Gluten',
  crustaceans: 'Crustacés',
  eggs: 'Œufs',
  fish: 'Poissons',
  peanuts: 'Arachides',
  soy: 'Soja',
  milk: 'Lait',
  nuts: 'Fruits à coque',
  celery: 'Céleri',
  mustard: 'Moutarde',
  sesame: 'Graines de sésame',
  sulphites: 'Anhydride sulfureux et sulfites',
  lupin: 'Lupin',
  molluscs: 'Mollusques',
}

const { allergens, extraAllergens = [] } = defineProps<{
  allergens: readonly Allergen[]
  /** Allergènes apportés par les suppléments retenus, signalés comme tels. */
  extraAllergens?: readonly Allergen[]
}>()

// L'ordre suivi est celui du règlement, et non celui des données reçues : deux
// produits présentent ainsi leurs allergènes communs au même rang, et la
// lecture d'une fiche à l'autre ne demande pas de tout relire.
const lignes = computed(() =>
  ALLERGENS.filter(
    (allergene) => allergens.includes(allergene) || extraAllergens.includes(allergene),
  ).map((allergene) => ({
    allergene,
    libelle: LIBELLES[allergene],
    // Un allergène déjà présent dans le produit n'est pas imputé au
    // supplément : le retirer ne l'enlèverait pas.
    duSupplement: !allergens.includes(allergene),
  })),
)
</script>

<template>
  <p v-if="lignes.length === 0" class="c-allergens__none">
    Aucun allergène des quatorze catégories réglementaires.
  </p>

  <ul v-else class="c-allergens">
    <li v-for="ligne of lignes" :key="ligne.allergene" class="c-allergens__item">
      {{ ligne.libelle }}
      <span v-if="ligne.duSupplement" class="c-allergens__source">apporté par un supplément</span>
    </li>
  </ul>
</template>
