// "Zapamatuj si mě" on the login screen. Checked (the default, and how Muzio
// always worked): the Supabase session lives in localStorage and survives
// closing the browser. Unchecked: it lives in sessionStorage, so closing the
// browser logs out - for shared computers at school. The choice itself and
// the last username are kept in localStorage.

const REMEMBER_KEY = 'muzio-remember'
const USERNAME_KEY = 'muzio-last-username'

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function safeLocal(): KeyValueStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null // storage blocked (private mode, site data off)
  }
}

function safeSession(): KeyValueStorage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage
  } catch {
    return null
  }
}

function tryGet(storage: KeyValueStorage | null, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null
  } catch {
    return null
  }
}

function trySet(storage: KeyValueStorage | null, key: string, value: string) {
  try {
    storage?.setItem(key, value)
  } catch {
    // full or blocked: the session simply won't persist
  }
}

function tryRemove(storage: KeyValueStorage | null, key: string) {
  try {
    storage?.removeItem(key)
  } catch {
    // nothing to clean up
  }
}

export function getRememberMe(local: KeyValueStorage | null = safeLocal()): boolean {
  return tryGet(local, REMEMBER_KEY) !== '0'
}

export function setRememberMe(remember: boolean, local: KeyValueStorage | null = safeLocal()) {
  trySet(local, REMEMBER_KEY, remember ? '1' : '0')
}

export function getLastUsername(local: KeyValueStorage | null = safeLocal()): string {
  return tryGet(local, USERNAME_KEY) ?? ''
}

// Called after a successful login: remembered only when "remember me" is on.
export function saveLastUsername(username: string, remember: boolean, local: KeyValueStorage | null = safeLocal()) {
  if (remember) trySet(local, USERNAME_KEY, username.trim())
  else tryRemove(local, USERNAME_KEY)
}

// The storage handed to Supabase. It asks for the choice on every call, so
// ticking or unticking the box before signing in takes effect at once;
// writing a key also removes it from the other storage, so a session never
// lingers in localStorage once "remember me" is off.
export function createAuthStorage(
  local: KeyValueStorage | null = safeLocal(),
  session: KeyValueStorage | null = safeSession(),
): KeyValueStorage {
  const target = () => (getRememberMe(local) ? local : session)
  const other = () => (getRememberMe(local) ? session : local)
  return {
    getItem: (key) => tryGet(target(), key),
    setItem: (key, value) => {
      trySet(target(), key, value)
      tryRemove(other(), key)
    },
    removeItem: (key) => {
      tryRemove(local, key)
      tryRemove(session, key)
    },
  }
}
