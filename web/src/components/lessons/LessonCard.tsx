import { Badge } from '../ui/Badge'

interface LessonCardProps {
  icon: string
  title: string
  meta: string
  badge: { label: string; tone: 'success' | 'pending' | 'xp' }
  onClick?: () => void
}

export function LessonCard({ icon, title, meta, badge, onClick }: LessonCardProps) {
  return (
    <button
      className="w-full flex items-center justify-between gap-3 rounded-2xl bg-bg-card p-3.5 shadow-clay-sm text-left disabled:pointer-events-none"
      onClick={onClick}
      disabled={!onClick}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 shrink-0 rounded-lg bg-bg-card-alt shadow-clay-sm flex items-center justify-center text-lg">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="font-heading font-semibold text-sm truncate">{title}</div>
          <div className="text-text-muted text-xs truncate">{meta}</div>
        </div>
      </div>
      <Badge tone={badge.tone}>{badge.label}</Badge>
    </button>
  )
}
