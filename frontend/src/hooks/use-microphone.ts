import * as React from 'react'

export interface MicrophoneState {
  /** 0…1 RMS level of the live input, for waveform + meter UI. */
  level: number
  permission: 'unknown' | 'granted' | 'denied'
  error: string | null
  /** True while a stream is actually flowing. */
  live: boolean
}

/**
 * Real microphone capture: opens the input device while `enabled` and reports
 * a smoothed amplitude level. Nothing is recorded or uploaded — the stream is
 * torn down as soon as the microphone is muted or the component unmounts.
 */
export function useMicrophone(enabled: boolean, deviceId?: string): MicrophoneState {
  const [state, setState] = React.useState<MicrophoneState>({
    level: 0,
    permission: 'unknown',
    error: null,
    live: false,
  })

  // Latest level is written into a ref first so the animation loop can run at
  // frame rate without forcing a React render every tick.
  const levelRef = React.useRef(0)
  const lastPush = React.useRef(0)

  React.useEffect(() => {
    if (!enabled) {
      levelRef.current = 0
      setState((s) => ({ ...s, level: 0, live: false }))
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setState((s) => ({
        ...s,
        permission: 'denied',
        error: 'This browser cannot capture microphone audio.',
      }))
      return
    }

    let stream: MediaStream | null = null
    let context: AudioContext | null = null
    let frame = 0
    let cancelled = false

    const push = (value: number, force = false) => {
      const now = performance.now()
      if (!force && now - lastPush.current < 80 && Math.abs(value - levelRef.current) < 0.05) return
      lastPush.current = now
      levelRef.current = value
      setState((s) => (s.level === value ? s : { ...s, level: value }))
    }

    const run = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        const Ctor: typeof AudioContext =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        context = new Ctor()
        const source = context.createMediaStreamSource(stream)
        const analyser = context.createAnalyser()
        analyser.fftSize = 512
        source.connect(analyser)
        const buffer = new Uint8Array(analyser.fftSize)

        setState((s) => ({ ...s, permission: 'granted', error: null, live: true }))

        const tick = () => {
          if (cancelled) return
          analyser.getByteTimeDomainData(buffer)
          let sum = 0
          for (let i = 0; i < buffer.length; i++) {
            const v = (buffer[i] - 128) / 128
            sum += v * v
          }
          const rms = Math.sqrt(sum / buffer.length)
          // Gentle curve so quiet speech still reads on the meter.
          push(Math.min(1, Math.pow(rms * 3.2, 0.75)))
          frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      } catch (error) {
        if (cancelled) return
        const denied =
          error instanceof DOMException &&
          (error.name === 'NotAllowedError' || error.name === 'SecurityError')
        setState((s) => ({
          ...s,
          permission: denied ? 'denied' : 'unknown',
          live: false,
          error: denied
            ? 'Microphone access was blocked. Allow it in your browser settings to speak.'
            : 'Could not open the microphone. Check that no other app is using it.',
        }))
      }
    }

    void run()

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      stream?.getTracks().forEach((t) => t.stop())
      void context?.close().catch(() => undefined)
      levelRef.current = 0
      setState((s) => ({ ...s, level: 0, live: false }))
    }
  }, [enabled, deviceId])

  return state
}
