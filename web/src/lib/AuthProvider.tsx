import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { fetchOwnProfile } from './data/profiles'
import type { Profile } from './data/types'

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  // Distinguishes "genuinely logged out" from "haven't checked yet" — without
  // it, a hard reload briefly renders as logged out before the async
  // getSession() below resolves, which bounces RequireRole to /login and
  // loses whatever deep link (e.g. /student/profile) the user had open.
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setSessionLoaded(true)
    })
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setSessionLoaded(true)
    })
    return () => subscription.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!sessionLoaded) return
    if (!session) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    let cancelled = false
    fetchOwnProfile(session.user.id)
      .then((p) => {
        if (!cancelled) setProfile(p)
      })
      .catch(() => {
        if (!cancelled) setProfile(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [session, sessionLoaded, refreshTick])

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, refreshProfile: () => setRefreshTick((t) => t + 1) }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
