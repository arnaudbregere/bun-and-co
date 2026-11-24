#!/usr/bin/env node
// =============================================================================
// Vérification des contrastes de la palette
// =============================================================================
// Lit les custom properties de `assets/scss/1-settings/_couleurs.scss`, calcule
// le rapport de contraste de chaque paire déclarée ci-dessous, et échoue si une
// paire descend sous son seuil.
//
// Aucune dépendance : le calcul tient en vingt lignes et une bibliothèque
// serait une dépendance sans besoin démontré.
//
// Formules issues de WCAG 2.2 :
//   - luminance relative d'un canal : c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ^ 2.4
//   - rapport de contraste : (L_clair + 0.05) / (L_sombre + 0.05)
//
// Usage : node scripts/verifier-contrastes.mjs

import { readFileSync } from 'node:fs'

const FICHIER = 'assets/scss/1-settings/_couleurs.scss'

// Paires réellement utilisées par l'interface. Une paire absente de cette liste
// n'est pas vérifiée : ajouter une combinaison de couleurs dans un composant
// impose donc de l'ajouter ici.
const PAIRES = [
  // Texte courant sur les surfaces — seuil 4.5:1
  ['encre', 'fond', 4.5, 'texte principal sur le fond général'],
  ['encre', 'surface', 4.5, 'texte principal sur une carte produit'],
  ['encre', 'surface-sourde', 4.5, 'texte principal sur une zone secondaire'],
  ['encre-sourde', 'fond', 4.5, 'texte secondaire sur le fond général'],
  ['encre-sourde', 'surface', 4.5, 'texte secondaire sur une carte produit'],
  ['encre', 'accent-sourd', 4.5, 'texte sur un fond de mise en avant'],
  ['encre', 'olive-sourd', 4.5, 'texte sur un fond de confirmation'],
  ['encre', 'erreur-sourd', 4.5, 'texte sur un fond d’erreur'],
  ['desactive', 'desactive-fond', 4.5, 'libellé d’un produit indisponible'],

  // Texte sur les fonds accentués — seuil 4.5:1
  ['encre-inversee', 'accent', 4.5, 'libellé d’un bouton principal'],
  ['encre-inversee', 'accent-appuye', 4.5, 'libellé d’un bouton principal appuyé'],
  ['encre-inversee', 'olive', 4.5, 'libellé sur fond de confirmation appuyé'],
  ['encre-inversee', 'erreur', 4.5, 'libellé sur fond d’erreur appuyé'],

  // Texte accentué sur surface claire — seuil 4.5:1
  ['accent', 'fond', 4.5, 'prix mis en avant sur le fond général'],
  ['accent', 'surface', 4.5, 'prix mis en avant sur une carte produit'],
  ['erreur', 'fond', 4.5, 'message d’erreur sur le fond général'],
  ['olive', 'fond', 4.5, 'mention de disponibilité sur le fond général'],

  // Composants d'interface et bordures porteuses de sens — seuil 3:1
  ['bordure', 'fond', 3, 'bordure de champ sur le fond général'],
  ['bordure', 'surface', 3, 'bordure de carte sur fond blanc'],
  ['accent', 'surface-sourde', 3, 'contour d’un contrôle accentué'],

  // Indicateur de focus contre les couleurs adjacentes — seuil 3:1
  ['focus', 'fond', 3, 'anneau de focus sur le fond général'],
  ['focus', 'surface', 3, 'anneau de focus sur une carte produit'],
  ['focus-halo', 'focus', 3, 'liseré de focus contre l’anneau'],
]

