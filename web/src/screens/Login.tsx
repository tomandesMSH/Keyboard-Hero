import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'

export function Login() {
  return (
    <div className="max-w-sm mx-auto p-5 mt-16">
      <Card className="space-y-4">
        <div>
          <h1 className="text-xl">Muzio</h1>
          <p className="text-text-muted text-sm">Uč se hudbu hravě, každý den.</p>
        </div>
        <Input placeholder="E-mail" type="email" />
        <Input placeholder="Heslo" type="password" />
        <Button className="w-full">Přihlásit se</Button>
      </Card>
    </div>
  )
}
