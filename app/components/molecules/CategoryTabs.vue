<script setup lang="ts">
/**
 * Onglets de catégories de la carte.
 *
 * Le choix d'une catégorie ne change pas d'écran, exigence EF-006 : la barre et
 * le contenu qu'elle commande restent sur la même page. Le motif d'onglets du
 * guide ARIA décrit exactement cette situation, et un lecteur d'écran y annonce
 * « onglet 3 sur 6, sélectionné », ce qu'une liste de boutons ne dirait pas.
 *
 * Le composant rend aussi le panneau, par un emplacement. Les identifiants qui
 * lient un onglet à son panneau — `aria-controls` dans un sens,
 * `aria-labelledby` dans l'autre — seraient sinon à reconstruire dans l'écran
 * appelant, qui devrait connaître la façon dont ils sont formés ici. Un seul
 * endroit les écrit.
 *
 * La sélection suit le focus : les flèches changent d'onglet et affichent sa
 * catégorie sans appui supplémentaire. Le guide ARIA réserve l'activation
 * manuelle aux panneaux coûteux à produire ; ici la carte est déjà chargée, et
 * exiger un second appui ne ferait qu'allonger le parcours clavier.
 *
 * Le composant ne connaît pas les catégories : il reçoit sa liste. La carte en
 * compte six, dont « Menus » qui n'est pas une catégorie de produit mais une
 * entrée de navigation, et cet écart appartient à l'écran, pas à la barre.
 */

export interface CategoryTab {
  /** Identifiant transmis tel quel par `v-model`. */
  readonly id: string
  readonly label: string
}

const { tabs, label } = defineProps<{
  tabs: readonly CategoryTab[]
  /** Nom de la barre d'onglets, annoncé avant son premier onglet. */
  label: string
}>()

const selection = defineModel<string>({ required: true })

const identifiant = useId()
const idOnglet = (id: string) => `${identifiant}-onglet-${id}`
const idPanneau = `${identifiant}-panneau`

const rangCourant = computed(() => tabs.findIndex((onglet) => onglet.id === selection.value))

// Lorsque la sélection reçue ne figure pas dans la liste, le premier onglet
// tient le rôle de l'onglet courant : une barre dont aucun onglet n'est
// atteignable enfermerait le focus, et un panneau qui désigne une étiquette
// absente n'a plus de nom.
const rangRetenu = computed(() => (rangCourant.value === -1 ? 0 : rangCourant.value))

// Un seul onglet est dans le parcours de tabulation. Sans cela, six arrêts
// précèdent la carte, et le client au clavier traverse la navigation à chaque
// écran.
const idEtiquettePanneau = computed(() => {
  const courant = tabs[rangRetenu.value]
  return courant === undefined ? undefined : idOnglet(courant.id)
})

const DEPLACEMENTS: Readonly<Record<string, number>> = {
  ArrowRight: 1,
  ArrowLeft: -1,
}

// La touche est écoutée sur l'onglet et non sur la barre : c'est l'onglet qui
// reçoit le focus, et un conteneur muni d'un gestionnaire de clavier mais
// jamais focalisable est un défaut que la règle `interactive-supports-focus`
// signale à juste titre.
const deplacer = (event: KeyboardEvent, rang: number) => {
  const barre = (event.currentTarget as HTMLElement).closest('[role="tablist"]')
  const boutons = [...(barre?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [])]
  const cible = boutons[rang]

  if (cible === undefined) return

  event.preventDefault()
  selection.value = tabs[rang]?.id ?? selection.value
  cible.focus()
}

const onKeydown = (event: KeyboardEvent) => {
  const depart = rangRetenu.value
  const pas = DEPLACEMENTS[event.key]

  // Les flèches tournent en boucle : depuis le dernier onglet, la droite revient
  // au premier. Le guide ARIA le recommande pour une barre courte, où le retour
  // coûte moins que six appuis en sens inverse.
  if (pas !== undefined) {
    deplacer(event, (depart + pas + tabs.length) % tabs.length)
    return
  }

  if (event.key === 'Home') deplacer(event, 0)
  if (event.key === 'End') deplacer(event, tabs.length - 1)
}
</script>

<template>
  <div class="c-tabs">
    <div class="c-tabs__list" role="tablist" :aria-label="label">
      <button
        v-for="(onglet, rang) of tabs"
        :id="idOnglet(onglet.id)"
        :key="onglet.id"
        type="button"
        role="tab"
        class="c-tabs__tab"
        :aria-selected="onglet.id === selection ? 'true' : 'false'"
        :aria-controls="idPanneau"
        :tabindex="rang === rangRetenu ? undefined : -1"
        @click="selection = onglet.id"
        @keydown="onKeydown"
      >
        {{ onglet.label }}
      </button>
    </div>

    <div
      :id="idPanneau"
      role="tabpanel"
      class="c-tabs__panel"
      :aria-labelledby="idEtiquettePanneau"
    >
      <slot :selected="selection" />
    </div>
  </div>
</template>
