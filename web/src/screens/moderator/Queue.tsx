import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { AudioPlayer } from '../../components/audio/AudioPlayer'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { PasswordReauthModal } from '../../components/ui/PasswordReauthModal'
import { SearchBar } from '../../components/ui/SearchBar'
import { Avatar } from '../../components/ui/Avatar'
import { Toast } from '../../components/ui/Toast'
import { useAuth } from '../../lib/AuthProvider'
import { useQuery } from '../../lib/data/useQuery'
import { fetchOpenReports, resolveReport, suspendAccount } from '../../lib/data/moderation'
import { fetchProfilesByIds, fetchStudents } from '../../lib/data/profiles'
import { deletePracticeLog, fetchLogsByIds, fetchStudentLogs } from '../../lib/data/practiceLogs'
import { signOut } from '../../lib/auth'
import { isReauthed } from '../../lib/reauth'
import { useToast } from '../../lib/useToast'
import { getErrorMessage } from '../../lib/errors'
import { TeachersSection } from './TeachersSection'
import type { PracticeLog, Profile } from '../../lib/data/types'

interface SuspendTarget {
  reportId: string
  userId: string
  name: string
}

type Tab = 'reports' | 'recordings' | 'teachers'

export function Queue() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [tab, setTab] = useState<Tab>('reports')
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
    if (!id) return '-'
    return profiles.data?.find((p) => p.id === id)?.full_name ?? '-'
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
            ? `Účet „${suspendTarget.name}“ se okamžitě pozastaví - přihlášení mu přestane fungovat.`
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
        <h1 className="text-xl">Admin dashboard</h1>
        <Button variant="ghost" onClick={handleLogout}>
          Odhlásit se
        </Button>
      </div>

      <div className="flex gap-2.5 rounded-xl bg-bg-card-alt shadow-clay-press p-1">
        <button
          className={`flex-1 rounded-lg py-2 text-sm font-heading font-semibold ${tab === 'reports' ? 'bg-bg-card shadow-clay-sm' : 'text-text-muted'}`}
          onClick={() => setTab('reports')}
        >
          Nahlášený obsah
        </button>
        <button
          className={`flex-1 rounded-lg py-2 text-sm font-heading font-semibold ${tab === 'recordings' ? 'bg-bg-card shadow-clay-sm' : 'text-text-muted'}`}
          onClick={() => setTab('recordings')}
        >
          Nahrávky
        </button>
        <button
          className={`flex-1 rounded-lg py-2 text-sm font-heading font-semibold ${tab === 'teachers' ? 'bg-bg-card shadow-clay-sm' : 'text-text-muted'}`}
          onClick={() => setTab('teachers')}
        >
          Učitelé
        </button>
      </div>

      {tab === 'reports' && (
        <>
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
                          requestSuspend(
                            report.id,
                            report.reported_user_id as string,
                            nameFor(report.reported_user_id),
                          )
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
        </>
      )}

      {tab === 'recordings' && <RecordingsSection />}
      {tab === 'teachers' && <TeachersSection />}
    </div>
  )
}

function RecordingsSection() {
  const students = useQuery(() => fetchStudents(), [])
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Profile>()
  const logs = useQuery(
    () => (selectedStudent ? fetchStudentLogs(selectedStudent.id) : Promise.resolve([])),
    [selectedStudent?.id],
  )
  const [deleteTarget, setDeleteTarget] = useState<PracticeLog>()
  const [deleting, setDeleting] = useState<string>()
  const { message, show } = useToast()

  const query = search.trim().toLowerCase()
  const matches = (students.data ?? []).filter((s) => s.full_name.toLowerCase().includes(query))

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    const log = deleteTarget
    setDeleteTarget(undefined)
    setDeleting(log.id)
    try {
      await deletePracticeLog(log)
      show('Nahrávka byla smazána')
      logs.refetch()
    } catch (err) {
      show(getErrorMessage(err, 'Smazání se nepovedlo, zkus to znovu.'))
    } finally {
      setDeleting(undefined)
    }
  }

  if (!selectedStudent) {
    return (
      <div className="space-y-3">
        {message && <Toast message={message} />}
        <SearchBar value={search} onChange={setSearch} placeholder="Hledat žáka" />
        {students.loading && <p className="text-text-muted text-sm">Načítám…</p>}
        <div className="space-y-2">
          {matches.map((student) => (
            <button
              key={student.id}
              className="w-full flex items-center gap-2.5 rounded-2xl bg-bg-card shadow-clay-sm p-3.5 text-left"
              onClick={() => setSelectedStudent(student)}
            >
              <Avatar name={student.full_name} size={34} />
              <span className="text-sm font-heading font-semibold">{student.full_name}</span>
            </button>
          ))}
          {matches.length === 0 && !students.loading && (
            <p className="text-text-muted text-sm">Žádný žák neodpovídá hledání.</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {message && <Toast message={message} />}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Smazat nahrávku?"
        message="Nahrávka a s ní spojené hodnocení se nenávratně smažou."
        confirmLabel="Smazat"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(undefined)}
      />
      <button className="text-sm text-text-muted" onClick={() => setSelectedStudent(undefined)}>
        ← Zpět na žáky
      </button>
      <h2 className="font-heading font-semibold">{selectedStudent.full_name}</h2>
      {logs.loading && <p className="text-text-muted text-sm">Načítám…</p>}
      {logs.data?.length === 0 && <p className="text-text-muted text-sm">Žádné nahrávky.</p>}
      <div className="space-y-3">
        {logs.data?.map((log) => (
          <div key={log.id} className="rounded-2xl bg-bg-card shadow-clay-sm p-4 space-y-2.5">
            <div className="text-xs text-text-muted">{new Date(log.created_at).toLocaleString('cs-CZ')}</div>
            <AudioPlayer src={log.audio_url} />
            <Button
              variant="destructive"
              className="w-full !py-1.5 text-xs"
              disabled={deleting === log.id}
              onClick={() => setDeleteTarget(log)}
            >
              Smazat nahrávku
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
