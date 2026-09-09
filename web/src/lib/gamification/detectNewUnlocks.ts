import { computeBadges, computeLevel, type BadgeContext } from '../game-logic'

interface UnlockState {
  level: number
  badgeIds: string[]
}

export interface DetectResult {
  newLevel: boolean
  newBadgeIds: string[]
  level: number
}

const STORAGE_PREFIX = 'kh_seen_'

function readState(userId: string): UnlockState | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userId)
    if (!raw) return null
    return JSON.parse(raw) as UnlockState
  } catch {
    return null
  }
}

function writeState(userId: string, state: UnlockState): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(state))
  } catch {
    // localStorage unavailable (private mode) — persistence is best-effort only.
  }
}

// Compares current level/badges against what was last seen (in localStorage)
// for this user and reports what's newly unlocked. On the very first call for
// a user (no stored baseline yet) nothing is reported as "new" — we're only
// seeding the baseline, not celebrating pre-existing progress.
export function detectNewUnlocks(userId: string, stars: number, badgeCtx: BadgeContext): DetectResult {
  const level = computeLevel(stars).level
  const unlockedBadgeIds = computeBadges(badgeCtx)
    .filter((b) => b.unlocked)
    .map((b) => b.id)
  const previous = readState(userId)

  const newLevel = previous !== null && level > previous.level
  const newBadgeIds =
    previous !== null ? unlockedBadgeIds.filter((id) => !previous.badgeIds.includes(id)) : []

  writeState(userId, { level, badgeIds: unlockedBadgeIds })

  return { newLevel, newBadgeIds, level }
}
