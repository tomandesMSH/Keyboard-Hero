import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchBar } from '../../components/ui/SearchBar'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Toast } from '../../components/ui/Toast'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { PasswordReauthModal } from '../../components/ui/PasswordReauthModal'
import { AppShell } from '../../components/layout/AppShell'
import { useQuery } from '../../lib/data/useQuery'
import { approveStudent, deleteStudent, fetchStudents } from '../../lib/data/profiles'
import { useToast } from '../../lib/useToast'
import { isReauthed } from '../../lib/reauth'
import { getErrorMessage } from '../../lib/errors'
import type { Profile } from '../../lib/data/types'

export function Students() {
  const navigate = useNavigate()
  const students = useQuery(() => fetchStudents(), [])
  const [search, setSearch] = useState('')
  const [approving, setApproving] = useState<string>()
  const [deleting, setDeleting] = useState<string>()
  const [reauthOpen, setReauthOpen] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<Profile>()
  const { message, show } = useToast()

  const query = search.trim().toLowerCase()
  const matches = (name: string) => name.toLowerCase().includes(query)

  const pending = (students.data ?? []).filter((s) => !s.is_approved && matches(s.full_name))
  const approved = (students.data ?? []).filter((s) => s.is_approved && matches(s.full_name))

  async function handleApprove(id: string) {
    setApproving(id)
    try {
      await approveStudent(id)
      show('Žák byl schválen')
      students.refetch()
    } catch (err) {
      show(getErrorMessage(err, 'Schválení se nepovedlo, zkus to znovu.'))
    } finally {
      setApproving(undefined)
    }
  }

  function requestDelete(student: Profile) {
    setConfirmTarget(student)
    if (!isReauthed()) setReauthOpen(true)
  }

  async function handleConfirmDelete() {
    if (!confirmTarget) return
    const id = confirmTarget.id
    setConfirmTarget(undefined)
    setDeleting(id)
    try {
      await deleteStudent(id)
      show('Profil žáka byl smazán')
      students.refetch()
    } catch (err) {
      show(getErrorMessage(err, 'Smazání se nepovedlo, zkus to znovu.'))
    } finally {
      setDeleting(undefined)
    }
  }

  function renderDeleteButton(student: Profile) {
    return (
      <Button
        variant="destructive"
        className="shrink-0 !px-3 !py-1.5 text-xs"
        disabled={deleting === student.id}
        onClick={() => requestDelete(student)}
      >
        Smazat
      </Button>
    )
  }

  return (
    <AppShell role="teacher">
      {message && <Toast message={message} />}
      <PasswordReauthModal
        open={reauthOpen}
        onCancel={() => {
          setReauthOpen(false)
          setConfirmTarget(undefined)
        }}
        onSuccess={() => setReauthOpen(false)}
      />
      <ConfirmDialog
        open={!reauthOpen && !!confirmTarget}
        title="Smazat profil žáka?"
        message={
          confirmTarget
            ? `Nenávratně smažeš profil, nahrávky a odezvu žáka „${confirmTarget.full_name}“. Přihlašovací účet zůstane existovat, ale žák se po smazání profilu do appky nedostane.`
            : undefined
        }
        confirmLabel="Smazat"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmTarget(undefined)}
      />

      <div className="space-y-4 flex-1">
        <h1 className="text-xl">Žáci</h1>
        <SearchBar value={search} onChange={setSearch} placeholder="Hledat žáka" />
        {students.loading && <p className="text-text-muted text-sm">Načítám…</p>}

        {pending.length > 0 && (
          <div>
            <h2 className="text-sm font-heading font-semibold text-text-muted mb-2">
              Čekají na schválení ({pending.length})
            </h2>
            <div className="space-y-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3 md:space-y-0">
              {pending.map((student) => (
                <div
                  key={student.id}
                  className="w-full flex items-center justify-between gap-2.5 rounded-2xl bg-bg-card shadow-clay-sm p-3.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={student.full_name} size={38} />
                    <div className="min-w-0">
                      <div className="font-heading font-semibold text-sm truncate">{student.full_name}</div>
                      <div className="text-text-muted text-xs">Nový registrovaný žák</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="secondary"
                      className="!px-3 !py-1.5 text-xs"
                      disabled={approving === student.id}
                      onClick={() => handleApprove(student.id)}
                    >
                      Schválit
                    </Button>
                    {renderDeleteButton(student)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-sm font-heading font-semibold text-text-muted mb-2">
            {pending.length > 0 ? 'Schválení žáci' : 'Žáci'}
          </h2>
          <div className="space-y-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3 md:space-y-0">
            {approved.map((student) => (
              <div
                key={student.id}
                className="w-full flex items-center justify-between gap-2.5 rounded-2xl bg-bg-card shadow-clay-sm p-3.5"
              >
                <button
                  className="flex items-center gap-2.5 min-w-0 text-left"
                  onClick={() => navigate('/teacher/grading', { state: { studentId: student.id } })}
                >
                  <Avatar name={student.full_name} size={38} />
                  <div className="min-w-0">
                    <div className="font-heading font-semibold text-sm truncate">{student.full_name}</div>
                    <div className="text-text-muted text-xs">
                      Streak {student.streak} dní · {student.stars} XP
                    </div>
                  </div>
                </button>
                {renderDeleteButton(student)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
