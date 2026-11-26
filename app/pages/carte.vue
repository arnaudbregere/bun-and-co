<script setup lang="ts">
/**
 * Carte, demande #122.
 *
 * L'écran central : six entrées de navigation, exigence EF-006, une grille de
 * cartes de produit, exigence EF-007, et la barre de panier qui suit le client
 * à partir d'ici, exigence EF-005.
 *
 * L'écran ne connaît ni la route du catalogue, ni le stockage de la commande :
 * `useCatalogue` rend les produits, `useDraft` tient le panier, `useVisuels`
 * donne les photographies. Il ne calcule aucun prix et ne filtre pas lui-même :
 * `productsOfCategory` appartient au domaine.
 *
 * « Menus » n'est pas une catégorie de produit, et c'est pourquoi l'écart vit
 * ici plutôt que dans la barre d'onglets : un menu se compose à partir d'un
 * burger, demande #124. L'entrée existe parce que le client la cherche à cet
 * endroit, et son panneau dit où aller.
 *
 * Un produit indisponible reste affiché, atteignable au clavier et désactivé,
 * exigence EF-009 : le retirer de la grille laisserait le client chercher ce
 * qu'il a vu la veille.
 */

import type { CategoryTab } from '../components/molecules/CategoryTabs.vue'
import { productsOfCategory } from '../domain/catalogue'
import type { Category, ProductId } from '../domain/types'

/** Les six entrées de l'exigence EF-006, dans l'ordre d'une carte imprimée. */
const ENTREES: readonly CategoryTab[] = [
  { id: 'burgers', label: 'Burgers' },
  { id: 'menus', label: 'Menus' },
  { id: 'chicken', label: 'Poulet' },
  { id: 'sides', label: 'Accompagnements' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'drinks', label: 'Boissons' },
]

const MENUS = 'menus'

const { produits, chargement, erreur, recharger } = useCatalogue()
const { articles, totalCentimes } = useDraft()
const { visuelDe } = useVisuels()

const entree = ref<string>('burgers')

const produitsAffiches = computed(() =>
  entree.value === MENUS ? [] : productsOfCategory(produits.value, entree.value as Category),
)

const ouvrirProduit = (id: ProductId) => navigateTo(`/produit/${id}`)

useHead({ title: 'Carte — Bun & Co' })
</script>

<template>
  <main class="o-container o-stack c-catalogue">
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

    <CategoryTabs v-else v-model="entree" :tabs="ENTREES" label="Catégories de la carte">
      <p v-if="entree === MENUS" class="c-catalogue__note">
        Un menu se compose à partir d'un burger : choisissez-en un, puis ajoutez-y un accompagnement
        et une boisson.
      </p>

      <ul v-else class="c-catalogue__grid">
        <li v-for="produit of produitsAffiches" :key="produit.id">
          <ProductCard
            :name="produit.name"
            :price-cents="produit.priceCents"
            :src="visuelDe(produit.id)?.medium ?? ''"
            :available="produit.available"
            @select="ouvrirProduit(produit.id)"
          />
        </li>
      </ul>
    </CategoryTabs>

    <CartSummary
      :item-count="articles"
      :total-cents="totalCentimes"
      @open="navigateTo('/panier')"
    />
  </main>
</template>
