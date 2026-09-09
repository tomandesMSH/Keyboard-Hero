import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Switch } from '../../components/ui/Switch'
import { SettingsRow } from '../../components/ui/SettingsRow'
import { Badge } from '../../components/ui/Badge'
import { Toast } from '../../components/ui/Toast'
import { AppShell } from '../../components/layout/AppShell'
import { useAuth } from '../../lib/AuthProvider'
import { signOut } from '../../lib/auth'
import { applyTheme, getStoredTheme } from '../../lib/theme'
import { useToast } from '../../lib/useToast'

export function Profile() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [darkMode, setDarkMode] = useState(() => getStoredTheme() === 'dark')
  const { message, show } = useToast()

  if (!profile) return null

  function toggleDarkMode(next: boolean) {
    setDarkMode(next)
    applyTheme(next ? 'dark' : 'light')
  }

  function notReady() {
    show('Tahle funkce se ještě připravuje.')
  }

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <AppShell role="teacher">
      {message && <Toast message={message} />}
      <div className="space-y-6 flex-1">
        <div className="text-center">
          <h1 className="text-xl">{profile.full_name}</h1>
          <p className="text-text-muted text-sm">Učitel</p>
        </div>

        <div>
          <h2 className="text-sm font-heading font-semibold mb-1">Nastavení</h2>
          <SettingsRow label="Tmavý režim" right={<Switch checked={darkMode} onChange={toggleDarkMode} />} />
          <SettingsRow
            label="Ověření identity"
            right={
              profile.is_verified ? (
                <Badge tone="success">Ověřeno</Badge>
              ) : (
                <Badge tone="pending">Čeká na ověření</Badge>
              )
            }
          />
          <SettingsRow label="Notifikace" onClick={notReady} />
        </div>

        {profile.is_moderator && (
          <div>
            <h2 className="text-sm font-heading font-semibold mb-1">Moderace</h2>
            <SettingsRow label="Nahlášený obsah" onClick={() => navigate('/moderator')} />
          </div>
        )}

        <Button variant="ghost" className="w-full" onClick={handleLogout}>
          Odhlásit se
        </Button>
      </div>
    </AppShell>
  )
}
