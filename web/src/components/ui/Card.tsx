import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl bg-bg-card shadow-clay-sm p-5 ${className}`}
      {...props}
    />
  )
}
