#!/usr/bin/env node
// =============================================================================
// Vérification des contrastes de la palette
// =============================================================================
// Lit les custom properties de `assets/scss/1-settings/_colors.scss`, calcule
// le ratio de contraste de chaque paire déclarée ci-dessous, et échoue si une
// paire descend sous son seuil.
//
// Aucune dépendance : le calcul tient en vingt lines et une bibliothèque
// serait une dépendance sans besoin démontré.
//
// Formules issues de WCAG 2.2 :
//   - luminance relative d'un canal : c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ^ 2.4
//   - ratio de contraste : (L_clair + 0.05) / (L_sombre + 0.05)
//
// Usage : node scripts/verify-contrasts.mjs

import { readFileSync } from 'node:fs'

const FILE = 'app/assets/scss/1-settings/_colors.scss'

// Paires réellement utilisées par l'interface. Une paire absente de cette liste
// n'est pas vérifiée : ajouter une combinaison de couleurs dans un composant
// impose donc de l'ajouter ici.
const PAIRS = [
  // Texte courant sur les surfaces — seuil 4.5:1
  ['ink', 'background', 4.5, 'texte principal sur le fond général'],
  ['ink', 'surface', 4.5, 'texte principal sur une carte produit'],
  ['ink', 'surface-muted', 4.5, 'texte principal sur une zone secondaire'],
  ['ink-muted', 'background', 4.5, 'texte secondaire sur le fond général'],
  ['ink-muted', 'surface', 4.5, 'texte secondaire sur une carte produit'],
  ['ink', 'accent-muted', 4.5, 'texte sur un fond de mise en avant'],
  ['ink', 'teal-muted', 4.5, 'texte sur un fond de confirmation'],
  ['ink', 'error-muted', 4.5, 'texte sur un fond d’erreur'],
  ['disabled', 'disabled-surface', 4.5, 'libellé d’un produit indisponible'],

  // Texte sur les fonds accentués — seuil 4.5:1
  ['ink-inverse', 'accent', 4.5, 'libellé d’un bouton principal'],
  ['ink-inverse', 'accent-pressed', 4.5, 'libellé d’un bouton principal appuyé'],
  ['ink-inverse', 'teal', 4.5, 'libellé sur fond de confirmation appuyé'],
  ['ink-inverse', 'error', 4.5, 'libellé sur fond d’erreur appuyé'],

  // Texte accentué sur surface claire — seuil 4.5:1
  ['accent', 'background', 4.5, 'prix mis en avant sur le fond général'],
  ['accent', 'surface', 4.5, 'prix mis en avant sur une carte produit'],
  ['error', 'background', 4.5, 'message d’erreur sur le fond général'],
  ['teal', 'background', 4.5, 'mention de disponibilité sur le fond général'],

  // Composants d'interface et bordures porteuses de sens — seuil 3:1
  ['border', 'background', 3, 'bordure de champ sur le fond général'],
  ['border', 'surface', 3, 'bordure de carte sur fond blanc'],
  ['accent', 'surface-muted', 3, 'contour d’un contrôle accentué'],

  // Indicateur de focus contre les couleurs adjacentes — seuil 3:1
  ['focus', 'background', 3, 'anneau de focus sur le fond général'],
  ['focus', 'surface', 3, 'anneau de focus sur une carte produit'],
  ['focus-halo', 'focus', 3, 'liseré de focus contre l’anneau'],
]

// L'indicateur de focus est à deux tons : un anneau sombre doublé d'un liseré
// clair. Le critère WCAG 2.4.13 est satisfait dès que l'un des deux tons atteint
// 3:1 contre la couleur adjacente, et non les deux. Sur un bouton terracotta,
// l'anneau sombre n'y suffit pas ; c'est le liseré clair qui porte le contraste.
// Chaque group ci-dessous exige donc qu'au moins une de ses paires passe.
const AT_LEAST_ONE_GROUPS = [
  {
    label: 'indicateur de focus sur un bouton principal',
    threshold: 3,
    pairs: [
      ['focus', 'accent'],
      ['focus-halo', 'accent'],
    ],
  },
  {
    label: 'indicateur de focus sur un bouton principal appuyé',
    threshold: 3,
    pairs: [
      ['focus', 'accent-pressed'],
      ['focus-halo', 'accent-pressed'],
    ],
  },
]

function readTokens(filePath) {
  const source = readFileSync(filePath, 'utf8')
  const tokens = new Map()
  const pattern = /--color-([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi
  let match
  while ((match = pattern.exec(source)) !== null) {
    tokens.set(match[1], match[2].toLowerCase())
  }
  return tokens
}

function luminance(hex) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, v, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * v + 0.0722 * b
}

function contrast(hexA, hexB) {
  const a = luminance(hexA)
  const b = luminance(hexB)
  const clair = Math.max(a, b)
  const sombre = Math.min(a, b)
  return (clair + 0.05) / (sombre + 0.05)
}

const tokens = readTokens(FILE)
const failures = []
const lines = []

for (const [foreground, background, threshold, label] of PAIRS) {
  const hexForeground = tokens.get(foreground)
  const hexBackground = tokens.get(background)

  if (!hexForeground || !hexBackground) {
    failures.push(
      `token absent : ${!hexForeground ? `--color-${foreground}` : `--color-${background}`}`,
    )
    continue
  }

  const ratio = contrast(hexForeground, hexBackground)
  const passes = ratio >= threshold
  if (!passes) {
    failures.push(
      `${label} : ${ratio.toFixed(2)}:1 pour un threshold de ${threshold}:1 (--color-${foreground} sur --color-${background})`,
    )
  }
  lines.push(
    `${passes ? 'OK  ' : 'ECHEC'} ${ratio.toFixed(2).padStart(5)}:1  seuil ${String(threshold).padStart(3)}:1  ${label}`,
  )
}

for (const group of AT_LEAST_ONE_GROUPS) {
  const measurements = group.pairs.map(([foreground, background]) => {
    const hexForeground = tokens.get(foreground)
    const hexBackground = tokens.get(background)
    if (!hexForeground || !hexBackground) return { foreground, background, ratio: 0 }
    return { foreground, background, ratio: contrast(hexForeground, hexBackground) }
  })
  const best = measurements.reduce((a, b) => (b.ratio > a.ratio ? b : a))
  const passes = best.ratio >= group.threshold
  if (!passes) {
    failures.push(
      `${group.label} : aucune des ${measurements.length} combinaisons n’atteint ${group.threshold}:1, la meilleure vaut ${best.ratio.toFixed(2)}:1`,
    )
  }
  lines.push(
    `${passes ? 'OK  ' : 'ECHEC'} ${best.ratio.toFixed(2).padStart(5)}:1  seuil ${String(group.threshold).padStart(3)}:1  ${group.label} (par --color-${best.foreground})`,
  )
}

console.log(
  `Contrastes de la palette — ${PAIRS.length} paires déclarées et ${AT_LEAST_ONE_GROUPS.length} groupes à combinaison libre\n`,
)
console.log(lines.join('\n'))

if (failures.length > 0) {
  console.error(`\n${failures.length} paire(s) non conforme(s) :`)
  for (const echec of failures) console.error(`  - ${echec}`)
  process.exit(1)
}

console.log('\nToutes les paires déclarées respectent leur seuil.')
