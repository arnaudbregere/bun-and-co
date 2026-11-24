// =============================================================================
// Données du catalogue
// =============================================================================
// Traduction en données typées de la carte décrite par
// `specs/001-parcours-commande/spec.md`.
//
// Ce module appartient à la couche services, et non au domaine : il décrit ce
// que l'enseigne vend aujourd'hui, pas ce qu'est un produit. Le jour où le
// catalogue viendra d'une API, c'est ce fichier qui sera remplacé, sans qu'une
// seule règle métier change.
//
// Tous les prix sont des entiers de centimes. Aucun nombre à virgule n'apparaît
// dans ce fichier, et aucun ne doit y apparaître.

import {
  toExtraId,
  toProductId,
  toRemovableId,
  type Extra,
  type Product,
  type Removable,
} from '../domain/types'

// --- Personnalisation des burgers ---------------------------------------------

const ONIONS = toRemovableId('onions')
const PICKLES = toRemovableId('pickles')
const LETTUCE = toRemovableId('lettuce')
const TOMATO = toRemovableId('tomato')
const SAUCE = toRemovableId('sauce')
const CHEESE = toRemovableId('cheese')

const BURGER_REMOVABLES: readonly Removable[] = [
  { id: ONIONS, label: 'Oignons' },
  { id: PICKLES, label: 'Cornichons' },
  { id: LETTUCE, label: 'Salade' },
  { id: TOMATO, label: 'Tomate' },
  { id: SAUCE, label: 'Sauce' },
  { id: CHEESE, label: 'Fromage' },
]

const BACON = toExtraId('bacon')
const EXTRA_STEAK = toExtraId('extra-steak')

const BURGER_EXTRAS: readonly Extra[] = [
  { id: BACON, label: 'Bacon', priceCents: 120, allergens: [] },
  { id: toExtraId('cheddar'), label: 'Cheddar', priceCents: 80, allergens: ['milk'] },
  {
    id: toExtraId('hash-brown'),
    label: 'Galette de pomme de terre',
    priceCents: 100,
    allergens: ['gluten'],
  },
  { id: toExtraId('egg'), label: 'Œuf', priceCents: 90, allergens: ['eggs'] },
  { id: EXTRA_STEAK, label: 'Steak supplémentaire', priceCents: 250, allergens: [] },
  {
    id: toExtraId('extra-sauce'),
    label: 'Sauce supplémentaire',
    priceCents: 50,
    allergens: ['eggs', 'mustard', 'sulphites'],
  },
]

/**
 * Suppléments d'un burger, moins ceux que ce produit refuse.
 *
 * Le Végétal refuse le bacon et le steak supplémentaire : un produit végétal
 * personnalisable en non-végétal serait un défaut, pas une liberté offerte au
 * client. Le Mariner refuse le seul steak supplémentaire, un sandwich au
 * poisson garni de bœuf n'ayant pas de sens, tandis que le bacon reste une
 * garniture plausible.
 */
const burgerExtrasExcept = (...refused: readonly string[]): readonly Extra[] =>
  BURGER_EXTRAS.filter((extra) => !refused.includes(extra.id))

// --- Produits -------------------------------------------------------------------

const burger = (
  id: string,
  name: string,
  priceCents: number,
  allergens: Product['allergens'],
  extras: readonly Extra[] = BURGER_EXTRAS,
): Product => ({
  id: toProductId(id),
  name,
  category: 'burgers',
  priceCents,
  allergens,
  available: true,
  removables: BURGER_REMOVABLES,
  extras,
})

/**
 * Produit sans personnalisation possible : poulet, accompagnements, desserts et
 * boissons ne se retirent ni ne se complètent.
 */
const plain = (
  id: string,
  name: string,
  category: Product['category'],
  priceCents: number,
  allergens: Product['allergens'],
  format?: Product['format'],
): Product => ({
  id: toProductId(id),
  name,
  category,
  priceCents,
  allergens,
  available: true,
  removables: [],
  extras: [],
  ...(format === undefined ? {} : { format }),
})

