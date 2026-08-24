import type { InputHTMLAttributes } from 'react'

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl bg-bg-card-alt border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-periwinkle ${className}`}
      {...props}
    />
  )
}
