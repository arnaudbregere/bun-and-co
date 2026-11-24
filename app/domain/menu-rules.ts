// =============================================================================
// Règles de menu
// =============================================================================
// Ce que coûte une taille, ce qu'elle inclut, et ce qui peut en remplacer un
// composant. Ces règles appartiennent au domaine : elles ne décrivent pas un
// produit vendu, elles décrivent comment un menu se compose et se tarife.

import { toProductId, type MenuSize, type MenuSizeRule, type Substitution } from './types'

// --- Menus ------------------------------------------------------------------------

/**
 * Règles des trois tailles de menu.
 *
 * Le forfait croît moins vite que la somme des pièces achetées séparément :
 * l'économie du client augmente avec la taille, de 0,90 € en M à 1,50 € en XL.
 * Cette propriété est vérifiée par les tests du calcul tarifaire.
 */
export const MENU_SIZE_RULES: Readonly<Record<MenuSize, MenuSizeRule>> = {
  M: {
    size: 'M',
    surchargeCents: 400,
    sideFormat: 'small',
    drinkFormat: 'small',
    includesDessert: false,
  },
  L: {
    size: 'L',
    surchargeCents: 490,
    sideFormat: 'medium',
    drinkFormat: 'medium',
    includesDessert: false,
  },
  XL: {
    size: 'XL',
    surchargeCents: 690,
    sideFormat: 'large',
    drinkFormat: 'medium',
    includesDessert: true,
  },
}

/**
 * Accompagnements acceptés en substitution, avec leur supplément.
 *
 * Les suppléments sont des forfaits, calibrés sur la taille M et indépendants
 * de la taille retenue. C'est la pratique du secteur, et elle évite une grille
 * à neuf cases pour un gain de quelques centimes.
 */
export const SIDE_SUBSTITUTIONS: readonly Substitution[] = [
  { productId: toProductId('potatoes'), surchargeCents: 60 },
  { productId: toProductId('salad'), surchargeCents: 40 },
  { productId: toProductId('apple-slices'), surchargeCents: 0 },
]

/**
 * Boissons acceptées en substitution, avec leur supplément.
 *
 * Le soda 50 cl n'y figure qu'au titre de la montée en format depuis une taille
 * M, dont la boisson incluse est un 33 cl.
 */
export const DRINK_SUBSTITUTIONS: readonly Substitution[] = [
  { productId: toProductId('milkshake'), surchargeCents: 110 },
  { productId: toProductId('orange-juice-25'), surchargeCents: 30 },
  { productId: toProductId('water-50'), surchargeCents: 0 },
  { productId: toProductId('iced-tea-50'), surchargeCents: 0 },
  { productId: toProductId('coffee'), surchargeCents: 0 },
  { productId: toProductId('soda-50'), surchargeCents: 50 },
]
