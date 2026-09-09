import { describe, expect, it } from 'vitest'
import * as KHGame from './game-logic'

describe('computeLevel', () => {
  it('0 stars is level 1 Nováček', () => {
    const result = KHGame.computeLevel(0)
    expect(result.level).toBe(1)
    expect(result.title).toBe('Nováček')
    expect(result.starsInLevel).toBe(0)
    expect(result.starsToNext).toBe(10)
    expect(result.progress).toBe(0)
  })

  it('25 stars is level 3, mid-progress', () => {
    const result = KHGame.computeLevel(25)
    expect(result.level).toBe(3)
    expect(result.title).toBe('Talent')
    expect(result.starsInLevel).toBe(5)
    expect(result.starsToNext).toBe(5)
    expect(result.progress).toBe(0.5)
  })

  it('beyond named levels appends +N', () => {
    const result = KHGame.computeLevel(75) // level 8, only 7 named titles
    expect(result.level).toBe(8)
    expect(result.title).toBe('Legenda +1')
  })

  it('negative/undefined stars treated as 0', () => {
    expect(KHGame.computeLevel(-5).level).toBe(1)
    expect(KHGame.computeLevel(undefined).level).toBe(1)
  })
})

describe('computeBadges', () => {
  it('no activity unlocks nothing', () => {
    const badges = KHGame.computeBadges({ stars: 0, streak: 0, totalRecordings: 0 })
    expect(badges.every((b) => b.unlocked === false)).toBe(true)
    expect(badges.length).toBe(KHGame.BADGES.length)
  })

  it('first recording unlocks only Nováček', () => {
    const badges = KHGame.computeBadges({ stars: 0, streak: 0, totalRecordings: 1 })
    const unlocked = badges.filter((b) => b.unlocked).map((b) => b.id)
    expect(unlocked).toEqual(['novacek'])
  })

  it('streak of 7 unlocks pravidelnost and tyden-v-ohni but not mesic-discipliny', () => {
    const badges = KHGame.computeBadges({ stars: 0, streak: 7, totalRecordings: 0 })
    const unlocked = badges.filter((b) => b.unlocked).map((b) => b.id)
    expect(unlocked).toContain('pravidelnost')
    expect(unlocked).toContain('tyden-v-ohni')
    expect(unlocked).not.toContain('mesic-discipliny')
  })

  it('negative stars/streak/totalRecordings are clamped to 0', () => {
    const badges = KHGame.computeBadges({ stars: -100, streak: -50, totalRecordings: -10 })
    expect(badges.every((b) => b.unlocked === false)).toBe(true)
  })

  it('perfectWeek flag drives perfektni-tyden badge', () => {
    const withoutFlag = KHGame.computeBadges({ perfectWeek: false })
    const withFlag = KHGame.computeBadges({ perfectWeek: true })
    expect(withoutFlag.find((b) => b.id === 'perfektni-tyden')?.unlocked).toBe(false)
    expect(withFlag.find((b) => b.id === 'perfektni-tyden')?.unlocked).toBe(true)
  })

  it('locked badges include a progressLabel, unlocked ones do not', () => {
    const badges = KHGame.computeBadges({ stars: 0, streak: 5, totalRecordings: 0 })
    const pravidelnost = badges.find((b) => b.id === 'pravidelnost') // streak >= 3, unlocked
    const tydenVOhni = badges.find((b) => b.id === 'tyden-v-ohni') // streak >= 7, locked at streak 5
    expect(pravidelnost?.unlocked).toBe(true)
    expect(pravidelnost?.progressLabel).toBeUndefined()
    expect(tydenVOhni?.unlocked).toBe(false)
    expect(tydenVOhni?.progressLabel).toBe('5/7')
  })

  it('progressLabel current is capped at target, never overshoots', () => {
    const badges = KHGame.computeBadges({ stars: 0, streak: 0, totalRecordings: 0 })
    const desetMelodii = badges.find((b) => b.id === 'deset-melodii')
    expect(desetMelodii?.progressLabel).toBe('0/10')
  })

  it('stoleti-legenda unlocks at streak 100 but not 99', () => {
    const almost = KHGame.computeBadges({ streak: 99 })
    const there = KHGame.computeBadges({ streak: 100 })
    expect(almost.find((b) => b.id === 'stoleti-legenda')?.unlocked).toBe(false)
    expect(almost.find((b) => b.id === 'stoleti-legenda')?.progressLabel).toBe('99/100')
    expect(there.find((b) => b.id === 'stoleti-legenda')?.unlocked).toBe(true)
  })

  it('tydenni-cil unlocks when weeklyCount reaches 3', () => {
    const below = KHGame.computeBadges({ weeklyCount: 2 })
    const at = KHGame.computeBadges({ weeklyCount: 3 })
    expect(below.find((b) => b.id === 'tydenni-cil')?.unlocked).toBe(false)
    expect(below.find((b) => b.id === 'tydenni-cil')?.progressLabel).toBe('2/3')
    expect(at.find((b) => b.id === 'tydenni-cil')?.unlocked).toBe(true)
  })

  it('perfektni-tyden progress uses daysPlayedThisWeek out of 7', () => {
    const badges = KHGame.computeBadges({ perfectWeek: false, daysPlayedThisWeek: 4 })
    expect(badges.find((b) => b.id === 'perfektni-tyden')?.progressLabel).toBe('4/7')
  })
})

