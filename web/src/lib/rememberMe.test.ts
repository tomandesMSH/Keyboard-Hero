import { describe, expect, it } from 'vitest'
import { createAuthStorage, getLastUsername, getRememberMe, saveLastUsername, setRememberMe } from './rememberMe'

function memoryStorage() {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  }
}

describe('remember me', () => {
  it('is on by default, so existing logins keep working', () => {
    const local = memoryStorage()
    expect(getRememberMe(local)).toBe(true)
    const storage = createAuthStorage(local, memoryStorage())
    storage.setItem('sb-token', 'abc')
    expect(local.data.get('sb-token')).toBe('abc')
    expect(storage.getItem('sb-token')).toBe('abc')
  })

  it('keeps the session only for the browser session when off', () => {
    const local = memoryStorage()
    const session = memoryStorage()
    local.data.set('sb-token', 'old') // from an earlier remembered login
    setRememberMe(false, local)
    const storage = createAuthStorage(local, session)
    storage.setItem('sb-token', 'new')
    expect(session.data.get('sb-token')).toBe('new')
    expect(local.data.has('sb-token')).toBe(false)
    expect(storage.getItem('sb-token')).toBe('new')
  })

  it('switching back on moves the next write to localStorage', () => {
    const local = memoryStorage()
    const session = memoryStorage()
    setRememberMe(false, local)
    const storage = createAuthStorage(local, session)
    storage.setItem('sb-token', 'a')
    setRememberMe(true, local)
    storage.setItem('sb-token', 'b')
    expect(local.data.get('sb-token')).toBe('b')
    expect(session.data.has('sb-token')).toBe(false)
  })

  it('signing out clears both storages', () => {
    const local = memoryStorage()
    const session = memoryStorage()
    local.data.set('sb-token', 'a')
    session.data.set('sb-token', 'b')
    createAuthStorage(local, session).removeItem('sb-token')
    expect(local.data.size).toBe(0)
    expect(session.data.size).toBe(0)
  })

  it('remembers the username only when asked to', () => {
    const local = memoryStorage()
    saveLastUsername(' tomask ', true, local)
    expect(getLastUsername(local)).toBe('tomask')
    saveLastUsername('tomask', false, local)
    expect(getLastUsername(local)).toBe('')
  })

  it('survives blocked storage', () => {
    const throwing = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    }
    const storage = createAuthStorage(throwing, throwing)
    expect(() => storage.setItem('k', 'v')).not.toThrow()
    expect(storage.getItem('k')).toBeNull()
    expect(getRememberMe(throwing)).toBe(true)
  })
})
