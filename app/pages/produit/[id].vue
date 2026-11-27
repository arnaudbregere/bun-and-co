<script setup lang="ts">
/**
 * Fiche produit, demande #123.
 *
 * Le détail d'un produit : sa photographie, ses allergènes, ses retraits sans
 * frais, ses suppléments payants, et son ajout au panier.
 *
 * La route est dynamique dans les sources, jamais à l'exécution : les
 * vingt-sept fiches sont rendues au build, listées dans
 * `nitro.prerender.routes` à partir de la carte elle-même. L'hébergement est
 * statique, et aucun processus ne répondrait à une fiche absente du rendu.
 *
 * Aucun prix n'est calculé ici. `unitPriceCents` et `extrasTotalCents`
 * appartiennent au domaine, et l'ajout au panier passe par `useDraft`, qui
 * délègue lui-même à `app/domain/cart.ts`. La page compose, elle ne décide
 * pas.
 *
 * Le prix affiché suit les options, et chaque changement est annoncé par la
 * région courtoise de l'application : un client qui coche un supplément sans
 * voir l'écran doit savoir ce que sa commande lui coûte désormais.
 *
 * La barre de panier suit ici comme à la carte, exigences EF-005 et EF-003 : le
 * client atteint son panier sans perdre la fiche qu'il consulte.
 */

import type { MenuDraft } from '../../components/organisms/MenuComposer.vue'
import { findProduct } from '../../domain/catalogue'
import { MENU_SIZE_RULES } from '../../domain/menu-rules'
import { ZERO_CENTS } from '../../domain/money'
import { extrasTotalCents, unitPriceCents } from '../../domain/pricing'
import { toProductId, type Allergen, type MenuComposition } from '../../domain/types'
import { formatEuros } from '../../utils/format-euros'

const route = useRoute()

const identifiant = computed(() => toProductId(String(route.params.id)))

const { produits } = useCatalogue()
const { ajouter, articles, totalCentimes } = useDraft()
const { annoncer, alerter } = useAnnonces()
const { visuelDe } = useVisuels()

const produit = computed(() => findProduct(produits.value, identifiant.value))

/** Identifiants des ingrédients retirés, exigence EF-017. */
const retires = ref<readonly string[]>([])

/** Identifiants des suppléments retenus, exigence EF-018. */
const ajoutes = ref<readonly string[]>([])

const personnalisation = computed(() => ({
  removedIds: retires.value,
  extraIds: ajoutes.value,
}))

/** Un menu se compose à partir d'un burger, et de lui seul. */
const composable = computed(() => produit.value?.category === 'burgers')

const enMenu = ref(false)

const composition = ref<MenuDraft>({ size: 'M' })

/**
 * Étape de la composition qui manque encore, nommée pour être dite au client,
 * exigence EF-016. « Formulaire invalide » n'indique pas quoi faire.
 */
const etapeManquante = computed(() => {
  if (!enMenu.value) return undefined

  const { sideId, drinkId, dessertId } = composition.value

  if (sideId === undefined) return 'un accompagnement'
  if (drinkId === undefined) return 'une boisson'
  if (MENU_SIZE_RULES[composition.value.size].includesDessert && dessertId === undefined) {
    return 'un dessert'
  }

  return undefined
})

/**
 * Composition complète, ou `undefined` tant qu'il manque une étape.
 *
 * Le domaine refuserait une composition partielle en levant : la page ne la lui
 * soumet pas, et dit plutôt ce qui manque.
 */
const menu = computed<MenuComposition | undefined>(() => {
  if (!enMenu.value || etapeManquante.value !== undefined) return undefined

  const { size, sideId, drinkId, dessertId } = composition.value
  if (sideId === undefined || drinkId === undefined) return undefined

  return { size, sideId, drinkId, ...(dessertId === undefined ? {} : { dessertId }) }
})

const supplementsCentimes = computed(() =>
  produit.value === undefined
    ? ZERO_CENTS
    : extrasTotalCents(produit.value, { removedIds: [], extraIds: ajoutes.value }),
)

const prixCentimes = computed(() =>
  produit.value === undefined
    ? ZERO_CENTS
    : unitPriceCents(produit.value, {
        customisation: personnalisation.value,
        ...(menu.value === undefined ? {} : { menu: menu.value }),
      }),
)

/**
 * Allergènes apportés par les suppléments retenus.
 *
 * Ils sont présentés à part : le client qui retire le supplément retire aussi
 * l'allergène, ce qu'une liste fondue en une seule ne dirait pas.
 */
