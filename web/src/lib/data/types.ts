export type UserRole = 'student' | 'teacher' | 'moderator'

export interface Profile {
  id: string
  full_name: string
  username: string | null
  stars: number
  streak: number
  role: UserRole
  // Student registration requires teacher approval; other roles ignore this.
  is_approved: boolean
  // Generic account ban, any role.
  is_banned: boolean
  // Teacher identity verification (spec 5.5). Absent until migration 0003 is
  // applied - treat as unverified if so.
  is_verified?: boolean
  // GDPR consent (spec 1.3). Absent until migration 0006 is applied.
  date_of_birth?: string | null
  consent_given?: boolean
  consent_guardian_name?: string | null
  consent_given_at?: string | null
  // Moderator access, independent of role - a teacher can also hold this.
  // Absent until migration 0012 is applied.
  is_moderator?: boolean
  // Opt-in for a teacher to see this student's non-assigned practice logs
  // (spec 5.3). Absent until migration 0014 is applied.
  share_basic_progress?: boolean
  // Streak freeze bookkeeping (spec 4.3). Absent until migration 0015 is
  // applied.
  streak_freezes_available?: number
  last_practice_date?: string | null
}

export interface Classroom {
  id: string
  teacher_id: string
  name: string
  join_code: string
  created_at: string
}

export interface Assignment {
  id: string
  classroom_id: string
  teacher_id: string
  title: string
  description: string | null
  created_at: string
}

export interface PracticeLog {
  id: string
  user_id: string
  created_at: string
  audio_url: string
  teacher_comment: string | null
  rating: number | null
  feedback_good: string | null
  feedback_improve: string | null
  // Absent until migration 0009 is applied.
  assignment_id?: string | null
  // Absent until migration 0011 is applied; null for anything graded before it.
  graded_by?: string | null
}

export interface ReportedContent {
  id: string
  reporter_id: string
  reported_user_id: string | null
  practice_log_id: string | null
  reason: string
  description: string | null
  status: 'open' | 'resolved'
  created_at: string
  resolved_at: string | null
  resolved_by: string | null
  resolution_note: string | null
}
