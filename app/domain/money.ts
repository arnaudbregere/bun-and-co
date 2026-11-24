// =============================================================================
// Montants
// =============================================================================
// Les montants sont des entiers de centimes, et le typage le garantit. En
// JavaScript, `5.90 + 1.20 + 0.80` vaut `7.9000000000000004` : sur un panier de
// plusieurs lignes, l'erreur s'accumule et produit un total faux d'un centime,
// invisible en relecture et visible sur un ticket.
//
// `Cents` est un type nominal : un `number` ordinaire ne peut pas y être affecté
// sans passer par `cents()`, qui refuse tout ce qui n'est pas un entier.
//
// La conversion en euros n'a lieu qu'à l'affichage, hors du domaine.

declare const centsBrand: unique symbol

export type Cents = number & { readonly [centsBrand]: 'Cents' }

/**
 * Construit un montant. Refuse les nombres à virgule, les valeurs non finies et
 * les montants négatifs.
 *
 * L'échec est une erreur de programmation, pas une saisie utilisateur : aucune
 * interface ne permet de composer un prix négatif. Lever ici fait échouer le
 * test qui a introduit la faute, au lieu de la propager jusqu'au ticket.
 */
export const cents = (value: number): Cents => {
  if (!Number.isInteger(value)) {
    throw new RangeError(`Montant non entier : ${value}. Les montants sont en centimes.`)
  }
  if (value < 0) {
    throw new RangeError(`Montant négatif : ${value}.`)
  }
  return value as Cents
}

export const ZERO_CENTS = cents(0)

export const addCents = (a: Cents, b: Cents): Cents => cents(a + b)

export const sumCents = (values: readonly Cents[]): Cents =>
  values.reduce<Cents>((total, value) => addCents(total, value), ZERO_CENTS)

/**
 * Multiplie un montant par une quantité entière. La quantité n'est pas un
 * montant : la distinguer évite de multiplier deux prix l'un par l'autre.
 */
export const multiplyCents = (amount: Cents, quantity: number): Cents => {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new RangeError(`Quantité invalide : ${quantity}.`)
  }
  return cents(amount * quantity)
}
