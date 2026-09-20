import { useState } from 'react'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { PasswordReauthModal } from '../../components/ui/PasswordReauthModal'
import { ResetPasswordModal } from '../../components/ui/ResetPasswordModal'
import { SearchBar } from '../../components/ui/SearchBar'
import { Toast } from '../../components/ui/Toast'
import { useAuth } from '../../lib/AuthProvider'
import { useQuery } from '../../lib/data/useQuery'
import { approveStudent, fetchAllUsers, setTeacherVerified } from '../../lib/data/profiles'
import { reinstateAccount, suspendAccount } from '../../lib/data/moderation'
import { isReauthed } from '../../lib/reauth'
import { useToast } from '../../lib/useToast'
import { getErrorMessage } from '../../lib/errors'
import { isTeacherAdmin } from '../../lib/roles'
import type { Profile } from '../../lib/data/types'

type Filter = 'all' | 'pending' | 'student' | 'teacher'

// Students wait for approval and teachers for identity verification.
function isPending(user: Profile): boolean {
  return (user.role === 'student' && !user.is_approved) || (user.role === 'teacher' && !user.is_verified)
}

// Admin overview of every student and teacher account: approve new students,
// verify new teachers, reset a password, ban or reinstate. Other admins and the signed-in
// admin themselves are shown without actions - admin_reset_password (0020)
// refuses moderators anyway.
export function UsersSection() {
  const { profile } = useAuth()
  const users = useQuery(() => fetchAllUsers(), [])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [resetTarget, setResetTarget] = useState<Profile>()
  const [banTarget, setBanTarget] = useState<Profile>()
  const [reauthOpen, setReauthOpen] = useState(false)
  const [busy, setBusy] = useState<string>()
  const { message, show } = useToast()

  const all = users.data ?? []
  const studentCount = all.filter((u) => u.role === 'student').length
  const teacherCount = all.filter((u) => u.role === 'teacher').length
  const pendingCount = all.filter(isPending).length

  const query = search.trim().toLowerCase()
  const visible = all
    .filter((u) => filter === 'all' || (filter === 'pending' ? isPending(u) : u.role === filter))
    .filter((u) => u.full_name.toLowerCase().includes(query) || (u.username ?? '').toLowerCase().includes(query))
    .sort((a, b) => a.role.localeCompare(b.role) || a.full_name.localeCompare(b.full_name, 'cs'))

  function isProtected(user: Profile): boolean {
    return user.id === profile?.id || user.role === 'moderator' || !!user.is_moderator
  }

  function requestReset(user: Profile) {
    setResetTarget(user)
    if (!isReauthed()) setReauthOpen(true)
  }

  function requestBan(user: Profile) {
    setBanTarget(user)
    if (!isReauthed()) setReauthOpen(true)
  }

  async function runAction(userId: string, action: () => Promise<void>, success: string) {
    setBusy(userId)
    try {
      await action()
      show(success)
      users.refetch()
    } catch (err) {
      show(getErrorMessage(err, 'Nepovedlo se, zkus to znovu.'))
    } finally {
      setBusy(undefined)
    }
  }

  function handleConfirmBan() {
    if (!banTarget) return
    const target = banTarget
    setBanTarget(undefined)
    void runAction(target.id, () => suspendAccount(target.id), `Účet „${target.full_name}“ byl zabanován`)
  }

  return (
    <div className="space-y-3">
      {message && <Toast message={message} />}
      <PasswordReauthModal
        open={reauthOpen}
        onCancel={() => {
          setReauthOpen(false)
          setResetTarget(undefined)
          setBanTarget(undefined)
        }}
        onSuccess={() => setReauthOpen(false)}
      />
      {!reauthOpen && resetTarget && (
        <ResetPasswordModal
          userId={resetTarget.id}
          name={resetTarget.full_name}
          onClose={() => setResetTarget(undefined)}
        />
      )}
      <ConfirmDialog
        open={!reauthOpen && !!banTarget}
        title="Zabanovat účet?"
        message={
          banTarget
            ? `Uživatel „${banTarget.full_name}“ se po přihlášení dostane jen na obrazovku s pozastaveným účtem. Kdykoli ho můžeš odbanovat.`
            : undefined
        }
        confirmLabel="Zabanovat"
        onConfirm={handleConfirmBan}
        onCancel={() => setBanTarget(undefined)}
      />

      <SearchBar value={search} onChange={setSearch} placeholder="Hledat podle jména nebo přihlašovacího jména" />
      <div className="flex gap-2 overflow-x-auto">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          Všichni ({all.length})
        </Chip>
        <Chip active={filter === 'pending'} onClick={() => setFilter('pending')}>
          Čekající ({pendingCount})
        </Chip>
        <Chip active={filter === 'student'} onClick={() => setFilter('student')}>
          Žáci ({studentCount})
        </Chip>
        <Chip active={filter === 'teacher'} onClick={() => setFilter('teacher')}>
          Učitelé ({teacherCount})
        </Chip>
      </div>

      {users.loading && <p className="text-text-muted text-sm">Načítám…</p>}
      {users.error && <p className="text-sm text-coral-dark">Načtení se nepovedlo: {users.error.message}</p>}

      <div className="space-y-2">
        {visible.map((user) => (
          <div key={user.id} className="rounded-2xl bg-bg-card shadow-clay-sm p-3.5 space-y-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={user.full_name} size={38} />
              <div className="min-w-0">
                <div className="font-heading font-semibold text-sm truncate">{user.full_name}</div>
                <div className="text-text-muted text-xs truncate">
                  {user.role === 'teacher' ? 'Učitel' : 'Žák'}
                  {user.username ? ` · ${user.username}` : ''}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {isProtected(user) && (
                <Badge>{user.id === profile?.id ? 'Ty' : isTeacherAdmin(user) ? 'Učitel + Admin' : 'Admin'}</Badge>
              )}
              {user.is_banned && <Badge tone="pending">Zabanovaný</Badge>}
              {user.role === 'teacher' && !user.is_verified && <Badge tone="pending">Čeká na ověření</Badge>}
              {user.role === 'student' && !user.is_approved && <Badge tone="pending">Čeká na schválení</Badge>}
            </div>

            {!isProtected(user) && (
              <div className="flex flex-wrap gap-1.5">
                <Button variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={() => requestReset(user)}>
                  Nové heslo
                </Button>
                {user.role === 'student' && !user.is_approved && (
                  <Button
                    variant="secondary"
                    className="!px-3 !py-1.5 text-xs"
                    disabled={busy === user.id}
                    onClick={() =>
                      runAction(user.id, () => approveStudent(user.id), `Žák „${user.full_name}“ byl schválen`)
                    }
                  >
                    Schválit žáka
                  </Button>
                )}
                {user.role === 'teacher' && !user.is_verified && (
                  <Button
                    variant="secondary"
                    className="!px-3 !py-1.5 text-xs"
                    disabled={busy === user.id}
                    onClick={() =>
                      runAction(user.id, () => setTeacherVerified(user.id, true), `Učitel „${user.full_name}“ byl ověřen`)
                    }
                  >
                    Ověřit učitele
                  </Button>
                )}
                {user.is_banned ? (
                  <Button
                    variant="secondary"
                    className="!px-3 !py-1.5 text-xs"
                    disabled={busy === user.id}
                    onClick={() =>
                      runAction(user.id, () => reinstateAccount(user.id), `Účet „${user.full_name}“ byl odbanován`)
                    }
                  >
                    Odbanovat
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    className="!px-3 !py-1.5 text-xs"
                    disabled={busy === user.id}
                    onClick={() => requestBan(user)}
                  >
                    Zabanovat
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
        {visible.length === 0 && !users.loading && (
          <p className="text-text-muted text-sm">Žádný uživatel neodpovídá hledání.</p>
        )}
      </div>
    </div>
  )
}
