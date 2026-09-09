import { useCallback, useRef, useState } from 'react'

export type RecordingStatus = 'idle' | 'recording' | 'stopped' | 'error'

interface MediaRecorderState {
  status: RecordingStatus
  elapsedSeconds: number
  blob: Blob | undefined
  levels: number[]
  error: string | undefined
  start: () => Promise<void>
  stop: () => void
}

const BAR_COUNT = 24

export function useMediaRecorder(maxSeconds = 60): MediaRecorderState {
  const [status, setStatus] = useState<RecordingStatus>('idle')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [blob, setBlob] = useState<Blob>()
  const [levels, setLevels] = useState<number[]>(Array(BAR_COUNT).fill(0))
  const [error, setError] = useState<string>()

  const recorderRef = useRef<MediaRecorder>(undefined)
  const streamRef = useRef<MediaStream>(undefined)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const audioCtxRef = useRef<AudioContext>(undefined)
  const analyserRef = useRef<AnalyserNode>(undefined)

  const cleanup = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    audioCtxRef.current?.close().catch(() => {})
  }, [])

  const stop = useCallback(() => {
    recorderRef.current?.stop()
  }, [])

  const start = useCallback(async () => {
    setError(undefined)
    setBlob(undefined)
    setElapsedSeconds(0)
    chunksRef.current = []

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setStatus('error')
      setError('Nepodařilo se získat přístup k mikrofonu.')
      return
    }
    streamRef.current = stream

    const audioCtx = new AudioContext()
    audioCtxRef.current = audioCtx
    const source = audioCtx.createMediaStreamSource(stream)
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 64
    source.connect(analyser)
    analyserRef.current = analyser

    const recorder = new MediaRecorder(stream)
    recorderRef.current = recorder
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      setBlob(new Blob(chunksRef.current, { type: 'audio/wav' }))
      setStatus('stopped')
      cleanup()
    }
    recorder.start()
    setStatus('recording')

    const startedAt = Date.now()
    const freqData = new Uint8Array(analyser.frequencyBinCount)
    intervalRef.current = setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000)
      setElapsedSeconds(seconds)
      analyser.getByteFrequencyData(freqData)
      const step = Math.max(1, Math.floor(freqData.length / BAR_COUNT))
      const next: number[] = []
      for (let i = 0; i < BAR_COUNT; i++) {
        next.push(freqData[i * step] ?? 0)
      }
      setLevels(next)
      if (seconds >= maxSeconds) stop()
    }, 200)
  }, [cleanup, maxSeconds, stop])

  return { status, elapsedSeconds, blob, levels, error, start, stop }
}
