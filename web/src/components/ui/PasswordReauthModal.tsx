import { useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Input } from './Input'
import { useAuth } from '../../lib/AuthProvider'
import { reauthenticate } from '../../lib/auth'
import { markReauthed } from '../../lib/reauth'

interface PasswordReauthModalProps {
  open: boolean
  onSuccess: () => void
  onCancel: () => void
}

export function PasswordReauthModal({ open, onSuccess, onCancel }: PasswordReauthModalProps) {
  const { session } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!session?.user.email) return
    setSubmitting(true)
    setError(undefined)
    try {
      await reauthenticate(session.user.email, password)
      markReauthed()
      setPassword('')
      onSuccess()
    } catch {
      setError('Nesprávné heslo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onCancel}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <h2 className="font-heading font-semibold text-lg">Potvrď svoje heslo</h2>
        <p className="text-text-muted text-sm">
          Tahle akce je nevratná — ověř prosím svoje heslo, než budeš pokračovat. Pro zbytek session se už ptát
          nebudeme.
        </p>
        <Input
          type="password"
          placeholder="Heslo"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
        />
        {error && <p className="text-sm text-coral-dark">{error}</p>}
        <div className="flex gap-2.5">
          <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
            Zrušit
          </Button>
          <Button type="submit" className="flex-1" disabled={submitting}>
            Potvrdit
          </Button>
        </div>
      </form>
    </Modal>
  )
}
