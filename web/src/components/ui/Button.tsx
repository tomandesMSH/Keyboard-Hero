import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive'

const variantClasses: Record<Variant, string> = {
  primary: 'bg-gradient-to-r from-periwinkle to-magenta text-text-primary shadow-lg shadow-magenta/30',
  secondary: 'bg-gradient-to-r from-periwinkle to-periwinkle-dark text-text-primary shadow-lg shadow-periwinkle/30',
  ghost: 'bg-transparent text-text-primary border border-border hover:bg-bg-card',
  destructive: 'bg-gradient-to-r from-coral to-magenta text-text-primary shadow-lg shadow-coral/30',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-xl px-5 py-3 font-heading font-semibold text-sm transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
}
