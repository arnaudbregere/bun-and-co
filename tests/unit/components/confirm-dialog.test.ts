// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDialog from '../../../app/components/molecules/ConfirmDialog.vue'
import BaseButton from '../../../app/components/atoms/BaseButton.vue'

// happy-dom ne rend pas l'élément `dialog` : `showModal` et `close` y manquent,
// et l'attribut `open` ne bouge pas seul. Les deux méthodes sont donc
// espionnées, et c'est leur appel que ces tests vérifient. Le comportement
// réel — piégeage de la tabulation, inertie du fond, Échap, restitution du
// focus — est vérifié par un test end-to-end dans un vrai navigateur.
const equiperLeDialogue = () => {
  const prototype = globalThis.HTMLDialogElement?.prototype ?? HTMLElement.prototype
  const showModal = vi.fn(function (this: HTMLElement) {
    this.setAttribute('open', '')
  })
  const close = vi.fn(function (this: HTMLElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  })

  Object.defineProperty(prototype, 'showModal', { value: showModal, configurable: true })
  Object.defineProperty(prototype, 'close', { value: close, configurable: true })
  Object.defineProperty(prototype, 'open', {
    get(this: HTMLElement) {
      return this.hasAttribute('open')
    },
    configurable: true,
  })

  return { showModal, close }
}

const monter = (props: Record<string, unknown> = {}) =>
  mount(ConfirmDialog, {
    props: {
      title: 'Retirer cet article ?',
      confirmLabel: 'Supprimer Le Classique',
      open: false,
      ...props,
    },
    global: { components: { BaseButton } },
    attachTo: document.body,
  })

const boutons = (wrapper: ReturnType<typeof monter>) => wrapper.findAll('button')

describe('molécule Boîte de confirmation', () => {
  it('repose sur l’élément dialog natif', () => {
    const wrapper = monter()

    // Un dialogue modal réécrit à la main est un piège à clavier : le natif
    // apporte le piégeage de la tabulation, l'inertie du fond, Échap et la
    // restitution du focus.
    expect(wrapper.element.tagName).toBe('DIALOG')
  })

  it('porte la question comme nom accessible', () => {
    const wrapper = monter()

    const titre = wrapper.find('.c-confirm__title')
    expect(titre.text()).toBe('Retirer cet article ?')
    expect(wrapper.attributes('aria-labelledby')).toBe(titre.attributes('id'))
  })

  it('nomme l’action destructrice plutôt que de dire « OK »', () => {
    const wrapper = monter()

    expect(boutons(wrapper).map((bouton) => bouton.text())).toEqual([
      'Annuler',
      'Supprimer Le Classique',
    ])
  })

  it('place l’annulation avant l’action destructrice', () => {
    const wrapper = monter()

    // L'ordre du balisage est celui de la tabulation, et le dialogue natif
    // pose le focus sur le premier élément focalisable : un appui machinal sur
    // Entrée annule, il ne supprime pas.
    expect(boutons(wrapper)[0]?.text()).toBe('Annuler')
  })

  it('affiche une précision seulement si on lui en donne une', () => {
    expect(monter().find('.c-confirm__message').exists()).toBe(false)
    expect(
      monter({ message: 'Cette action est définitive.' }).find('.c-confirm__message').text(),
    ).toBe('Cette action est définitive.')
  })

  describe('ouverture et fermeture', () => {
    it('ouvre le dialogue en mode modal, jamais en simple ouverture', async () => {
      const { showModal } = equiperLeDialogue()
      const wrapper = monter()

      await wrapper.setProps({ open: true })

      // `show()` laisserait la page derrière accessible à la tabulation.
      expect(showModal).toHaveBeenCalledTimes(1)
    })

    it('ferme le dialogue lorsque l’écran le referme', async () => {
      const { close } = equiperLeDialogue()
      const wrapper = monter({ open: true })

      await wrapper.setProps({ open: false })

      expect(close).toHaveBeenCalled()
    })

    it('émet la confirmation sans rien exécuter', async () => {
      equiperLeDialogue()
      const wrapper = monter({ open: true })

      await boutons(wrapper)[1]?.trigger('click')

      // C'est l'écran qui retire la ligne, et le domaine qui recalcule.
      expect(wrapper.emitted('confirm')).toHaveLength(1)
      expect(wrapper.emitted('cancel')).toBeUndefined()
      expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
    })

    it('émet l’annulation sur le bouton d’annulation', async () => {
      equiperLeDialogue()
      const wrapper = monter({ open: true })

      await boutons(wrapper)[0]?.trigger('click')

      expect(wrapper.emitted('cancel')).toHaveLength(1)
      expect(wrapper.emitted('confirm')).toBeUndefined()
    })

    it('traite Échap comme une annulation', async () => {
      equiperLeDialogue()
      const wrapper = monter({ open: true })

      // Échap ferme le dialogue sans passer par nos boutons : l'événement
      // `close` est le seul endroit qui voie toutes les fermetures.
      await wrapper.trigger('close')

      expect(wrapper.emitted('cancel')).toHaveLength(1)
      expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
    })

    it('n’annonce qu’une annulation par fermeture', async () => {
      equiperLeDialogue()
      const wrapper = monter({ open: true })

      await boutons(wrapper)[0]?.trigger('click')
      await wrapper.trigger('close')

      expect(wrapper.emitted('cancel')).toHaveLength(1)
    })
  })
})
