// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import QuantityStepper from '../../../app/components/molecules/QuantityStepper.vue'
import BaseButton from '../../../app/components/atoms/BaseButton.vue'
import BaseIcon from '../../../app/components/atoms/BaseIcon.vue'

const monter = (props: Record<string, unknown> = {}) =>
  mount(QuantityStepper, {
    props: { quantity: 2, productName: 'Le Classique', ...props },
    global: { components: { BaseButton, BaseIcon } },
  })

const boutons = (wrapper: ReturnType<typeof monter>) => wrapper.findAll('button')

describe('molécule Sélecteur de quantité', () => {
  it('affiche la quantité sans la rendre saisissable', () => {
    const wrapper = monter()

    // Une borne tactile n'a pas de clavier : un champ libre y ouvrirait la
    // porte aux quantités absurdes qu'il faudrait ensuite refuser.
    expect(wrapper.find('.c-quantity__value').text()).toBe('2')
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('nomme le produit sur chacun de ses boutons', () => {
    const wrapper = monter()

    expect(boutons(wrapper)[0]?.text()).toContain('Le Classique')
    expect(boutons(wrapper)[1]?.text()).toContain('Le Classique')
  })

  it('augmente et diminue la quantité', async () => {
    const wrapper = monter()

    await boutons(wrapper)[1]?.trigger('click')
    await boutons(wrapper)[0]?.trigger('click')

    expect(wrapper.emitted('increase')).toHaveLength(1)
    expect(wrapper.emitted('decrease')).toHaveLength(1)
  })

  it('demande la suppression plutôt qu’une quantité nulle', async () => {
    const wrapper = monter({ quantity: 1 })

    await boutons(wrapper)[0]?.trigger('click')

    // Exigence EF-024 : c'est l'écran qui demandera confirmation.
    expect(wrapper.emitted('remove')).toHaveLength(1)
    expect(wrapper.emitted('decrease')).toBeUndefined()
  })

  it('nomme son geste à une unité, et non l’effet du retrait', () => {
    const wrapper = monter({ quantity: 1 })

    // Demande #140 : la ligne de panier porte déjà « Retirer Le Classique du
    // panier ». Deux boutons de même nom accessible sur une même ligne
    // allongent la liste des éléments interactifs sans dire lequel choisir.
    expect(boutons(wrapper)[0]?.text()).toContain('Retirer la dernière unité de Le Classique')
    expect(boutons(wrapper)[0]?.text()).not.toContain('du panier')
  })

  describe('limite atteinte', () => {
    it('refuse l’augmentation en donnant sa raison', async () => {
      const wrapper = monter({ increaseDisabledReason: 'Maximum de 10 par ligne' })

      await boutons(wrapper)[1]?.trigger('click')

      expect(wrapper.emitted('increase')).toBeUndefined()
      expect(boutons(wrapper)[1]?.attributes('aria-disabled')).toBe('true')
      expect(wrapper.text()).toContain('Maximum de 10 par ligne')
    })

    it('n’écrit aucune limite dans le composant', () => {
      const wrapper = monter({ quantity: 10 })

      // Dix par ligne et trente par commande sont des règles du domaine. Le
      // composant reçoit leur verdict, il ne les applique pas.
      expect(boutons(wrapper)[1]?.attributes('aria-disabled')).toBeUndefined()
    })
  })
})
