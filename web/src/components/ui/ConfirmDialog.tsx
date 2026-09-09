import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Ano', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel}>
      <div className="space-y-4">
        <h2 className="font-heading font-semibold text-lg">{title}</h2>
        {message && <p className="text-text-muted text-sm">{message}</p>}
        <div className="flex gap-2.5">
          <Button variant="ghost" className="flex-1" onClick={onCancel}>
            Ne
          </Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
