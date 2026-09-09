import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Toast } from '../../components/ui/Toast'
import { Streak } from '../../components/gamification/Streak'
import { XPDisplay } from '../../components/gamification/XPDisplay'
import { LevelProgress } from '../../components/gamification/LevelProgress'
import { DailyReminderBanner } from '../../components/gamification/DailyReminderBanner'
import { Confetti } from '../../components/gamification/Confetti'
import { LessonCard } from '../../components/lessons/LessonCard'
import { AppShell } from '../../components/layout/AppShell'
import { useAuth } from '../../lib/AuthProvider'
import { useQuery } from '../../lib/data/useQuery'
import { fetchCompletedAssignmentIds, fetchOwnLogsCount, fetchWeeklyStats } from '../../lib/data/practiceLogs'
import { fetchStudentAssignments } from '../../lib/data/classrooms'
import { isPerfectWeek, hasPlayedToday } from '../../lib/game-logic'
import { detectNewUnlocks } from '../../lib/gamification/detectNewUnlocks'
import { useToast } from '../../lib/useToast'
import type { Assignment } from '../../lib/data/types'

export function StudentDashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const userId = profile?.id
  const [today] = useState(() => new Date())

  const logsCount = useQuery(
    () => (userId ? fetchOwnLogsCount(userId) : Promise.resolve(0)),
    [userId],
  )
  const weekly = useQuery(
    () => (userId ? fetchWeeklyStats(userId, today) : Promise.resolve({ dateKeys: [], weeklyCount: 0 })),
    [userId],
  )
  const assignments = useQuery(() => fetchStudentAssignments(), [])
  const assignmentIds = (assignments.data ?? []).map((a) => a.id)
  const completed = useQuery(
    () => (userId ? fetchCompletedAssignmentIds(userId, assignmentIds) : Promise.resolve(new Set<string>())),
    [userId, assignmentIds.join(',')],
  )

  const { message, show } = useToast()
  const [celebrating, setCelebrating] = useState(false)
  const celebratedRef = useRef(false)

  useEffect(() => {
    if (!userId || !profile || logsCount.data === undefined || !weekly.data) return
    if (celebratedRef.current) return
    celebratedRef.current = true

    const dateKeys = weekly.data.dateKeys
    const result = detectNewUnlocks(userId, profile.stars, {
      stars: profile.stars,
      streak: profile.streak,
      totalRecordings: logsCount.data,
      perfectWeek: isPerfectWeek(dateKeys, today),
      daysPlayedThisWeek: dateKeys.length,
      weeklyCount: weekly.data.weeklyCount,
    })

    if (result.newLevel) {
      setCelebrating(true)
      show(`LEVEL UP! Teď jsi level ${result.level} 🎉`)
      setTimeout(() => setCelebrating(false), 2500)
    } else if (result.newBadgeIds.length > 0) {
      setCelebrating(true)
      show('Nový odznak! 🏅')
      setTimeout(() => setCelebrating(false), 2500)
    }
  }, [userId, profile, logsCount.data, weekly.data, today, show])

  if (!profile) return null

  const playedToday = weekly.data ? hasPlayedToday(weekly.data.dateKeys, today) : false
  const firstName = profile.full_name?.split(' ')[0] || 'žáku'

  function openAssignment(assignment: Assignment) {
    navigate('/student/recording', {
      state: {
        lessonTitle: assignment.title,
        instructions: assignment.description ?? '',
        assignmentId: assignment.id,
      },
    })
  }

  return (
    <AppShell role="student">
      <Confetti active={celebrating} />
      {message && <Toast message={message} />}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl">Ahoj, {firstName}! 👋</h1>
          <div className="flex items-center gap-2">
            <Streak count={profile.streak} />
            <XPDisplay xp={profile.stars} />
          </div>
        </div>
        <DailyReminderBanner playedToday={playedToday} onStart={() => navigate('/student/recording')} />

        <div>
          <h2 className="text-sm font-heading font-semibold text-text-muted mb-2">Zadané lekce</h2>
          {assignments.error && (
            <p className="text-sm text-coral-dark mb-2">
              Načtení úkolů se nepovedlo: {assignments.error.message}
            </p>
          )}
          <div className="space-y-2.5 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3 md:space-y-0">
            {assignments.data?.map((assignment) => {
              const done = completed.data?.has(assignment.id) ?? false
              return (
                <LessonCard
                  key={assignment.id}
                  icon="🎵"
                  title={assignment.title}
                  meta={assignment.description ?? ''}
                  badge={done ? { label: 'Hotovo', tone: 'success' } : { label: 'Čeká', tone: 'pending' }}
                  onClick={() => openAssignment(assignment)}
                />
              )
            })}
          </div>
          {assignments.data?.length === 0 && (
            <p className="text-text-muted text-sm">Zatím nemáš žádný zadaný úkol.</p>
          )}
        </div>

        <Card>
          <LevelProgress stars={profile.stars} />
        </Card>
      </div>
    </AppShell>
  )
}
