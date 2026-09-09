import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { AudioPlayer } from '../../components/audio/AudioPlayer'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { PasswordReauthModal } from '../../components/ui/PasswordReauthModal'
import { Toast } from '../../components/ui/Toast'
import { useAuth } from '../../lib/AuthProvider'
import { useQuery } from '../../lib/data/useQuery'
import { fetchOpenReports, resolveReport, suspendAccount } from '../../lib/data/moderation'
import { fetchProfilesByIds } from '../../lib/data/profiles'
import { fetchLogsByIds } from '../../lib/data/practiceLogs'
import { signOut } from '../../lib/auth'
import { isReauthed } from '../../lib/reauth'
import { useToast } from '../../lib/useToast'
import { getErrorMessage } from '../../lib/errors'

interface SuspendTarget {
  reportId: string
  userId: string
  name: string
}

export function Queue() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const reports = useQuery(() => fetchOpenReports(), [])

  const userIds = Array.from(
    new Set((reports.data ?? []).flatMap((r) => [r.reporter_id, r.reported_user_id].filter((v): v is string => !!v))),
  )
  const profiles = useQuery(() => fetchProfilesByIds(userIds), [userIds.join(',')])

  const logIds = (reports.data ?? []).map((r) => r.practice_log_id).filter((v): v is string => !!v)
  const logs = useQuery(() => fetchLogsByIds(logIds), [logIds.join(',')])

  const [resolving, setResolving] = useState<string>()
  const [reauthOpen, setReauthOpen] = useState(false)
  const [suspendTarget, setSuspendTarget] = useState<SuspendTarget>()
  const { message, show } = useToast()

  function nameFor(id: string | null): string {
    if (!id) return '—'
    return profiles.data?.find((p) => p.id === id)?.full_name ?? '—'
  }

  function logFor(id: string | null) {
    return logs.data?.find((l) => l.id === id)
  }

  async function handleResolve(reportId: string) {
    if (!profile) return
    setResolving(reportId)
    try {
      await resolveReport(reportId, profile.id)
      reports.refetch()
    } catch (err) {
      show(getErrorMessage(err, 'Nepovedlo se, zkus to znovu.'))
    } finally {
      setResolving(undefined)
    }
  }

  function requestSuspend(reportId: string, userId: string, name: string) {
    setSuspendTarget({ reportId, userId, name })
    if (!isReauthed()) setReauthOpen(true)
  }

  async function handleConfirmSuspend() {
    if (!suspendTarget || !profile) return
    const { reportId, userId } = suspendTarget
    setSuspendTarget(undefined)
    try {
      await suspendAccount(userId)
      await resolveReport(reportId, profile.id, 'Účet pozastaven')
      show('Účet byl pozastaven')
      reports.refetch()
    } catch (err) {
      show(getErrorMessage(err, 'Nepovedlo se, zkus to znovu.'))
    }
  }

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      {message && <Toast message={message} />}
      <PasswordReauthModal
        open={reauthOpen}
        onCancel={() => {
          setReauthOpen(false)
          setSuspendTarget(undefined)
        }}
        onSuccess={() => setReauthOpen(false)}
      />
      <ConfirmDialog
        open={!reauthOpen && !!suspendTarget}
        title="Pozastavit účet?"
        message={
          suspendTarget
            ? `Účet „${suspendTarget.name}“ se okamžitě pozastaví — přihlášení mu přestane fungovat.`
            : undefined
        }
        confirmLabel="Pozastavit"
        onConfirm={handleConfirmSuspend}
        onCancel={() => setSuspendTarget(undefined)}
      />

      {profile?.role === 'teacher' && (
        <button className="text-sm text-text-muted" onClick={() => navigate('/teacher')}>
          ← Zpět na Dashboard
        </button>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-xl">Nahlášený obsah</h1>
        <Button variant="ghost" onClick={handleLogout}>
          Odhlásit se
        </Button>
      </div>

      {reports.loading && <p className="text-text-muted text-sm">Načítám…</p>}
      {reports.error && (
        <p className="text-sm text-coral-dark">Načtení se nepovedlo: {reports.error.message}</p>
      )}
      {reports.data?.length === 0 && <p className="text-text-muted text-sm">Žádná otevřená nahlášení. 🎉</p>}

      <div className="space-y-3">
        {reports.data?.map((report) => {
          const log = logFor(report.practice_log_id)
          return (
            <div key={report.id} className="rounded-2xl bg-bg-card shadow-clay-sm p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>{new Date(report.created_at).toLocaleString('cs-CZ')}</span>
                <span>{report.reason}</span>
              </div>
              <div className="text-sm space-y-0.5">
                <div>
                  <span className="text-text-muted">Nahlásil/a: </span>
                  {nameFor(report.reporter_id)}
                </div>
                {report.reported_user_id && (
                  <div>
                    <span className="text-text-muted">Týká se: </span>
                    {nameFor(report.reported_user_id)}
                  </div>
                )}
              </div>
              {report.description && <p className="text-sm text-text-muted">{report.description}</p>}
              {log && <AudioPlayer src={log.audio_url} />}
              <div className="flex gap-2.5">
                <Button
                  variant="ghost"
                  className="flex-1 !py-1.5 text-xs"
                  disabled={resolving === report.id}
                  onClick={() => handleResolve(report.id)}
                >
                  Vyřešit bez akce
                </Button>
                {report.reported_user_id && (
                  <Button
                    variant="destructive"
                    className="flex-1 !py-1.5 text-xs"
                    onClick={() =>
                      requestSuspend(report.id, report.reported_user_id as string, nameFor(report.reported_user_id))
                    }
                  >
                    Pozastavit účet
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
