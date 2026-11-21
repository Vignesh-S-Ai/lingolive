import type { TtsSegment } from '../../services/pipelineService'
import { getSettings } from '../../store/settingsStore'

/**
 * Ordered playback queue for translated speech arriving from the pipeline.
 *
 * One AudioContext, one active source at a time — segments play strictly in
 * arrival order (the backend already sequences them per listener), each
 * segment is played at most once, and every segment is resampled from its
 * native TTS rate (8/16/22.05/44.1 kHz) to the context rate.
 */

interface QueuedSegment {
  segmentId: string
  pcm: ArrayBuffer
  rate: number
}

/** Introspection for dev/CDP tests — proves bytes arrived and rendered. */
export interface PlaybackStats {
  ctxState: string
  queueLen: number
  playing: boolean
  totalPlayed: number
  last: { segmentId: string; bytes: number; durationS: number; peak: number } | null
}

class PlaybackQueue {
  private ctx: AudioContext | null = null
  private queue: QueuedSegment[] = []
  private seen = new Set<string>()
  private playing = false
  private current: AudioBufferSourceNode | null = null
  private volume = 1
  private resumeListener: (() => void) | null = null
  private totalPlayed = 0
  private lastStats: PlaybackStats['last'] = null

  /** The backend does not send the sample rate — Gnani Timbre streams at 16 kHz by default. */
  defaultRate = 16_000

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
  }

  stats(): PlaybackStats {
    return {
      ctxState: this.ctx?.state ?? 'none',
      queueLen: this.queue.length,
      playing: this.playing,
      totalPlayed: this.totalPlayed,
      last: this.lastStats,
    }
  }

  enqueue(segment: TtsSegment): void {
    if (this.seen.has(segment.segmentId)) return
    this.seen.add(segment.segmentId)
    if (this.seen.size > 128) {
      const oldest = this.seen.values().next().value
      if (oldest !== undefined) this.seen.delete(oldest)
    }
    if (segment.pcm.byteLength === 0) return
    this.queue.push({ segmentId: segment.segmentId, pcm: segment.pcm, rate: this.defaultRate })
    void this.pump()
  }

  stopAll(): void {
    this.queue = []
    if (this.current) {
      try {
        this.current.onended = null
        this.current.stop()
      } catch {
        /* already stopped */
      }
      this.current = null
    }
  }

  dispose(): void {
    this.stopAll()
    if (this.resumeListener) {
      document.removeEventListener('pointerdown', this.resumeListener)
      this.resumeListener = null
    }
    const ctx = this.ctx
    this.ctx = null
    void ctx?.close().catch(() => undefined)
  }

  private ensureContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const Ctor: typeof AudioContext =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctor()
      const resume = () => {
        if (this.ctx?.state === 'suspended') void this.ctx.resume().catch(() => undefined)
      }
      this.resumeListener = resume
      document.addEventListener('pointerdown', resume, { once: true })
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => undefined)
    return this.ctx
  }

  private async pump(): Promise<void> {
    if (this.playing) return
    this.playing = true
    try {
      while (this.queue.length) {
        const item = this.queue.shift()
        if (!item) break
        if (!getSettings().speakerEnabled) continue
        const ctx = this.ensureContext()
        const buffer = this.decode(ctx, item)
        if (!buffer) continue
        // Peak amplitude of the decoded samples — >0 proves non-silent audio.
        const data = buffer.getChannelData(0)
        let peak = 0
        for (let i = 0; i < data.length; i++) {
          const a = data[i] < 0 ? -data[i] : data[i]
          if (a > peak) peak = a
        }
        this.lastStats = {
          segmentId: item.segmentId,
          bytes: item.pcm.byteLength,
          durationS: Math.round(buffer.duration * 100) / 100,
          peak: Math.round(peak * 1000) / 1000,
        }
        const source = ctx.createBufferSource()
        source.buffer = buffer
        const gain = ctx.createGain()
        gain.gain.value = this.volume
        source.connect(gain)
        gain.connect(ctx.destination)
        this.current = source
        await new Promise<void>((resolve) => {
          source.onended = () => resolve()
          source.start()
        })
        this.current = null
        this.totalPlayed += 1
      }
    } finally {
      this.playing = false
      this.current = null
    }
  }

  private decode(ctx: AudioContext, item: QueuedSegment): AudioBuffer | null {
    try {
      const int16 = new Int16Array(item.pcm)
      if (!int16.length) return null
      const ratio = item.rate / ctx.sampleRate
      const outLength = Math.max(1, Math.floor(int16.length / ratio))
      const buffer = ctx.createBuffer(1, outLength, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      if (ratio === 1) {
        for (let i = 0; i < outLength; i++) data[i] = int16[i] / 0x8000
      } else {
        for (let i = 0; i < outLength; i++) {
          const pos = i * ratio
          const left = Math.min(int16.length - 1, Math.floor(pos))
          const right = Math.min(int16.length - 1, left + 1)
          const frac = pos - left
          data[i] = (int16[left] * (1 - frac) + int16[right] * frac) / 0x8000
        }
      }
      return buffer
    } catch {
      return null
    }
  }
}

export const playback = new PlaybackQueue()
