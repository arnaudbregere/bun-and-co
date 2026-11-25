// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PriceTag from '../../../app/components/atoms/PriceTag.vue'
import { cents } from '../../../app/domain/money'

/**
 * Le séparateur avant le symbole est une espace insécable, dont le point de code
 * dépend de la version d'ICU embarquée par Node. La comparaison le normalise :
 * ce qui est vérifié ici est le format, pas la version de la bibliothèque.
 */
const normaliser = (texte: string) => texte.replace(/[\u00a0\u202f]/g, ' ').trim()

const afficher = (montant: number, variant?: 'inline' | 'total') =>
  normaliser(
    mount(PriceTag, {
      props:
        variant === undefined
          ? { amountCents: cents(montant) }
          : { amountCents: cents(montant), variant },
    }).text(),
  )

describe('atome Prix', () => {
  it.each([
    [590, '5,90 €'],
    [1080, '10,80 €'],
    [120, '1,20 €'],
    [2, '0,02 €'],
    [100000, '1 000,00 €'],
  ])('affiche %i centimes en %s', (montant, attendu) => {
    expect(afficher(montant)).toBe(normaliser(attendu))
  })

  it('affiche un montant nul en euros, et non une mention', () => {
    // « gratuit » ou « offert » relèvent de l'appelant, qui sait pourquoi le
    // montant est nul. Le composant affiche un montant.
    expect(afficher(0)).toBe('0,00 €')
  })

  it('porte la valeur en euros décimaux, lisible par une machine', () => {
    const wrapper = mount(PriceTag, { props: { amountCents: cents(590) } })

    expect(wrapper.attributes('value')).toBe('5.90')
    expect(wrapper.element.tagName).toBe('DATA')
  })

  describe('variantes', () => {
    it('est en ligne par défaut', () => {
      const wrapper = mount(PriceTag, { props: { amountCents: cents(590) } })

      expect(wrapper.classes()).toContain('c-price--inline')
    })

    it('porte la classe du total quand elle est demandée', () => {
      const wrapper = mount(PriceTag, { props: { amountCents: cents(590), variant: 'total' } })

      expect(wrapper.classes()).toContain('c-price--total')
    })
  })
})
