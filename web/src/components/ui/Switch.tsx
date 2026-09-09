interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function Switch({ checked, onChange, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`w-9 h-5 shrink-0 rounded-full relative transition disabled:opacity-40 ${
        checked ? 'bg-coral' : 'bg-bg-card-alt shadow-clay-press'
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-cream shadow-clay-sm transition-all ${
          checked ? 'right-0.5' : 'left-0.5'
        }`}
      />
    </button>
  )
}
