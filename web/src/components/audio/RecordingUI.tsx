import { Waveform } from './Waveform'

// Placeholder shell — real MediaRecorder wiring lands with the recording module.
export function RecordingUI() {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <Waveform />
      <button
        className="w-20 h-20 rounded-full bg-gradient-to-br from-coral to-magenta shadow-lg shadow-coral/40 flex items-center justify-center"
        aria-label="Spustit nahrávání"
      >
        <span className="w-6 h-6 rounded bg-white" />
      </button>
    </div>
  )
}
