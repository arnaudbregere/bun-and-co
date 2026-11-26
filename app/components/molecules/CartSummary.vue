<script setup lang="ts">
/**
 * Résumé du panier : barre persistante qui porte le nombre d'articles, le
 * total et l'accès au panier.
 *
 * Elle est visible dès l'écran de carte, exigence EF-005, et donne accès au
 * panier depuis la carte comme depuis la fiche produit, exigence EF-003.
 *
 * Le total n'est pas recalculé ici. Il vient de `cartTotalCents` et le nombre
 * d'articles de `itemCount` : la barre affiche ce que le domaine a tarifé, et
 * c'est le même montant qui ira sur le ticket.
 *
 * Un panier vide annonce « Panier vide », et non « 0 article ». Un zéro
 * suivi d'un montant nul se lit comme un prix, pas comme une absence, et
 * l'accès au panier n'aurait rien à montrer.
 *
 * L'accès reste atteignable au clavier lorsqu'il est refusé : `aria-disabled`
 * et sa raison, comme partout ailleurs, exigence EF-026 et critère WCAG 3.3.1.
 *
 * La barre n'annonce rien. L'application porte une région courtoise unique,
 * tenue par `useAnnonces`, et chaque changement du panier y passe déjà par
 * `useDraft`, exigence EF-040. Une seconde annonce depuis la barre dirait deux
 * fois le même ajout.
 *
 * Elle colle au bas du cadre sans en sortir — `position: sticky` et non
 * `fixed` : une barre fixe sort du flux et recouvre le dernier élément de la
 * liste, que le client ne peut alors plus atteindre.
 */

import type { Cents } from '../../domain/money'

const {
  itemCount,
  totalCents,
  label = 'Voir le panier',
  emptyReason = 'Panier vide',
} = defineProps<{
  /** Nombre d'articles, calculé par le domaine. */
  itemCount: number
  /** Total du panier, calculé par le domaine. */
  totalCents: Cents
  /** Libellé du bouton d'accès. */
  label?: string
  /** Raison annoncée lorsque l'accès est refusé. */
  emptyReason?: string
}>()

const emit = defineEmits<{ open: [] }>()

const vide = computed(() => itemCount === 0)

const articles = computed(() =>
  vide.value ? 'Panier vide' : `${itemCount} ${itemCount > 1 ? 'articles' : 'article'}`,
)
</script>

<template>
  <div class="c-cart-summary">
    <p class="c-cart-summary__state">
      <span class="c-cart-summary__count">{{ articles }}</span>
      <PriceTag :amount-cents="totalCents" variant="total" />
    </p>

    <BaseButton :disabled="vide" :reason="emptyReason" @activate="emit('open')">
      {{ label }}
    </BaseButton>
  </div>
</template>
