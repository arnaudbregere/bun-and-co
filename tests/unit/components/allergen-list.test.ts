// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AllergenList from '../../../app/components/molecules/AllergenList.vue'
import { ALLERGENS } from '../../../app/domain/types'

const monter = (props: Record<string, unknown>) => mount(AllergenList, { props })

// Le gabarit indente son balisage : les libellés sont comparés sur un
// espacement normalisé, pas sur celui du fichier source.
const libelles = (wrapper: ReturnType<typeof monter>) =>
  wrapper.findAll('li').map((item) => item.text().replace(/\s+/g, ' '))

describe('molécule Liste d’allergènes', () => {
  it('nomme chaque allergène en texte', () => {
    const wrapper = monter({ allergens: ['gluten', 'milk', 'sesame'] })

    // Exigence EF-008 : un pictogramme d'épi ne nomme rien, et une personne
    // allergique ne devine pas un risque.
    expect(libelles(wrapper)).toEqual(['Gluten', 'Lait', 'Graines de sésame'])
  })

  it('traduit les quatorze catégories réglementaires', () => {
    const wrapper = monter({ allergens: ALLERGENS })

    // Le règlement 1169/2011 ferme la liste : un allergène sans libellé serait
    // affiché sous son identifiant anglais.
    const rendus = libelles(wrapper)
    expect(rendus).toHaveLength(14)
    expect(rendus.some((libelle) => /^[a-z]+$/.test(libelle))).toBe(false)
  })

  it('rend une liste, pour que son nombre d’éléments soit annoncé', () => {
    const wrapper = monter({ allergens: ['eggs', 'fish'] })

    expect(wrapper.element.tagName).toBe('UL')
    expect(wrapper.findAll('li')).toHaveLength(2)
  })

  it('suit l’ordre du règlement et non celui des données reçues', () => {
    const wrapper = monter({ allergens: ['sesame', 'gluten', 'milk'] })

    // Deux produits présentent ainsi leurs allergènes communs au même rang.
    expect(libelles(wrapper)).toEqual(['Gluten', 'Lait', 'Graines de sésame'])
  })

  it('affiche une mention explicite en l’absence d’allergène', () => {
    const wrapper = monter({ allergens: [] })

    // Une liste vide se lirait comme un oubli de la borne.
    expect(wrapper.find('ul').exists()).toBe(false)
    expect(wrapper.text()).toBe('Aucun allergène des quatorze catégories réglementaires.')
  })

  describe('allergène apporté par un supplément', () => {
    it('le signale comme tel', () => {
      const wrapper = monter({ allergens: ['gluten'], extraAllergens: ['milk'] })

      // Histoire 5 : le client qui retire le supplément retire aussi
      // l'allergène.
      expect(libelles(wrapper)).toEqual(['Gluten', 'Lait apporté par un supplément'])
    })

    it('ne l’impute pas au supplément lorsque le produit le porte déjà', () => {
      const wrapper = monter({ allergens: ['milk'], extraAllergens: ['milk'] })

      // Retirer le supplément n'enlèverait pas cet allergène : le signaler
      // comme apporté serait faux.
      expect(libelles(wrapper)).toEqual(['Lait'])
    })

    it('liste l’allergène même lorsque le produit n’en porte aucun', () => {
      const wrapper = monter({ allergens: [], extraAllergens: ['peanuts'] })

      expect(libelles(wrapper)).toEqual(['Arachides apporté par un supplément'])
    })
  })
})
