import { supabase } from '../supabase'
import type { Profile } from './types'

export async function fetchOwnProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) throw error
  return data as Profile
}

export async function fetchStudents(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'student')
  if (error) throw error
  return (data ?? []) as Profile[]
}

export async function fetchProfilesByIds(ids: string[]): Promise<Profile[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase.from('profiles').select('*').in('id', ids)
  if (error) throw error
  return (data ?? []) as Profile[]
}

export async function approveStudent(studentId: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ is_approved: true }).eq('id', studentId)
  if (error) throw error
}

// Deletes a student's profile, their practice logs, and their uploaded
// recordings. Does NOT delete their auth.users login — that requires the
// Supabase service-role key, which the browser must never have, so a
// deleted student can still authenticate but immediately bounces back to
// the login screen once their profile is gone (see RequireRole).
export async function deleteStudent(studentId: string): Promise<void> {
  const { data: files } = await supabase.storage.from('recordings').list(studentId)
  if (files && files.length > 0) {
    await supabase.storage.from('recordings').remove(files.map((f) => `${studentId}/${f.name}`))
  }

  const { error: logsError } = await supabase.from('practice_logs').delete().eq('user_id', studentId)
  if (logsError) throw logsError

  const { error: profileError } = await supabase.from('profiles').delete().eq('id', studentId)
  if (profileError) throw profileError
}
