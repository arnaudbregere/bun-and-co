// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductCard from '../../../app/components/molecules/ProductCard.vue'
import ProductImage from '../../../app/components/atoms/ProductImage.vue'
import PriceTag from '../../../app/components/atoms/PriceTag.vue'
import StatusBadge from '../../../app/components/atoms/StatusBadge.vue'
import { cents } from '../../../app/domain/money'

const monter = (props: Record<string, unknown> = {}) =>
  mount(ProductCard, {
    props: { name: 'Le Classique', priceCents: cents(590), ...props },
    global: { components: { ProductImage, PriceTag, StatusBadge } },
  })

describe('molécule Carte de produit', () => {
  it('n’offre qu’une seule cible, qui couvre toute la carte', () => {
    const wrapper = monter()

    // Un titre cliquable entouré de zones mortes multiplie les appuis manqués
    // sur une borne, et triple les arrêts de tabulation par produit.
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.findAll('button')).toHaveLength(1)
  })

  it('affiche le nom et le prix reçus', () => {
    const wrapper = monter()

    expect(wrapper.text()).toContain('Le Classique')
    expect(wrapper.find('.c-price').attributes('value')).toBe('5.90')
  })

  it('émet sa sélection, sans décider de la suite', async () => {
    const wrapper = monter()

    await wrapper.trigger('click')

    expect(wrapper.emitted('select')).toHaveLength(1)
  })

  it('ne répète pas le nom du produit dans le visuel', () => {
    const wrapper = monter({ src: '/classique.jpg' })

    // Le nom figure juste en dessous : un texte alternatif qui le reprendrait
    // le ferait annoncer deux fois.
    expect(wrapper.find('img').attributes('alt')).toBe('')
  })

  describe('produit indisponible', () => {
    it('n’émet aucune sélection', async () => {
      const wrapper = monter({ available: false })

      await wrapper.trigger('click')

      expect(wrapper.emitted('select')).toBeUndefined()
    })

    it('reste atteignable au clavier et annonce son état', () => {
      const wrapper = monter({ available: false })

      expect(wrapper.attributes('disabled')).toBeUndefined()
      expect(wrapper.attributes('aria-disabled')).toBe('true')
      expect(wrapper.text()).toContain('Indisponible')
    })

    it('ne porte pas l’étiquette lorsque le produit est disponible', () => {
      const wrapper = monter()

      expect(wrapper.text()).not.toContain('Indisponible')
    })
  })
})
