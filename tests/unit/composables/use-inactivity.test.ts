// @vitest-environment nuxt

// Le composable lit la route, écoute la fenêtre et annonce au lecteur d'écran :
// il lui faut une application Nuxt et un DOM, que cet environnement fournit
// sans navigateur.
//
// Le retour en veille est un paramètre. Ces tests en passent un espion : aucun
// routeur n'est sollicité, aucun stockage de session n'est touché, et
// l'expiration se vérifie à l'appel près.
//
// Les minuteurs sont simulés. Un test qui attendrait réellement
// quatre-vingt-dix secondes ne serait exécuté par personne.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref, type EffectScope } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useInactivity } from '../../../app/composables/useInactivity'
import { useAnnonces } from '../../../app/composables/useAnnonces'
import { SECONDES_AVANT_AVERTISSEMENT, SECONDES_DE_SURSIS } from '../../../app/domain/session'

const chemin = ref('/carte')

mockNuxtImport('useRoute', () => () => ({
  get path() {
    return chemin.value
  },
}))

/** Avance les minuteurs d'un nombre entier de secondes. */
const secondes = async (combien: number) => {
  await vi.advanceTimersByTimeAsync(combien * 1000)
}

let portee: EffectScope | undefined

const surveiller = (chemineDepuis = '/carte') => {
  chemin.value = chemineDepuis

  const surExpiration = vi.fn()
  portee = effectScope()

  const limite = portee.run(() => useInactivity({ surExpiration }))
  if (limite === undefined) throw new Error('La portée n’a rien rendu.')

  return { ...limite, surExpiration }
}

beforeEach(() => {
  vi.useFakeTimers()
  useAnnonces().annoncer('')
})

afterEach(() => {
  portee?.stop()
  portee = undefined
  vi.useRealTimers()
})

