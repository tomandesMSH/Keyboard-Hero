interface DailyReminderBannerProps {
  playedToday: boolean
  onStart: () => void
}

export function DailyReminderBanner({ playedToday, onStart }: DailyReminderBannerProps) {
  return (
    <div className="rounded-3xl bg-coral-dark text-cream p-5 shadow-clay">
      <div className="text-[11px] tracking-wider opacity-85 mb-1.5">DENNÍ ÚKOL</div>
      <div className="font-heading font-semibold text-base mb-3">
        {playedToday ? 'Dnešní cvičení splněno! 🎉' : 'Zahraj dnešní cvičení'}
      </div>
      <div className="h-2 rounded-full bg-white/25 overflow-hidden mb-2">
        <div
          className="h-full rounded-full bg-white transition-[width]"
          style={{ width: playedToday ? '100%' : '4%' }}
        />
      </div>
      <div className="text-xs opacity-90 mb-3.5">{playedToday ? '1/1 hotovo' : '0/1 hotovo'}</div>
      {!playedToday && (
        <button
          className="bg-cream text-coral-dark font-heading font-semibold text-xs px-4 py-2 rounded-lg shadow-clay-sm active:scale-95 transition"
          onClick={onStart}
        >
          Zahrát
        </button>
      )}
    </div>
  )
}
