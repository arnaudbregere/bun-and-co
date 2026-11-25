// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CartSummary from '../../../app/components/molecules/CartSummary.vue'
import BaseButton from '../../../app/components/atoms/BaseButton.vue'
import LiveRegion from '../../../app/components/atoms/LiveRegion.vue'
import PriceTag from '../../../app/components/atoms/PriceTag.vue'
import { cents } from '../../../app/domain/money'

const monter = (props: Record<string, unknown> = {}) =>
  mount(CartSummary, {
    props: { itemCount: 3, totalCents: cents(1770), ...props },
    global: { components: { BaseButton, LiveRegion, PriceTag } },
  })

describe('molécule Résumé du panier', () => {
  it('affiche le nombre d’articles et le total reçus', () => {
    const wrapper = monter()

    expect(wrapper.find('.c-cart-summary__count').text()).toBe('3 articles')
    expect(wrapper.find('.c-price').attributes('value')).toBe('17.70')
  })

  it('n’additionne ni ne recalcule rien', () => {
    // Un total qui ne correspond à aucun compte d'articles : s'il était
    // calculé ici, le composant afficherait autre chose.
    const wrapper = monter({ itemCount: 2, totalCents: cents(4242) })

    expect(wrapper.find('.c-price').attributes('value')).toBe('42.42')
  })

  it('accorde le nombre d’articles', () => {
    expect(monter({ itemCount: 1 }).find('.c-cart-summary__count').text()).toBe('1 article')
  })

  describe('panier vide', () => {
    it('annonce « panier vide » plutôt qu’un zéro', () => {
      const wrapper = monter({ itemCount: 0, totalCents: cents(0) })

      // Un zéro suivi d'un montant nul se lit comme un prix, pas comme une
      // absence.
      expect(wrapper.find('.c-cart-summary__count').text()).toBe('Panier vide')
      expect(wrapper.text()).not.toContain('0 article')
    })

    it('refuse l’accès au panier en donnant sa raison', async () => {
      const wrapper = monter({ itemCount: 0, totalCents: cents(0) })
      const bouton = wrapper.find('button')

      // Exigence EF-026, et critère WCAG 3.3.1 : le bouton reste atteignable
      // au clavier, donc la raison du refus est annonçable.
      expect(bouton.attributes('aria-disabled')).toBe('true')
      expect(bouton.attributes('disabled')).toBeUndefined()
      expect(bouton.text()).toContain('Panier vide')

      await bouton.trigger('click')
      expect(wrapper.emitted('open')).toBeUndefined()
    })
  })

  it('ouvre le panier lorsqu’il contient quelque chose', async () => {
    const wrapper = monter()

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('open')).toHaveLength(1)
  })

  describe('annonce courtoise', () => {
    it('porte le compte et le montant', async () => {
      const wrapper = monter({ itemCount: 0, totalCents: cents(0) })

      await wrapper.setProps({ itemCount: 3, totalCents: cents(1770) })
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      // « 3 articles » sans montant ne dit pas où en est la commande : un
      // lecteur d'écran n'a pas la barre sous les yeux.
      const region = wrapper.find('[role="status"]')
      expect(region.text()).toMatch(/^Panier : 3 articles, 17,70\s€$/)
    })

    it('annonce le panier vidé', async () => {
      const wrapper = monter()

      await wrapper.setProps({ itemCount: 0, totalCents: cents(0) })
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[role="status"]').text()).toBe('Panier vide')
    })
  })
})
