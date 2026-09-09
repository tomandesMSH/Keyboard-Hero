import { useCallback, useRef, useState } from 'react'

// Toast itself is a dumb presentational component with no dismiss timer —
// this hook owns the auto-dismiss behavior so every screen doesn't repeat it.
export function useToast(durationMs = 2900) {
  const [message, setMessage] = useState<string>()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const show = useCallback(
    (msg: string) => {
      setMessage(msg)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setMessage(undefined), durationMs)
    },
    [durationMs],
  )

  return { message, show }
}
