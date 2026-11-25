// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductImage from '../../../app/components/atoms/ProductImage.vue'

describe('atome Visuel de produit', () => {
  it('rend une image avec son texte alternatif', () => {
    const wrapper = mount(ProductImage, {
      props: { src: '/images/classique.jpg', alt: 'Le Classique' },
    })

    expect(wrapper.element.tagName).toBe('IMG')
    expect(wrapper.attributes('alt')).toBe('Le Classique')
    expect(wrapper.attributes('src')).toBe('/images/classique.jpg')
  })

  it('charge en différé par défaut, et au premier rendu sur demande', () => {
    const differe = mount(ProductImage, { props: { src: '/x.jpg', alt: 'X' } })
    const immediat = mount(ProductImage, {
      props: { src: '/x.jpg', alt: 'X', loading: 'eager' },
    })

    expect(differe.attributes('loading')).toBe('lazy')
    expect(immediat.attributes('loading')).toBe('eager')
  })

  describe('produit sans visuel', () => {
    it('garde sa place et reste annoncé', () => {
      const wrapper = mount(ProductImage, { props: { alt: 'Le Classique' } })

      expect(wrapper.element.tagName).toBe('DIV')
      expect(wrapper.attributes('role')).toBe('img')
      expect(wrapper.attributes('aria-label')).toBe('Le Classique')
      // La place réservée avant le chargement est tenue par la classe, que la
      // feuille de styles dote d'un rapport d'affichage.
      expect(wrapper.classes()).toContain('c-product-image')
    })

    it('n’annonce pas son initiale en plus du nom', () => {
      const wrapper = mount(ProductImage, { props: { alt: 'Le Classique' } })

      expect(wrapper.find('span').attributes('aria-hidden')).toBe('true')
      expect(wrapper.text()).toBe('L')
    })
  })
})
