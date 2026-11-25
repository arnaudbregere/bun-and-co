<script setup lang="ts">
/**
 * Région d'annonce.
 *
 * Deux modes, une seule mécanique. Le mode courtois sert les changements du
 * panier, exigence EF-040 ; le mode alerte sert les refus et les erreurs,
 * exigence EF-041. Les règles d'usage sont identiques et faciles à manquer :
 * un seul composant les tient.
 *
 * Trois pièges, et leur parade.
 *
 * La région doit exister dans le document avant d'avoir du contenu. Un lecteur
 * d'écran observe un nœud déjà présent ; une région créée en même temps que son
 * premier message n'annonce pas ce message.
 *
 * Le contenu est masqué par `.u-visually-hidden`, jamais par `display: none`,
 * qui le retirerait aussi de l'arbre d'accessibilité — donc des annonces.
 *
 * Un même message envoyé deux fois de suite ne change pas le texte du nœud, et
 * n'est donc pas relu. Le composant vide la région, attend un cycle de rendu,
 * puis écrit : la seconde annonce part comme la première. « Quantité maximale
 * atteinte » doit se répéter si le client insiste.
 */

const { message = '', mode = 'polite' } = defineProps<{
  message?: string
  mode?: 'polite' | 'alert'
}>()

const annonce = ref('')

watch(
  () => message,
  async (nouveau) => {
    annonce.value = ''

    if (nouveau === '') return

    await nextTick()
    annonce.value = nouveau
  },
  { immediate: true },
)
</script>

<template>
  <p
    class="u-visually-hidden"
    :role="mode === 'alert' ? 'alert' : 'status'"
    :aria-live="mode === 'alert' ? 'assertive' : 'polite'"
  >
    {{ annonce }}
  </p>
</template>
