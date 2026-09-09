// Tracks whether the current user has already re-confirmed their password
// this browser session, so destructive actions only ask for it once per
// session instead of on every click.
const REAUTH_KEY = 'muzio-admin-reauth'

export function isReauthed(): boolean {
  try {
    return sessionStorage.getItem(REAUTH_KEY) === '1'
  } catch {
    return false
  }
}

export function markReauthed(): void {
  try {
    sessionStorage.setItem(REAUTH_KEY, '1')
  } catch {
    // Storage unavailable — will just re-prompt next time, which is safe.
  }
}
