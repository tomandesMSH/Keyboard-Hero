import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useAuth } from '../../lib/AuthProvider'
import { useQuery } from '../../lib/data/useQuery'
import { fetchStudentClassrooms, joinClassroom, leaveClassroom } from '../../lib/data/classrooms'
import { getErrorMessage } from '../../lib/errors'

interface JoinClassroomModalProps {
  open: boolean
  onClose: () => void
}

export function JoinClassroomModal({ open, onClose }: JoinClassroomModalProps) {
  const { profile } = useAuth()
  const classrooms = useQuery(
    () => (profile && open ? fetchStudentClassrooms(profile.id) : Promise.resolve([])),
    [profile?.id, open],
  )
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setSubmitting(true)
    setError(undefined)
    try {
      await joinClassroom(code)
      setCode('')
      classrooms.refetch()
    } catch (err) {
      setError(getErrorMessage(err, 'Připojení se nepovedlo.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLeave(classroomId: string) {
    if (!profile) return
    await leaveClassroom(classroomId, profile.id)
    classrooms.refetch()
  }

  if (!profile) return null

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-4">
        <h2 className="font-heading font-semibold text-lg">Moje třídy</h2>

        {classrooms.data && classrooms.data.length > 0 && (
          <div className="space-y-2">
            {classrooms.data.map((classroom) => (
              <div
                key={classroom.id}
                className="flex items-center justify-between rounded-xl bg-bg-card-alt px-3.5 py-2.5"
              >
                <span className="text-sm font-heading font-semibold">{classroom.name}</span>
                <button className="text-xs text-coral-dark" onClick={() => handleLeave(classroom.id)}>
                  Opustit
                </button>
              </div>
            ))}
          </div>
        )}
        {classrooms.data?.length === 0 && (
          <p className="text-text-muted text-sm">Zatím nejsi v žádné třídě.</p>
        )}

        <form className="space-y-2.5" onSubmit={handleJoin}>
          <div className="text-xs font-semibold text-text-muted">Kód od učitele</div>
          <Input
            placeholder="např. AB12CD"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          {error && <p className="text-sm text-coral-dark">{error}</p>}
          <Button type="submit" className="w-full" disabled={submitting || !code.trim()}>
            Připojit se
          </Button>
        </form>

        <Button variant="ghost" className="w-full" onClick={onClose}>
          Zavřít
        </Button>
      </div>
    </Modal>
  )
}
