import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { signOut } from '../lib/auth'

export function BannedScreen() {
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="max-w-sm md:max-w-md mx-auto p-6 pt-20 text-center space-y-5">
      <div className="text-4xl">🚫</div>
      <h1 className="text-xl">Účet byl pozastaven</h1>
      <p className="text-text-muted text-sm">
        Tvůj účet byl pozastaven moderátorem. Pokud si myslíš, že jde o omyl, kontaktuj vedení školy.
      </p>
      <Button variant="ghost" className="w-full" onClick={handleLogout}>
        Odhlásit se
      </Button>
    </div>
  )
}
