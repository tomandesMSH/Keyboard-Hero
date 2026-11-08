import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

interface InfoTipProps {
  // What the "i" explains - read out by screen readers as the button's name.
  label: string
  children: ReactNode
  // Which way the bubble opens from the "i" (towards the free space).
  align?: 'left' | 'right'
}

// A small "i" that shows an explanation in a bubble when clicked, and hides it
// again on a second click, a click elsewhere or Escape.
export function InfoTip({ label, children, align = 'left' }: InfoTipProps) {
  const [open, setOpen] = useState(false)
  const wrapper = useRef<HTMLSpanElement>(null)
  const bubbleId = useId()

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (wrapper.current && !wrapper.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  return (
    <span
      ref={wrapper}
      className="relative inline-flex align-middle"
      onKeyDown={(e) => {
        // Close the bubble, not the dialog around it.
        if (e.key === 'Escape' && open) {
          e.stopPropagation()
          setOpen(false)
        }
      }}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={bubbleId}
        className="w-4 h-4 rounded-full border border-text-muted text-text-muted text-[10px] font-semibold leading-none flex items-center justify-center hover:text-text-primary hover:border-text-primary"
        onClick={(e) => {
          // Inside a clickable card: don't open the card too.
          e.stopPropagation()
          setOpen((o) => !o)
        }}
      >
        i
      </button>
      {open && (
        <span
          id={bubbleId}
          role="note"
          className={`absolute top-6 z-20 w-72 max-w-[80vw] rounded-xl bg-bg-card border border-border shadow-clay-sm p-3 text-xs leading-relaxed text-text-primary font-normal text-left normal-case ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </span>
      )}
    </span>
  )
}
