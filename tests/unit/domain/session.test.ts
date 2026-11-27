import { describe, expect, it } from 'vitest'
import {
  limiteDInactiviteCourt,
  PALIERS_DE_SURSIS,
  SECONDES_APRES_PROLONGATION,
  SECONDES_AVANT_AVERTISSEMENT,
  SECONDES_AVANT_VEILLE,
  SECONDES_DE_SURSIS,
} from '../../../app/domain/session'

describe('règles de session', () => {
  it('tient les délais de l’exigence EF-035', () => {
    expect(SECONDES_AVANT_AVERTISSEMENT).toBe(90)
    expect(SECONDES_DE_SURSIS).toBe(20)
  })

  it('accorde au moins les vingt secondes du test RGAA 13.1.3', () => {
    // Le test exige un délai suffisant pour réagir à l'avertissement, et
    // vingt secondes en sont le minimum.
    expect(SECONDES_DE_SURSIS).toBeGreaterThanOrEqual(20)
  })

  it('annonce le sursis par paliers, et non chaque seconde', () => {
    // Vingt annonces courtoises en vingt secondes couvriraient la question
    // posée par l'avertissement.
    expect(PALIERS_DE_SURSIS.length).toBeLessThan(SECONDES_DE_SURSIS)
    expect([...PALIERS_DE_SURSIS]).toEqual([10, 5])

    // Un palier hors du sursis ne serait jamais atteint.
    for (const palier of PALIERS_DE_SURSIS) {
      expect(palier).toBeGreaterThan(0)
      expect(palier).toBeLessThan(SECONDES_DE_SURSIS)
    }
  })

  it('porte le délai du ticket au décuple après prolongation', () => {
    // Exigence EF-034 et test RGAA 13.1.3 : « dix fois, au moins ».
    expect(SECONDES_AVANT_VEILLE).toBe(15)
    expect(SECONDES_APRES_PROLONGATION).toBe(SECONDES_AVANT_VEILLE * 10)
  })

  it('ne fait courir aucune limite sur la veille ni sur le ticket', () => {
    // Exigence EF-038.
    expect(limiteDInactiviteCourt('/')).toBe(false)
    expect(limiteDInactiviteCourt('/ticket')).toBe(false)
  })

  it('ne fait courir aucune limite sur l’atelier des composants', () => {
    // L'atelier n'est pas un écran du parcours : une page de vérification qui
    // se renvoie seule en veille ne se vérifie plus.
    expect(limiteDInactiviteCourt('/workshop')).toBe(false)
  })

  it('fait courir la limite sur les écrans de commande', () => {
    // Exigences EF-035 à EF-037 : ce sont les écrans où un panier se perd.
    expect(limiteDInactiviteCourt('/mode')).toBe(true)
    expect(limiteDInactiviteCourt('/carte')).toBe(true)
    expect(limiteDInactiviteCourt('/produit/classique')).toBe(true)
    expect(limiteDInactiviteCourt('/panier')).toBe(true)
    expect(limiteDInactiviteCourt('/paiement')).toBe(true)
  })
})
