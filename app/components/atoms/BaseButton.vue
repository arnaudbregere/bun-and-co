<script setup lang="ts">
/**
 * Bouton de la borne.
 *
 * Trois variantes, une seule mécanique. Le composant n'affiche pas d'affordance
 * au survol : il n'y a pas de survol sur un écran tactile, et un état qui ne se
 * déclenche jamais trompe la relecture.
 *
 * L'état indisponible passe par `aria-disabled`, et non par l'attribut
 * `disabled`. Un bouton `disabled` sort du parcours de tabulation : le client
 * qui navigue au clavier ne le rencontre pas, n'apprend pas qu'il existe, et
 * n'entend donc pas pourquoi l'action est refusée. Le critère WCAG 3.3.1 veut
 * l'inverse. La raison du refus est passée par `reason`, et le composant appelant
 * l'annonce.
 */

type Variant = 'primary' | 'secondary' | 'quiet'

const {
  variant = 'primary',
  type = 'button',
  disabled = false,
  reason = '',
} = defineProps<{
  variant?: Variant
  type?: 'button' | 'submit'
  disabled?: boolean
  /** Raison du refus, annoncée lorsque le bouton est indisponible. */
  reason?: string
}>()

const emit = defineEmits<{ activate: [] }>()

const onClick = (event: MouseEvent) => {
  // `aria-disabled` n'empêche pas l'activation : c'est une annonce, pas un
  // verrou. Le verrou est ici.
  if (disabled) {
    event.preventDefault()
    return
  }

  emit('activate')
}
</script>

<template>
  <button
    :type="type"
    class="c-button"
    :class="`c-button--${variant}`"
    :aria-disabled="disabled ? 'true' : undefined"
    @click="onClick"
  >
    <span class="c-button__label"><slot /></span>
    <span v-if="disabled && reason" class="c-button__reason">{{ reason }}</span>
  </button>
</template>
