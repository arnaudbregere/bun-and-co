<script setup lang="ts">
/**
 * Panier, demande #125.
 *
 * Le récapitulatif et la correction de la commande : une ligne par
 * personnalisation distincte, exigences EF-020 et EF-021, des quantités
 * modifiables, exigence EF-023, un retrait et un vidage confirmés, exigence
 * EF-024, et un paiement refusé tant que le panier est vide, exigence EF-026.
 *
 * L'écran ne calcule aucun montant. `unitPriceCents` et `lineTotalCents`
 * viennent du domaine, et le total de `useDraft`, qui délègue lui-même à
 * `cartTotalCents`. Une multiplication écrite ici serait une seconde source de
 * vérité, et c'est le ticket qui trancherait.
 *
 * L'écran n'annonce rien non plus. Chaque mutation passe par `useDraft`, qui
 * annonce l'état du panier après l'opération, exigence EF-040. Une annonce
 * ajoutée ici dirait deux fois le même changement.
 *
 * Les deux confirmations partagent un seul dialogue, piloté par `aConfirmer`.
 * Deux instances d'un même modal se disputeraient le focus, et l'élément
 * `<dialog>` natif rend le focus à son déclencheur à la fermeture — c'est ce
 * qui satisfait le critère d'acceptation sur le retour du focus, sans qu'une
 * ligne de code s'en charge.
 *
 * Un panier vide ne laisse pas le client en cul-de-sac : il porte le retour à
 * la carte, parce qu'un écran qui dit seulement « vide » n'indique pas quoi
 * faire ensuite.
 */

import type { LineExtra } from '../components/molecules/CartLineItem.vue'
import { MAX_QUANTITY_PER_LINE } from '../domain/cart'
import { findProduct } from '../domain/catalogue'
import { DRINK_SUBSTITUTIONS, MENU_SIZE_RULES, SIDE_SUBSTITUTIONS } from '../domain/menu-rules'
import { lineTotalCents, unitPriceCents } from '../domain/pricing'
import type { CartLine, CartLineId, Cents, Product, ProductId, Substitution } from '../domain/types'

const { panier, articles, totalCentimes, changerQuantite, retirer, vider } = useDraft()
const { produits } = useCatalogue()

/** Raison du refus de payer, vide dès qu'il y a un article, exigence EF-026. */
const RAISON_PANIER_VIDE = 'Ajoutez un article pour payer'

const vide = computed(() => articles.value === 0)

const nomDe = (id: ProductId) => findProduct(produits.value, id)?.name ?? 'Produit'

/**
 * Composant de menu remplacé, avec son supplément.
 *
 * Le composant compris dans le forfait ne produit aucune mention : le client
 * n'a rien remplacé, et l'écrire allongerait la ligne sans l'informer.
 */
const substitution = (
  choisi: ProductId,
  inclus: ProductId,
  autorisees: readonly Substitution[],
): LineExtra | undefined => {
  if (choisi === inclus) return undefined

  const retenue = autorisees.find((candidate) => candidate.productId === choisi)
  if (retenue === undefined) return undefined

  return { id: choisi, label: nomDe(choisi), priceCents: retenue.surchargeCents }
}

/**
 * Tout ce qu'une ligne doit afficher, assemblé une fois.
 *
 * Les libellés des retraits et des suppléments viennent du produit, et non des
 * identifiants stockés dans le panier : « Sans cornichons » se lit, « Sans
 * pickles » ne se lit pas.
 */
interface LigneAffichee {
  readonly id: CartLineId
  readonly produit: Product
  readonly ligne: CartLine
  readonly menuLabel: string
  readonly removed: readonly string[]
  readonly extras: readonly LineExtra[]
  readonly substitutions: readonly LineExtra[]
  readonly unitPriceCents: Cents
  readonly totalPriceCents: Cents
}

const lignes = computed<readonly LigneAffichee[]>(() =>
  panier.value.lines.flatMap((ligne) => {
    const produit = findProduct(produits.value, ligne.productId)

    // Le catalogue arrive après le premier rendu. Une ligne dont le produit
    // n'est pas encore là est omise, et non rendue avec un prix nul : un
    // montant faux à l'écran est pire qu'une ligne qui apparaît un instant
    // plus tard.
    if (produit === undefined) return []

    const regle = ligne.menu === undefined ? undefined : MENU_SIZE_RULES[ligne.menu.size]

    const remplacements =
      ligne.menu === undefined || regle === undefined
        ? []
        : [
            substitution(ligne.menu.sideId, regle.defaultSideId, SIDE_SUBSTITUTIONS),
            substitution(ligne.menu.drinkId, regle.defaultDrinkId, DRINK_SUBSTITUTIONS),
          ].filter((candidate) => candidate !== undefined)

    return [
      {
        id: ligne.id,
        produit,
        ligne,
        menuLabel: ligne.menu === undefined ? '' : `Menu ${ligne.menu.size}`,
        removed: ligne.customisation.removedIds.map(
          (retrait) =>
            produit.removables.find((candidate) => candidate.id === retrait)?.label ?? retrait,
        ),
        extras: ligne.customisation.extraIds.flatMap((ajout) => {
          const supplement = produit.extras.find((candidate) => candidate.id === ajout)
          return supplement === undefined
            ? []
            : [{ id: supplement.id, label: supplement.label, priceCents: supplement.priceCents }]
        }),
        substitutions: remplacements,
        unitPriceCents: unitPriceCents(produit, ligne),
        totalPriceCents: lineTotalCents(produit, ligne),
      },
    ]
  }),
)

