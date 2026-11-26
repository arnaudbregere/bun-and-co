// @vitest-environment nuxt

// Le composable appelle `useState` et la carte : il lui faut une application
// Nuxt, que cet environnement fournit sans navigateur.
//
// Ni stockage de session ni réseau. Le magasin et la passerelle sont des
// paramètres, et ces tests passent un magasin en mémoire et une passerelle
// immédiate : ce qui est vérifié est bien le composable que les écrans
// appellent.
//
// La restauration a son propre fichier : elle se joue à la première lecture de
// la session, et un seul fichier ferait dépendre son test de l'ordre des
// autres.

import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { MAX_QUANTITY_PER_LINE } from '../../../app/domain/cart'
import type { CatalogueGateway, DraftStore } from '../../../app/domain/ports'
import type { Draft, Product } from '../../../app/domain/types'
import { toCartLineId, toProductId } from '../../../app/domain/types'
import { useDraft } from '../../../app/composables/useDraft'
import { formatEuros } from '../../../app/utils/format-euros'

const BURGER: Product = {
  id: toProductId('classique'),
  name: 'Le Classique',
  category: 'burgers',
  priceCents: 590,
  available: true,
  allergens: ['gluten'],
  removables: [],
  extras: [],
}

const SANS_OPTION = { removedIds: [], extraIds: [] }

const catalogue: CatalogueGateway = { all: async () => [BURGER] }

/** Magasin en mémoire, qui tient le rôle du stockage de session. */
let contenu: Draft | undefined

const magasin: DraftStore = {
  read: () => contenu,
  write: (commande) => {
    contenu = commande
  },
  clear: () => {
    contenu = undefined
  },
}

const commandeEnCours = () => useDraft({ magasin, catalogue })

/** Panier chargé, carte comprise : le total a besoin des produits. */
const avecCarteChargee = async () => {
  const outils = commandeEnCours()
  await flushPromises()
  return outils
}

afterEach(() => {
  commandeEnCours().vider()

  const { message, alerte } = useAnnonces()
  message.value = ''
  alerte.value = ''
})

describe('composable Commande en cours', () => {
  it('ajoute un produit et annonce ce que le client a et ce qu’il doit', async () => {
    const { ajouter, articles, totalCentimes } = await avecCarteChargee()

    expect(ajouter({ productId: BURGER.id, customisation: SANS_OPTION })).toBe(true)

    expect(articles.value).toBe(1)
    expect(totalCentimes.value).toBe(590)

    // Exigence EF-040 : le changement passe par la région courtoise, qui
    // attend la fin de la lecture en cours plutôt que de la couper.
    //
    // Le montant est construit par le même formateur que l'affichage :
    // `Intl` sépare le nombre du symbole par une espace fine insécable, que
    // personne ne tape au clavier.
    expect(useAnnonces().message.value).toBe(
      `Le Classique ajouté au panier. 1 article, ${formatEuros(590)}`,
    )
  })

  it('refuse au-delà de la limite, avec le message du domaine', async () => {
    const { ajouter, articles } = await avecCarteChargee()

    ajouter({ productId: BURGER.id, customisation: SANS_OPTION, quantity: MAX_QUANTITY_PER_LINE })

    expect(ajouter({ productId: BURGER.id, customisation: SANS_OPTION })).toBe(false)

    // La limite reste écrite dans le domaine, exigence EF-025 : le composable
    // n'en connaît ni la valeur ni la formulation.
    expect(useAnnonces().alerte.value).toContain(String(MAX_QUANTITY_PER_LINE))
    expect(articles.value).toBe(MAX_QUANTITY_PER_LINE)
  })

  it('porte la quantité d’une ligne, et la retire à zéro', async () => {
    const { ajouter, changerQuantite, articles, panier } = await avecCarteChargee()

    ajouter({ productId: BURGER.id, customisation: SANS_OPTION })
    const ligne = panier.value.lines[0]!.id

    changerQuantite(ligne, 3)
    expect(articles.value).toBe(3)
    expect(useAnnonces().message.value).toBe(
      `Quantité portée à 3. 3 articles, ${formatEuros(1770)}`,
    )

    // Zéro retire la ligne : c'est le résultat attendu quand le client
    // décrémente une ligne à une unité.
    changerQuantite(ligne, 0)
    expect(panier.value.lines).toEqual([])
    expect(useAnnonces().message.value).toBe(
      `Ligne retirée du panier. 0 article, ${formatEuros(0)}`,
    )
  })

  it('retire une ligne nommée', async () => {
    const { ajouter, retirer, panier } = await avecCarteChargee()

    ajouter({ productId: BURGER.id, customisation: SANS_OPTION })
    retirer(panier.value.lines[0]!.id)

    expect(panier.value.lines).toEqual([])
  })

  it('laisse remonter une ligne inconnue, faute de programmation', async () => {
    const { retirer } = await avecCarteChargee()

    // Une ligne absente n'est pas un refus adressé au client : l'étouffer la
    // rendrait invisible jusqu'au ticket.
    expect(() => retirer(toCartLineId('ligne-absente'))).toThrow()
  })

  it('vide le panier et le stockage', async () => {
    const { ajouter, vider, articles } = await avecCarteChargee()

    ajouter({ productId: BURGER.id, customisation: SANS_OPTION })
    expect(contenu?.cart.lines).toHaveLength(1)

    vider()

    expect(articles.value).toBe(0)
    expect(contenu).toBeUndefined()
    expect(useAnnonces().message.value).toBe('Panier vidé.')
  })

  it('retient le mode de consommation, et le persiste', async () => {
    const { definirMode, mode } = await avecCarteChargee()

    definirMode('takeaway')

    expect(mode.value).toBe('takeaway')
    expect(contenu?.serviceMode).toBe('takeaway')
    expect(useAnnonces().message.value).toBe('Commande à emporter.')
  })
})
