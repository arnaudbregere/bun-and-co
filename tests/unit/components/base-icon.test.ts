// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseIcon from '../../../app/components/atoms/BaseIcon.vue'

const NOMS = ['arrow-left', 'cart', 'plus', 'minus', 'trash', 'alert'] as const

describe('atome Icône', () => {
  it.each(NOMS)('rend le symbole %s avec au moins un tracé', (name) => {
    const wrapper = mount(BaseIcon, { props: { name } })

    expect(wrapper.element.tagName).toBe('svg')
    expect(wrapper.findAll('path').length).toBeGreaterThan(0)
  })

  it('reste décoratif et hors du parcours de tabulation', () => {
    const wrapper = mount(BaseIcon, { props: { name: 'cart' } })

    // L'icône accompagne un libellé : l'annoncer produirait une annonce en
    // double. `focusable="false"` est nécessaire parce que certains navigateurs
    // placent un `<svg>` dans le parcours de tabulation sans cet attribut.
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('focusable')).toBe('false')
  })

  it('garde un gabarit de 24 unités, sur lequel l’épaisseur du trait est réglée', () => {
    const wrapper = mount(BaseIcon, { props: { name: 'plus' } })

    expect(wrapper.attributes('viewBox')).toBe('0 0 24 24')
  })

  it('rend des tracés distincts pour deux symboles distincts', () => {
    const plus = mount(BaseIcon, { props: { name: 'plus' } }).html()
    const minus = mount(BaseIcon, { props: { name: 'minus' } }).html()

    expect(plus).not.toBe(minus)
  })
})
