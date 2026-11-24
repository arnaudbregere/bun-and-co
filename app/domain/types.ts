// =============================================================================
// Vocabulaire du domaine
// =============================================================================
// Ce module ne connaît ni Vue, ni le DOM, ni le navigateur. Il décrit ce qu'est
// une commande sur la borne, sans rien dire de son affichage.
//
// Tous les montants sont des entiers de centimes. En JavaScript,
// `5.90 + 1.20 + 0.80` vaut `7.9000000000000004`, et l'erreur s'accumule au fil
// des lignes du panier. La conversion en euros n'a lieu qu'à l'affichage.

import type { Cents } from './money'

export type { Cents }

// --- Identifiants ------------------------------------------------------------
// Types nominaux pour les deux identifiants qui se confondent dans une
// signature : `removeLine(cart, productId)` au lieu de `removeLine(cart,
// lineId)` est une faute plausible, et les deux sont des chaînes à l'exécution.
// Le marquage en fait une erreur de compilation.

declare const brand: unique symbol

type Branded<T, B extends string> = T & { readonly [brand]: B }

export type ProductId = Branded<string, 'ProductId'>
export type CartLineId = Branded<string, 'CartLineId'>

export const toProductId = (value: string): ProductId => value as ProductId
export const toCartLineId = (value: string): CartLineId => value as CartLineId

/**
 * Identifiants non marqués, parce qu'ils ne se confondent avec rien.
 *
 * Un supplément et un retrait ne figurent jamais ensemble dans une signature, et
 * l'interversion des deux champs d'une personnalisation échoue bruyamment : un
 * identifiant de retrait placé dans les suppléments ne figure pas parmi ceux du
 * produit, donc le calcul tarifaire lève.
 *
 * On marque ce qui se confond silencieusement, pas tout ce qui a le même type
 * de base.
 */
export type ExtraId = string
export type RemovableId = string

// --- Allergènes ---------------------------------------------------------------
// Les quatorze catégories du règlement européen 1169/2011, dit INCO. La liste
// est fermée : un allergène hors de ces catégories n'existe pas au sens de la
// réglementation.

export const ALLERGENS = [
  'gluten',
  'crustaceans',
  'eggs',
  'fish',
  'peanuts',
  'soy',
  'milk',
  'nuts',
  'celery',
  'mustard',
  'sesame',
  'sulphites',
  'lupin',
  'molluscs',
] as const

export type Allergen = (typeof ALLERGENS)[number]

// --- Catalogue ----------------------------------------------------------------

export const CATEGORIES = ['burgers', 'chicken', 'sides', 'desserts', 'drinks'] as const

export type Category = (typeof CATEGORIES)[number]

/**
 * Format d'un accompagnement ou d'une boisson. La taille de menu détermine
 * quel format est inclus.
 */
export const FORMATS = ['small', 'medium', 'large'] as const

export type Format = (typeof FORMATS)[number]

export interface Extra {
  readonly id: ExtraId
  readonly label: string
  readonly priceCents: Cents
  readonly allergens: readonly Allergen[]
}

export interface Removable {
  readonly id: RemovableId
  readonly label: string
}

export interface Product {
  readonly id: ProductId
  readonly name: string
  readonly category: Category
  readonly priceCents: Cents
  readonly allergens: readonly Allergen[]
  readonly available: boolean
  /** Format du produit, pour les accompagnements et les boissons déclinés. */
  readonly format?: Format
  /** Ingrédients retirables sans frais. Vide pour les produits non modifiables. */
  readonly removables: readonly Removable[]
  /** Suppléments payants proposés sur ce produit. */
  readonly extras: readonly Extra[]
}

// --- Menus ---------------------------------------------------------------------

export const MENU_SIZES = ['M', 'L', 'XL'] as const

export type MenuSize = (typeof MENU_SIZES)[number]

/**
 * Règle d'une taille de menu : son forfait tarifaire, les formats inclus et la
 * présence d'un dessert.
 */
export interface MenuSizeRule {
  readonly size: MenuSize
  readonly surchargeCents: Cents
  readonly sideFormat: Format
  readonly drinkFormat: Format
  readonly includesDessert: boolean
  /** Accompagnement compris dans le forfait, sans supplément. */
  readonly defaultSideId: ProductId
  /** Boisson comprise dans le forfait, sans supplément. */
  readonly defaultDrinkId: ProductId
}

/**
 * Remplacement d'un composant de menu par un autre produit, avec son supplément.
 */
export interface Substitution {
  readonly productId: ProductId
  readonly surchargeCents: Cents
}

// --- Panier ---------------------------------------------------------------------

/**
 * Personnalisation d'un produit : ce qui est retiré, ce qui est ajouté.
 */
export interface Customisation {
  readonly removedIds: readonly RemovableId[]
  readonly extraIds: readonly ExtraId[]
}

/**
 * Composition d'un menu retenue par le client.
 */
export interface MenuComposition {
  readonly size: MenuSize
  readonly sideId: ProductId
  readonly drinkId: ProductId
  readonly dessertId?: ProductId
}

/**
 * Ligne de panier. Deux produits identiques personnalisés différemment forment
 * deux lignes ; personnalisés à l'identique, ils forment une seule ligne dont la
 * quantité est incrémentée.
 */
export interface CartLine {
  readonly id: CartLineId
  readonly productId: ProductId
  readonly quantity: number
  readonly customisation: Customisation
  /** Absent pour un produit commandé seul. */
  readonly menu?: MenuComposition
}

export interface Cart {
  readonly lines: readonly CartLine[]
}

// --- Commande ---------------------------------------------------------------------

export const SERVICE_MODES = ['eat-in', 'takeaway'] as const

export type ServiceMode = (typeof SERVICE_MODES)[number]

export const PAYMENT_MODES = ['card', 'counter'] as const

export type PaymentMode = (typeof PAYMENT_MODES)[number]

/**
 * Commande en cours de composition : ce qui est persisté entre deux
 * rafraîchissements de page, avant toute confirmation.
 */
export interface Draft {
  readonly cart: Cart
  readonly serviceMode: ServiceMode
}

export interface Order {
  readonly cart: Cart
  readonly serviceMode: ServiceMode
  readonly paymentMode: PaymentMode
  /** Numéro à trois chiffres, unique au sein d'une session. */
  readonly number: number
  /** Horodatage ISO 8601 de la confirmation. */
  readonly confirmedAt: string
}
