import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthProvider'
import { BannedScreen } from '../../screens/BannedScreen'
import { roleHome } from './RequireRole'

// Separate from RequireRole because moderator access isn't a role — it's a
// capability (is_moderator) that can sit on top of any role, e.g. a
// teacher who is also the moderator, rather than an either/or account type.
export function RequireModerator({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth()

  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/login" replace />
  if (profile.is_banned) return <BannedScreen />
  if (profile.role !== 'moderator' && !profile.is_moderator) {
    return <Navigate to={roleHome(profile.role)} replace />
  }
  return <>{children}</>
}
