// =============================================================================
// Visuels de la carte
// =============================================================================
// Fichier produit par `node scripts/fetch-product-images.mjs`. Ne pas modifier
// à la main : la prochaine exécution l'écraserait.
//
// Les photographies viennent de Pixabay, sont versionnées avec le dépôt et
// servies depuis celui-ci. La borne n'appelle aucun service tiers, et la
// construction n'a besoin d'aucun réseau.
//
// Deux tailles par produit : 340 px de large pour les grilles de carte, 640 px
// pour la fiche produit. Le composant choisit selon son contexte.

import classiqueMedium from '../assets/images/products/classique-medium.jpg'
import classiqueLarge from '../assets/images/products/classique-large.jpg'
import fermierMedium from '../assets/images/products/fermier-medium.jpg'
import fermierLarge from '../assets/images/products/fermier-large.jpg'
import vegetalMedium from '../assets/images/products/vegetal-medium.jpg'
import vegetalLarge from '../assets/images/products/vegetal-large.jpg'
import marinerMedium from '../assets/images/products/mariner-medium.jpg'
import marinerLarge from '../assets/images/products/mariner-large.jpg'
import montagnardMedium from '../assets/images/products/montagnard-medium.jpg'
import montagnardLarge from '../assets/images/products/montagnard-large.jpg'
import doubleSmokyMedium from '../assets/images/products/double-smoky-medium.jpg'
import doubleSmokyLarge from '../assets/images/products/double-smoky-large.jpg'
import nuggets6Medium from '../assets/images/products/nuggets-6-medium.jpg'
import nuggets6Large from '../assets/images/products/nuggets-6-large.jpg'
import nuggets9Medium from '../assets/images/products/nuggets-9-medium.jpg'
import nuggets9Large from '../assets/images/products/nuggets-9-large.jpg'
import tenders3Medium from '../assets/images/products/tenders-3-medium.jpg'
import tenders3Large from '../assets/images/products/tenders-3-large.jpg'
import wrapMedium from '../assets/images/products/wrap-medium.jpg'
import wrapLarge from '../assets/images/products/wrap-large.jpg'
import friesSmallMedium from '../assets/images/products/fries-small-medium.jpg'
import friesSmallLarge from '../assets/images/products/fries-small-large.jpg'
import friesMediumMedium from '../assets/images/products/fries-medium-medium.jpg'
import friesMediumLarge from '../assets/images/products/fries-medium-large.jpg'
import friesLargeMedium from '../assets/images/products/fries-large-medium.jpg'
import friesLargeLarge from '../assets/images/products/fries-large-large.jpg'
import potatoesMedium from '../assets/images/products/potatoes-medium.jpg'
import potatoesLarge from '../assets/images/products/potatoes-large.jpg'
import saladMedium from '../assets/images/products/salad-medium.jpg'
import saladLarge from '../assets/images/products/salad-large.jpg'
import appleSlicesMedium from '../assets/images/products/apple-slices-medium.jpg'
import appleSlicesLarge from '../assets/images/products/apple-slices-large.jpg'
import cookieMedium from '../assets/images/products/cookie-medium.jpg'
import cookieLarge from '../assets/images/products/cookie-large.jpg'
import brownieMedium from '../assets/images/products/brownie-medium.jpg'
import brownieLarge from '../assets/images/products/brownie-large.jpg'
import sundaeMedium from '../assets/images/products/sundae-medium.jpg'
import sundaeLarge from '../assets/images/products/sundae-large.jpg'
import appleDonutMedium from '../assets/images/products/apple-donut-medium.jpg'
import appleDonutLarge from '../assets/images/products/apple-donut-large.jpg'
import soda33Medium from '../assets/images/products/soda-33-medium.jpg'
import soda33Large from '../assets/images/products/soda-33-large.jpg'
import soda50Medium from '../assets/images/products/soda-50-medium.jpg'
import soda50Large from '../assets/images/products/soda-50-large.jpg'
import icedTea50Medium from '../assets/images/products/iced-tea-50-medium.jpg'
import icedTea50Large from '../assets/images/products/iced-tea-50-large.jpg'
import water50Medium from '../assets/images/products/water-50-medium.jpg'
import water50Large from '../assets/images/products/water-50-large.jpg'
import orangeJuice25Medium from '../assets/images/products/orange-juice-25-medium.jpg'
import orangeJuice25Large from '../assets/images/products/orange-juice-25-large.jpg'
import coffeeMedium from '../assets/images/products/coffee-medium.jpg'
import coffeeLarge from '../assets/images/products/coffee-large.jpg'
import milkshakeMedium from '../assets/images/products/milkshake-medium.jpg'
import milkshakeLarge from '../assets/images/products/milkshake-large.jpg'

