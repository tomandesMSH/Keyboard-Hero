import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { fetchOwnProfile } from './data/profiles'
import type { Profile } from './data/types'

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  // The profile couldn't be loaded (network down, server waking up) - the
  // user is still logged in, so the guards show "trying again" instead of
  // sending them to the login screen.
  profileError: boolean
  refreshProfile: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

// Waits before each further attempt when loading the profile fails.
const PROFILE_RETRY_DELAYS_MS = [1000, 3000, 10000]

// PostgREST's "no rows" for .single(): the account really has no profile.
function isMissingProfile(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'PGRST116'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  // Distinguishes "genuinely logged out" from "haven't checked yet" - without
  // it, a hard reload briefly renders as logged out before the async
  // getSession() below resolves, which bounces RequireRole to /login and
  // loses whatever deep link (e.g. /student/profile) the user had open.
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const profileRef = useRef<Profile | null>(null)
  useEffect(() => {
    profileRef.current = profile
  }, [profile])

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

  // Back online: try again straight away.
  useEffect(() => {
    const onOnline = () => setRefreshTick((t) => t + 1)
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  // Keyed on the user, not the session object: the token is refreshed about
  // once an hour, which hands out a new session - that must not reload (and
  // possibly lose) the profile mid-practice.
  const userId = session?.user.id ?? null

  useEffect(() => {
    if (!sessionLoaded) return
    if (!userId) {
      setProfile(null)
      setProfileError(false)
      setLoading(false)
      return
    }
    // Only a first load blocks the screen; a reload keeps showing the profile it has.
    const known = profileRef.current?.id === userId
    if (!known) {
      setProfile(null)
      setLoading(true)
    }
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const attempt = (index: number) => {
      fetchOwnProfile(userId)
        .then((p) => {
          if (cancelled) return
          setProfile(p)
          setProfileError(false)
          setLoading(false)
        })
        .catch((err) => {
          if (cancelled) return
          if (isMissingProfile(err)) {
            setProfile(null)
            setProfileError(false)
            setLoading(false)
          } else {
            // Keep a profile we already have; without one, the guards show
            // "trying again" (not a blank page) while the retries run.
            if (profileRef.current?.id !== userId) {
              setProfileError(true)
              setLoading(false)
            }
            if (index < PROFILE_RETRY_DELAYS_MS.length) {
              timer = setTimeout(() => attempt(index + 1), PROFILE_RETRY_DELAYS_MS[index])
            }
          }
        })
    }
    attempt(0)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [userId, sessionLoaded, refreshTick])

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, profileError, refreshProfile: () => setRefreshTick((t) => t + 1) }}
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
