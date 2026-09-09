const STORAGE_KEY = 'muzio-theme'

export type Theme = 'light' | 'dark'

export function getStoredTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage unavailable (private browsing, etc.) — theme just won't persist.
  }
}
