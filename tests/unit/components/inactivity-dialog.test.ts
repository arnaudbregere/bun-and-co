// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import InactivityDialog from '../../../app/components/molecules/InactivityDialog.vue'
import BaseButton from '../../../app/components/atoms/BaseButton.vue'

// happy-dom ne rend pas l'élément `dialog` : `showModal` et `close` y manquent,
// et l'attribut `open` ne bouge pas seul. Les deux méthodes sont donc
// espionnées, et c'est leur appel que ces tests vérifient. Le piégeage de la
// tabulation, l'inertie du fond et Échap sont vérifiés par un test end-to-end
// dans un vrai navigateur.
//
// La restitution du focus, elle, est écrite dans le composant et non apportée
// par le natif : elle se vérifie donc ici.
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
  mount(InactivityDialog, {
    props: { open: false, remainingSeconds: 20, ...props },
    global: { components: { BaseButton } },
    attachTo: document.body,
  })

/** Bouton déjà focalisé avant l'apparition de l'avertissement. */
const boutonDOrigine = () => {
  const bouton = document.createElement('button')
  bouton.textContent = 'Ajouter au panier'
  document.body.append(bouton)
  bouton.focus()

  return bouton
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('molécule Avertissement d’inactivité', () => {
  it('repose sur l’élément dialog natif', () => {
    equiperLeDialogue()
    const wrapper = monter()

    // Un dialogue modal réécrit à la main est un piège à clavier : le natif
    // apporte le piégeage de la tabulation, l'inertie du fond et Échap.
    expect(wrapper.element.tagName).toBe('DIALOG')
  })

  it('porte la question comme nom accessible et le message comme description', () => {
    equiperLeDialogue()
    const wrapper = monter()

    const titre = wrapper.get(`#${wrapper.attributes('aria-labelledby')}`)
    const message = wrapper.get(`#${wrapper.attributes('aria-describedby')}`)

    expect(titre.text()).toBe('Êtes-vous toujours là ?')
    expect(message.text()).toContain('votre commande sera effacée')
  })

  it('s’ouvre en modal à la demande de l’appelant', async () => {
    const { showModal } = equiperLeDialogue()
    const wrapper = monter()

    expect(showModal).not.toHaveBeenCalled()

    await wrapper.setProps({ open: true })
    expect(showModal).toHaveBeenCalledOnce()
  })

  it('dit le sursis entier une fois, et ne le réécrit pas chaque seconde', async () => {
    equiperLeDialogue()
    const wrapper = monter({ open: true, remainingSeconds: 20 })

    const message = () => wrapper.get(`#${wrapper.attributes('aria-describedby')}`).text()
    expect(message()).toContain('20 secondes')

    await wrapper.setProps({ remainingSeconds: 12 })

    // Un texte qui se réécrit chaque seconde changerait sous les doigts d'un
    // client qui relit le dialogue au lecteur d'écran.
    expect(message()).toContain('20 secondes')
  })

  it('masque le décompte au lecteur d’écran', async () => {
    equiperLeDialogue()
    const wrapper = monter({ open: true, remainingSeconds: 20 })

    const decompte = wrapper.get('.c-inactivity__countdown')
    expect(decompte.attributes('aria-hidden')).toBe('true')
    expect(decompte.text()).toBe('20')

    await wrapper.setProps({ remainingSeconds: 9 })
    expect(decompte.text()).toBe('9')
  })

  it('ferme par le bouton de prolongation, sans rien effacer lui-même', async () => {
    equiperLeDialogue()
    const wrapper = monter({ open: true })

    await wrapper.get('button').trigger('click')

    // Exigence EF-036 : le composant émet la fermeture, et c'est l'appelant qui
    // en tire la prolongation. Rien n'est effacé ici, et aucune navigation
    // n'est demandée.
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('restitue le focus à son origine, exigence EF-045', async () => {
    equiperLeDialogue()
    const origine = boutonDOrigine()
    const wrapper = monter()

    await wrapper.setProps({ open: true })

    // `showModal()` est espionné ici, donc il ne déplace pas le focus comme le
    // ferait un navigateur : le focus est posé à la main sur le bouton du
    // dialogue, état dans lequel le client se trouve réellement.
    wrapper.get('button').element.focus()
    expect(document.activeElement).not.toBe(origine)

    await wrapper.setProps({ open: false })

    // L'avertissement surgit sans déclencheur : `dialog` ne restitue le focus
    // qu'à l'appelant de `showModal()`, ici un minuteur. Le composant relève
    // donc l'élément actif lui-même.
    expect(document.activeElement).toBe(origine)
  })

  it('ne cherche pas à focaliser une origine disparue', async () => {
    equiperLeDialogue()
    const origine = boutonDOrigine()
    const wrapper = monter()

    await wrapper.setProps({ open: true })
    origine.remove()

    // Un élément retiré du document ne peut plus rien recevoir : la fermeture
    // ne doit pas lever pour autant.
    await expect(wrapper.setProps({ open: false })).resolves.toBeUndefined()
  })

  it('tire une prolongation d’une fermeture par Échap', async () => {
    equiperLeDialogue()
    const wrapper = monter({ open: true })

    // Échap ferme le dialogue natif sans passer par notre bouton. L'événement
    // `close` est le seul endroit qui voie toutes les fermetures.
    wrapper.element.dispatchEvent(new Event('close'))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })
})
