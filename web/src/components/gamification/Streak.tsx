export function Streak({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1 font-heading font-bold text-sm">
      <span aria-hidden>🔥</span>
      {count}
    </div>
  )
}
