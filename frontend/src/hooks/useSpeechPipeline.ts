import * as React from 'react'
import type { PipelineClient } from '../services/pipelineService'

/**
 * Captures the microphone, converts it to 16 kHz mono PCM (what the backend
 * pipeline expects), streams it to `client`, and derives utterance markers
 * from a simple RMS voice-activity detector.
 *
 * The AudioWorklet batches ~100 ms of samples per message; a linear
 * resampler normalises any context rate down to 16 kHz (browsers that honour
 * `sampleRate: 16000` skip the resample entirely).
 */

export interface SpeechPipelineState {
  /** 0…1 smoothed input level for meters. */
  level: number
  permission: 'unknown' | 'granted' | 'denied'
  error: string | null
  /** True while the capture graph is running. */
  live: boolean
  /** True while the VAD currently classifies the input as speech. */
  speaking: boolean
}

interface Options {
  /** Capture only while the session is live. */
  enabled: boolean
  /** Muted stops audio/utterance traffic but keeps the device open. */
  muted: boolean
  deviceId?: string
  client: PipelineClient | null
}

const TARGET_RATE = 16_000
const VAD_ENTER_RMS = 0.015
const VAD_EXIT_RMS = 0.01
const VAD_ENTER_FRAMES = 2 // ~200 ms of speech to open an utterance
const VAD_EXIT_FRAMES = 8 // ~800 ms of silence to close it

const WORKLET_SOURCE = `
class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.chunks = []
    this.size = 0
    this.target = Math.max(128, Math.round(sampleRate / 10))
  }
  process(inputs) {
    const input = inputs[0]
    if (input && input[0] && input[0].length) {
      const copy = new Float32Array(input[0])
      this.chunks.push(copy)
      this.size += copy.length
      if (this.size >= this.target) {
        const merged = new Float32Array(this.size)
        let offset = 0
        for (const chunk of this.chunks) { merged.set(chunk, offset); offset += chunk.length }
        this.port.postMessage(merged, [merged.buffer])
        this.chunks = []
        this.size = 0
      }
    }
    return true
  }
}
registerProcessor('capture-processor', CaptureProcessor)
`

/** Linear resample from `from` rate to 16 kHz (identity when already 16 kHz). */
function resampleTo16k(input: Float32Array, fromRate: number): Float32Array {
  if (fromRate === TARGET_RATE) return input
  const ratio = fromRate / TARGET_RATE
  const outLength = Math.floor(input.length / ratio)
  const output = new Float32Array(outLength)
  for (let i = 0; i < outLength; i++) {
    const pos = i * ratio
    const left = Math.floor(pos)
    const right = Math.min(left + 1, input.length - 1)
    const frac = pos - left
    output[i] = input[left] * (1 - frac) + input[right] * frac
  }
  return output
}

function floatToInt16(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length)
  for (let i = 0; i < input.length; i++) {
    const v = Math.max(-1, Math.min(1, input[i]))
    output[i] = v < 0 ? v * 0x8000 : v * 0x7fff
  }
  return output
}

function rmsOf(input: Float32Array): number {
  let sum = 0
  for (let i = 0; i < input.length; i++) sum += input[i] * input[i]
  return Math.sqrt(sum / Math.max(1, input.length))
}

const initial: SpeechPipelineState = {
  level: 0,
  permission: 'unknown',
  error: null,
  live: false,
  speaking: false,
}

