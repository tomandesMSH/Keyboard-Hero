import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AudioPlayer } from '../../components/audio/AudioPlayer'
import { Button } from '../../components/ui/Button'
import { Toast } from '../../components/ui/Toast'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { AppShell } from '../../components/layout/AppShell'
import { AssignToStudentModal } from '../../components/classrooms/AssignToStudentModal'
import { useQuery } from '../../lib/data/useQuery'
import { deletePracticeLog, fetchPendingReview, fetchStudentLogs, submitGrading } from '../../lib/data/practiceLogs'
import { fetchStudents } from '../../lib/data/profiles'
import { useToast } from '../../lib/useToast'
import { useAuth } from '../../lib/AuthProvider'
import { getErrorMessage } from '../../lib/errors'
import type { PracticeLog } from '../../lib/data/types'

interface LocationState {
  studentId?: string
}

export function Grading() {
  const location = useLocation()
  const state = (location.state ?? {}) as LocationState
  const { profile } = useAuth()

  const students = useQuery(() => fetchStudents(), [])
  const logs = useQuery(
    () => (state.studentId ? fetchStudentLogs(state.studentId) : fetchPendingReview()),
    [state.studentId],
  )

  const [selectedLog, setSelectedLog] = useState<PracticeLog>()
  const [rating, setRating] = useState(0)
  const [feedbackGood, setFeedbackGood] = useState('')
  const [feedbackImprove, setFeedbackImprove] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { message, show } = useToast()

  function nameFor(userId: string): string {
    return students.data?.find((s) => s.id === userId)?.full_name ?? 'Žák'
  }

  function selectLog(log: PracticeLog) {
    setSelectedLog(log)
    setRating(log.rating ?? 0)
    setFeedbackGood(log.feedback_good ?? '')
    setFeedbackImprove(log.feedback_improve ?? '')
  }

  async function handleDelete() {
    if (!selectedLog) return
    setDeleteConfirmOpen(false)
    setDeleting(true)
    try {
      await deletePracticeLog(selectedLog)
      show('Nahrávka byla smazána')
      setSelectedLog(undefined)
      logs.refetch()
    } catch (err) {
      show(getErrorMessage(err, 'Smazání se nepovedlo, zkus to znovu.'))
      setDeleting(false)
    }
  }

  async function handleSubmit() {
    if (!selectedLog || !profile) return
    setSubmitting(true)
    try {
      await submitGrading(
        selectedLog.id,
        {
          rating,
          feedback_good: feedbackGood,
          feedback_improve: feedbackImprove,
        },
        profile.id,
      )
      show('Hodnocení odesláno žákovi')
      setSelectedLog(undefined)
      logs.refetch()
    } catch (err) {
      show(getErrorMessage(err, 'Odeslání se nepovedlo, zkus to znovu.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (selectedLog) {
    return (
      <div className="max-w-md md:max-w-lg mx-auto p-5 space-y-4">
        {message && <Toast message={message} />}
        <ConfirmDialog
          open={deleteConfirmOpen}
          title="Smazat nahrávku?"
          message="Nahrávka a s ní spojené hodnocení se nenávratně smažou."
          confirmLabel="Smazat"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirmOpen(false)}
        />
        <div className="flex items-center justify-between gap-2">
          <button className="text-sm text-text-muted" onClick={() => setSelectedLog(undefined)}>
            ← Zpět na seznam
          </button>
          <Button
            variant="destructive"
            className="!px-3 !py-1.5 text-xs shrink-0"
            disabled={deleting}
            onClick={() => setDeleteConfirmOpen(true)}
          >
            Smazat nahrávku
          </Button>
        </div>
        <div>
          <h1 className="text-xl">Hodnocení nahrávky</h1>
          <p className="text-text-muted text-sm">{nameFor(selectedLog.user_id)}</p>
        </div>
        <AudioPlayer src={selectedLog.audio_url} />
        <div>
          <label className="text-sm font-heading font-semibold mb-1.5 flex items-center gap-1.5">
            <span aria-hidden>✅</span> Co se povedlo
          </label>
          <textarea
            className="w-full rounded-xl bg-bg-card-alt shadow-clay-press px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-coral"
            value={feedbackGood}
            onChange={(e) => setFeedbackGood(e.target.value)}
            rows={2}
          />
        </div>
        <div>
          <label className="text-sm font-heading font-semibold mb-1.5 flex items-center gap-1.5">
            <span aria-hidden>🎯</span> Co zlepšit
          </label>
          <textarea
            className="w-full rounded-xl bg-bg-card-alt shadow-clay-press px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-coral"
            value={feedbackImprove}
            onChange={(e) => setFeedbackImprove(e.target.value)}
            rows={2}
          />
        </div>
        <div>
          <label className="text-sm font-heading font-semibold mb-1.5 flex items-center gap-1.5">
            <span aria-hidden>⭐</span> Hodnocení
          </label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} aria-label={`${n} hvězdiček`} className="text-2xl">
                <span className={n <= rating ? 'text-coral' : 'text-bg-card'}>★</span>
              </button>
            ))}
          </div>
        </div>
        <Button className="w-full" disabled={submitting} onClick={handleSubmit}>
          Odeslat hodnocení
        </Button>
      </div>
    )
  }

  return (
    <AppShell role="teacher">
      {message && <Toast message={message} />}
      <div className="space-y-4 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl">
            {state.studentId ? `Nahrávky - ${nameFor(state.studentId)}` : 'Ke kontrole'}
          </h1>
          {state.studentId && (
            <Button className="!px-3 !py-1.5 text-xs shrink-0" onClick={() => setAssignOpen(true)}>
              Zadat úkol pro {nameFor(state.studentId)}
            </Button>
          )}
        </div>
        {logs.loading && <p className="text-text-muted text-sm">Načítám…</p>}
        {logs.data?.length === 0 && <p className="text-text-muted text-sm">Žádné nahrávky ke zobrazení.</p>}
        <div className="space-y-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3 md:space-y-0">
          {logs.data?.map((log) => (
            <button
              key={log.id}
              className="w-full text-left rounded-2xl bg-bg-card shadow-clay-sm p-3.5"
              onClick={() => selectLog(log)}
            >
              <div className="font-heading font-semibold text-sm">{nameFor(log.user_id)}</div>
              <div className="text-text-muted text-xs">
                {new Date(log.created_at).toLocaleString('cs-CZ')}
                {log.teacher_comment ? ' · ohodnoceno' : ' · čeká na hodnocení'}
              </div>
            </button>
          ))}
        </div>
      </div>
      {state.studentId && (
        <AssignToStudentModal
          open={assignOpen}
          studentId={state.studentId}
          studentName={nameFor(state.studentId)}
          onClose={() => setAssignOpen(false)}
          onAssigned={() => show('Úkol byl zadán')}
        />
      )}
    </AppShell>
  )
}
