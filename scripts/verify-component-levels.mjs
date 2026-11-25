#!/usr/bin/env node
// =============================================================================
// Vérification des niveaux d'Atomic Design
// =============================================================================
// Un composant ne consomme que des composants d'un niveau strictement
// inférieur : une molécule compose des atomes, un organisme compose des
// molécules, et jamais l'inverse.
//
// ESLint ne peut pas l'attraper seul. Les composants sont auto-importés par
// Nuxt, donc employés dans un gabarit sans ligne d'import : la règle
// `no-restricted-imports` ne voit rien. Ce script lit les gabarits et compare
// le niveau de chaque composant employé à celui du fichier qui l'emploie.
//
// Usage : node scripts/verify-component-levels.mjs

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'app/components'
const LEVELS = ['atoms', 'molecules', 'organisms']

/** Rang d'un niveau : un composant ne peut employer qu'un rang inférieur. */
const rankOf = (level) => LEVELS.indexOf(level)

function listComponents() {
  const components = new Map()

  for (const level of LEVELS) {
    let entries

    try {
      entries = readdirSync(join(ROOT, level))
    } catch {
      // Un niveau sans dossier est un niveau sans composant, pas une erreur :
      // les organismes arrivent au lot 6.
      continue
    }

    for (const entry of entries.filter((name) => name.endsWith('.vue'))) {
      const name = entry.replace(/\.vue$/, '')

      if (components.has(name)) {
        console.error(`Deux composants portent le nom ${name}, dans deux niveaux différents.`)
        console.error(`Nuxt les auto-importe par leur nom : l'un écraserait l'autre.`)
        process.exit(1)
      }

      components.set(name, { level, path: join(ROOT, level, entry) })
    }
  }

  return components
}

/** Normalise `base-button` et `BaseButton` sur la même clé. */
const toPascalCase = (name) =>
  name.includes('-')
    ? name
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('')
    : name

function usedComponents(source) {
  const template = source.match(/<template>([\s\S]*)<\/template>/)
  if (!template?.[1]) return []

  const used = new Set()

  for (const match of template[1].matchAll(/<([A-Za-z][A-Za-z0-9-]*)/g)) {
    const tag = match[1]
    if (tag === 'template') continue
    used.add(toPascalCase(tag))
  }

  return [...used]
}

const components = listComponents()
const violations = []

for (const [name, { level, path }] of components) {
  const source = readFileSync(path, 'utf8')

  for (const used of usedComponents(source)) {
    const target = components.get(used)
    // Une balise HTML ou un composant de Nuxt n'est pas dans le registre : seuls
    // nos composants sont comparés.
    if (!target || used === name) continue

    if (rankOf(target.level) >= rankOf(level)) {
      violations.push(`${path} emploie <${used}>, de niveau ${target.level}`)
    }
  }
}

console.log(`${components.size} composant(s) : ${[...components.keys()].join(', ') || 'aucun'}`)

if (violations.length > 0) {
  console.error(`\nNiveau d'Atomic Design non respecté :`)
  for (const violation of violations) console.error(`  ${violation}`)
  console.error(`\nUn composant ne consomme qu'un niveau strictement inférieur. Remonter la`)
  console.error(`composition d'un niveau, ou passer le contenu en propriété.`)
  process.exit(1)
}

console.log('Chaque composant ne consomme que des niveaux inférieurs.')
