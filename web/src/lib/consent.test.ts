import { describe, expect, it } from 'vitest'
import { calculateAge, needsGuardianConsent } from './consent'

describe('calculateAge', () => {
  it('counts a full year before the birthday this year', () => {
    expect(calculateAge('2010-06-15', new Date('2026-06-01'))).toBe(15)
  })

  it('counts the birthday itself as turning the new age', () => {
    expect(calculateAge('2010-06-15', new Date('2026-06-15'))).toBe(16)
  })

  it('counts the day after the birthday as the new age', () => {
    expect(calculateAge('2010-06-15', new Date('2026-06-16'))).toBe(16)
  })
})

describe('needsGuardianConsent', () => {
  it('is true under the age of consent', () => {
    expect(needsGuardianConsent('2015-01-01', new Date('2026-01-01'))).toBe(true)
  })

  it('is false at or above the age of consent', () => {
    expect(needsGuardianConsent('2008-01-01', new Date('2026-01-01'))).toBe(false)
  })
})
