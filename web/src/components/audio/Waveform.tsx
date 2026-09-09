interface WaveformProps {
  bars?: number
  // Real amplitude data (0-255 per bar, e.g. from AnalyserNode.getByteFrequencyData).
  // Falls back to a static decorative pattern when omitted.
  levels?: number[]
  // Playback progress 0..1 — colors bars up to this fraction as "played".
  progress?: number
}

export function Waveform({ bars = 24, levels, progress }: WaveformProps) {
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {Array.from({ length: bars }).map((_, i) => {
        const height = levels ? Math.max(8, ((levels[i] ?? 0) / 255) * 100) : 20 + Math.sin(i) * 40 + 40
        const played = progress !== undefined && i / bars <= progress
        const color = progress !== undefined ? (played ? 'bg-coral' : 'bg-bg-card') : 'bg-coral'
        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-[height] duration-100 ${color}`}
            style={{ height: `${height}%` }}
          />
        )
      })}
    </div>
  )
}
