import { describe, expect, it } from 'vitest'

// Test témoin du harnais unitaire. Il ne vérifie aucune règle métier : il
// garantit que Vitest démarre, résout la configuration du projet et applique
// TypeScript. Il sera rejoint par les tests du domaine au lot 4.
describe('harnais de test unitaire', () => {
  it('exécute une assertion', () => {
    expect(1 + 1).toBe(2)
  })

  it('applique le typage strict des montants en centimes', () => {
    const prixCentimes = 590
    const supplementCentimes = 120

    // La règle de calcul du projet : des entiers de centimes, jamais de nombres
    // à virgule flottante. En euros, 5.90 + 1.20 vaudrait 7.100000000000001.
    expect(prixCentimes + supplementCentimes).toBe(710)
  })
})
