import { useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Input } from './Input'
import { adminResetPassword, generateTempPassword } from '../../lib/auth'
import { getErrorMessage } from '../../lib/errors'

interface ResetPasswordModalProps {
  userId: string
  name: string
  onClose: () => void
}

// Mount this only while a reset is in progress - it generates a fresh
// temporary password on mount, so each open starts from a new one.
export function ResetPasswordModal({ userId, name, onClose }: ResetPasswordModalProps) {
  const [password, setPassword] = useState(() => generateTempPassword())
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string>()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(undefined)
    try {
      await adminResetPassword(userId, password)
      setDone(true)
    } catch (err) {
      setError(getErrorMessage(err, 'Změna hesla se nepovedla, zkus to znovu.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <Modal open onClose={onClose}>
        <div className="space-y-4">
          <h2 className="font-heading font-semibold text-lg">Heslo bylo změněno</h2>
          <p className="text-text-muted text-sm">
            Nové heslo pro „{name}“ je níže. Předej mu ho osobně - po zavření tohoto okna už se nezobrazí. Původní
            přihlášení uživatele bylo ukončeno.
          </p>
          <div className="rounded-xl bg-bg-card-alt shadow-clay-press px-4 py-3 text-center font-mono text-lg tracking-wider select-all">
            {password}
          </div>
          <Button className="w-full" onClick={onClose}>
            Hotovo
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <h2 className="font-heading font-semibold text-lg">Nové heslo pro „{name}“</h2>
        <p className="text-text-muted text-sm">
          Nastav uživateli nové heslo - původní přestane fungovat. Můžeš nechat vygenerované, nebo napsat vlastní
          (aspoň 6 znaků).
        </p>
        <div className="flex gap-2">
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            minLength={6}
            className="font-mono"
            required
          />
          <Button
            type="button"
            variant="ghost"
            className="shrink-0 !px-3"
            onClick={() => setPassword(generateTempPassword())}
          >
            Nové
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-coral-dark">
            {error}
          </p>
        )}
        <div className="flex gap-2.5">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Zrušit
          </Button>
          <Button type="submit" className="flex-1" disabled={submitting}>
            Nastavit heslo
          </Button>
        </div>
      </form>
    </Modal>
  )
}
