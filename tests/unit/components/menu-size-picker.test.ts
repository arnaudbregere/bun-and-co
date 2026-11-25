// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MenuSizePicker from '../../../app/components/molecules/MenuSizePicker.vue'
import PriceTag from '../../../app/components/atoms/PriceTag.vue'
import StatusBadge from '../../../app/components/atoms/StatusBadge.vue'
import { MENU_SIZE_RULES } from '../../../app/domain/menu-rules'
import { cents } from '../../../app/domain/money'
import { toProductId, type MenuSizeRule } from '../../../app/domain/types'

const REGLES = [MENU_SIZE_RULES.M, MENU_SIZE_RULES.L, MENU_SIZE_RULES.XL]

const monter = (props: Record<string, unknown> = {}) =>
  mount(MenuSizePicker, {
    props: { legend: 'Taille du menu', rules: REGLES, modelValue: 'M', ...props },
    global: { components: { PriceTag, StatusBadge } },
  })

const radios = (wrapper: ReturnType<typeof monter>) => wrapper.findAll('input[type="radio"]')

describe('molécule Sélecteur de taille de menu', () => {
  it('nomme le groupe et propose une taille par règle reçue', () => {
    const wrapper = monter()

    expect(wrapper.element.tagName).toBe('FIELDSET')
    expect(wrapper.find('legend').text()).toBe('Taille du menu')
    expect(wrapper.findAll('.c-menu-size__size').map((item) => item.text())).toEqual([
      'M',
      'L',
      'XL',
    ])
  })

  it('repose sur des boutons radio natifs partageant un nom', () => {
    const wrapper = monter()

    // Le navigateur donne alors l'exclusivité du choix, les flèches et un seul
    // arrêt de tabulation, qu'il faudrait sinon réécrire.
    const noms = radios(wrapper).map((item) => item.attributes('name'))
    expect(noms).toHaveLength(3)
    expect(new Set(noms).size).toBe(1)
    expect(noms[0]).toBeTruthy()
  })

  it('n’écrit aucun forfait ni aucun format', () => {
    // Une grille inventée : si le composant affichait la vraie, c'est qu'il la
    // porte au lieu de la recevoir.
    const inventee: MenuSizeRule = {
      size: 'M',
      surchargeCents: cents(123),
      sideFormat: 'large',
      drinkFormat: 'large',
      includesDessert: false,
      defaultSideId: toProductId('fries-large'),
      defaultDrinkId: toProductId('soda-50'),
    }

    const wrapper = monter({ rules: [inventee] })

    expect(wrapper.text()).toContain('1,23')
    expect(wrapper.text()).toContain('Accompagnement grand format, boisson grand format')
    expect(wrapper.text()).not.toContain('4,00')
  })

  it('annonce ce que la taille comprend, pas seulement sa lettre', () => {
    const wrapper = monter()

    // L'étiquette enveloppe la lettre, le forfait et les formats : le nom
    // accessible du bouton radio les reprend tous.
    const premiere = wrapper.findAll('.c-menu-size__option')[0]?.text() ?? ''
    expect(premiere).toContain('M')
    expect(premiere).toContain('4,00')
    expect(premiere).toContain('Accompagnement petit format, boisson petit format')
  })

  it('signale le dessert de la taille XL', () => {
    const wrapper = monter()
    const options = wrapper.findAll('.c-menu-size__option')

    // Exigence EF-014 : la taille XL inclut un dessert au choix.
    expect(options[2]?.text()).toContain('Dessert')
    expect(options[2]?.text()).toContain('Inclus')
    expect(options[0]?.text()).not.toContain('Dessert')
  })

  it('coche la taille reçue', () => {
    const wrapper = monter({ modelValue: 'L' })

    expect(radios(wrapper).map((item) => (item.element as HTMLInputElement).checked)).toEqual([
      false,
      true,
      false,
    ])
  })

  it('émet la taille choisie', async () => {
    const wrapper = monter()

    await radios(wrapper)[2]?.setValue(true)

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['XL'])
  })
})
