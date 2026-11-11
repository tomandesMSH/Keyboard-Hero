import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { useAuth } from '../lib/AuthProvider'
import { signOut } from '../lib/auth'

// Logged in, but the profile couldn't be loaded (no internet, the server
// waking up). Before, this looked like being logged out; now the user stays
// logged in and it keeps trying by itself.
export function ConnectionProblem() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="max-w-sm md:max-w-md mx-auto p-6 pt-20 text-center space-y-5">
      <div className="text-4xl">📡</div>
      <h1 className="text-xl">Nelze se spojit se serverem</h1>
      <p className="text-text-muted text-sm">
        Zůstáváš přihlášený(á). Zkontroluj připojení k internetu – zkouším to znovu sám, nebo klikni na tlačítko.
      </p>
      <Button className="w-full" onClick={refreshProfile}>
        Zkusit znovu
      </Button>
      <Button variant="ghost" className="w-full" onClick={handleLogout}>
        Odhlásit se
      </Button>
    </div>
  )
}
