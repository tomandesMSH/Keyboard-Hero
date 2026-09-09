export function Streak({ count, freezesAvailable }: { count: number; freezesAvailable?: number }) {
  return (
    <div className="flex items-center gap-1 font-heading font-bold text-sm">
      <span aria-hidden className="inline-block animate-pulse motion-reduce:animate-none">
        🔥
      </span>
      {count}
      {!!freezesAvailable && (
        <span
          title={`${freezesAvailable}x zmrazení streaku k dispozici tento měsíc`}
          aria-label={`${freezesAvailable}x zmrazení streaku k dispozici`}
          className="text-sky-500 text-xs"
        >
          🧊{freezesAvailable}
        </span>
      )}
    </div>
  )
}
