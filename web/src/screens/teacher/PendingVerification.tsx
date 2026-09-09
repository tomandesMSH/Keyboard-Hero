import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../lib/AuthProvider'
import { signOut } from '../../lib/auth'

export function PendingVerification() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  const [checking, setChecking] = useState(false)

  async function handleRefresh() {
    setChecking(true)
    refreshProfile()
    setTimeout(() => setChecking(false), 600)
  }

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="max-w-sm md:max-w-md mx-auto p-6 pt-20 text-center space-y-5">
      <div className="text-4xl">🔒</div>
      <h1 className="text-xl">Čekáš na ověření</h1>
      <p className="text-text-muted text-sm">
        Nový učitelský účet musí nejdřív ručně ověřit administrátor/moderátor, než získá přístup k žákům a jejich
        nahrávkám. Ozvi se mu, ať tě ověří.
      </p>
      <Button className="w-full" onClick={handleRefresh} disabled={checking}>
        {checking ? 'Kontroluju…' : 'Zkontrolovat znovu'}
      </Button>
      <Button variant="ghost" className="w-full" onClick={handleLogout}>
        Odhlásit se
      </Button>
    </div>
  )
}
