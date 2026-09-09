import { supabase } from '../supabase'
import { toDateKey } from '../game-logic'
import type { PracticeLog } from './types'

export async function fetchOwnLogs(userId: string): Promise<PracticeLog[]> {
  const { data, error } = await supabase
    .from('practice_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as PracticeLog[]
}

export async function fetchOwnLogsCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('practice_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  if (error) throw error
  return count ?? 0
}

export interface WeeklyStats {
  dateKeys: string[]
  weeklyCount: number
}

// today is injectable so callers can compute deterministically in tests.
export async function fetchWeeklyStats(userId: string, today: Date): Promise<WeeklyStats> {
  const dayOfWeek = (today.getDay() + 6) % 7 // 0 = Monday
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dayOfWeek)
  const { data, error } = await supabase
    .from('practice_logs')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', monday.toISOString())
  if (error) throw error
  const dateKeys = (data ?? []).map((row) => toDateKey(new Date(row.created_at as string)))
  return { dateKeys: Array.from(new Set(dateKeys)), weeklyCount: data?.length ?? 0 }
}

export async function fetchPendingReview(): Promise<PracticeLog[]> {
  const { data, error } = await supabase
    .from('practice_logs')
    .select('*')
    .is('teacher_comment', null)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as PracticeLog[]
}

export async function fetchLogsByIds(ids: string[]): Promise<PracticeLog[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase.from('practice_logs').select('*').in('id', ids)
  if (error) throw error
  return (data ?? []) as PracticeLog[]
}

export async function fetchStudentLogs(studentId: string): Promise<PracticeLog[]> {
  const { data, error } = await supabase
    .from('practice_logs')
    .select('*')
    .eq('user_id', studentId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as PracticeLog[]
}

export interface GradingInput {
  rating: number
  feedback_good: string
  feedback_improve: string
}

export async function submitGrading(logId: string, input: GradingInput, gradedBy: string): Promise<void> {
  // Also fill teacher_comment for backward compatibility with the old
  // single-field model, in case anything still reads it.
  const { error } = await supabase
    .from('practice_logs')
    .update({
      rating: input.rating,
      feedback_good: input.feedback_good,
      feedback_improve: input.feedback_improve,
      teacher_comment: input.feedback_good,
      graded_by: gradedBy,
    })
    .eq('id', logId)
  if (error) throw error
}

const RECORDINGS_BUCKET = 'recordings'

export async function uploadRecording(userId: string, blob: Blob): Promise<string> {
  const fileName = `${userId}/${Date.now()}.wav`
  const { error: uploadError } = await supabase.storage
    .from(RECORDINGS_BUCKET)
    .upload(fileName, blob, { contentType: 'audio/wav' })
  if (uploadError) throw uploadError
  const { data } = supabase.storage.from(RECORDINGS_BUCKET).getPublicUrl(fileName)
  return data.publicUrl
}

export async function insertPracticeLog(userId: string, audioUrl: string, assignmentId?: string): Promise<void> {
  const { error } = await supabase
    .from('practice_logs')
    .insert([{ user_id: userId, audio_url: audioUrl, assignment_id: assignmentId ?? null }])
  if (error) throw error
}

// Which of the given assignment ids already have a submitted recording
// from this student.
export async function fetchCompletedAssignmentIds(userId: string, assignmentIds: string[]): Promise<Set<string>> {
  if (assignmentIds.length === 0) return new Set()
  const { data, error } = await supabase
    .from('practice_logs')
    .select('assignment_id')
    .eq('user_id', userId)
    .in('assignment_id', assignmentIds)
  if (error) throw error
  return new Set((data ?? []).map((row) => row.assignment_id as string))
}
