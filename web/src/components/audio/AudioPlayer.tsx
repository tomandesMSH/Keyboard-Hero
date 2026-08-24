import { Waveform } from './Waveform'

// Placeholder shell — real playback wiring lands with the grading module.
export function AudioPlayer({ src }: { src?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-bg-card-alt p-3">
      <button
        className="w-9 h-9 shrink-0 rounded-full bg-periwinkle flex items-center justify-center"
        disabled={!src}
        aria-label="Přehrát"
      >
        ▶
      </button>
      <div className="flex-1">
        <Waveform />
      </div>
    </div>
  )
}
