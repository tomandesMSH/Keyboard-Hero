import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { roleHome } from '../components/routing/RequireRole'
import { useAuth } from '../lib/AuthProvider'
import { signOut } from '../lib/auth'
import { isTeacherAdmin } from '../lib/roles'
import { BannedScreen } from './BannedScreen'

// Shown right after every login to an account that is both teacher and admin,
// so they pick which panel to open instead of always landing in the same one.
export function ChoosePanel() {
  const navigate = useNavigate()
  const { session, profile, loading } = useAuth()

  if (loading) return null
  if (!session || !profile) return <Navigate to="/login" replace />
  if (profile.is_banned) return <BannedScreen />
  if (!isTeacherAdmin(profile)) return <Navigate to={roleHome(profile.role)} replace />

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="max-w-sm md:max-w-md mx-auto p-6 pt-16 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold mb-1">Muzio</h1>
        <p className="text-text-muted text-sm">
          Ahoj, {profile.full_name}. Který panel chceš otevřít?
        </p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          className="w-full text-left rounded-2xl bg-bg-card shadow-clay-sm p-4 transition active:scale-95"
          onClick={() => navigate('/moderator', { replace: true })}
        >
          <div className="font-heading font-semibold">🛡️ Admin panel</div>
          <div className="text-text-muted text-xs mt-1">
            Všichni uživatelé, resety hesel, bany, nahlášený obsah a nahrávky.
          </div>
        </button>
        <button
          type="button"
          className="w-full text-left rounded-2xl bg-bg-card shadow-clay-sm p-4 transition active:scale-95"
          onClick={() => navigate('/teacher', { replace: true })}
        >
          <div className="font-heading font-semibold">🎓 Učitelský panel</div>
          <div className="text-text-muted text-xs mt-1">Žáci, učebny, zadání a hodnocení nahrávek.</div>
        </button>
      </div>

      <Button variant="ghost" className="w-full" onClick={handleLogout}>
        Odhlásit se
      </Button>
    </div>
  )
}
