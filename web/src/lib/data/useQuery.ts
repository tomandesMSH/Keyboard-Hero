import { useCallback, useEffect, useState } from 'react'

interface QueryState<T> {
  data: T | undefined
  loading: boolean
  error: Error | undefined
  refetch: () => void
}

// Minimal fetch-on-mount hook — deliberately not a caching library, the app
// is small enough that per-screen refetching is fine.
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[]): QueryState<T> {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error>()
  const [tick, setTick] = useState(0)

  const run = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError(undefined)
    fn()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  useEffect(() => run(), [run])

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  return { data, loading, error, refetch }
}
