// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CategoryTabs from '../../../app/components/molecules/CategoryTabs.vue'

const ONGLETS = [
  { id: 'burgers', label: 'Burgers' },
  { id: 'menus', label: 'Menus' },
  { id: 'chicken', label: 'Poulet' },
  { id: 'sides', label: 'Accompagnements' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'drinks', label: 'Boissons' },
] as const

const monter = (props: Record<string, unknown> = {}) =>
  mount(CategoryTabs, {
    props: { tabs: ONGLETS, label: 'Catégories de la carte', modelValue: 'burgers', ...props },
    attachTo: document.body,
  })

const onglets = (wrapper: ReturnType<typeof monter>) => wrapper.findAll('[role="tab"]')

// La touche est écoutée sur l'onglet courant, seul élément de la barre à
// recevoir le focus.
const appuyer = (wrapper: ReturnType<typeof monter>, key: string) =>
  wrapper.find('[role="tab"][aria-selected="true"]').trigger('keydown', { key })

const derniereSelection = (wrapper: ReturnType<typeof monter>) =>
  wrapper.emitted('update:modelValue')?.at(-1)

describe('molécule Onglets de catégories', () => {
  it('rend les six catégories de la carte en onglets', () => {
    const wrapper = monter()

    // Exigence EF-006 : six catégories, dont « Menus » qui n'est pas une
    // catégorie de produit mais une entrée de navigation.
    expect(onglets(wrapper).map((onglet) => onglet.text())).toEqual([
      'Burgers',
      'Menus',
      'Poulet',
      'Accompagnements',
      'Desserts',
      'Boissons',
    ])
  })

  it('nomme la barre d’onglets', () => {
    const wrapper = monter()

    expect(wrapper.find('[role="tablist"]').attributes('aria-label')).toBe('Catégories de la carte')
  })

  it('annonce l’onglet courant comme sélectionné, et lui seul', () => {
    const wrapper = monter({ modelValue: 'desserts' })

    expect(onglets(wrapper).map((onglet) => onglet.attributes('aria-selected'))).toEqual([
      'false',
      'false',
      'false',
      'false',
      'true',
      'false',
    ])
  })

  it('ne laisse qu’un onglet dans le parcours de tabulation', () => {
    const wrapper = monter({ modelValue: 'chicken' })

    // Six arrêts avant la carte feraient traverser la navigation au client au
    // clavier à chaque écran.
    expect(onglets(wrapper).map((onglet) => onglet.attributes('tabindex'))).toEqual([
      '-1',
      '-1',
      undefined,
      '-1',
      '-1',
      '-1',
    ])
  })

  it('lie chaque onglet au panneau, et le panneau à l’onglet courant', () => {
    const wrapper = monter({ modelValue: 'menus' })
    const panneau = wrapper.find('[role="tabpanel"]')
    const identifiantPanneau = panneau.attributes('id')

    expect(identifiantPanneau).toBeTruthy()
    for (const onglet of onglets(wrapper)) {
      expect(onglet.attributes('aria-controls')).toBe(identifiantPanneau)
    }

    expect(panneau.attributes('aria-labelledby')).toBe(onglets(wrapper)[1]?.attributes('id'))
  })

  it('sélectionne la catégorie appuyée', async () => {
    const wrapper = monter()

    await onglets(wrapper)[3]?.trigger('click')

    expect(derniereSelection(wrapper)).toEqual(['sides'])
  })

  describe('navigation aux flèches', () => {
    it('change d’onglet sans appui supplémentaire', async () => {
      const wrapper = monter({ modelValue: 'menus' })

      // La sélection suit le focus : le guide ARIA réserve l'activation
      // manuelle aux panneaux coûteux à produire.
      await appuyer(wrapper, 'ArrowRight')
      expect(derniereSelection(wrapper)).toEqual(['chicken'])

      await appuyer(wrapper, 'ArrowLeft')
      expect(derniereSelection(wrapper)).toEqual(['menus'])
    })

    it('tourne en boucle aux deux extrémités', async () => {
      const wrapper = monter({ modelValue: 'drinks' })

      await appuyer(wrapper, 'ArrowRight')
      expect(derniereSelection(wrapper)).toEqual(['burgers'])

      await appuyer(wrapper, 'ArrowLeft')
      expect(derniereSelection(wrapper)).toEqual(['drinks'])
    })

    it('atteint le premier et le dernier onglet par Home et End', async () => {
      const wrapper = monter({ modelValue: 'sides' })

      await appuyer(wrapper, 'End')
      expect(derniereSelection(wrapper)).toEqual(['drinks'])

      await appuyer(wrapper, 'Home')
      expect(derniereSelection(wrapper)).toEqual(['burgers'])
    })

    it('donne le focus à l’onglet atteint', async () => {
      const wrapper = monter()

      await appuyer(wrapper, 'ArrowRight')

      // Sans déplacement du focus, la touche suivante repartirait de l'onglet
      // précédent : le parcours aux flèches ne progresserait pas.
      expect(document.activeElement).toBe(onglets(wrapper)[1]?.element)
    })

    it('laisse passer les touches qu’elle ne traite pas', async () => {
      const wrapper = monter()

      await appuyer(wrapper, 'ArrowDown')

      // La barre est horizontale : les flèches verticales appartiennent au
      // défilement de la page.
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  it('garde un onglet atteignable lorsque la sélection reçue est inconnue', () => {
    const wrapper = monter({ modelValue: 'inconnue' })

    // Une barre dont aucun onglet n'est dans la tabulation enfermerait le
    // focus, et un panneau qui désigne une étiquette absente n'a plus de nom.
    expect(onglets(wrapper)[0]?.attributes('tabindex')).toBeUndefined()
    expect(wrapper.find('[role="tabpanel"]').attributes('aria-labelledby')).toBe(
      onglets(wrapper)[0]?.attributes('id'),
    )
  })

  it('rend le contenu du panneau et lui passe la catégorie courante', () => {
    const wrapper = mount(CategoryTabs, {
      props: { tabs: ONGLETS, label: 'Catégories de la carte', modelValue: 'drinks' },
      slots: { default: '<p>Contenu : {{ params.selected }}</p>' },
    })

    expect(wrapper.find('[role="tabpanel"]').text()).toBe('Contenu : drinks')
  })
})
