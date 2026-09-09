import { useEffect, useRef, useState } from 'react'
import { Waveform } from './Waveform'

const SPEEDS = [0.5, 0.75, 1] as const

interface AudioPlayerProps {
  src?: string
}

export function AudioPlayer({ src }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1)

  useEffect(() => {
    setPlaying(false)
    setProgress(0)
  }, [src])

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed
  }, [speed])

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) audio.pause()
    else audio.play()
  }

  function handleTimeUpdate() {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    setProgress(audio.currentTime / audio.duration)
  }

  return (
    <div className="rounded-2xl bg-bg-card shadow-clay p-4 space-y-3">
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
      />
      <div className="flex items-center gap-3">
        <button
          className="w-9 h-9 shrink-0 rounded-full bg-coral shadow-clay-sm flex items-center justify-center disabled:opacity-40"
          disabled={!src}
          onClick={toggle}
          aria-label={playing ? 'Pozastavit' : 'Přehrát'}
        >
          {playing ? '⏸' : '▶'}
        </button>
        <div className="flex-1">
          <Waveform progress={progress} />
        </div>
      </div>
      <div className="flex gap-1.5">
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              speed === s ? 'bg-coral-tint text-coral-dark shadow-clay-sm' : 'bg-bg-card-alt text-text-muted shadow-clay-press'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  )
}
