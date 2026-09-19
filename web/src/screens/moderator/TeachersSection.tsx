import { useState } from 'react'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { PasswordReauthModal } from '../../components/ui/PasswordReauthModal'
import { ResetPasswordModal } from '../../components/ui/ResetPasswordModal'
import { SearchBar } from '../../components/ui/SearchBar'
import { useAuth } from '../../lib/AuthProvider'
import { useQuery } from '../../lib/data/useQuery'
import { fetchTeachers } from '../../lib/data/profiles'
import { isReauthed } from '../../lib/reauth'
import type { Profile } from '../../lib/data/types'

// Teachers who forgot their password come here - a moderator sets a new one.
// Other moderators are left out: admin_reset_password refuses them (0020).
export function TeachersSection() {
  const { profile } = useAuth()
  const teachers = useQuery(() => fetchTeachers(), [])
  const [search, setSearch] = useState('')
  const [resetTarget, setResetTarget] = useState<Profile>()
  const [reauthOpen, setReauthOpen] = useState(false)

  const query = search.trim().toLowerCase()
  const matches = (teachers.data ?? []).filter(
    (t) => t.id !== profile?.id && !t.is_moderator && t.full_name.toLowerCase().includes(query),
  )

  function requestReset(teacher: Profile) {
    setResetTarget(teacher)
    if (!isReauthed()) setReauthOpen(true)
  }

  return (
    <div className="space-y-3">
      <PasswordReauthModal
        open={reauthOpen}
        onCancel={() => {
          setReauthOpen(false)
          setResetTarget(undefined)
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

      <p className="text-text-muted text-sm">Učitel zapomněl heslo? Nastav mu nové a předej mu ho osobně.</p>
      <SearchBar value={search} onChange={setSearch} placeholder="Hledat učitele" />
      {teachers.loading && <p className="text-text-muted text-sm">Načítám…</p>}
      {teachers.error && (
        <p className="text-sm text-coral-dark">Načtení se nepovedlo: {teachers.error.message}</p>
      )}
      <div className="space-y-2">
        {matches.map((teacher) => (
          <div
            key={teacher.id}
            className="w-full flex items-center justify-between gap-2.5 rounded-2xl bg-bg-card shadow-clay-sm p-3.5"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={teacher.full_name} size={34} />
              <div className="min-w-0">
                <div className="text-sm font-heading font-semibold truncate">{teacher.full_name}</div>
                {teacher.username && <div className="text-text-muted text-xs truncate">{teacher.username}</div>}
              </div>
            </div>
            <Button
              variant="secondary"
              className="shrink-0 !px-3 !py-1.5 text-xs"
              onClick={() => requestReset(teacher)}
            >
              Nové heslo
            </Button>
          </div>
        ))}
        {matches.length === 0 && !teachers.loading && (
          <p className="text-text-muted text-sm">Žádný učitel neodpovídá hledání.</p>
        )}
      </div>
    </div>
  )
}
