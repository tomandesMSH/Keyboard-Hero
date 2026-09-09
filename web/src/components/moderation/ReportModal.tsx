import { useState, type FormEvent } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface ReportModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (reason: string, description: string) => void
  submitting: boolean
  error?: string
}

const REASONS = ['Nevhodná zpráva', 'Nevhodné chování', 'Jiné']

export function ReportModal({ open, onClose, onSubmit, submitting, error }: ReportModalProps) {
  const [reason, setReason] = useState(REASONS[0])
  const [description, setDescription] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit(reason, description)
  }

  return (
    <Modal open={open} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <h2 className="font-heading font-semibold text-lg">Nahlásit zpětnou vazbu</h2>
        <p className="text-text-muted text-sm">
          Nahlášení uvidí jen moderátor, ne učitel. Použij to, když ti něco přijde nevhodné.
        </p>
        <p className="text-xs text-coral-dark">
          Zneužití nahlašování (např. ze srandy nebo aby se učiteli něco udělalo naschvál) se trestá.
        </p>
        <div>
          <div className="text-xs font-semibold text-text-muted mb-1.5">Důvod</div>
          <div className="flex gap-2 flex-wrap">
            {REASONS.map((r) => (
              <button
                type="button"
                key={r}
                className={`px-3 py-1.5 rounded-full text-xs font-heading font-semibold transition ${
                  reason === r ? 'bg-coral text-cream' : 'bg-bg-card-alt text-text-muted'
                }`}
                onClick={() => setReason(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-text-muted mb-1.5">Popis (nepovinné)</div>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Co se stalo?" />
        </div>
        {error && <p className="text-sm text-coral-dark">{error}</p>}
        <div className="flex gap-2.5">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Zrušit
          </Button>
          <Button type="submit" variant="destructive" className="flex-1" disabled={submitting}>
            Nahlásit
          </Button>
        </div>
      </form>
    </Modal>
  )
}
