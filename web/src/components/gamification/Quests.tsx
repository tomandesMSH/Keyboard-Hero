import { Card } from '../ui/Card'
import { Progress } from '../ui/Progress'
import type { QuestResult } from '../../lib/game-logic'

export function Quests({ quests }: { quests: QuestResult[] }) {
  return (
    <div>
      <h2 className="text-sm font-heading font-semibold text-text-muted mb-2">Výzvy</h2>
      <div className="space-y-2">
        {quests.map((quest) => (
          <Card key={quest.id} className={quest.completed ? 'opacity-70' : undefined}>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-sm flex items-center gap-1.5">
                <span aria-hidden>{quest.icon}</span>
                {quest.label}
              </span>
              <span className="text-xs text-text-muted shrink-0">
                {quest.completed ? 'Hotovo ✅' : `${quest.current}/${quest.target}`}
              </span>
            </div>
            <Progress value={quest.target === 0 ? 1 : quest.current / quest.target} />
          </Card>
        ))}
      </div>
    </div>
  )
}
