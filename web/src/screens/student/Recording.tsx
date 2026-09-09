import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { RecordingUI } from '../../components/audio/RecordingUI'
import { Toast } from '../../components/ui/Toast'
import { Confetti } from '../../components/gamification/Confetti'
import { useAuth } from '../../lib/AuthProvider'
import { uploadRecording, insertPracticeLog, fetchOwnLogsCount, fetchWeeklyStats } from '../../lib/data/practiceLogs'
import { isPerfectWeek } from '../../lib/game-logic'
import { detectNewUnlocks } from '../../lib/gamification/detectNewUnlocks'
import { useToast } from '../../lib/useToast'
import { getErrorMessage } from '../../lib/errors'

interface LocationState {
  lessonTitle?: string
  instructions?: string
  assignmentId?: string
}

export function Recording() {
  const navigate = useNavigate()
  const location = useLocation()
  const { lessonTitle, instructions, assignmentId } = (location.state ?? {}) as LocationState
  const { profile } = useAuth()
  const { message, show } = useToast()
  const [uploading, setUploading] = useState(false)
  const [celebrating, setCelebrating] = useState(false)

  async function handleRecorded(blob: Blob) {
    if (!profile) return
    setUploading(true)
    try {
      const audioUrl = await uploadRecording(profile.id, blob)
      await insertPracticeLog(profile.id, audioUrl, assignmentId)
      show('Nahrávka odeslána ke kontrole')

      const today = new Date()
      const [logsCount, weekly] = await Promise.all([
        fetchOwnLogsCount(profile.id),
        fetchWeeklyStats(profile.id, today),
      ])
      const result = detectNewUnlocks(profile.id, profile.stars, {
        stars: profile.stars,
        streak: profile.streak,
        totalRecordings: logsCount,
        perfectWeek: isPerfectWeek(weekly.dateKeys, today),
        daysPlayedThisWeek: weekly.dateKeys.length,
        weeklyCount: weekly.weeklyCount,
      })
      if (result.newLevel || result.newBadgeIds.length > 0) {
        setCelebrating(true)
        setTimeout(() => setCelebrating(false), 2500)
      }
      setTimeout(() => navigate('/student'), 1500)
    } catch (err) {
      show(getErrorMessage(err, 'Nahrání se nepovedlo, zkus to znovu.'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-md md:max-w-lg mx-auto p-5">
      <Confetti active={celebrating} />
      {message && <Toast message={message} />}
      <button className="text-sm text-text-muted mb-2.5" onClick={() => navigate(-1)}>
        ← Zpět
      </button>
      <h1 className="text-xl mb-1.5">{lessonTitle ?? 'Nahrávání'}</h1>
      {instructions && <p className="text-text-muted text-xs leading-relaxed mb-2">{instructions}</p>}
      <RecordingUI onRecorded={handleRecorded} />
      {uploading && <p className="text-center text-text-muted text-sm">Nahrávám…</p>}
    </div>
  )
}
