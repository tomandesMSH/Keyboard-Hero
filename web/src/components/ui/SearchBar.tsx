interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-bg-card-alt shadow-clay-press px-3.5 py-2.5 text-sm">
      <span aria-hidden className="text-text-muted">
        🔍
      </span>
      <input
        className="flex-1 bg-transparent outline-none placeholder:text-text-muted text-text-primary"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}