export interface ProductImage {
  readonly medium: string
  readonly large: string
  /** Texte alternatif de repli : le nom du produit. */
  readonly alt: string
  readonly photographer: string
  readonly page: string
}

export const PRODUCT_IMAGES: Readonly<Record<string, ProductImage>> = {
  classique: {
    medium: classiqueMedium,
    large: classiqueLarge,
    alt: 'Le Classique',
    photographer: 'niekverlaan',
    page: 'https://pixabay.com/photos/hamburger-snack-burger-gourmet-494706/',
  },
  fermier: {
    medium: fermierMedium,
    large: fermierLarge,
    alt: 'Le Fermier',
    photographer: 'SylwesterL',
    page: 'https://pixabay.com/photos/hamburger-sandwich-chicken-healthy-8026582/',
  },
  vegetal: {
    medium: vegetalMedium,
    large: vegetalLarge,
    alt: 'Le Végétal',
    photographer: 'TheoCrazzolara',
    page: 'https://pixabay.com/photos/burger-meal-hamburger-food-4641173/',
  },
  mariner: {
    medium: marinerMedium,
    large: marinerLarge,
    alt: 'Le Mariner',
    photographer: 'tehzeebkazmii',
    page: 'https://pixabay.com/photos/burger-fish-burger-fried-fish-10448255/',
  },
  montagnard: {
    medium: montagnardMedium,
    large: montagnardLarge,
    alt: 'Le Montagnard',
    photographer: 'camilatpb',
    page: 'https://pixabay.com/photos/burger-hamburger-snack-food-bread-9642130/',
  },
  'double-smoky': {
    medium: doubleSmokyMedium,
    large: doubleSmokyLarge,
    alt: 'Le Double Smoky',
    photographer: 'Pexels',
    page: 'https://pixabay.com/photos/burgers-fire-grill-grilling-cook-1839090/',
  },
  'nuggets-6': {
    medium: nuggets6Medium,
    large: nuggets6Large,
    alt: 'Croquettes de poulet, 6 pièces',
    photographer: 'hansbenn',
    page: 'https://pixabay.com/photos/chicken-nuggets-poultry-flesh-food-1351329/',
  },
  'nuggets-9': {
    medium: nuggets9Medium,
    large: nuggets9Large,
    alt: 'Croquettes de poulet, 9 pièces',
    photographer: 'fudowakira0',
    page: 'https://pixabay.com/photos/pizza-food-delivery-dining-767221/',
  },
  'tenders-3': {
    medium: tenders3Medium,
    large: tenders3Large,
    alt: 'Tenders, 3 pièces',
    photographer: 'WikimediaImages',
    page: 'https://pixabay.com/photos/food-eat-diet-mcd-chicken-selects-2202375/',
  },
  wrap: {
    medium: wrapMedium,
    large: wrapLarge,
    alt: 'Wrap Croustillant',
    photographer: 'tehzeebhud',
    page: 'https://pixabay.com/photos/wrap-chicken-tortilla-grilled-10387272/',
  },
  'fries-small': {
    medium: friesSmallMedium,
    large: friesSmallLarge,
    alt: 'Frites maison, petite',
    photographer: 'Pexels',
    page: 'https://pixabay.com/photos/bowl-french-fries-food-fries-1842294/',
  },
  'fries-medium': {
    medium: friesMediumMedium,
    large: friesMediumLarge,
    alt: 'Frites maison, moyenne',
    photographer: 'Pexels',
    page: 'https://pixabay.com/photos/bowl-french-fries-food-fries-1842294/',
  },
  'fries-large': {
    medium: friesLargeMedium,
    large: friesLargeLarge,
    alt: 'Frites maison, grande',
    photographer: 'Pexels',
    page: 'https://pixabay.com/photos/bowl-french-fries-food-fries-1842294/',
  },
  potatoes: {
    medium: potatoesMedium,
    large: potatoesLarge,
    alt: 'Potatoes',
    photographer: 'brenkee',
    page: 'https://pixabay.com/photos/hamburger-fries-coleslaw-food-1281855/',
  },
  salad: {
    medium: saladMedium,
    large: saladLarge,
    alt: 'Salade verte',
    photographer: 'JillWellington',
    page: 'https://pixabay.com/photos/salad-fresh-veggies-vegetables-791891/',
  },
  'apple-slices': {
    medium: appleSlicesMedium,
    large: appleSlicesLarge,
    alt: 'Pommes tranchées',
    photographer: 'pasja1000',
    page: 'https://pixabay.com/photos/apples-fruits-food-vitamins-sliced-3580560/',
  },
  cookie: {
    medium: cookieMedium,
    large: cookieLarge,
    alt: 'Cookie tout chocolat',
    photographer: 'Pezibear',
    page: 'https://pixabay.com/photos/cookies-baked-goods-chocolate-1372607/',
  },
  brownie: {
    medium: brownieMedium,
    large: brownieLarge,
    alt: 'Brownie noix de pécan',
    photographer: '350543',
    page: 'https://pixabay.com/photos/brownie-snack-de-chocolate-dessert-852979/',
  },
  sundae: {
    medium: sundaeMedium,
    large: sundaeLarge,
    alt: 'Sundae caramel',
    photographer: 'garten-gg',
    page: 'https://pixabay.com/photos/meal-food-ice-cream-sundae-cute-3691222/',
  },
  'apple-donut': {
    medium: appleDonutMedium,
    large: appleDonutLarge,
    alt: 'Beignet à la pomme',
    photographer: 'pixel1',
    page: 'https://pixabay.com/photos/donuts-chocolate-apple-fritter-963087/',
  },
  'soda-33': {
    medium: soda33Medium,
    large: soda33Large,
    alt: 'Soda, 33 cl',
    photographer: 'igorovsyannykov',
    page: 'https://pixabay.com/photos/beverages-bottles-shelf-cans-coke-3105631/',
  },
  'soda-50': {
    medium: soda50Medium,
    large: soda50Large,
    alt: 'Soda, 50 cl',
    photographer: 'chachbrand',
    page: 'https://pixabay.com/photos/hamburger-cheeseburger-fast-food-10450066/',
  },
  'iced-tea-50': {
    medium: icedTea50Medium,
    large: icedTea50Large,
    alt: 'Thé glacé pêche, 50 cl',
    photographer: 'JillWellington',
    page: 'https://pixabay.com/photos/tea-biscuit-still-life-cookie-6101059/',
  },
  'water-50': {
    medium: water50Medium,
    large: water50Large,
    alt: 'Eau minérale, 50 cl',
    photographer: 'Orxxen',
    page: 'https://pixabay.com/photos/bottle-caps-bottle-beer-soda-4890369/',
  },
  'orange-juice-25': {
    medium: orangeJuice25Medium,
    large: orangeJuice25Large,
    alt: 'Jus d’orange, 25 cl',
    photographer: 'Couleur',
    page: 'https://pixabay.com/photos/carrot-juice-glasses-drink-juice-1623157/',
  },
  coffee: {
    medium: coffeeMedium,
    large: coffeeLarge,
    alt: 'Café',
    photographer: 'cocoparisienne',
    page: 'https://pixabay.com/photos/coffee-coffee-cup-cup-drink-beans-2714970/',
  },
  milkshake: {
    medium: milkshakeMedium,
    large: milkshakeLarge,
    alt: 'Milkshake vanille, chocolat ou fraise',
    photographer: 'danymena88',
    page: 'https://pixabay.com/photos/dessert-drink-ice-cream-beverage-2199271/',
  },
}
