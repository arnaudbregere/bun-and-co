// =============================================================================
// Conversion d'un montant en euros
// =============================================================================
// Les montants sont des entiers de centimes partout : dans le domaine, dans
// les services, dans les propriétés des composants. Ce module est le seul
// endroit du projet où un montant est divisé par cent, et le seul où il
// devient une chaîne.
//
// Centraliser la conversion n'est pas une coquetterie : `5.90 + 1.20 + 0.80`
// vaut `7.9000000000000004` en JavaScript, et une division dispersée dans les
// composants ramène les flottants dans l'affichage.
//
// Ce module vit dans l'interface et non dans le domaine : le domaine ne connaît
// pas la langue d'affichage, et un montant formaté n'est plus calculable.
//
// Deux appelants l'emploient : l'atome Prix, qui affiche le montant, et le
// résumé du panier, qui l'annonce à un lecteur d'écran — une région d'annonce
// ne peut pas contenir un composant, seulement du texte.

import type { Cents } from '../domain/money'

// Une seule instance : construire un formateur est coûteux, et la carte en
// affiche vingt-sept.
const FORMATEUR = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

/** Montant en euros, dans la langue d'affichage de la borne. */
export const formatEuros = (amountCents: Cents): string => FORMATEUR.format(amountCents / 100)

/**
 * Valeur lisible par une machine, en euros décimaux, telle que l'attend
 * l'attribut `value` de l'élément `<data>`.
 */
export const machineEuros = (amountCents: Cents): string => (amountCents / 100).toFixed(2)