// L'indicateur de focus est à deux tons : un anneau sombre doublé d'un liseré
// clair. Le critère WCAG 2.4.13 est satisfait dès que l'un des deux tons atteint
// 3:1 contre la couleur adjacente, et non les deux. Sur un bouton terracotta,
// l'anneau sombre n'y suffit pas ; c'est le liseré clair qui porte le contraste.
// Chaque groupe ci-dessous exige donc qu'au moins une de ses paires passe.
const GROUPES_AU_MOINS_UNE = [
  {
    intitule: 'indicateur de focus sur un bouton principal',
    seuil: 3,
    paires: [
      ['focus', 'accent'],
      ['focus-halo', 'accent'],
    ],
  },
  {
    intitule: 'indicateur de focus sur un bouton principal appuyé',
    seuil: 3,
    paires: [
      ['focus', 'accent-appuye'],
      ['focus-halo', 'accent-appuye'],
    ],
  },
]

function lireTokens(chemin) {
  const source = readFileSync(chemin, 'utf8')
  const tokens = new Map()
  const motif = /--couleur-([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi
  let trouve
  while ((trouve = motif.exec(source)) !== null) {
    tokens.set(trouve[1], trouve[2].toLowerCase())
  }
  return tokens
}

function luminance(hex) {
  const canaux = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, v, b] = canaux.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * v + 0.0722 * b
}

function contraste(hexA, hexB) {
  const a = luminance(hexA)
  const b = luminance(hexB)
  const clair = Math.max(a, b)
  const sombre = Math.min(a, b)
  return (clair + 0.05) / (sombre + 0.05)
}

const tokens = lireTokens(FICHIER)
const echecs = []
const lignes = []

for (const [avant, arriere, seuil, intitule] of PAIRES) {
  const hexAvant = tokens.get(avant)
  const hexArriere = tokens.get(arriere)

  if (!hexAvant || !hexArriere) {
    echecs.push(`token absent : ${!hexAvant ? `--couleur-${avant}` : `--couleur-${arriere}`}`)
    continue
  }

  const rapport = contraste(hexAvant, hexArriere)
  const conforme = rapport >= seuil
  if (!conforme) {
    echecs.push(`${intitule} : ${rapport.toFixed(2)}:1 pour un seuil de ${seuil}:1 (--couleur-${avant} sur --couleur-${arriere})`)
  }
  lignes.push(
    `${conforme ? 'OK  ' : 'ECHEC'} ${rapport.toFixed(2).padStart(5)}:1  seuil ${String(seuil).padStart(3)}:1  ${intitule}`,
  )
}

for (const groupe of GROUPES_AU_MOINS_UNE) {
  const mesures = groupe.paires.map(([avant, arriere]) => {
    const hexAvant = tokens.get(avant)
    const hexArriere = tokens.get(arriere)
    if (!hexAvant || !hexArriere) return { avant, arriere, rapport: 0 }
    return { avant, arriere, rapport: contraste(hexAvant, hexArriere) }
  })
  const meilleure = mesures.reduce((a, b) => (b.rapport > a.rapport ? b : a))
  const conforme = meilleure.rapport >= groupe.seuil
  if (!conforme) {
    echecs.push(
      `${groupe.intitule} : aucune des ${mesures.length} combinaisons n’atteint ${groupe.seuil}:1, la meilleure vaut ${meilleure.rapport.toFixed(2)}:1`,
    )
  }
  lignes.push(
    `${conforme ? 'OK  ' : 'ECHEC'} ${meilleure.rapport.toFixed(2).padStart(5)}:1  seuil ${String(groupe.seuil).padStart(3)}:1  ${groupe.intitule} (par --couleur-${meilleure.avant})`,
  )
}

console.log(
  `Contrastes de la palette — ${PAIRES.length} paires déclarées et ${GROUPES_AU_MOINS_UNE.length} groupes à combinaison libre\n`,
)
console.log(lignes.join('\n'))

if (echecs.length > 0) {
  console.error(`\n${echecs.length} paire(s) non conforme(s) :`)
  for (const echec of echecs) console.error(`  - ${echec}`)
  process.exit(1)
}

console.log('\nToutes les paires déclarées respectent leur seuil.')
