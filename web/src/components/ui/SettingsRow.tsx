import type { ReactNode } from 'react'

interface SettingsRowProps {
  label: string
  right?: ReactNode
  onClick?: () => void
  danger?: boolean
}

export function SettingsRow({ label, right, onClick, danger }: SettingsRowProps) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      className={`w-full flex items-center justify-between py-3 border-b border-border last:border-none text-sm text-left ${
        danger ? 'text-coral-dark' : 'text-text-primary'
      }`}
      onClick={onClick}
    >
      <span>{label}</span>
      {right ?? (onClick && <span className="text-text-muted text-xs">›</span>)}
    </Tag>
  )
}