export const PRODUCTS: readonly Product[] = [
  // Burgers
  burger('classique', 'Le Classique', 590, [
    'gluten',
    'milk',
    'eggs',
    'mustard',
    'sesame',
    'sulphites',
  ]),
  burger('fermier', 'Le Fermier', 690, ['gluten', 'milk', 'eggs', 'mustard', 'sesame']),
  burger(
    'vegetal',
    'Le Végétal',
    640,
    ['gluten', 'milk', 'soy', 'mustard', 'sesame'],
    burgerExtrasExcept(BACON, EXTRA_STEAK),
  ),
  burger(
    'mariner',
    'Le Mariner',
    640,
    ['gluten', 'milk', 'eggs', 'fish', 'mustard', 'sesame'],
    burgerExtrasExcept(EXTRA_STEAK),
  ),
  burger('montagnard', 'Le Montagnard', 790, [
    'gluten',
    'milk',
    'eggs',
    'mustard',
    'sesame',
    'sulphites',
  ]),
  burger('double-smoky', 'Le Double Smoky', 840, [
    'gluten',
    'milk',
    'eggs',
    'mustard',
    'sesame',
    'sulphites',
  ]),

  // Poulet
  plain('nuggets-6', 'Croquettes de poulet, 6 pièces', 'chicken', 450, [
    'gluten',
    'milk',
    'mustard',
  ]),
  plain('nuggets-9', 'Croquettes de poulet, 9 pièces', 'chicken', 620, [
    'gluten',
    'milk',
    'mustard',
  ]),
  plain('tenders-3', 'Tenders, 3 pièces', 'chicken', 490, ['gluten', 'milk', 'eggs']),
  plain('wrap', 'Wrap Croustillant', 'chicken', 550, [
    'gluten',
    'milk',
    'eggs',
    'mustard',
    'celery',
  ]),

  // Accompagnements
  plain('fries-small', 'Frites maison, petite', 'sides', 250, [], 'small'),
  plain('fries-medium', 'Frites maison, moyenne', 'sides', 310, [], 'medium'),
  plain('fries-large', 'Frites maison, grande', 'sides', 360, [], 'large'),
  plain('potatoes', 'Potatoes', 'sides', 330, ['gluten']),
  plain('salad', 'Salade verte', 'sides', 290, ['mustard', 'sulphites']),
  plain('apple-slices', 'Pommes tranchées', 'sides', 220, []),

  // Desserts
  plain('cookie', 'Cookie tout chocolat', 'desserts', 190, ['gluten', 'milk', 'eggs', 'soy']),
  plain('brownie', 'Brownie noix de pécan', 'desserts', 240, ['gluten', 'milk', 'eggs', 'nuts']),
  plain('sundae', 'Sundae caramel', 'desserts', 290, ['milk', 'eggs', 'soy']),
  plain('apple-donut', 'Beignet à la pomme', 'desserts', 220, ['gluten', 'milk', 'eggs']),

  // Boissons
  plain('soda-33', 'Soda, 33 cl', 'drinks', 240, [], 'small'),
  plain('soda-50', 'Soda, 50 cl', 'drinks', 290, [], 'medium'),
  plain('iced-tea-50', 'Thé glacé pêche, 50 cl', 'drinks', 260, [], 'medium'),
  plain('water-50', 'Eau minérale, 50 cl', 'drinks', 220, [], 'medium'),
  plain('orange-juice-25', 'Jus d’orange, 25 cl', 'drinks', 270, [], 'small'),
  plain('coffee', 'Café', 'drinks', 180, []),
  plain('milkshake', 'Milkshake vanille, chocolat ou fraise', 'drinks', 350, [
    'milk',
    'eggs',
    'soy',
  ]),
]
