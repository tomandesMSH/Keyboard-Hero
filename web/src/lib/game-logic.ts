// Pure, framework-free gamification helpers.

export const LEVEL_TITLES = [
  'Nováček',
  'Začátečník',
  'Talent',
  'Šikovný hráč',
  'Mistr kláves',
  'Virtuoz',
  'Legenda',
] as const

export const STARS_PER_LEVEL = 10

export interface LevelInfo {
  level: number
  title: string
  starsInLevel: number
  starsToNext: number
  progress: number
}

export function computeLevel(stars: number | undefined): LevelInfo {
  const safeStars = Math.max(0, stars || 0)
  const level = 1 + Math.floor(safeStars / STARS_PER_LEVEL)
  const titleIndex = Math.min(level - 1, LEVEL_TITLES.length - 1)
  let title: string = LEVEL_TITLES[titleIndex]
  if (level > LEVEL_TITLES.length) {
    title = `${LEVEL_TITLES[LEVEL_TITLES.length - 1]} +${level - LEVEL_TITLES.length}`
  }
  const starsInLevel = safeStars % STARS_PER_LEVEL
  return {
    level,
    title,
    starsInLevel,
    starsToNext: STARS_PER_LEVEL - starsInLevel,
    progress: starsInLevel / STARS_PER_LEVEL,
  }
}

export interface BadgeContext {
  stars?: number
  streak?: number
  totalRecordings?: number
  perfectWeek?: boolean
  daysPlayedThisWeek?: number
  weeklyCount?: number
}

interface SafeBadgeContext {
  stars: number
  streak: number
  totalRecordings: number
  perfectWeek: boolean
  daysPlayedThisWeek: number
  weeklyCount: number
}

interface BadgeDef {
  id: string
  icon: string
  label: string
  check: (ctx: SafeBadgeContext) => boolean
  progress: (ctx: SafeBadgeContext) => { current: number; target: number }
}

export interface BadgeResult {
  id: string
  icon: string
  label: string
  unlocked: boolean
  progressLabel?: string
}

export const BADGES: BadgeDef[] = [
  { id: 'novacek', icon: '🌱', label: 'Nováček', check: (ctx) => ctx.totalRecordings >= 1, progress: (ctx) => ({ current: ctx.totalRecordings, target: 1 }) },
  { id: 'pravidelnost', icon: '🎯', label: 'Pravidelnost', check: (ctx) => ctx.streak >= 3, progress: (ctx) => ({ current: ctx.streak, target: 3 }) },
  { id: 'tyden-v-ohni', icon: '🔥', label: 'Týden v ohni', check: (ctx) => ctx.streak >= 7, progress: (ctx) => ({ current: ctx.streak, target: 7 }) },
  { id: 'mesic-discipliny', icon: '🔥🔥', label: 'Měsíc disciplíny', check: (ctx) => ctx.streak >= 30, progress: (ctx) => ({ current: ctx.streak, target: 30 }) },
  { id: 'stoleti-legenda', icon: '🔥🔥🔥', label: 'Stoletá legenda', check: (ctx) => ctx.streak >= 100, progress: (ctx) => ({ current: ctx.streak, target: 100 }) },
  { id: 'deset-melodii', icon: '🎵', label: 'Deset melodií', check: (ctx) => ctx.totalRecordings >= 10, progress: (ctx) => ({ current: ctx.totalRecordings, target: 10 }) },
  { id: 'padesat-melodii', icon: '🎼', label: 'Padesát melodií', check: (ctx) => ctx.totalRecordings >= 50, progress: (ctx) => ({ current: ctx.totalRecordings, target: 50 }) },
  { id: 'maly-virtuoz', icon: '⭐', label: 'Malý virtuoz', check: (ctx) => ctx.stars >= 10, progress: (ctx) => ({ current: ctx.stars, target: 10 }) },
  { id: 'virtuoz', icon: '⭐⭐', label: 'Virtuoz', check: (ctx) => ctx.stars >= 50, progress: (ctx) => ({ current: ctx.stars, target: 50 }) },
  { id: 'perfektni-tyden', icon: '📅', label: 'Perfektní týden', check: (ctx) => !!ctx.perfectWeek, progress: (ctx) => ({ current: ctx.daysPlayedThisWeek, target: 7 }) },
  { id: 'tydenni-cil', icon: '🏁', label: 'Týdenní cíl', check: (ctx) => ctx.weeklyCount >= 3, progress: (ctx) => ({ current: ctx.weeklyCount, target: 3 }) },
]

