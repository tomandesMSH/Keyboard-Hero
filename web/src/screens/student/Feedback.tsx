import { useState } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { AudioPlayer } from '../../components/audio/AudioPlayer'
import { Badge } from '../../components/ui/Badge'
import { Toast } from '../../components/ui/Toast'
import { ReportModal } from '../../components/moderation/ReportModal'
import { useAuth } from '../../lib/AuthProvider'
import { useQuery } from '../../lib/data/useQuery'
import { fetchOwnLogs } from '../../lib/data/practiceLogs'
import { reportContent } from '../../lib/data/moderation'
import { useToast } from '../../lib/useToast'
import { getErrorMessage } from '../../lib/errors'
import type { PracticeLog } from '../../lib/data/types'

export function Feedback() {
  const { profile } = useAuth()
  const logs = useQuery(() => (profile ? fetchOwnLogs(profile.id) : Promise.resolve([])), [profile?.id])
  const [reportTarget, setReportTarget] = useState<PracticeLog>()
  const [reporting, setReporting] = useState(false)
  const [reportError, setReportError] = useState<string>()
  const { message, show } = useToast()

  async function handleReport(reason: string, description: string) {
    if (!profile || !reportTarget) return
    setReporting(true)
    setReportError(undefined)
    try {
      await reportContent({
        reporterId: profile.id,
        reportedUserId: reportTarget.graded_by ?? undefined,
        practiceLogId: reportTarget.id,
        reason,
        description,
      })
      setReportTarget(undefined)
      show('Nahlášeno - podívá se na to moderátor.')
    } catch (err) {
      setReportError(getErrorMessage(err, 'Nahlášení se nepovedlo, zkus to znovu.'))
    } finally {
      setReporting(false)
    }
  }

  return (
    <AppShell role="student">
      {message && <Toast message={message} />}
      <div className="space-y-4 flex-1">
        <h1 className="text-xl">Nahrávky</h1>
        {logs.loading && <p className="text-text-muted text-sm">Načítám…</p>}
        {logs.error && (
          <p className="text-sm text-coral-dark">Načtení nahrávek se nepovedlo: {logs.error.message}</p>
        )}
        {logs.data?.length === 0 && (
          <p className="text-text-muted text-sm">Ještě jsi nic nenahrál/a - zkus to na Dashboardu.</p>
        )}

        <div className="space-y-3">
          {logs.data?.map((log) => {
            const graded = log.rating != null
            return (
              <div key={log.id} className="rounded-2xl bg-bg-card shadow-clay-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">
                    {new Date(log.created_at).toLocaleString('cs-CZ')}
                  </span>
                  {graded ? (
                    <Badge tone="success">Ohodnoceno</Badge>
                  ) : (
                    <Badge tone="pending">Čeká na hodnocení</Badge>
                  )}
                </div>

                <AudioPlayer src={log.audio_url} />

                {graded && (
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className={n <= (log.rating ?? 0) ? 'text-coral' : 'text-bg-card-alt'}>
                          ★
                        </span>
                      ))}
                    </div>
                    {log.feedback_good && (
                      <div>
                        <div className="font-heading font-semibold text-xs flex items-center gap-1.5 mb-0.5">
                          <span aria-hidden>✅</span> Co se povedlo
                        </div>
                        <p className="text-text-muted">{log.feedback_good}</p>
                      </div>
                    )}
                    {log.feedback_improve && (
                      <div>
                        <div className="font-heading font-semibold text-xs flex items-center gap-1.5 mb-0.5">
                          <span aria-hidden>🎯</span> Co zlepšit
                        </div>
                        <p className="text-text-muted">{log.feedback_improve}</p>
                      </div>
                    )}
                    <button
                      className="text-xs text-coral-dark"
                      onClick={() => setReportTarget(log)}
                    >
                      Nahlásit
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <ReportModal
        open={!!reportTarget}
        submitting={reporting}
        error={reportError}
        onClose={() => setReportTarget(undefined)}
        onSubmit={handleReport}
      />
    </AppShell>
  )
}
