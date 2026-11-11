import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthProvider'
import { fetchOwnProfile } from './data/profiles'

type Listener = (event: string, session: unknown) => void
const auth = vi.hoisted(() => ({ listener: null as Listener | null, session: null as unknown }))

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: Listener) => {
        auth.listener = cb
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
      getSession: async () => ({ data: { session: auth.session } }),
    },
  },
}))
vi.mock('./data/profiles', () => ({ fetchOwnProfile: vi.fn() }))

const fetchProfile = vi.mocked(fetchOwnProfile)
const session = (token: string) => ({ access_token: token, user: { id: 'u1' } })
const pupil = { id: 'u1', role: 'student', full_name: 'Žák' }

function Probe() {
  const { session, profile, loading, profileError } = useAuth()
  return (
    <div data-testid="state">
      {JSON.stringify({ session: !!session, profile: profile?.full_name ?? null, loading, profileError })}
    </div>
  )
}

const state = () => JSON.parse(screen.getByTestId('state').textContent ?? '{}')

async function flush(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    fetchProfile.mockReset()
    auth.session = session('t1')
  })
  afterEach(() => vi.useRealTimers())

  it('a token refresh does not reload the profile', async () => {
    fetchProfile.mockResolvedValue(pupil as never)
    render(<AuthProvider><Probe /></AuthProvider>)
    await flush()
    expect(state()).toMatchObject({ profile: 'Žák', loading: false })
    act(() => auth.listener?.('TOKEN_REFRESHED', session('t2')))
    await flush()
    expect(fetchProfile).toHaveBeenCalledTimes(1)
    expect(state()).toMatchObject({ session: true, profile: 'Žák' })
  })

  it('a failed profile load is a connection problem, not a logout - and it retries', async () => {
    fetchProfile.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    fetchProfile.mockResolvedValueOnce(pupil as never)
    render(<AuthProvider><Probe /></AuthProvider>)
    await flush()
    expect(state()).toMatchObject({ session: true, profile: null, profileError: true, loading: false })
    await flush(1000)
    expect(state()).toMatchObject({ profile: 'Žák', profileError: false })
  })

  it('a missing profile row is not a connection problem', async () => {
    fetchProfile.mockRejectedValue({ code: 'PGRST116', message: 'no rows' })
    render(<AuthProvider><Probe /></AuthProvider>)
    await flush()
    expect(state()).toMatchObject({ profile: null, profileError: false, loading: false })
  })
})
