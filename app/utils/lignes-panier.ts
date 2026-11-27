// =============================================================================
// Lignes de panier, préparées pour l'affichage
// =============================================================================
// Fonction pure d'affichage : elle traduit les lignes du domaine en ce qu'un
// écran doit montrer, et rien de plus. Elle ne mute rien, n'appelle aucun
// service et ne connaît pas Vue.
//
// Elle vit ici plutôt que dans une page parce que deux écrans la demandent :
// le panier, qui laisse corriger la commande, et le paiement, qui en donne le
// récapitulatif avant confirmation, exigence EF-031. La même ligne doit s'y
// lire à l'identique — un récapitulatif qui nomme autrement ce que le panier
// affichait ferait douter le client au moment de payer.
//
// Aucun montant n'est calculé ici. `unitPriceCents` et `lineTotalCents`
// viennent du domaine : une multiplication écrite dans une fonction
// d'affichage serait une seconde source de vérité, et c'est le ticket qui
// trancherait.

import { findProduct } from '../domain/catalogue'
import { DRINK_SUBSTITUTIONS, MENU_SIZE_RULES, SIDE_SUBSTITUTIONS } from '../domain/menu-rules'
import type { Cents } from '../domain/money'
import { lineTotalCents, unitPriceCents } from '../domain/pricing'
import type { CartLine, CartLineId, Product, ProductId, Substitution } from '../domain/types'

/** Un supplément ou un remplacement, avec ce qu'il coûte. */
export interface MentionDeLigne {
  readonly id: string
  readonly label: string
  readonly priceCents: Cents
}

/** Tout ce qu'une ligne de panier doit afficher, assemblé une fois. */
export interface LigneAffichee {
  readonly id: CartLineId
  readonly produit: Product
  readonly ligne: CartLine
  /** Taille du menu, vide pour un produit commandé seul. */
  readonly menuLabel: string
  /** Libellés des ingrédients retirés, en toutes lettres. */
  readonly removed: readonly string[]
  readonly extras: readonly MentionDeLigne[]
  readonly substitutions: readonly MentionDeLigne[]
  readonly unitPriceCents: Cents
  readonly totalPriceCents: Cents
}

/**
 * Composant de menu remplacé, avec son supplément.
 *
 * Le composant compris dans le forfait ne produit aucune mention : le client
 * n'a rien remplacé, et l'écrire allongerait la ligne sans l'informer.
 */
const substitution = (
  choisi: ProductId,
  inclus: ProductId,
  autorisees: readonly Substitution[],
  nomDe: (id: ProductId) => string,
): MentionDeLigne | undefined => {
  if (choisi === inclus) return undefined

  const retenue = autorisees.find((candidate) => candidate.productId === choisi)
  if (retenue === undefined) return undefined

  return { id: choisi, label: nomDe(choisi), priceCents: retenue.surchargeCents }
}

/**
 * Prépare les lignes d'un panier pour l'affichage.
 *
 * Une ligne dont le produit est absent de la liste passée est omise, et non
 * rendue avec un prix nul. Le cas se produit avant que le catalogue ne soit
 * chargé : un montant faux à l'écran est pire qu'une ligne qui apparaît un
 * instant plus tard.
 *
 * Les libellés des retraits et des suppléments viennent du produit, et non des
 * identifiants stockés dans le panier : « Sans oignons » se lit, « Sans
 * pickles » ne se lit pas.
 */
export const lignesAffichees = (
  produits: readonly Product[],
  lignes: readonly CartLine[],
): readonly LigneAffichee[] => {
  const nomDe = (id: ProductId) => findProduct(produits, id)?.name ?? 'Produit'

  return lignes.flatMap((ligne) => {
    const produit = findProduct(produits, ligne.productId)
    if (produit === undefined) return []

    const regle = ligne.menu === undefined ? undefined : MENU_SIZE_RULES[ligne.menu.size]

    const remplacements =
      ligne.menu === undefined || regle === undefined
        ? []
        : [
            substitution(ligne.menu.sideId, regle.defaultSideId, SIDE_SUBSTITUTIONS, nomDe),
            substitution(ligne.menu.drinkId, regle.defaultDrinkId, DRINK_SUBSTITUTIONS, nomDe),
          ].filter((candidate) => candidate !== undefined)

    return [
      {
        id: ligne.id,
        produit,
        ligne,
        menuLabel: ligne.menu === undefined ? '' : `Menu ${ligne.menu.size}`,
        removed: ligne.customisation.removedIds.map(
          (retrait) =>
            produit.removables.find((candidate) => candidate.id === retrait)?.label ?? retrait,
        ),
        extras: ligne.customisation.extraIds.flatMap((ajout) => {
          const supplement = produit.extras.find((candidate) => candidate.id === ajout)
          return supplement === undefined
            ? []
            : [{ id: supplement.id, label: supplement.label, priceCents: supplement.priceCents }]
        }),
        substitutions: remplacements,
        unitPriceCents: unitPriceCents(produit, ligne),
        totalPriceCents: lineTotalCents(produit, ligne),
      },
    ]
  })
}
