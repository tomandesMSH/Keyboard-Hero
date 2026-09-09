import { supabase } from '../supabase'
import type { ReportedContent } from './types'

export interface ReportInput {
  reporterId: string
  reportedUserId?: string
  practiceLogId?: string
  reason: string
  description?: string
}

export async function reportContent(input: ReportInput): Promise<void> {
  const { error } = await supabase.from('reported_content').insert([
    {
      reporter_id: input.reporterId,
      reported_user_id: input.reportedUserId ?? null,
      practice_log_id: input.practiceLogId ?? null,
      reason: input.reason,
      description: input.description || null,
    },
  ])
  if (error) throw error
}

export async function fetchOpenReports(): Promise<ReportedContent[]> {
  const { data, error } = await supabase
    .from('reported_content')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as ReportedContent[]
}

export async function resolveReport(id: string, moderatorId: string, note?: string): Promise<void> {
  const { error } = await supabase
    .from('reported_content')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: moderatorId,
      resolution_note: note ?? null,
    })
    .eq('id', id)
  if (error) throw error
}

export async function suspendAccount(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ is_banned: true }).eq('id', userId)
  if (error) throw error
}

export async function reinstateAccount(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ is_banned: false }).eq('id', userId)
  if (error) throw error
}
