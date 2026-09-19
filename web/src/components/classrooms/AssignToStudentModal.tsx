import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useAuth } from '../../lib/AuthProvider'
import { useQuery } from '../../lib/data/useQuery'
import { createAssignment, fetchStudentClassroomsForTeacher } from '../../lib/data/classrooms'
import { getErrorMessage } from '../../lib/errors'

interface AssignToStudentModalProps {
  open: boolean
  studentId: string
  studentName: string
  onClose: () => void
  onAssigned?: () => void
}

export function AssignToStudentModal({ open, studentId, studentName, onClose, onAssigned }: AssignToStudentModalProps) {
  const { profile } = useAuth()
  const classrooms = useQuery(
    () => (profile && open ? fetchStudentClassroomsForTeacher(profile.id, studentId) : Promise.resolve([])),
    [profile?.id, studentId, open],
  )
  const options = classrooms.data ?? []
  const [classroomId, setClassroomId] = useState<string>()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  const effectiveClassroomId = classroomId ?? options[0]?.id

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || !effectiveClassroomId || !title.trim()) return
    setSubmitting(true)
    setError(undefined)
    try {
      await createAssignment({
        classroomId: effectiveClassroomId,
        teacherId: profile.id,
        title: title.trim(),
        description,
        recipientIds: [studentId],
      })
      setTitle('')
      setDescription('')
      setClassroomId(undefined)
      onAssigned?.()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err, 'Zadání úkolu se nepovedlo.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-4">
        <h2 className="font-heading font-semibold text-lg">Zadat úkol pro {studentName}</h2>

        {!classrooms.loading && options.length === 0 && (
          <>
            <p className="text-text-muted text-sm">
              {studentName} zatím není v žádné tvé učebně - nejdřív žáka přidej přes kód v sekci Učebny.
            </p>
            <Button variant="ghost" className="w-full" onClick={onClose}>
              Zavřít
            </Button>
          </>
        )}

        {options.length > 0 && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {options.length > 1 && (
              <div>
                <div className="text-xs font-semibold text-text-muted mb-1.5">Třída</div>
                <select
                  className="w-full rounded-xl bg-bg-card-alt shadow-clay-press px-4 py-3 text-sm text-text-primary outline-none"
                  value={effectiveClassroomId}
                  onChange={(e) => setClassroomId(e.target.value)}
                >
                  {options.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <div className="text-xs font-semibold text-text-muted mb-1.5">Nadpis</div>
              <Input
                placeholder="např. Zahrej něco od ABBA"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
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
            {error && <p className="text-sm text-coral-dark">{error}</p>}
            <div className="flex gap-2.5">
              <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
                Zrušit
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting || !title.trim()}>
                Zadat
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}
