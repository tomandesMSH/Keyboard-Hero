import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AuthProvider } from './lib/AuthProvider'
import { applyTheme, getStoredTheme } from './lib/theme'

export function App() {
  useEffect(() => {
    applyTheme(getStoredTheme())
  }, [])

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