const allergenesDesSupplements = computed<readonly Allergen[]>(() => {
  const choisis = produit.value?.extras.filter((extra) => ajoutes.value.includes(extra.id)) ?? []
  return choisis.flatMap((extra) => extra.allergens)
})

const optionsDeRetrait = computed(() =>
  (produit.value?.removables ?? []).map((retrait) => ({ id: retrait.id, label: retrait.label })),
)

const optionsDeSupplement = computed(() =>
  (produit.value?.extras ?? []).map((extra) => ({
    id: extra.id,
    label: extra.label,
    priceCents: extra.priceCents,
  })),
)

// Le prix est annoncé à chaque changement d'option, et jamais au premier rendu :
// annoncer un prix que personne n'a modifié interromprait la lecture de la
// fiche pour redire ce qui est déjà à l'écran.
watch(prixCentimes, (montant) => {
  annoncer(`Prix mis à jour : ${formatEuros(montant)}.`)
})

const ajouterAuPanier = async () => {
  const reference = produit.value
  if (reference === undefined || !reference.available) return

  // Exigence EF-016 : un menu incomplet est refusé, et le refus nomme l'étape
  // qui manque. Exigence EF-041 : il passe par la région d'alerte.
  const manque = etapeManquante.value
  if (manque !== undefined) {
    alerter(`Menu incomplet : choisissez ${manque}.`)
    return
  }

  // L'ajout est annoncé par `useDraft`, qui connaît l'état du panier après
  // l'opération. La fiche ne redit rien.
  if (
    ajouter({
      productId: reference.id,
      customisation: personnalisation.value,
      ...(menu.value === undefined ? {} : { menu: menu.value }),
    })
  ) {
    await navigateTo('/carte')
  }
}

useHead({ title: () => `${produit.value?.name ?? 'Produit'} — Bun & Co` })
</script>

<template>
  <main class="o-container o-stack c-product">
    <template v-if="produit === undefined">
      <h1>Produit introuvable</h1>

      <p>Cette référence ne figure pas à la carte.</p>

      <p>
        <NuxtLink class="c-button c-button--primary" to="/carte">Revenir à la carte</NuxtLink>
      </p>
    </template>

    <template v-else>
      <h1>{{ produit.name }}</h1>

      <ProductImage :src="visuelDe(produit.id)?.large ?? ''" alt="" loading="eager" />

      <p class="c-product__price">
        <PriceTag :amount-cents="prixCentimes" variant="total" />
      </p>

      <section class="o-stack o-stack--tight" aria-labelledby="titre-allergenes">
        <h2 id="titre-allergenes">Allergènes</h2>

        <AllergenList :allergens="produit.allergens" :extra-allergens="allergenesDesSupplements" />
      </section>

      <OptionGroup
        v-if="optionsDeRetrait.length > 0"
        v-model="retires"
        legend="Retirer un ingrédient"
        :options="optionsDeRetrait"
      />

      <OptionGroup
        v-if="optionsDeSupplement.length > 0"
        v-model="ajoutes"
        legend="Ajouter un supplément"
        :options="optionsDeSupplement"
        :total-cents="supplementsCentimes"
      />

      <template v-if="composable">
        <fieldset class="c-menu__group">
          <legend class="c-menu__legend">Formule</legend>

          <label class="c-menu__option">
            <input
              class="c-menu__input"
              type="radio"
              name="formule"
              value="seul"
              :checked="!enMenu"
              @change="enMenu = false"
            />
            <span class="c-menu__label">Le burger seul</span>
          </label>

          <label class="c-menu__option">
            <input
              class="c-menu__input"
              type="radio"
              name="formule"
              value="menu"
              :checked="enMenu"
              @change="enMenu = true"
            />
            <span class="c-menu__label">En menu</span>
          </label>
        </fieldset>

        <MenuComposer v-if="enMenu" v-model="composition" :products="produits" />

        <p v-if="etapeManquante !== undefined" class="c-product__missing">
          Il reste {{ etapeManquante }} à choisir pour composer votre menu.
        </p>
      </template>

      <p v-if="!produit.available">
        Ce produit est indisponible aujourd'hui. Choisissez-en un autre à la carte.
      </p>

      <p>
        <button
          type="button"
          class="c-button c-button--primary c-product__add"
          :aria-disabled="produit.available ? undefined : 'true'"
          @click="ajouterAuPanier"
        >
          Ajouter au panier
          <span class="c-product__add-price">{{ formatEuros(prixCentimes) }}</span>
        </button>
      </p>

      <CartSummary
        :item-count="articles"
        :total-cents="totalCentimes"
        @open="navigateTo('/panier')"
      />
    </template>
  </main>
</template>