export function computeBadges(ctx: BadgeContext): BadgeResult[] {
  const safeCtx: SafeBadgeContext = {
    stars: Math.max(0, ctx?.stars || 0),
    streak: Math.max(0, ctx?.streak || 0),
    totalRecordings: Math.max(0, ctx?.totalRecordings || 0),
    perfectWeek: !!ctx?.perfectWeek,
    daysPlayedThisWeek: Math.max(0, ctx?.daysPlayedThisWeek || 0),
    weeklyCount: Math.max(0, ctx?.weeklyCount || 0),
  }
  return BADGES.map((badge) => {
    const unlocked = badge.check(safeCtx)
    const result: BadgeResult = { id: badge.id, icon: badge.icon, label: badge.label, unlocked }
    if (!unlocked) {
      const p = badge.progress(safeCtx)
      const current = Math.min(p.current, p.target)
      result.progressLabel = `${current}/${p.target}`
    }
    return result
  })
}

export interface LeagueEntry {
  name: string
  weeklyCount: number
}

export interface LeagueResult extends LeagueEntry {
  tier: 'gold' | 'silver' | 'bronze'
  rank: number
}

// Students with weeklyCount 0 are excluded — a league only makes sense
// among people who actually practiced this week.
export function computeWeeklyLeague(entries: LeagueEntry[] | undefined): LeagueResult[] {
  const active = (entries || []).filter((e) => e && e.weeklyCount > 0)
  active.sort((a, b) => b.weeklyCount - a.weeklyCount)
  const n = active.length
  return active.map((e, idx) => {
    let tier: LeagueResult['tier']
    if (n <= 2) {
      tier = idx === 0 ? 'gold' : 'silver'
    } else {
      const third = Math.ceil(n / 3)
      if (idx < third) tier = 'gold'
      else if (idx < third * 2) tier = 'silver'
      else tier = 'bronze'
    }
    return { name: e.name, weeklyCount: e.weeklyCount, tier, rank: idx + 1 }
  })
}

export interface MascotSkin {
  id: string
  icon: string
  label: string
  unlockLevel: number
}

export const MASCOT_SKINS: MascotSkin[] = [
  { id: 'noticka', icon: '🎵', label: 'Nota', unlockLevel: 1 },
  { id: 'kytara', icon: '🎸', label: 'Kytara', unlockLevel: 2 },
  { id: 'bubny', icon: '🥁', label: 'Bubny', unlockLevel: 3 },
  { id: 'klavir', icon: '🎹', label: 'Klávesy', unlockLevel: 4 },
  { id: 'mikrofon', icon: '🎤', label: 'Mikrofon', unlockLevel: 5 },
]

export function computeUnlockedSkins(level: number | undefined): MascotSkin[] {
  const safeLevel = Math.max(1, level || 1)
  return MASCOT_SKINS.filter((skin) => skin.unlockLevel <= safeLevel)
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// today is injectable so tests don't depend on the real clock.
export function isPerfectWeek(playedDateKeys: string[], today: Date): boolean {
  const playedSet = new Set(playedDateKeys)
  const dayOfWeek = (today.getDay() + 6) % 7 // 0 = Monday
  for (let i = 0; i <= dayOfWeek; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (dayOfWeek - i))
    if (!playedSet.has(toDateKey(d))) return false
  }
  return true
}

export function hasPlayedToday(playedDateKeys: string[], today: Date): boolean {
  return playedDateKeys.includes(toDateKey(today))
}
