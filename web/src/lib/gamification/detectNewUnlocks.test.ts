import { beforeEach, describe, expect, it } from 'vitest'
import { detectNewUnlocks } from './detectNewUnlocks'

const USER_ID = 'test-user'

beforeEach(() => {
  localStorage.clear()
})

describe('detectNewUnlocks', () => {
  it('reports nothing new on the very first call (seeds the baseline)', () => {
    const result = detectNewUnlocks(USER_ID, 15, { stars: 15, streak: 1, totalRecordings: 1 })
    expect(result.newLevel).toBe(false)
    expect(result.newBadgeIds).toEqual([])
    expect(result.level).toBe(2)
  })

  it('detects a new level after crossing a threshold', () => {
    detectNewUnlocks(USER_ID, 5, { stars: 5, streak: 1, totalRecordings: 1 })
    const result = detectNewUnlocks(USER_ID, 15, { stars: 15, streak: 1, totalRecordings: 1 })
    expect(result.newLevel).toBe(true)
    expect(result.level).toBe(2)
  })

  it('detects a newly unlocked badge', () => {
    detectNewUnlocks(USER_ID, 5, { stars: 5, streak: 1, totalRecordings: 1 })
    const result = detectNewUnlocks(USER_ID, 5, { stars: 5, streak: 3, totalRecordings: 1 })
    expect(result.newBadgeIds).toContain('pravidelnost')
  })

  it('reports nothing new when nothing changed', () => {
    detectNewUnlocks(USER_ID, 5, { stars: 5, streak: 1, totalRecordings: 1 })
    const result = detectNewUnlocks(USER_ID, 5, { stars: 5, streak: 1, totalRecordings: 1 })
    expect(result.newLevel).toBe(false)
    expect(result.newBadgeIds).toEqual([])
  })
})
