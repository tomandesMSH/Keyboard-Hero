export function XPDisplay({ xp }: { xp: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-xp-pink to-coral text-bg px-2.5 py-1 text-xs font-heading font-semibold">
      ⭐ {xp} XP
    </div>
  )
}
