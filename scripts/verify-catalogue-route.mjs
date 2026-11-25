#!/usr/bin/env node
// =============================================================================
// Vérification de la route préconstruite du catalogue
// =============================================================================
// Le catalogue est servi par `server/api/catalogue.json.get.ts`, route déclarée
// dans `nitro.prerender.routes`. Elle n'est donc exécutée qu'une fois, au
// build, et sa réponse écrite en fichier statique.
//
// Rien dans le code ne signale l'oubli de cette déclaration : la route
// continuerait de fonctionner sur le serveur de développement, et ne
// répondrait plus qu'en production, où aucun processus Node ne tourne. Ce
// script lit le fichier produit et échoue s'il manque ou s'il ne décrit pas une
// liste de produits.
//
// Usage : node scripts/verify-catalogue-route.mjs

import { readFileSync } from 'node:fs'

const FILE = '.output/public/api/catalogue.json'
const CATEGORIES = ['burgers', 'chicken', 'sides', 'desserts', 'drinks']

let raw

try {
  raw = readFileSync(FILE, 'utf8')
} catch {
  console.error(`Fichier absent : ${FILE}`)
  console.error(`La route du catalogue n'a pas été préconstruite. Vérifier que`)
  console.error(`'/api/catalogue.json' figure dans nitro.prerender.routes, puis relancer`)
  console.error(`\`pnpm generate\`.`)
  process.exit(1)
}

let products

try {
  products = JSON.parse(raw)
} catch (error) {
  console.error(`${FILE} n'est pas du JSON valide : ${error.message}`)
  process.exit(1)
}

if (!Array.isArray(products) || products.length === 0) {
  console.error(`${FILE} ne décrit pas une liste de produits non vide.`)
  process.exit(1)
}

const invalid = products.filter(
  (product) =>
    typeof product?.id !== 'string' ||
    !CATEGORIES.includes(product?.category) ||
    !Number.isInteger(product?.priceCents),
)

if (invalid.length > 0) {
  console.error(`${invalid.length} produit(s) de ${FILE} ont une forme inattendue.`)
  console.error(`Premier en cause : ${JSON.stringify(invalid[0])}`)
  process.exit(1)
}

const byCategory = CATEGORIES.map(
  (category) => `${category} ${products.filter((product) => product.category === category).length}`,
).join(', ')

console.log(`${FILE} : ${products.length} produits (${byCategory}).`)
