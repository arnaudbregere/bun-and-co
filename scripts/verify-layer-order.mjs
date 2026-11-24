#!/usr/bin/env node
// =============================================================================
// Vérification de l'ordre des couches de styles
// =============================================================================
// L'ordre de la cascade est déclaré dans `app/assets/scss/_layers.scss`. Le
// minificateur CSS ne conserve pas cette déclaration telle quelle : il la
// découpe en déclarations séparées, replacées juste avant la première
// utilisation de chaque couche.
//
// Le résultat observé est correct, mais il dépend du comportement du
// minificateur. Une montée de version pourrait le changer sans que rien
// n'échoue, et toute la discipline de cascade reposerait alors sur une chance.
//
// Ce script lit l'ordre déclaré dans la source, lit l'ordre réellement émis
// dans le CSS construit, et échoue s'ils diffèrent.
//
// Usage : node scripts/verify-layer-order.mjs

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const SOURCE = 'app/assets/scss/_layers.scss'
const BUILD_DIRECTORY = '.output/public/_nuxt'

function readDeclaredOrder() {
  const source = readFileSync(SOURCE, 'utf8')
  const match = source.match(/@layer\s+([a-z0-9,\s-]+);/i)

  if (!match?.[1]) {
    throw new Error(`Aucune déclaration @layer trouvée dans ${SOURCE}.`)
  }

  return match[1]
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
}

function readEmittedOrder() {
  const files = readdirSync(BUILD_DIRECTORY).filter((name) => name.endsWith('.css'))

  if (files.length === 0) {
    throw new Error(
      `Aucun fichier CSS dans ${BUILD_DIRECTORY}. Lancer \`pnpm generate\` avant ce script.`,
    )
  }

  const seen = []

  for (const file of files) {
    const css = readFileSync(join(BUILD_DIRECTORY, file), 'utf8')

    // Capture aussi bien `@layer settings{…}` que `@layer tools;` ou
    // `@layer components,utilities;`.
    for (const match of css.matchAll(/@layer\s+([a-z0-9,\s-]+?)\s*[{;]/gi)) {
      for (const name of match[1].split(',')) {
        const layer = name.trim()
        if (layer && !seen.includes(layer)) seen.push(layer)
      }
    }
  }

  return seen
}

const declared = readDeclaredOrder()
const emitted = readEmittedOrder()

// Le CSS construit peut ne pas utiliser toutes les couches déclarées. On ne
// compare donc que celles effectivement émises, en vérifiant qu'elles
// apparaissent dans le même ordre relatif que dans la déclaration.
const expected = declared.filter((layer) => emitted.includes(layer))
const unknown = emitted.filter((layer) => !declared.includes(layer))

console.log(`Ordre déclaré  : ${declared.join(', ')}`)
console.log(`Ordre émis     : ${emitted.join(', ')}`)

if (unknown.length > 0) {
  console.error(`\nCouche émise mais non déclarée : ${unknown.join(', ')}`)
  console.error(`Toute couche doit être déclarée dans ${SOURCE}, faute de quoi son rang dépend`)
  console.error(`de son ordre d'apparition dans le CSS.`)
  process.exit(1)
}

const actual = emitted.join(',')
const wanted = expected.join(',')

if (actual !== wanted) {
  console.error(`\nL'ordre émis ne correspond pas à l'ordre déclaré.`)
  console.error(`  attendu : ${wanted}`)
  console.error(`  obtenu  : ${actual}`)
  console.error(`\nLa discipline de cascade n'est plus garantie : une règle d'une couche basse`)
  console.error(`peut désormais l'emporter sur une couche haute.`)
  process.exit(1)
}

console.log('\nL’ordre des couches émises correspond à l’ordre déclaré.')
