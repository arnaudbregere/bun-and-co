// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from '../../../app/components/atoms/StatusBadge.vue'

describe('atome Étiquette d’état', () => {
  it.each([
    ['unavailable', 'Indisponible'],
    ['included', 'Inclus'],
    ['surcharge', 'Supplément'],
  ] as const)('rend l’état %s avec le libellé %s', (state, libelle) => {
    const wrapper = mount(StatusBadge, { props: { state } })

    expect(wrapper.text()).toBe(libelle)
  })

  it('porte la classe de son état', () => {
    const wrapper = mount(StatusBadge, { props: { state: 'unavailable' } })

    expect(wrapper.classes()).toContain('c-status--unavailable')
  })

  it('reste du texte, jamais une pastille seule', () => {
    const wrapper = mount(StatusBadge, { props: { state: 'included' } })

    // Le critère WCAG 1.4.1 interdit de porter une information par la couleur
    // seule. Un libellé vide la porterait par la couleur seule.
    expect(wrapper.text().trim().length).toBeGreaterThan(0)
  })

  it('n’est pas interactive et ne prend pas le focus', () => {
    const wrapper = mount(StatusBadge, { props: { state: 'surcharge' } })

    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.attributes('tabindex')).toBeUndefined()
    expect(wrapper.attributes('role')).toBeUndefined()
  })
})
