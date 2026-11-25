// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import OptionGroup from '../../../app/components/molecules/OptionGroup.vue'
import OptionToggle from '../../../app/components/atoms/OptionToggle.vue'
import PriceTag from '../../../app/components/atoms/PriceTag.vue'
import { cents } from '../../../app/domain/money'

const RETRAITS = [
  { id: 'onions', label: 'Sans oignons' },
  { id: 'pickles', label: 'Sans cornichons' },
] as const

const SUPPLEMENTS = [
  { id: 'bacon', label: 'Bacon', priceCents: cents(120) },
  { id: 'cheddar', label: 'Cheddar', priceCents: cents(80) },
] as const

const monter = (props: Record<string, unknown> = {}) =>
  mount(OptionGroup, {
    props: { legend: 'Retraits', options: RETRAITS, modelValue: [], ...props },
    global: { components: { OptionToggle, PriceTag } },
  })

const cases = (wrapper: ReturnType<typeof monter>) => wrapper.findAll('input[type="checkbox"]')

describe('molécule Groupe d’options', () => {
  it('nomme le groupe par une légende', () => {
    const wrapper = monter()

    // Sans elle, « bacon » suit « sans cornichons » dans la même liste plate,
    // et rien ne dit que l'un retire et que l'autre ajoute.
    expect(wrapper.element.tagName).toBe('FIELDSET')
    expect(wrapper.find('legend').text()).toBe('Retraits')
  })

  it('rend une option par entrée reçue, dans l’ordre reçu', () => {
    const wrapper = monter()

    expect(wrapper.findAll('.c-option__label').map((item) => item.text())).toEqual([
      'Sans oignons',
      'Sans cornichons',
    ])
  })

  it('ne produit pas de groupe vide', () => {
    const wrapper = monter({ options: [] })

    // Un produit sans personnalisation n'annonce pas un groupe de zéro option.
    expect(wrapper.find('fieldset').exists()).toBe(false)
  })

  it('reflète la sélection reçue', () => {
    const wrapper = monter({ modelValue: ['pickles'] })

    expect(cases(wrapper).map((item) => (item.element as HTMLInputElement).checked)).toEqual([
      false,
      true,
    ])
  })

  it('ajoute l’option cochée à la sélection', async () => {
    const wrapper = monter({ modelValue: ['onions'] })

    await cases(wrapper)[1]?.setValue(true)

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['onions', 'pickles']])
  })

  it('retire l’option décochée de la sélection', async () => {
    const wrapper = monter({ modelValue: ['onions', 'pickles'] })

    await cases(wrapper)[0]?.setValue(false)

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['pickles']])
  })

  it('remplace la sélection au lieu de la modifier sur place', async () => {
    const recue = ['onions']
    const wrapper = monter({ modelValue: recue })

    await cases(wrapper)[1]?.setValue(true)

    // Une propriété mutée changerait sous les pieds de l'appelant, qui n'en
    // serait pas averti.
    expect(recue).toEqual(['onions'])
  })

  describe('suppléments payants', () => {
    it('affiche le prix de chaque supplément', () => {
      const wrapper = monter({ legend: 'Suppléments', options: SUPPLEMENTS })

      // Le séparateur avant le symbole est une espace insécable, dont le point
      // de code dépend de la version d'ICU du navigateur.
      const prix = wrapper.findAll('.c-option__price').map((item) => item.text())
      expect(prix[0]).toMatch(/^1,20\s€$/)
      expect(prix[1]).toMatch(/^0,80\s€$/)
    })

    it('n’affiche aucun prix sur un retrait, qui est sans frais', () => {
      const wrapper = monter()

      expect(wrapper.find('.c-option__price').exists()).toBe(false)
    })

    it('affiche le total qu’on lui donne, sans rien additionner', () => {
      const wrapper = monter({
        legend: 'Suppléments',
        options: SUPPLEMENTS,
        modelValue: ['bacon', 'cheddar'],
        totalCents: cents(200),
      })

      // Le total vient de `extrasTotalCents`. Deux endroits qui additionnent
      // les mêmes montants finissent par ne plus être d'accord.
      expect(wrapper.find('.c-option-group__total').text()).toContain('2,00')
    })

    it('n’affiche aucun total tant qu’on ne lui en donne pas', () => {
      const wrapper = monter({ legend: 'Suppléments', options: SUPPLEMENTS })

      expect(wrapper.find('.c-option-group__total').exists()).toBe(false)
    })
  })
})
