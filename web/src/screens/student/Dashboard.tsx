import { Card } from '../../components/ui/Card'
import { Streak } from '../../components/gamification/Streak'
import { XPDisplay } from '../../components/gamification/XPDisplay'
import { LevelProgress } from '../../components/gamification/LevelProgress'

export function StudentDashboard() {
  return (
    <div className="max-w-md mx-auto p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl">Ahoj! 👋</h1>
        <div className="flex items-center gap-2">
          <Streak count={0} />
          <XPDisplay xp={0} />
        </div>
      </div>
      <Card>
        <LevelProgress stars={0} />
      </Card>
    </div>
  )
}