export function useSpeechPipeline({ enabled, muted, deviceId, client }: Options): SpeechPipelineState {
  const [state, setState] = React.useState<SpeechPipelineState>(initial)

  const mutedRef = React.useRef(muted)
  const clientRef = React.useRef<PipelineClient | null>(client)
  const vadRef = React.useRef({ speaking: false, aboveCount: 0, belowCount: 0, seq: 0 as number | null })

  React.useEffect(() => {
    mutedRef.current = muted
    if (clientRef.current) clientRef.current.setMuted(muted)
    // A muted pipeline must not look like active speech to the UI.
    if (muted) {
      vadRef.current.speaking = false
      vadRef.current.aboveCount = 0
      vadRef.current.belowCount = 0
      setState((s) => (s.speaking || s.level ? { ...s, speaking: false, level: 0 } : s))
    }
  }, [muted])

  React.useEffect(() => {
    clientRef.current = client
    if (client) client.setMuted(mutedRef.current)
  }, [client])

  React.useEffect(() => {
    if (!enabled) {
      setState(initial)
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

    let cancelled = false
    let stream: MediaStream | null = null
    let context: AudioContext | null = null
    let node: AudioWorkletNode | null = null
    let source: MediaStreamAudioSourceNode | null = null
    let workletUrl: string | null = null
    let resumeListener: (() => void) | null = null

    const vad = vadRef.current

    const finishUtterance = () => {
      if (vad.seq !== null && clientRef.current) {
        clientRef.current.utteranceEnd(vad.seq)
      }
      vad.seq = null
      if (vad.speaking) {
        vad.speaking = false
        setState((s) => (s.speaking ? { ...s, speaking: false } : s))
      }
    }

    const run = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        const Ctor: typeof AudioContext =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        try {
          context = new Ctor({ sampleRate: TARGET_RATE })
        } catch {
          context = new Ctor()
        }
        const ctx = context

        const blob = new Blob([WORKLET_SOURCE], { type: 'application/javascript' })
        workletUrl = URL.createObjectURL(blob)
        await ctx.audioWorklet.addModule(workletUrl)
        if (cancelled) return

        source = ctx.createMediaStreamSource(stream)
        node = new AudioWorkletNode(ctx, 'capture-processor')
        source.connect(node)
        // Keep the graph pulled without audible routing.
        const mute = ctx.createGain()
        mute.gain.value = 0
        node.connect(mute)
        mute.connect(ctx.destination)

        setState((s) => ({ ...s, permission: 'granted', error: null, live: true }))

        const resume = () => {
          if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined)
        }
        resume()
        resumeListener = resume
        document.addEventListener('pointerdown', resume, { once: true })

        node.port.onmessage = (ev: MessageEvent<Float32Array>) => {
          if (cancelled) return
          const batch = ev.data
          if (!batch || !batch.length) return

          const pcm16 = resampleTo16k(batch, ctx.sampleRate)
          const rms = rmsOf(pcm16)

          // Meter: smoothed curve matching the preview-mode meter.
          const level = Math.min(1, Math.pow(rms * 3.2, 0.75))
          setState((s) =>
            Math.abs(s.level - level) > 0.03 || (level === 0 && s.level !== 0)
              ? { ...s, level }
              : s
          )

          if (mutedRef.current) {
            if (vad.seq !== null) finishUtterance()
            return
          }

          // VAD → utterance markers (audio itself always streams while unmuted).
          if (rms >= VAD_ENTER_RMS) {
            vad.aboveCount += 1
            vad.belowCount = 0
          } else {
            vad.belowCount += 1
            vad.aboveCount = 0
          }
          if (!vad.speaking && vad.aboveCount >= VAD_ENTER_FRAMES) {
            vad.speaking = true
            vad.seq = clientRef.current?.utteranceStart() ?? null
            setState((s) => (s.speaking ? s : { ...s, speaking: true }))
          } else if (vad.speaking && rms < VAD_EXIT_RMS && vad.belowCount >= VAD_EXIT_FRAMES) {
            finishUtterance()
          }

          const int16 = floatToInt16(pcm16)
          clientRef.current?.sendAudio(int16.buffer as ArrayBuffer)
        }
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
      finishUtterance()
      if (resumeListener) document.removeEventListener('pointerdown', resumeListener)
      if (node) {
        node.port.onmessage = null
        node.disconnect()
      }
      source?.disconnect()
      stream?.getTracks().forEach((t) => t.stop())
      if (workletUrl) URL.revokeObjectURL(workletUrl)
      void context?.close().catch(() => undefined)
      setState(initial)
    }
    // `muted` is intentionally handled through refs — toggling it must not
    // rebuild the audio graph.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, deviceId])

  return state
}
