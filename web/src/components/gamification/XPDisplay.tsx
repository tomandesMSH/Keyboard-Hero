export function XPDisplay({ xp }: { xp: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-coral text-cream px-2.5 py-1 text-xs font-heading font-semibold shadow-clay-sm">
      ⭐ {xp} XP
    </div>
  )
}