describe('composable Limite d’inactivité', () => {
  it('avertit après quatre-vingt-dix secondes, avec vingt secondes de sursis', async () => {
    // Exigence EF-035.
    const { avertit, restant } = surveiller()

    await secondes(SECONDES_AVANT_AVERTISSEMENT - 1)
    expect(avertit.value).toBe(false)

    await secondes(1)
    expect(avertit.value).toBe(true)
    expect(restant.value).toBe(SECONDES_DE_SURSIS)
  })

  it('décompte le sursis seconde par seconde', async () => {
    const { restant } = surveiller()

    await secondes(SECONDES_AVANT_AVERTISSEMENT + 5)
    expect(restant.value).toBe(SECONDES_DE_SURSIS - 5)
  })

  it('remet le compteur à zéro à chaque interaction', async () => {
    const { avertit } = surveiller()

    await secondes(80)
    window.dispatchEvent(new Event('keydown'))

    await secondes(80)
    expect(avertit.value).toBe(false)

    await secondes(10)
    expect(avertit.value).toBe(true)
  })

  it('écoute la dalle tactile, la souris, le clavier et le défilement', async () => {
    for (const evenement of ['pointerdown', 'touchstart', 'keydown', 'wheel']) {
      portee?.stop()
      const { avertit } = surveiller()

      await secondes(SECONDES_AVANT_AVERTISSEMENT - 1)
      window.dispatchEvent(new Event(evenement))

      await secondes(SECONDES_AVANT_AVERTISSEMENT - 1)
      expect(avertit.value, evenement).toBe(false)
    }
  })

  it('ne prolonge rien par une interaction pendant l’avertissement', async () => {
    // Exigence EF-036 : la prolongation est décidée depuis l'avertissement. Un
    // client qui frôle la dalle en récupérant son sac ne doit pas effacer un
    // avertissement qu'il n'a pas lu.
    const { avertit, surExpiration } = surveiller()

    await secondes(SECONDES_AVANT_AVERTISSEMENT)
    expect(avertit.value).toBe(true)

    window.dispatchEvent(new Event('pointerdown'))
    await secondes(SECONDES_DE_SURSIS)

    expect(surExpiration).toHaveBeenCalledOnce()
  })

  it('prolonge la session depuis l’avertissement', async () => {
    // Exigence EF-036.
    const { avertit, restant, prolonger } = surveiller()

    await secondes(SECONDES_AVANT_AVERTISSEMENT + 5)
    prolonger()

    expect(avertit.value).toBe(false)
    expect(restant.value).toBe(SECONDES_DE_SURSIS)
    expect(useAnnonces().message.value).toContain('prolongée')

    // Le délai entier repart : la prolongation n'est pas un sursis de plus.
    await secondes(SECONDES_AVANT_AVERTISSEMENT - 1)
    expect(avertit.value).toBe(false)

    await secondes(1)
    expect(avertit.value).toBe(true)
  })

  it('ne prolonge rien hors de l’avertissement', async () => {
    const { prolonger } = surveiller()

    await secondes(30)
    prolonger()

    // Le compteur n'est pas remis à zéro : sans avertissement ouvert, il n'y a
    // rien à prolonger, et l'appel ne doit pas servir de dérobade.
    await secondes(SECONDES_AVANT_AVERTISSEMENT - 30)
    expect(useAnnonces().message.value).toBe('')
  })

  it('revient en veille à l’expiration du sursis', async () => {
    // Exigence EF-037.
    const { avertit, surExpiration } = surveiller()

    await secondes(SECONDES_AVANT_AVERTISSEMENT + SECONDES_DE_SURSIS - 1)
    expect(surExpiration).not.toHaveBeenCalled()

    await secondes(1)
    expect(surExpiration).toHaveBeenCalledOnce()
    expect(avertit.value).toBe(false)
  })

  it('n’expire qu’une fois', async () => {
    const { surExpiration } = surveiller()

    await secondes(SECONDES_AVANT_AVERTISSEMENT + SECONDES_DE_SURSIS + 60)
    expect(surExpiration).toHaveBeenCalledOnce()
  })

  it('annonce le sursis par paliers, et non chaque seconde', async () => {
    const { message } = useAnnonces()
    const { restant } = surveiller()

    await secondes(SECONDES_AVANT_AVERTISSEMENT + 1)
    expect(restant.value).toBe(19)

    // Rien n'est annoncé à dix-neuf secondes : le dialogue vient de dire le
    // sursis entier, et une annonce par seconde le couvrirait.
    expect(message.value).toBe('')

    await secondes(9)
    expect(restant.value).toBe(10)
    expect(message.value).toContain('10 secondes')

    await secondes(5)
    expect(restant.value).toBe(5)
    expect(message.value).toContain('5 secondes')
  })

  it('ne court pas sur l’écran de veille', async () => {
    // Exigence EF-038.
    const { avertit, surExpiration } = surveiller('/')

    await secondes(SECONDES_AVANT_AVERTISSEMENT + SECONDES_DE_SURSIS + 10)

    expect(avertit.value).toBe(false)
    expect(surExpiration).not.toHaveBeenCalled()
  })

  it('ne court pas sur l’écran de ticket', async () => {
    // Exigence EF-038 : le ticket a son propre retour en veille, exigence
    // EF-034, et un avertissement détournerait le client de son numéro.
    const { avertit, surExpiration } = surveiller('/ticket')

    await secondes(SECONDES_AVANT_AVERTISSEMENT + SECONDES_DE_SURSIS + 10)

    expect(avertit.value).toBe(false)
    expect(surExpiration).not.toHaveBeenCalled()
  })

  it('s’arrête en arrivant sur un écran sans limite', async () => {
    const { avertit, surExpiration } = surveiller('/paiement')

    await secondes(SECONDES_AVANT_AVERTISSEMENT - 10)

    chemin.value = '/ticket'
    await nextTick()

    await secondes(SECONDES_DE_SURSIS + 30)

    expect(avertit.value).toBe(false)
    expect(surExpiration).not.toHaveBeenCalled()
  })

  it('repart à zéro en changeant d’écran de commande', async () => {
    // Naviguer est une interaction : un client qui va de la carte au panier
    // n'est pas un client parti.
    const { avertit } = surveiller('/carte')

    await secondes(SECONDES_AVANT_AVERTISSEMENT - 5)

    chemin.value = '/panier'
    await nextTick()

    await secondes(10)
    expect(avertit.value).toBe(false)
  })

  it('ferme l’avertissement en quittant pour un écran sans limite', async () => {
    const { avertit } = surveiller('/paiement')

    await secondes(SECONDES_AVANT_AVERTISSEMENT)
    expect(avertit.value).toBe(true)

    chemin.value = '/ticket'
    await nextTick()

    expect(avertit.value).toBe(false)
  })

  it('arrête son minuteur avec la portée qui l’a créé', async () => {
    const { surExpiration } = surveiller()

    await secondes(SECONDES_AVANT_AVERTISSEMENT - 1)
    portee?.stop()

    await secondes(SECONDES_DE_SURSIS + 60)
    expect(surExpiration).not.toHaveBeenCalled()
  })
})
