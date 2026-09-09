const COLORS = ['#F95C4B', '#E14432', '#0A0A0A', '#FDE0DB', '#8C8578']

// Placeholder shell — wired up properly when the celebration flow is built.
export function Confetti({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <span
          key={i}
          className="absolute top-[-10px] w-2 h-2 rounded-sm animate-bounce"
          style={{
            left: `${Math.random() * 100}%`,
            background: COLORS[i % COLORS.length],
            animationDelay: `${Math.random() * 0.4}s`,
          }}
        />
      ))}
    </div>
  )
}