/**
 * Raison du refus d'augmenter une ligne, vide tant que la limite n'est pas
 * atteinte, exigence EF-025.
 *
 * La limite de trente articles par commande n'est pas évaluée ici : le domaine
 * refuse en levant, et `useDraft` annonce son message. Seule la limite de
 * ligne est connue d'avance, et elle sert à désactiver le bouton plutôt qu'à
 * laisser le client le découvrir par un refus.
 */
const refusDAugmenter = (ligne: CartLine) =>
  ligne.quantity >= MAX_QUANTITY_PER_LINE
    ? `Maximum ${MAX_QUANTITY_PER_LINE} unités par article`
    : ''

/**
 * Ce que la confirmation en cours détruira : une ligne nommée, ou le panier
 * entier. `undefined` ferme le dialogue.
 */
type Confirmation =
  | { readonly type: 'ligne'; readonly id: CartLineId; readonly nom: string }
  | { readonly type: 'panier' }

const aConfirmer = ref<Confirmation>()

/**
 * Ouverture du dialogue, tenue à part de ce qu'il confirme.
 *
 * Les deux ne peuvent pas être la même donnée. `ConfirmDialog` ferme avant
 * d'émettre : il écrit `open` à faux, puis émet `confirm`. Si la fermeture
 * effaçait la demande, le gestionnaire la lirait déjà vide et ne retirerait
 * rien. La demande survit donc à la fermeture, et c'est l'ouverture suivante
 * qui la remplace.
 */
const dialogueOuvert = ref(false)

const demanderConfirmation = (demande: Confirmation) => {
  aConfirmer.value = demande
  dialogueOuvert.value = true
}

const titreConfirmation = computed(() =>
  aConfirmer.value?.type === 'panier' ? 'Vider le panier ?' : 'Retirer cet article ?',
)

const messageConfirmation = computed(() =>
  aConfirmer.value === undefined
    ? ''
    : aConfirmer.value.type === 'panier'
      ? 'Tous les articles seront retirés de votre commande.'
      : `${aConfirmer.value.nom} sera retiré de votre commande.`,
)

const actionConfirmation = computed(() =>
  aConfirmer.value === undefined
    ? ''
    : aConfirmer.value.type === 'panier'
      ? 'Vider le panier'
      : `Retirer ${aConfirmer.value.nom}`,
)

const confirmer = () => {
  const demande = aConfirmer.value

  if (demande === undefined) return
  if (demande.type === 'panier') {
    vider()
    return
  }

  retirer(demande.id)
}

useHead({ title: 'Panier — Bun & Co' })
</script>

<template>
  <main class="o-container o-stack c-cart">
    <h1>Panier</h1>

    <!-- Le contenu du panier ne se rend pas sur le serveur, et c'est une
         contrainte, pas une optimisation. La page est écrite au build, où
         aucune session de navigateur n'existe : le serveur rend donc toujours
         un panier vide, alors que le client restaure la commande en cours
         depuis `sessionStorage`. Les deux arbres diffèrent par leur structure,
         et Vue ne rectifie pas un tel écart — il réemploie les nœuds rendus,
         qui gardent alors les attributs de l'autre branche. Sans ce
         `ClientOnly`, la liste s'affiche sans ses classes, donc sans ses
         styles. -->
    <ClientOnly>
      <template v-if="vide">
        <p>Votre panier est vide.</p>

        <p>
          <NuxtLink class="c-button c-button--primary" to="/carte">Revenir à la carte</NuxtLink>
        </p>
      </template>

      <template v-else>
        <ul class="c-cart__lines">
          <CartLineItem
            v-for="affichee of lignes"
            :key="affichee.id"
            :name="affichee.produit.name"
            :quantity="affichee.ligne.quantity"
            :unit-price-cents="affichee.unitPriceCents"
            :total-price-cents="affichee.totalPriceCents"
            :menu-label="affichee.menuLabel"
            :removed="affichee.removed"
            :extras="affichee.extras"
            :substitutions="affichee.substitutions"
            @remove="
              demanderConfirmation({
                type: 'ligne',
                id: affichee.id,
                nom: affichee.produit.name,
              })
            "
          >
            <template #quantity>
              <QuantityStepper
                :quantity="affichee.ligne.quantity"
                :product-name="affichee.produit.name"
                :increase-disabled-reason="refusDAugmenter(affichee.ligne)"
                @increase="changerQuantite(affichee.id, affichee.ligne.quantity + 1)"
                @decrease="changerQuantite(affichee.id, affichee.ligne.quantity - 1)"
                @remove="
                  demanderConfirmation({
                    type: 'ligne',
                    id: affichee.id,
                    nom: affichee.produit.name,
                  })
                "
              />
            </template>
          </CartLineItem>
        </ul>

        <p class="c-cart__clear">
          <BaseButton variant="quiet" @activate="demanderConfirmation({ type: 'panier' })">
            Vider le panier
          </BaseButton>
        </p>

        <p>
          <NuxtLink class="c-button c-button--secondary" to="/carte">
            Continuer ma commande
          </NuxtLink>
        </p>
      </template>
    </ClientOnly>

    <CartSummary
      :item-count="articles"
      :total-cents="totalCentimes"
      label="Payer"
      :empty-reason="RAISON_PANIER_VIDE"
      @open="navigateTo('/paiement')"
    />

    <ConfirmDialog
      v-model:open="dialogueOuvert"
      :title="titreConfirmation"
      :message="messageConfirmation"
      :confirm-label="actionConfirmation"
      @confirm="confirmer"
    />
  </main>
</template>
