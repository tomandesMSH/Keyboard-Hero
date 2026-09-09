import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Avatar } from '../../components/ui/Avatar'
import { Toast } from '../../components/ui/Toast'
import { AppShell } from '../../components/layout/AppShell'
import { NewAssignmentModal } from '../../components/classrooms/NewAssignmentModal'
import { useAuth } from '../../lib/AuthProvider'
import { useQuery } from '../../lib/data/useQuery'
import {
  createAssignment,
  createClassroom,
  fetchClassroomAssignments,
  fetchClassroomMemberIds,
  fetchTeacherClassrooms,
  removeClassroomMember,
} from '../../lib/data/classrooms'
import { fetchProfilesByIds } from '../../lib/data/profiles'
import { useToast } from '../../lib/useToast'
import { getErrorMessage } from '../../lib/errors'
import type { Classroom } from '../../lib/data/types'

export function Classrooms() {
  const { profile } = useAuth()
  const classrooms = useQuery(() => (profile ? fetchTeacherClassrooms(profile.id) : Promise.resolve([])), [
    profile?.id,
  ])
  const [selected, setSelected] = useState<Classroom>()
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const { message, show } = useToast()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || !newName.trim()) return
    setCreating(true)
    try {
      await createClassroom(profile.id, newName.trim())
      setNewName('')
      classrooms.refetch()
    } catch (err) {
      show(getErrorMessage(err, 'Vytvoření třídy se nepovedlo.'))
    } finally {
      setCreating(false)
    }
  }

  if (selected) {
    return <ClassroomDetail classroom={selected} onBack={() => setSelected(undefined)} />
  }

  return (
    <AppShell role="teacher">
      {message && <Toast message={message} />}
      <div className="space-y-4 flex-1">
        <h1 className="text-xl">Učebny</h1>
        <form className="flex gap-2" onSubmit={handleCreate}>
          <Input placeholder="Název třídy (např. 3.A)" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button type="submit" disabled={creating || !newName.trim()} className="shrink-0">
            Vytvořit
          </Button>
        </form>
        {classrooms.loading && <p className="text-text-muted text-sm">Načítám…</p>}
        {classrooms.data?.length === 0 && (
          <p className="text-text-muted text-sm">Zatím žádná třída — vytvoř první výše.</p>
        )}
        <div className="space-y-2.5 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3 md:space-y-0">
          {classrooms.data?.map((classroom) => (
            <button
              key={classroom.id}
              className="w-full text-left rounded-2xl bg-bg-card shadow-clay-sm p-4"
              onClick={() => setSelected(classroom)}
            >
              <div className="font-heading font-semibold text-sm mb-1">{classroom.name}</div>
              <div className="text-text-muted text-xs">
                Kód: <span className="font-heading font-bold tracking-widest">{classroom.join_code}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

function ClassroomDetail({ classroom, onBack }: { classroom: Classroom; onBack: () => void }) {
  const memberIds = useQuery(() => fetchClassroomMemberIds(classroom.id), [classroom.id])
  const members = useQuery(
    () => (memberIds.data ? fetchProfilesByIds(memberIds.data) : Promise.resolve([])),
    [memberIds.data?.join(',')],
  )
  const assignments = useQuery(() => fetchClassroomAssignments(classroom.id), [classroom.id])
  const { profile } = useAuth()
  const { message, show } = useToast()
  const [assignmentOpen, setAssignmentOpen] = useState(false)
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false)
  const [assignmentError, setAssignmentError] = useState<string>()

  async function handleCreateAssignment(input: { title: string; description: string; recipientIds: string[] }) {
    if (!profile) return
    setAssignmentSubmitting(true)
    setAssignmentError(undefined)
    try {
      await createAssignment({
        classroomId: classroom.id,
        teacherId: profile.id,
        title: input.title,
        description: input.description,
        recipientIds: input.recipientIds,
      })
      setAssignmentOpen(false)
      assignments.refetch()
    } catch (err) {
      setAssignmentError(getErrorMessage(err, 'Zadání úkolu se nepovedlo.'))
    } finally {
      setAssignmentSubmitting(false)
    }
  }

  async function handleRemoveMember(studentId: string) {
    try {
      await removeClassroomMember(classroom.id, studentId)
      memberIds.refetch()
    } catch (err) {
      show(getErrorMessage(err, 'Odebrání se nepovedlo.'))
    }
  }

  return (
    <AppShell role="teacher">
      {message && <Toast message={message} />}
      <div className="space-y-4 flex-1">
        <button className="text-sm text-text-muted" onClick={onBack}>
          ← Zpět na třídy
        </button>
        <div>
          <h1 className="text-xl">{classroom.name}</h1>
          <p className="text-text-muted text-sm">
            Kód pro připojení: <span className="font-heading font-bold tracking-widest">{classroom.join_code}</span>
          </p>
        </div>

        <div>
          <h2 className="text-sm font-heading font-semibold text-text-muted mb-2">Žáci ({members.data?.length ?? 0})</h2>
          <div className="space-y-2">
            {members.data?.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-2.5 rounded-2xl bg-bg-card shadow-clay-sm p-3"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={member.full_name} size={34} />
                  <span className="text-sm font-heading font-semibold">{member.full_name}</span>
                </div>
                <button
                  className="text-xs text-coral-dark"
                  onClick={() => handleRemoveMember(member.id)}
                >
                  Odebrat
                </button>
              </div>
            ))}
            {members.data?.length === 0 && (
              <p className="text-text-muted text-sm">Zatím se nikdo nepřipojil — sdílej kód výše.</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-heading font-semibold text-text-muted">Úkoly</h2>
            <Button className="!px-3 !py-1.5 text-xs" onClick={() => setAssignmentOpen(true)}>
              + Zadat úkol
            </Button>
          </div>
          <div className="space-y-2">
            {assignments.data?.map((assignment) => (
              <div key={assignment.id} className="rounded-2xl bg-bg-card shadow-clay-sm p-3.5">
                <div className="font-heading font-semibold text-sm">{assignment.title}</div>
                {assignment.description && (
                  <div className="text-text-muted text-xs mt-1">{assignment.description}</div>
                )}
              </div>
            ))}
            {assignments.data?.length === 0 && <p className="text-text-muted text-sm">Zatím žádné úkoly.</p>}
          </div>
        </div>
      </div>

      <NewAssignmentModal
        open={assignmentOpen}
        members={members.data ?? []}
        submitting={assignmentSubmitting}
        error={assignmentError}
        onClose={() => setAssignmentOpen(false)}
        onSubmit={handleCreateAssignment}
      />
    </AppShell>
  )
}
