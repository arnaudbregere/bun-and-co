<script setup lang="ts">
/**
 * Composition d'un menu à partir d'un burger : taille, accompagnement,
 * boisson, et dessert en XL.
 *
 * Les forfaits, les formats et les substitutions ne sont pas écrits ici. Ils
 * viennent de `app/domain/menu-rules.ts`, que ce composant lit : le prix d'une
 * taille, ce qu'elle comprend et ce qui peut en remplacer un composant sont des
 * règles du domaine, exigences EF-011 à EF-015. Les recopier dans un gabarit en
 * ferait une seconde grille, qui divergerait au premier changement.
 *
 * Rien n'est présélectionné hors la taille. Un accompagnement coché d'avance se
 * retrouve dans le panier sans que le client l'ait choisi, et la borne lui aura
 * vendu ce qu'il n'a pas demandé. La taille fait exception : elle commande
 * l'affichage du reste, et M est la plus petite.
 *
 * Le composant ne tarife pas le menu et ne valide rien. Il rend la composition
 * en cours ; l'écran la soumet au domaine, qui refuse si elle est incomplète,
 * exigence EF-016.
 *
 * Les produits sont reçus en propriété : un organisme ne va pas chercher le
 * catalogue lui-même.
 */

import { DRINK_SUBSTITUTIONS, MENU_SIZE_RULES, SIDE_SUBSTITUTIONS } from '../../domain/menu-rules'
import { ZERO_CENTS, type Cents } from '../../domain/money'
import {
  MENU_SIZES,
  type MenuSize,
  type Product,
  type ProductId,
  type Substitution,
} from '../../domain/types'

/**
 * Composition en cours : la taille est toujours connue, le reste s'ajoute.
 *
 * Les champs portent `undefined` plutôt que d'être absents : un changement de
 * taille efface un composant qui n'est plus proposé, et `exactOptionalPropertyTypes`
 * distingue une clé absente d'une clé à `undefined`.
 */
export interface MenuDraft {
  readonly size: MenuSize
  readonly sideId?: ProductId | undefined
  readonly drinkId?: ProductId | undefined
  readonly dessertId?: ProductId | undefined
}

interface Choix {
  readonly id: ProductId
  readonly label: string
  readonly surchargeCents: Cents
}

const { products } = defineProps<{
  /** Carte complète : le composant y lit les noms des composants proposés. */
  products: readonly Product[]
}>()

const composition = defineModel<MenuDraft>({ required: true })

const identifiant = useId()

const regle = computed(() => MENU_SIZE_RULES[composition.value.size])

const regles = computed(() => MENU_SIZES.map((taille) => MENU_SIZE_RULES[taille]))

const nomDe = (id: ProductId) => products.find((produit) => produit.id === id)?.name

/**
 * Composant compris dans le forfait, puis ses substitutions.
 *
 * Un produit absent de la carte est écarté plutôt qu'affiché sans nom : la
 * carte peut retirer une référence qu'une substitution désigne encore.
 */
const choix = (inclus: ProductId, substitutions: readonly Substitution[]): readonly Choix[] =>
  [
    { id: inclus, surchargeCents: ZERO_CENTS },
    ...substitutions.filter((substitution) => substitution.productId !== inclus),
  ]
    .map((entree) => {
      const id = 'productId' in entree ? entree.productId : entree.id
      const label = nomDe(id)
      return label === undefined ? undefined : { id, label, surchargeCents: entree.surchargeCents }
    })
    .filter((entree): entree is Choix => entree !== undefined)

const accompagnements = computed(() => choix(regle.value.defaultSideId, SIDE_SUBSTITUTIONS))

const boissons = computed(() => choix(regle.value.defaultDrinkId, DRINK_SUBSTITUTIONS))

// Le dessert n'a ni composant inclus ni substitution : toute la catégorie est
// proposée, sans supplément, exigence EF-014.
const desserts = computed<readonly Choix[]>(() =>
  products
    .filter((produit) => produit.category === 'desserts')
    .map((produit) => ({ id: produit.id, label: produit.name, surchargeCents: ZERO_CENTS })),
)

const changer = (champ: 'sideId' | 'drinkId' | 'dessertId', valeur: ProductId) => {
  composition.value = { ...composition.value, [champ]: valeur }
}

// Changer de taille change les composants compris dans le forfait : un
// accompagnement retenu qui n'est plus proposé est oublié, plutôt que de
// voyager jusqu'au panier où le domaine le refuserait.
const changerTaille = (taille: MenuSize) => {
  const suivante = MENU_SIZE_RULES[taille]
  const proposes = (liste: readonly Choix[], retenu?: ProductId) =>
    retenu !== undefined && liste.some((entree) => entree.id === retenu) ? retenu : undefined

  composition.value = {
    size: taille,
    sideId: proposes(choix(suivante.defaultSideId, SIDE_SUBSTITUTIONS), composition.value.sideId),
    drinkId: proposes(
      choix(suivante.defaultDrinkId, DRINK_SUBSTITUTIONS),
      composition.value.drinkId,
    ),
    // Une taille qui ne comprend pas de dessert ne garde pas celui d'une
    // taille précédente : le domaine refuse un dessert en trop.
    dessertId: suivante.includesDessert ? composition.value.dessertId : undefined,
  }
}

const taille = computed({
  get: () => composition.value.size,
  set: (valeur: MenuSize) => changerTaille(valeur),
})
</script>

<template>
  <div class="o-stack c-menu">
    <MenuSizePicker v-model="taille" legend="Taille du menu" :rules="regles" />

    <fieldset class="c-menu__group">
      <legend class="c-menu__legend">Accompagnement</legend>

      <label v-for="option of accompagnements" :key="option.id" class="c-menu__option">
        <input
          class="c-menu__input"
          type="radio"
          :name="`${identifiant}-accompagnement`"
          :value="option.id"
          :checked="composition.sideId === option.id"
          @change="changer('sideId', option.id)"
        />

        <span class="c-menu__label">{{ option.label }}</span>

        <PriceTag v-if="option.surchargeCents > 0" :amount-cents="option.surchargeCents" />
        <StatusBadge v-else state="included" />
      </label>
    </fieldset>

    <fieldset class="c-menu__group">
      <legend class="c-menu__legend">Boisson</legend>

      <label v-for="option of boissons" :key="option.id" class="c-menu__option">
        <input
          class="c-menu__input"
          type="radio"
          :name="`${identifiant}-boisson`"
          :value="option.id"
          :checked="composition.drinkId === option.id"
          @change="changer('drinkId', option.id)"
        />

        <span class="c-menu__label">{{ option.label }}</span>

        <PriceTag v-if="option.surchargeCents > 0" :amount-cents="option.surchargeCents" />
        <StatusBadge v-else state="included" />
      </label>
    </fieldset>

    <fieldset v-if="regle.includesDessert" class="c-menu__group">
      <legend class="c-menu__legend">Dessert</legend>

      <label v-for="option of desserts" :key="option.id" class="c-menu__option">
        <input
          class="c-menu__input"
          type="radio"
          :name="`${identifiant}-dessert`"
          :value="option.id"
          :checked="composition.dessertId === option.id"
          @change="changer('dessertId', option.id)"
        />

        <span class="c-menu__label">{{ option.label }}</span>

        <StatusBadge state="included" />
      </label>
    </fieldset>
  </div>
</template>
