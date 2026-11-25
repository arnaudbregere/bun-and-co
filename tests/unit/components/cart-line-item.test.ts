// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CartLineItem from '../../../app/components/molecules/CartLineItem.vue'
import BaseButton from '../../../app/components/atoms/BaseButton.vue'
import PriceTag from '../../../app/components/atoms/PriceTag.vue'
import { cents } from '../../../app/domain/money'

const monter = (props: Record<string, unknown> = {}, slots: Record<string, string> = {}) =>
  mount(CartLineItem, {
    props: {
      name: 'Le Classique',
      quantity: 2,
      unitPriceCents: cents(590),
      totalPriceCents: cents(1180),
      ...props,
    },
    slots,
    global: { components: { BaseButton, PriceTag } },
  })

const mentions = (wrapper: ReturnType<typeof monter>) =>
  wrapper.findAll('.c-cart-line__details li').map((item) => item.text().replace(/\s+/g, ' '))

describe('molécule Ligne de panier', () => {
  it('appartient à une liste', () => {
    const wrapper = monter()

    // Un lecteur d'écran annonce « 2 sur 5 » avant de lire la ligne.
    expect(wrapper.element.tagName).toBe('LI')
    expect(wrapper.text()).toContain('Le Classique')
  })

  it('écrit les retraits et les suppléments en toutes lettres', () => {
    const wrapper = monter({
      removed: ['Oignons', 'Cornichons'],
      extras: [{ id: 'bacon', label: 'Bacon', priceCents: cents(120) }],
    })

    // Exigence EF-020. Sans ces mentions, deux lignes du même produit
    // personnalisé différemment seraient indiscernables, exigence EF-021.
    expect(mentions(wrapper)[0]).toBe('Sans oignons')
    expect(mentions(wrapper)[1]).toBe('Sans cornichons')
    expect(mentions(wrapper)[2]).toMatch(/^Avec bacon 1,20\s€$/)
  })

  it('affiche les substitutions de menu avec leur supplément', () => {
    const wrapper = monter({
      menuLabel: 'Menu L',
      substitutions: [{ id: 'potatoes', label: 'Potatoes', priceCents: cents(60) }],
    })

    expect(wrapper.find('.c-cart-line__menu').text()).toBe('Menu L')
    expect(mentions(wrapper)[0]).toMatch(/^Potatoes 0,60\s€$/)
  })

  it('n’affiche aucune mention pour un produit non personnalisé', () => {
    const wrapper = monter()

    expect(wrapper.find('.c-cart-line__details').exists()).toBe(false)
  })

  it('ne multiplie aucun montant par aucune quantité', () => {
    // Un total volontairement faux : s'il était calculé ici, le composant
    // afficherait 11,80 € au lieu du montant reçu.
    const wrapper = monter({ quantity: 2, totalPriceCents: cents(999) })

    expect(wrapper.find('.c-cart-line__prices > .c-price').attributes('value')).toBe('9.99')
  })

  it('accueille le sélecteur de quantité dans son emplacement', () => {
    const wrapper = monter({}, { quantity: '<p class="specimen">deux</p>' })

    // Une molécule ne consomme pas une molécule : c'est l'écran qui place
    // l'un dans l'autre.
    expect(wrapper.find('.c-cart-line__controls .specimen').text()).toBe('deux')
  })

  describe('retrait de la ligne', () => {
    it('nomme la ligne concernée, et non une croix', () => {
      const wrapper = monter()

      // Un panier compte plusieurs lignes : « Retirer » seul ne dit pas
      // laquelle.
      expect(wrapper.find('button').text().replace(/\s+/g, ' ')).toBe(
        'Retirer Le Classique du panier',
      )
    })

    it('demande le retrait sans rien retirer', async () => {
      const wrapper = monter()

      await wrapper.find('button').trigger('click')

      // Exigence EF-024 : c'est l'écran qui demande confirmation.
      expect(wrapper.emitted('remove')).toHaveLength(1)
    })
  })

  it('accorde le nombre d’articles', () => {
    const une = monter({ quantity: 1 })
    const plusieurs = monter({ quantity: 3 })

    expect(une.find('.c-cart-line__unit').text()).toContain('1 article')
    expect(plusieurs.find('.c-cart-line__unit').text()).toContain('3 articles')
  })
})
