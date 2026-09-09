import { useNavigate } from 'react-router-dom'
import { LessonCard } from '../../components/lessons/LessonCard'
import { AppShell } from '../../components/layout/AppShell'
import { useAuth } from '../../lib/AuthProvider'
import { useQuery } from '../../lib/data/useQuery'
import { fetchCompletedAssignmentIds } from '../../lib/data/practiceLogs'
import { fetchStudentAssignments } from '../../lib/data/classrooms'
import type { Assignment } from '../../lib/data/types'

export function Lessons() {
  const navigate = useNavigate()
  const { profile } = useAuth()

  const assignments = useQuery(() => fetchStudentAssignments(), [])
  const assignmentIds = (assignments.data ?? []).map((a) => a.id)
  const completed = useQuery(
    () => (profile ? fetchCompletedAssignmentIds(profile.id, assignmentIds) : Promise.resolve(new Set<string>())),
    [profile?.id, assignmentIds.join(',')],
  )

  function openAssignment(assignment: Assignment) {
    navigate('/student/recording', {
      state: {
        lessonTitle: assignment.title,
        instructions: assignment.description ?? '',
        assignmentId: assignment.id,
      },
    })
  }

  const doneIds = completed.data ?? new Set<string>()
  const pending = (assignments.data ?? []).filter((a) => !doneIds.has(a.id))
  const done = (assignments.data ?? []).filter((a) => doneIds.has(a.id))

  return (
    <AppShell role="student">
      <div className="space-y-5 flex-1">
        <h1 className="text-xl">Lekce</h1>
        {assignments.loading && <p className="text-text-muted text-sm">Načítám…</p>}
        {assignments.error && (
          <p className="text-sm text-coral-dark">
            Načtení úkolů se nepovedlo: {assignments.error.message}
          </p>
        )}

        {assignments.data?.length === 0 && (
          <p className="text-text-muted text-sm">Zatím nemáš žádný zadaný úkol.</p>
        )}

        {assignments.data && assignments.data.length > 0 && pending.length === 0 && (
          <div className="rounded-2xl bg-coral-dark text-cream p-5 shadow-clay text-center">
            <div className="text-2xl mb-1">🎉</div>
            <div className="font-heading font-semibold">Výborná práce, máš splněno!</div>
          </div>
        )}

        {pending.length > 0 && (
          <div>
            <h2 className="text-sm font-heading font-semibold text-text-muted mb-2">Čeká na tebe</h2>
            <div className="space-y-2.5 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3 md:space-y-0">
              {pending.map((assignment) => (
                <LessonCard
                  key={assignment.id}
                  icon="🎵"
                  title={assignment.title}
                  meta={assignment.description ?? ''}
                  badge={{ label: 'Čeká', tone: 'pending' }}
                  onClick={() => openAssignment(assignment)}
                />
              ))}
            </div>
          </div>
        )}

        {done.length > 0 && (
          <div>
            <h2 className="text-sm font-heading font-semibold text-text-muted mb-2">Historie</h2>
            <div className="space-y-2.5 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3 md:space-y-0">
              {done.map((assignment) => (
                <LessonCard
                  key={assignment.id}
                  icon="🎵"
                  title={assignment.title}
                  meta={assignment.description ?? ''}
                  badge={{ label: 'Hotovo', tone: 'success' }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
