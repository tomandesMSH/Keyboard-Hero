import type { Profile } from './data/types'

// "teacheradmin" is not a value of profiles.role - role = 'teacher' is
// hardcoded in many RLS policies (0002, 0013, 0019), so a new role value would
// silently strip a combined account of its teacher permissions. It's the
// combination migration 0012 already designed: a teacher who also holds the
// is_moderator flag. This is the one place the app names that combination.
export function isTeacherAdmin(profile: Pick<Profile, 'role' | 'is_moderator'>): boolean {
  return profile.role === 'teacher' && !!profile.is_moderator
}
