import { useEffect, useRef } from 'react'
import { Waveform } from './Waveform'
import { useMediaRecorder } from '../../lib/audio/useMediaRecorder'

const MAX_SECONDS = 60

function formatTime(seconds: number): string {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

interface RecordingUIProps {
  onRecorded?: (blob: Blob) => void
}

export function RecordingUI({ onRecorded }: RecordingUIProps) {
  const { status, elapsedSeconds, blob, levels, error, start, stop } = useMediaRecorder(MAX_SECONDS)

  // Read the latest callback via a ref so a new function identity from the
  // parent on every render doesn't re-fire this effect for the same blob.
  const onRecordedRef = useRef(onRecorded)
  onRecordedRef.current = onRecorded
  useEffect(() => {
    if (blob) onRecordedRef.current?.(blob)
  }, [blob])

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <Waveform levels={status === 'recording' ? levels : undefined} />
      <div className="font-heading font-semibold text-sm text-text-muted">
        {formatTime(elapsedSeconds)} / {formatTime(MAX_SECONDS)}
      </div>
      <button
        className={`w-20 h-20 rounded-full bg-coral shadow-clay flex items-center justify-center ${
          status === 'recording' ? 'ring-8 ring-coral-tint animate-pulse' : ''
        }`}
        aria-label={status === 'recording' ? 'Zastavit nahrávání' : 'Spustit nahrávání'}
        onClick={status === 'recording' ? stop : start}
      >
        <span className={`bg-cream ${status === 'recording' ? 'w-6 h-6 rounded' : 'w-6 h-6 rounded-full'}`} />
      </button>
      {error && (
        <p role="alert" className="text-sm text-coral-dark text-center">
          {error}
        </p>
      )}
      <p className="text-text-muted text-xs">Klepnutím zastavíš nahrávání</p>
    </div>
  )
}
