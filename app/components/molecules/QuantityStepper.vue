<script setup lang="ts">
/**
 * Sélecteur de quantité d'une ligne de panier.
 *
 * La valeur s'affiche, elle ne se saisit pas : une borne tactile n'a pas de
 * clavier, et un champ libre y ouvre la porte aux quantités absurdes qu'il
 * faudrait ensuite refuser.
 *
 * Les limites ne sont pas écrites ici. Dix unités par ligne et trente articles
 * par commande sont des règles du domaine, exigence EF-025 ; le composant reçoit
 * leur verdict et l'affiche. Les coder ici en ferait une seconde source de
 * vérité, qui divergerait au premier changement de règle.
 *
 * Décrémenter depuis 1 ne produit pas une quantité nulle : le composant demande
 * la suppression de la ligne, et c'est l'écran qui en demande confirmation,
 * exigence EF-024.
 *
 * La valeur n'est pas une région d'annonce. L'appelant possède la sienne, et
 * deux régions annonceraient deux fois le même changement.
 */

const {
  quantity,
  productName,
  increaseDisabledReason = '',
} = defineProps<{
  quantity: number
  /** Nom du produit, pour que chaque bouton dise sur quoi il agit. */
  productName: string
  /** Raison du refus d'augmenter, vide tant que la limite n'est pas atteinte. */
  increaseDisabledReason?: string
}>()

const emit = defineEmits<{ increase: []; decrease: []; remove: [] }>()

const augmentationRefusee = computed(() => increaseDisabledReason !== '')

const augmenter = () => {
  if (augmentationRefusee.value) return
  emit('increase')
}

const diminuer = () => {
  if (quantity <= 1) {
    emit('remove')
    return
  }

  emit('decrease')
}
</script>

<template>
  <div class="c-quantity">
    <BaseButton variant="secondary" @activate="diminuer">
      <BaseIcon :name="quantity <= 1 ? 'trash' : 'minus'" />
      <span class="u-visually-hidden">
        {{
          quantity <= 1
            ? `Retirer ${productName} du panier`
            : `Diminuer la quantité de ${productName}`
        }}
      </span>
    </BaseButton>

    <span class="c-quantity__value">{{ quantity }}</span>

    <BaseButton
      variant="secondary"
      :disabled="augmentationRefusee"
      :reason="increaseDisabledReason"
      @activate="augmenter"
    >
      <BaseIcon name="plus" />
      <span class="u-visually-hidden">Augmenter la quantité de {{ productName }}</span>
    </BaseButton>
  </div>
</template>
