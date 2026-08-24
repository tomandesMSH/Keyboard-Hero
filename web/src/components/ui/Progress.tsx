interface ProgressProps {
  value: number // 0..1
  className?: string
}

export function Progress({ value, className = '' }: ProgressProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div className={`h-3.5 rounded-full bg-white/10 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-xp-pink to-coral transition-[width]"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function CircularProgress({ value, size = 56 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(1, value))
  const r = size / 2 - 4
  const circumference = 2 * Math.PI * r
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.1)" strokeWidth={4} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#BF40FA"
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - pct)}
      />
    </svg>
  )
}
