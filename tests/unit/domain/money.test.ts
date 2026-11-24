import { describe, expect, it } from 'vitest'
import { ZERO_CENTS, addCents, cents, multiplyCents, sumCents } from '../../../app/domain/money'

describe('montants', () => {
  it('accepte un entier de centimes', () => {
    expect(cents(590)).toBe(590)
    expect(ZERO_CENTS).toBe(0)
  })

  it('refuse un nombre à virgule', () => {
    // C'est la raison d'être du type : 5.90 est un prix en euros, et rien dans
    // le domaine ne doit manipuler d'euros.
    expect(() => cents(5.9)).toThrow(RangeError)
    expect(() => cents(0.1 + 0.2)).toThrow(RangeError)
  })

  it('refuse un montant négatif ou non fini', () => {
    expect(() => cents(-1)).toThrow(RangeError)
    expect(() => cents(Number.NaN)).toThrow(RangeError)
    expect(() => cents(Number.POSITIVE_INFINITY)).toThrow(RangeError)
  })

  it('additionne sans perte', () => {
    // En euros, 5.90 + 1.20 + 0.80 vaut 7.9000000000000004.
    expect(addCents(cents(590), cents(120))).toBe(710)
    expect(sumCents([cents(590), cents(120), cents(80)])).toBe(790)
    expect(sumCents([])).toBe(0)
  })

  it('multiplie par une quantité entière', () => {
    expect(multiplyCents(cents(590), 3)).toBe(1770)
    expect(multiplyCents(cents(590), 0)).toBe(0)
  })

  it('refuse une quantité non entière ou négative', () => {
    expect(() => multiplyCents(cents(590), 1.5)).toThrow(RangeError)
    expect(() => multiplyCents(cents(590), -1)).toThrow(RangeError)
  })
})
