import { computeLevel } from '../../lib/game-logic'
import { Progress } from '../ui/Progress'

export function LevelProgress({ stars }: { stars: number }) {
  const info = computeLevel(stars)
  return (
    <div>
      <div className="flex items-center justify-between text-sm font-heading font-semibold mb-1.5">
        <span>
          Level {info.level} · {info.title}
        </span>
        <span className="text-text-muted font-body font-normal text-xs">
          {info.starsInLevel}/10
        </span>
      </div>
      <Progress value={info.progress} />
    </div>
  )
}