describe('toDateKey', () => {
  it('formats as YYYY-MM-DD with zero-padding', () => {
    expect(KHGame.toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(KHGame.toDateKey(new Date(2026, 10, 21))).toBe('2026-11-21')
  })
})

describe('isPerfectWeek', () => {
  it('true when every day from Monday through today has an entry', () => {
    const today = new Date(2026, 7, 5)
    const dayOfWeek = (today.getDay() + 6) % 7
    const played: string[] = []
    for (let i = 0; i <= dayOfWeek; i++) {
      const d = new Date(2026, 7, 5 - (dayOfWeek - i))
      played.push(KHGame.toDateKey(d))
    }
    expect(KHGame.isPerfectWeek(played, today)).toBe(true)
  })

  it('false when a day earlier in the week is missing', () => {
    const today = new Date(2026, 7, 5)
    const dayOfWeek = (today.getDay() + 6) % 7
    if (dayOfWeek === 0) return // today is Monday, nothing earlier to remove
    const played = [KHGame.toDateKey(today)] // only today, missing earlier days
    expect(KHGame.isPerfectWeek(played, today)).toBe(false)
  })
})

describe('hasPlayedToday', () => {
  it('true only if today key present', () => {
    const today = new Date(2026, 7, 5)
    expect(KHGame.hasPlayedToday([KHGame.toDateKey(today)], today)).toBe(true)
    expect(KHGame.hasPlayedToday(['2026-08-04'], today)).toBe(false)
  })
})

describe('computeWeeklyLeague', () => {
  it('sorts descending by weeklyCount and excludes zero-count students', () => {
    const league = KHGame.computeWeeklyLeague([
      { name: 'Anna', weeklyCount: 5 },
      { name: 'Bedřich', weeklyCount: 0 },
      { name: 'Cyril', weeklyCount: 8 },
    ])
    expect(league.map((e) => e.name)).toEqual(['Cyril', 'Anna'])
    expect(league[0].rank).toBe(1)
    expect(league[1].rank).toBe(2)
  })

  it('assigns gold/silver/bronze in thirds for larger groups', () => {
    const league = KHGame.computeWeeklyLeague([
      { name: 'A', weeklyCount: 9 },
      { name: 'B', weeklyCount: 8 },
      { name: 'C', weeklyCount: 7 },
      { name: 'D', weeklyCount: 6 },
      { name: 'E', weeklyCount: 5 },
      { name: 'F', weeklyCount: 4 },
    ])
    expect(league.map((e) => e.tier)).toEqual(['gold', 'gold', 'silver', 'silver', 'bronze', 'bronze'])
  })

  it('single active student gets gold, empty input returns empty array', () => {
    const solo = KHGame.computeWeeklyLeague([{ name: 'Solo', weeklyCount: 1 }])
    expect(solo[0].tier).toBe('gold')
    expect(KHGame.computeWeeklyLeague([])).toEqual([])
    expect(KHGame.computeWeeklyLeague(undefined)).toEqual([])
  })
})

describe('computeUnlockedSkins', () => {
  it('level 1 unlocks only the first skin, higher levels unlock more', () => {
    const atLevel1 = KHGame.computeUnlockedSkins(1)
    const atLevel3 = KHGame.computeUnlockedSkins(3)
    const atLevel10 = KHGame.computeUnlockedSkins(10)
    expect(atLevel1.map((s) => s.id)).toEqual(['noticka'])
    expect(atLevel3.map((s) => s.id)).toEqual(['noticka', 'kytara', 'bubny'])
    expect(atLevel10.length).toBe(KHGame.MASCOT_SKINS.length)
  })

  it('missing/invalid level falls back to level 1', () => {
    expect(KHGame.computeUnlockedSkins(undefined).map((s) => s.id)).toEqual(['noticka'])
    expect(KHGame.computeUnlockedSkins(0).map((s) => s.id)).toEqual(['noticka'])
  })
})
