// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseButton from '../../../app/components/atoms/BaseButton.vue'

describe('atome Bouton', () => {
  it('émet son activation au clic', async () => {
    const wrapper = mount(BaseButton, { slots: { default: 'Ajouter au panier' } })

    await wrapper.trigger('click')

    expect(wrapper.emitted('activate')).toHaveLength(1)
  })

  describe('état indisponible', () => {
    it('n’émet rien et reste atteignable au clavier', async () => {
      const wrapper = mount(BaseButton, {
        props: { disabled: true },
        slots: { default: 'Payer' },
      })

      await wrapper.trigger('click')

      expect(wrapper.emitted('activate')).toBeUndefined()
      // Pas d'attribut `disabled` : un bouton `disabled` sort du parcours de
      // tabulation, et le client qui navigue au clavier n'apprend jamais que
      // l'action existe ni pourquoi elle est refusée.
      expect(wrapper.attributes('disabled')).toBeUndefined()
      expect(wrapper.attributes('aria-disabled')).toBe('true')
    })

    it('affiche la raison du refus quand elle est fournie', () => {
      const wrapper = mount(BaseButton, {
        props: { disabled: true, reason: 'Panier vide' },
        slots: { default: 'Payer' },
      })

      expect(wrapper.text()).toContain('Panier vide')
    })

    it('n’affiche aucune raison lorsque le bouton est disponible', () => {
      const wrapper = mount(BaseButton, {
        props: { reason: 'Panier vide' },
        slots: { default: 'Payer' },
      })

      expect(wrapper.text()).not.toContain('Panier vide')
    })
  })

  describe('variantes', () => {
    it('est principale par défaut', () => {
      const wrapper = mount(BaseButton, { slots: { default: 'Valider' } })

      expect(wrapper.classes()).toContain('c-button--primary')
    })

    it.each(['primary', 'secondary', 'quiet'] as const)('porte la classe de %s', (variant) => {
      const wrapper = mount(BaseButton, { props: { variant }, slots: { default: 'Retour' } })

      expect(wrapper.classes()).toContain(`c-button--${variant}`)
    })
  })

  it('est de type button par défaut, pour ne pas soumettre un formulaire', () => {
    const wrapper = mount(BaseButton, { slots: { default: 'Retour' } })

    expect(wrapper.attributes('type')).toBe('button')
  })
})
