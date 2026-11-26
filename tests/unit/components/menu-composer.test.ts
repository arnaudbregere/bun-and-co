// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MenuComposer, { type MenuDraft } from '../../../app/components/organisms/MenuComposer.vue'
import MenuSizePicker from '../../../app/components/molecules/MenuSizePicker.vue'
import OptionToggle from '../../../app/components/atoms/OptionToggle.vue'
import PriceTag from '../../../app/components/atoms/PriceTag.vue'
import StatusBadge from '../../../app/components/atoms/StatusBadge.vue'
import { MENU_SIZE_RULES } from '../../../app/domain/menu-rules'
import { toProductId } from '../../../app/domain/types'
import { PRODUCTS } from '../../../app/services/catalogue-data'

const monter = (composition: MenuDraft = { size: 'M' }) =>
  mount(MenuComposer, {
    props: { products: PRODUCTS, modelValue: composition },
    global: { components: { MenuSizePicker, OptionToggle, PriceTag, StatusBadge } },
  })

const groupe = (wrapper: ReturnType<typeof monter>, legende: string) =>
  wrapper.findAll('fieldset').find((champ) => champ.find('legend').text() === legende)

describe('organisme Composition de menu', () => {
  it('propose le composant compris avant ses substitutions', () => {
    const accompagnements = groupe(monter(), 'Accompagnement')

    // Exigence EF-013 : la taille M comprend les frites petite, et les trois
    // substitutions de `menu-rules.ts` viennent ensuite.
    const libelles = accompagnements?.findAll('.c-menu__label').map((noeud) => noeud.text())
    expect(libelles?.[0]).toBe('Frites maison, petite')
    expect(libelles).toHaveLength(1 + 3)
  })

  it('affiche le supplément d’une substitution, et l’inclusion du reste', () => {
    const accompagnements = groupe(monter(), 'Accompagnement')
    const lignes = accompagnements?.findAll('.c-menu__option')

    // Le composant compris ne coûte rien, et le dit par son étiquette plutôt
    // que par un montant nul.
    expect(lignes?.[0]?.find('.c-status').text()).toBe('Inclus')

    // Potatoes : 0,60 € de supplément, forfaitaire, venu du domaine.
    const potatoes = lignes?.find((ligne) => ligne.text().includes('Potatoes'))
    expect(potatoes?.find('.c-price').attributes('value')).toBe('0.60')
  })

  it('ne propose un dessert qu’aux tailles qui en comprennent un', () => {
    expect(groupe(monter({ size: 'M' }), 'Dessert')).toBeUndefined()

    // Exigence EF-014 : la taille XL comprend un dessert.
    expect(MENU_SIZE_RULES.XL.includesDessert).toBe(true)
    expect(groupe(monter({ size: 'XL' }), 'Dessert')).toBeDefined()
  })

  it('ne présélectionne rien hors la taille', () => {
    const wrapper = monter()

    // Un accompagnement coché d'avance se retrouverait dans le panier sans que
    // le client l'ait choisi. La taille fait exception : elle commande
    // l'affichage du reste, et M est la plus petite.
    expect(wrapper.findAll('.c-menu__input:checked')).toHaveLength(0)
    expect(wrapper.find('.c-menu-size__input:checked').attributes('value')).toBe('M')
  })

  it('rend le composant retenu', async () => {
    const wrapper = monter()

    const potatoes = wrapper
      .findAll('.c-menu__option')
      .find((ligne) => ligne.text().includes('Potatoes'))

    await potatoes?.find('input').setValue(true)

    const emis = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as MenuDraft
    expect(emis.sideId).toBe(toProductId('potatoes'))
  })

  it('oublie un composant que la nouvelle taille ne propose plus', async () => {
    // Le soda 33 cl est compris en M ; en L, le forfait comprend le 50 cl et le
    // 33 cl ne figure pas parmi les substitutions.
    const wrapper = monter({ size: 'M', drinkId: toProductId('soda-33') })

    const tailleL = wrapper.findAll('input[type="radio"][value="L"]')
    await tailleL[0]?.setValue(true)

    const emis = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as MenuDraft
    expect(emis.size).toBe('L')
    expect(emis.drinkId).toBeUndefined()
  })

  it('oublie le dessert d’une taille qui n’en comprend pas', async () => {
    const wrapper = monter({
      size: 'XL',
      sideId: toProductId('fries-large'),
      drinkId: toProductId('soda-50'),
      dessertId: toProductId('cookie'),
    })

    const tailleL = wrapper.findAll('input[type="radio"][value="L"]')
    await tailleL[0]?.setValue(true)

    // Le domaine refuse un dessert sur une taille qui n'en comprend pas : il
    // ne doit pas voyager jusqu'au panier.
    const emis = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as MenuDraft
    expect(emis.dessertId).toBeUndefined()
  })
})
