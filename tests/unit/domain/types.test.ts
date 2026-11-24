import { describe, expect, it } from 'vitest'
import {
  ALLERGENS,
  CATEGORIES,
  MENU_SIZES,
  PAYMENT_MODES,
  SERVICE_MODES,
  toCartLineId,
  toExtraId,
  toProductId,
  toRemovableId,
} from '../../../app/domain/types'

describe('vocabulaire du domaine', () => {
  it('énumère les quatorze catégories d’allergènes réglementaires', () => {
    // Règlement européen 1169/2011. La liste est fermée : ni plus, ni moins.
    expect(ALLERGENS).toHaveLength(14)
    expect(new Set(ALLERGENS).size).toBe(14)
  })

  it('énumère les catégories de la carte, les tailles de menu et les modes', () => {
    expect(CATEGORIES).toEqual(['burgers', 'chicken', 'sides', 'desserts', 'drinks'])
    expect(MENU_SIZES).toEqual(['M', 'L', 'XL'])
    expect(SERVICE_MODES).toEqual(['eat-in', 'takeaway'])
    expect(PAYMENT_MODES).toEqual(['card', 'counter'])
  })

  it('construit des identifiants qui conservent leur valeur', () => {
    // Les types nominaux n'existent qu'à la compilation : à l'exécution, un
    // identifiant reste la chaîne qu'on lui a donnée.
    expect(toProductId('classique')).toBe('classique')
    expect(toCartLineId('ligne-1')).toBe('ligne-1')
    expect(toExtraId('bacon')).toBe('bacon')
    expect(toRemovableId('onions')).toBe('onions')
  })
})
