import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Avatar } from '../ui/Avatar'
import type { Profile } from '../../lib/data/types'

interface NewAssignmentModalProps {
  open: boolean
  members: Profile[]
  submitting: boolean
  error?: string
  onClose: () => void
  onSubmit: (input: { title: string; description: string; recipientIds: string[] }) => void
}

type Target = 'all' | 'selected'

export function NewAssignmentModal({ open, members, submitting, error, onClose, onSubmit }: NewAssignmentModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [target, setTarget] = useState<Target>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      title,
      description,
      recipientIds: target === 'selected' ? Array.from(selected) : [],
    })
  }

  return (
    <Modal open={open} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <h2 className="font-heading font-semibold text-lg">Zadat úkol</h2>
        <div>
          <div className="text-xs font-semibold text-text-muted mb-1.5">Nadpis</div>
          <Input placeholder="např. Zahrej něco od ABBA" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <div className="text-xs font-semibold text-text-muted mb-1.5">Popis</div>
          <textarea
            className="w-full rounded-xl bg-bg-card-alt shadow-clay-press px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-coral"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <div className="text-xs font-semibold text-text-muted mb-1.5">Komu</div>
          <div className="flex gap-2 mb-2.5">
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg text-xs font-heading font-semibold transition ${
                target === 'all' ? 'bg-coral text-cream' : 'bg-bg-card-alt text-text-muted'
              }`}
              onClick={() => setTarget('all')}
            >
              Celá třída
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg text-xs font-heading font-semibold transition ${
                target === 'selected' ? 'bg-coral text-cream' : 'bg-bg-card-alt text-text-muted'
              }`}
              onClick={() => setTarget('selected')}
            >
              Vybraní žáci
            </button>
          </div>
          {target === 'selected' && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {members.length === 0 && <p className="text-text-muted text-xs">Ve třídě zatím nikdo není.</p>}
              {members.map((member) => (
                <button
                  type="button"
                  key={member.id}
                  className="w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-bg-card-alt"
                  onClick={() => toggleSelected(member.id)}
                >
                  <input type="checkbox" checked={selected.has(member.id)} readOnly />
                  <Avatar name={member.full_name} size={26} />
                  <span className="text-sm">{member.full_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-coral-dark">{error}</p>}
        <div className="flex gap-2.5">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Zrušit
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={submitting || !title.trim() || (target === 'selected' && selected.size === 0)}
          >
            Zadat
          </Button>
        </div>
      </form>
    </Modal>
  )
}
