import type { ReactNode } from 'react'

interface ChipProps {
  active: boolean
  onClick: () => void
  children: ReactNode
}

export function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      className={`shrink-0 font-heading font-semibold text-xs px-3.5 py-1.5 rounded-full transition whitespace-nowrap ${
        active ? 'bg-coral text-cream shadow-clay-sm' : 'bg-bg-card-alt text-text-muted shadow-clay-press'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
