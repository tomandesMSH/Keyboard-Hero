import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Avatar } from '../../components/ui/Avatar'
import { SearchBar } from '../../components/ui/SearchBar'
import { Toast } from '../../components/ui/Toast'
import { AppShell } from '../../components/layout/AppShell'
import { useQuery } from '../../lib/data/useQuery'
import { fetchPendingReview } from '../../lib/data/practiceLogs'
import { fetchStudents } from '../../lib/data/profiles'
import { useToast } from '../../lib/useToast'

export function TeacherDashboard() {
  const navigate = useNavigate()
  const pending = useQuery(() => fetchPendingReview(), [])
  const students = useQuery(() => fetchStudents(), [])
  const [search, setSearch] = useState('')
  const { message } = useToast()

  function nameFor(userId: string): string {
    return students.data?.find((s) => s.id === userId)?.full_name ?? 'Žák'
  }

  const query = search.trim().toLowerCase()
  const filteredPending = query ? pending.data?.filter((log) => nameFor(log.user_id).toLowerCase().includes(query)) : pending.data
  const filteredStudents = query
    ? (students.data ?? []).filter((s) => s.full_name.toLowerCase().includes(query))
    : students.data

  return (
    <AppShell role="teacher">
      {message && <Toast message={message} />}
      <div className="space-y-4 flex-1">
        <h1 className="text-xl">Přehled žáků</h1>
        <SearchBar value={search} onChange={setSearch} placeholder="Hledat žáka" />

        <div>
          <h2 className="text-sm font-heading font-semibold text-text-muted mb-2">
            Ke kontrole ({filteredPending?.length ?? 0})
          </h2>
          {pending.loading && <p className="text-text-muted text-sm">Načítám…</p>}
          {filteredPending?.length === 0 && <p className="text-text-muted text-sm">Vše zkontrolováno 🎉</p>}
          <div className="space-y-2">
            {filteredPending?.map((log) => (
              <button
                key={log.id}
                className="w-full flex items-center justify-between rounded-2xl bg-bg-card shadow-clay-sm p-3.5 text-left"
                onClick={() => navigate('/teacher/grading', { state: { studentId: log.user_id } })}
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={nameFor(log.user_id)} size={38} />
                  <div>
                    <div className="font-heading font-semibold text-sm">{nameFor(log.user_id)}</div>
                    <div className="text-text-muted text-xs">
                      {new Date(log.created_at).toLocaleDateString('cs-CZ')}
                    </div>
                  </div>
                </div>
                <Badge tone="pending">Nové</Badge>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-heading font-semibold text-text-muted mb-2">Ostatní žáci</h2>
          <div className="space-y-2">
            {filteredStudents?.map((student) => (
              <button
                key={student.id}
                className="w-full flex items-center justify-between rounded-2xl bg-bg-card shadow-clay-sm p-3.5 text-left"
                onClick={() => navigate('/teacher/grading', { state: { studentId: student.id } })}
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={student.full_name} size={38} />
                  <div>
                    <div className="font-heading font-semibold text-sm">{student.full_name}</div>
                    <div className="text-text-muted text-xs">Streak {student.streak} dní</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
