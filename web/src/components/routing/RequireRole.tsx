import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthProvider'
import type { UserRole } from '../../lib/data/types'
import { PendingApproval } from '../../screens/student/PendingApproval'
import { PendingVerification } from '../../screens/teacher/PendingVerification'
import { BannedScreen } from '../../screens/BannedScreen'

export function roleHome(role: UserRole): string {
  switch (role) {
    case 'teacher':
      return '/teacher'
    case 'student':
      return '/student'
    case 'moderator':
      return '/moderator'
    default:
      return '/login'
  }
}

export function RequireRole({ role, children }: { role: UserRole | UserRole[]; children: ReactNode }) {
  const { session, profile, loading } = useAuth()
  const allowedRoles = Array.isArray(role) ? role : [role]

  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/login" replace />
  if (profile.is_banned) return <BannedScreen />
  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to={roleHome(profile.role)} replace />
  }
  if (profile.role === 'student' && !profile.is_approved) {
    return <PendingApproval />
  }
  if (profile.role === 'teacher' && !profile.is_verified) {
    return <PendingVerification />
  }
  return <>{children}</>
}
