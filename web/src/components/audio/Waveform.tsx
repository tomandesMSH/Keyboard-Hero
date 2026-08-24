// Placeholder static waveform — real audio-driven rendering comes with the recording module.
export function Waveform({ bars = 24 }: { bars?: number }) {
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-periwinkle"
          style={{ height: `${20 + Math.sin(i) * 40 + 40}%` }}
        />
      ))}
    </div>
  )
}
