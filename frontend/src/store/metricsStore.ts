import { create } from 'zustand'
import type { PipelineLatency, PipelineMetrics } from '../types'

/** Rolling window used for the averages shown in the live metrics panel. */
const WINDOW = 12

function average(samples: PipelineLatency[]): PipelineLatency | null {
  if (!samples.length) return null
  const pick = (get: (l: PipelineLatency) => number | null | undefined) => {
    const values = samples.map(get).filter((v): v is number => typeof v === 'number')
    if (!values.length) return null
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  }
  return {
    stt_ms: pick((l) => l.stt_ms),
    endpoint_ms: pick((l) => l.endpoint_ms),
    translate_ms: pick((l) => l.translate_ms),
    tts_ms: pick((l) => l.tts_ms),
    first_audio_ms: pick((l) => l.first_audio_ms),
  }
}

export interface MetricsStore extends PipelineMetrics {
  /** Pause (VAD end) → first translated audio available — user-perceived. */
  firstAudioMs: number | null
  setStatus: (status: PipelineMetrics['status']) => void
  setLiveKitStatus: (status: PipelineMetrics['liveKitStatus']) => void
  setPing: (ms: number) => void
  setFirstAudio: (ms: number) => void
  recordSegment: (latency: PipelineLatency | null | undefined) => void
  setError: (message: string | null) => void
  reset: () => void
}

/** Internal state — `window` holds the rolling latency samples. */
type MetricsState = MetricsStore & { window: PipelineLatency[] }

const initialData: Pick<
  MetricsState,
  | 'status'
  | 'liveKitStatus'
  | 'pingMs'
  | 'last'
  | 'avg'
  | 'segments'
  | 'error'
  | 'firstAudioMs'
  | 'window'
> = {
  status: 'idle',
  liveKitStatus: 'idle',
  pingMs: null,
  last: null,
  avg: null,
  segments: 0,
  error: null,
  firstAudioMs: null,
  window: [],
}

export const useMetricsStore = create<MetricsState>((set) => ({
  ...initialData,

  setStatus: (status) => set({ status }),
  setLiveKitStatus: (liveKitStatus) => set({ liveKitStatus }),
  setPing: (pingMs) => set({ pingMs }),
  setFirstAudio: (firstAudioMs) => set({ firstAudioMs }),
  setError: (error) => set({ error }),

  recordSegment: (latency) =>
    set((s) => {
      if (!latency) return { segments: s.segments + 1 }
      const last: PipelineLatency = {
        stt_ms: latency.stt_ms ?? null,
        endpoint_ms: latency.endpoint_ms ?? null,
        translate_ms: latency.translate_ms ?? null,
        tts_ms: latency.tts_ms ?? null,
        first_audio_ms: latency.first_audio_ms ?? null,
      }
      const window = [...s.window, last].slice(-WINDOW)
      return { last, avg: average(window), segments: s.segments + 1, window }
    }),

  reset: () => set({ ...initialData }),
}))
