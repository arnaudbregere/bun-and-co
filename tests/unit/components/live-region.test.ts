// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import LiveRegion from '../../../app/components/atoms/LiveRegion.vue'

describe('atome Région d’annonce', () => {
  it('existe dans le document avant d’avoir un message', () => {
    const wrapper = mount(LiveRegion)

    // Un lecteur d'écran observe un nœud déjà présent. Une région créée en même
    // temps que son premier message n'annonce pas ce message.
    expect(wrapper.element.tagName).toBe('P')
    expect(wrapper.attributes('aria-live')).toBe('polite')
    expect(wrapper.text()).toBe('')
  })

  it('est masquée sans être retirée de l’arbre d’accessibilité', () => {
    const wrapper = mount(LiveRegion, { props: { message: 'Ajouté' } })

    // `display: none` ôterait la région aux lecteurs d'écran en même temps qu'à
    // l'écran.
    expect(wrapper.classes()).toContain('u-visually-hidden')
  })

  it('annonce courtoisement par défaut', async () => {
    const wrapper = mount(LiveRegion, { props: { message: 'Panier mis à jour' } })
    await nextTick()
    await nextTick()

    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.text()).toBe('Panier mis à jour')
  })

  it('alerte lorsqu’on le lui demande', async () => {
    const wrapper = mount(LiveRegion, {
      props: { message: 'Quantité maximale atteinte', mode: 'alert' },
    })
    await nextTick()
    await nextTick()

    expect(wrapper.attributes('role')).toBe('alert')
    expect(wrapper.attributes('aria-live')).toBe('assertive')
    expect(wrapper.text()).toBe('Quantité maximale atteinte')
  })

  it('relit un message identique envoyé deux fois', async () => {
    const wrapper = mount(LiveRegion, { props: { message: 'Limite atteinte' } })
    await nextTick()
    await nextTick()
    expect(wrapper.text()).toBe('Limite atteinte')

    await wrapper.setProps({ message: '' })
    await wrapper.setProps({ message: 'Limite atteinte' })

    // La région est vidée, puis réécrite au cycle suivant : sans ce passage par
    // le vide, le texte du nœud ne changerait pas et rien ne serait relu.
    expect(wrapper.text()).toBe('')

    await nextTick()
    await nextTick()
    expect(wrapper.text()).toBe('Limite atteinte')
  })

  it('se vide lorsqu’on retire son message', async () => {
    const wrapper = mount(LiveRegion, { props: { message: 'Ajouté' } })
    await nextTick()
    await nextTick()

    await wrapper.setProps({ message: '' })

    expect(wrapper.text()).toBe('')
  })
})
