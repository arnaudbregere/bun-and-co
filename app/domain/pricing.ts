// =============================================================================
// Calcul tarifaire
// =============================================================================
// Fonctions pures. Aucun accès au réseau, aucun état : le prix d'une ligne ne
// dépend que du produit, de sa personnalisation et de sa composition de menu.
//
// C'est volontaire et c'est une contrainte d'usage, pas un choix esthétique :
// un aller-retour réseau par appui sur « plus » dépasserait le budget
// d'interaction de 100 millisecondes et rendrait la borne inutilisable hors
// connexion, pour un calcul trivial.

import { findProduct } from './catalogue'
import { InvalidLineError } from './errors'
import { DRINK_SUBSTITUTIONS, MENU_SIZE_RULES, SIDE_SUBSTITUTIONS } from './menu-rules'
import { ZERO_CENTS, addCents, multiplyCents, sumCents, type Cents } from './money'
import type { CartLine, Customisation, MenuComposition, Product, ProductId } from './types'

/**
 * Somme des suppléments retenus sur un produit.
 *
 * Un supplément que le produit n'accepte pas est une faute, pas un prix nul :
 * le Végétal refuse le bacon, et une interface qui le proposerait serait à
 * corriger.
 */
export const extrasTotalCents = (product: Product, customisation: Customisation): Cents =>
  sumCents(
    customisation.extraIds.map((extraId) => {
      const extra = product.extras.find((candidate) => candidate.id === extraId)
      if (extra === undefined) {
        throw new InvalidLineError(
          `Le supplément ${extraId} n’est pas proposé sur ${product.name}.`,
        )
      }
      return extra.priceCents
    }),
  )

/**
 * Supplément appliqué au remplacement d'un composant de menu.
 *
 * Le composant compris dans le forfait ne coûte rien. Tout autre doit figurer
 * parmi les substitutions autorisées, sinon la composition est invalide.
 *
 * Les suppléments sont des forfaits, calibrés sur la taille M et indépendants
 * de la taille retenue : c'est la pratique du secteur, et elle évite une grille
 * à neuf cases pour un gain de quelques centimes.
 */
const componentSurchargeCents = (
  chosenId: ProductId,
  includedId: ProductId,
  allowed: readonly { readonly productId: ProductId; readonly surchargeCents: Cents }[],
  label: string,
): Cents => {
  if (chosenId === includedId) return ZERO_CENTS

  const substitution = allowed.find((candidate) => candidate.productId === chosenId)
  if (substitution === undefined) {
    throw new InvalidLineError(`${label} ${chosenId} n’est pas proposé en substitution.`)
  }

  return substitution.surchargeCents
}

/**
 * Supplément total d'une composition de menu : forfait de taille, puis
 * remplacements d'accompagnement et de boisson.
 */
export const menuSurchargeCents = (menu: MenuComposition): Cents => {
  const rule = MENU_SIZE_RULES[menu.size]

  if (rule.includesDessert && menu.dessertId === undefined) {
    throw new InvalidLineError(`La taille ${menu.size} comprend un dessert, qui n’est pas choisi.`)
  }
  if (!rule.includesDessert && menu.dessertId !== undefined) {
    throw new InvalidLineError(`La taille ${menu.size} ne comprend pas de dessert.`)
  }

  return sumCents([
    rule.surchargeCents,
    componentSurchargeCents(
      menu.sideId,
      rule.defaultSideId,
      SIDE_SUBSTITUTIONS,
      'L’accompagnement',
    ),
    componentSurchargeCents(menu.drinkId, rule.defaultDrinkId, DRINK_SUBSTITUTIONS, 'La boisson'),
  ])
}

/**
 * Prix d'une unité : le produit, ses suppléments, et le menu s'il y en a un.
 */
export const unitPriceCents = (
  product: Product,
  line: Pick<CartLine, 'customisation' | 'menu'>,
): Cents => {
  const base = addCents(product.priceCents, extrasTotalCents(product, line.customisation))
  return line.menu === undefined ? base : addCents(base, menuSurchargeCents(line.menu))
}

/**
 * Prix total d'une ligne, quantité comprise.
 */
export const lineTotalCents = (product: Product, line: CartLine): Cents =>
  multiplyCents(unitPriceCents(product, line), line.quantity)

/**
 * Total d'un panier.
 *
 * Les produits sont passés en argument : le domaine n'en détient aucun. Une
 * ligne qui désigne un produit absent du catalogue est une faute, et non une
 * ligne gratuite.
 */
export const cartTotalCents = (products: readonly Product[], lines: readonly CartLine[]): Cents =>
  sumCents(
    lines.map((line) => {
      const product = findProduct(products, line.productId)
      if (product === undefined) {
        throw new InvalidLineError(`Le produit ${line.productId} n’existe pas au catalogue.`)
      }
      return lineTotalCents(product, line)
    }),
  )
