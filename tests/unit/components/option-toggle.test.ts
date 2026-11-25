// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import OptionToggle from '../../../app/components/atoms/OptionToggle.vue'

describe('atome Option à cocher', () => {
  it('repose sur une case à cocher native', () => {
    const wrapper = mount(OptionToggle, { props: { label: 'Oignons' } })

    // Un faux interrupteur coûterait le rôle, l'état coché, la touche Espace et
    // le mode contraste élevé, qu'il faudrait tous réécrire à la main.
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
    expect(wrapper.element.tagName).toBe('LABEL')
  })

  it('associe son étiquette sans identifiant à inventer', () => {
    const wrapper = mount(OptionToggle, { props: { label: 'Bacon' } })

    // L'étiquette enveloppe la case : toute la zone est cliquable, et le texte
    // fait partie de la cible.
    expect(wrapper.find('label input').exists()).toBe(true)
    expect(wrapper.text()).toContain('Bacon')
  })

  it('annonce son changement d’état', async () => {
    const wrapper = mount(OptionToggle, { props: { label: 'Cornichons' } })

    await wrapper.find('input').setValue(true)

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([true])
  })

  it('reflète l’état qu’on lui donne', () => {
    const wrapper = mount(OptionToggle, {
      props: { label: 'Cheddar', modelValue: true },
    })

    expect(wrapper.find<HTMLInputElement>('input').element.checked).toBe(true)
  })

  it('n’affiche aucun prix sans emplacement rempli', () => {
    const wrapper = mount(OptionToggle, { props: { label: 'Salade' } })

    expect(wrapper.find('.c-option__price').exists()).toBe(false)
  })

  it('accueille le prix d’un supplément dans son emplacement', () => {
    const wrapper = mount(OptionToggle, {
      props: { label: 'Bacon' },
      slots: { price: '<span>1,20 €</span>' },
    })

    // Le composant n'additionne ni ne convertit : il reçoit déjà le montant
    // formaté par l'atome Prix, que l'appelant place ici.
    expect(wrapper.find('.c-option__price').text()).toBe('1,20 €')
  })
})
