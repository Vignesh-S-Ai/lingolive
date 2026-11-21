import { env } from '../lib/env'
import type { PipelineLatency } from '../types'

/**
 * Client for the backend's per-participant speech pipeline socket:
 *
 *   ws(s)://<api>/v1/rooms/{code}/pipeline?participant_id=<uuid>
 *
 * Binary frames up are microphone PCM (16 kHz mono Int16); binary frames down
 * are translated TTS PCM. JSON text frames carry control and events. One
 * socket per participant; reconnects with backoff and the server issues a
 * fresh STT session + roster on every connect.
 */

export type PipelineStatus = 'idle' | 'connecting' | 'open' | 'error' | 'closed'

export interface RosterParticipant {
  id: string
  name: string
  input_language: string
  output_language: string
  mic_enabled: boolean
}

export interface TranscriptEvent {
  final: boolean
  segmentId: string | null
  participantId: string
  participantName: string
  language: string
  text: string
  seq: number | null
}

export interface TranslationEvent {
  segmentId: string
  /** Speaker's participant id — maps to TranscriptEntry.participantId. */
  participantId: string
  participantName: string
  language: string
  sourceLanguage: string
  text: string
  /** False for the speaker's own text-only preview. */
  audio: boolean
  utteranceTs: number | null
}

export interface TtsSegment {
  segmentId: string
  language: string
  text: string
  latency: PipelineLatency | null
  /** Client clock (Date.now) of the utterance start this audio belongs to. */
  utteranceTs: number | null
  pcm: ArrayBuffer
}

export interface PipelineEvents {
  onStatus?: (status: PipelineStatus) => void
  onReady?: (info: { participantId: string; roomCode: string; inputLanguage: string; outputLanguage: string }) => void
  onRoster?: (participants: RosterParticipant[]) => void
  onTranscript?: (event: TranscriptEvent) => void
  onTranslation?: (event: TranslationEvent) => void
  onTtsSegment?: (segment: TtsSegment) => void
  onTtsDropped?: (event: { segmentId: string; reason: string }) => void
  onError?: (event: { stage: string; message: string; segmentId?: string }) => void
  onSttRestarted?: (reason: string) => void
  onLanguagesUpdated?: (languages: { inputLanguage: string; outputLanguage: string }) => void
  onPong?: (rttMs: number) => void
}

const MAX_AUDIO_BYTES = 256 * 1024
const PING_INTERVAL_MS = 10_000
const RECONNECT_DELAYS_MS = [1_000, 2_000, 4_000]

function toWsUrl(apiBase: string, path: string): string {
  const base = apiBase.replace(/^http/, 'ws').replace(/\/+$/, '')
  return `${base}${path}`
}

interface PendingTts {
  segmentId: string
  language: string
  text: string
  latency: PipelineLatency | null
  utteranceTs: number | null
  chunks: ArrayBuffer[]
}

export class PipelineClient {
  private ws: WebSocket | null = null
  private outbox: string[] = []
  private intentionallyClosed = false
  private attempt = 0
  private pingTimer: number | null = null
  private pingSentAt = 0
  private pendingTts: PendingTts | null = null
  private seq = 0
  /** seq → utterance start ts; start ts → VAD-end ts (for first-audio timing). */
  private startTsBySeq = new Map<number, number>()
  private endAtByStartTs = new Map<number, number>()

  status: PipelineStatus = 'idle'
  private events: PipelineEvents = {}

  constructor(
    private readonly roomCode: string,
    private readonly participantId: string,
    events: PipelineEvents = {}
  ) {
    this.events = events
  }

  /* ---------------------------------------------------------------- */
  /* lifecycle                                                         */
  /* ---------------------------------------------------------------- */

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return
    this.intentionallyClosed = false
    this.setStatus(this.attempt === 0 ? 'connecting' : 'connecting')

    const url = toWsUrl(env.apiBaseUrl, `/v1/rooms/${encodeURIComponent(this.roomCode)}/pipeline?participant_id=${encodeURIComponent(this.participantId)}`)

    let ws: WebSocket
    try {
      ws = new WebSocket(url)
    } catch {
      this.scheduleReconnect()
      return
    }
    ws.binaryType = 'arraybuffer'
    this.ws = ws

    ws.onopen = () => {
      this.attempt = 0
      this.setStatus('open')
      this.startPing()
      const queued = this.outbox
      this.outbox = []
      for (const json of queued) {
        try {
          ws.send(json)
        } catch {
          break
        }
      }
    }

    ws.onmessage = (ev: MessageEvent) => {
      if (typeof ev.data === 'string') this.handleText(ev.data)
      else if (ev.data instanceof ArrayBuffer) this.handleBinary(ev.data)
    }

    ws.onerror = () => {
      /* onclose always follows — reconnect handled there */
    }

    ws.onclose = () => {
      this.stopPing()
      this.pendingTts = null
      this.outbox = []
      if (this.intentionallyClosed) {
        this.setStatus('closed')
        return
      }
      this.scheduleReconnect()
    }
  }

  close(): void {
    this.intentionallyClosed = true
    this.stopPing()
    const ws = this.ws
    this.ws = null
    if (ws) {
      ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null
      try {
        ws.close()
      } catch {
        /* already closing */
      }
    }
    this.setStatus('closed')
  }

  private scheduleReconnect(): void {
    if (this.intentionallyClosed) return
    if (this.attempt >= RECONNECT_DELAYS_MS.length) {
      this.setStatus('error')
      return
    }
    const delay = RECONNECT_DELAYS_MS[this.attempt]
    this.attempt += 1
    this.setStatus('connecting')
    window.setTimeout(() => {
      if (!this.intentionallyClosed) this.connect()
    }, delay)
  }

  private setStatus(status: PipelineStatus): void {
    if (this.status === status) return
    this.status = status
    this.events.onStatus?.(status)
  }

  private startPing(): void {
    this.stopPing()
    this.pingTimer = window.setInterval(() => this.ping(), PING_INTERVAL_MS)
  }

  private stopPing(): void {
    if (this.pingTimer !== null) {
      window.clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }

  /* ---------------------------------------------------------------- */
  /* outbound                                                          */
  /* ---------------------------------------------------------------- */

  private send(obj: Record<string, unknown>): boolean {
    const ws = this.ws
    if (!ws) return false
    if (ws.readyState === WebSocket.CONNECTING) {
      // Control messages must not be silently lost during the handshake —
      // an utterance start dropped here would leave the server without the
      // utterance clock (stt/endpoint metrics, provisional final).
      if (this.outbox.length < 32) this.outbox.push(JSON.stringify(obj))
      return true
    }
    if (ws.readyState !== WebSocket.OPEN) return false
    try {
      ws.send(JSON.stringify(obj))
      return true
    } catch {
      return false
    }
  }

  /** Microphone PCM batch (16 kHz mono Int16). */
  sendAudio(data: ArrayBuffer): boolean {
    const ws = this.ws
    if (!ws || ws.readyState !== WebSocket.OPEN || data.byteLength === 0) return false
    if (data.byteLength > MAX_AUDIO_BYTES) return false
    try {
      ws.send(data)
      return true
    } catch {
      return false
    }
  }

  utteranceStart(): number {
    const seq = ++this.seq
    const ts = Date.now()
    this.startTsBySeq.set(seq, ts)
    if (this.startTsBySeq.size > 64) {
      const oldest = this.startTsBySeq.keys().next().value
      if (oldest !== undefined) this.startTsBySeq.delete(oldest)
    }
    this.send({ type: 'utterance', event: 'start', seq, ts })
    return seq
  }

  utteranceEnd(seq: number): void {
    const ts = Date.now()
    const startTs = this.startTsBySeq.get(seq)
    if (startTs !== undefined) {
      this.endAtByStartTs.set(startTs, ts)
      if (this.endAtByStartTs.size > 64) {
        const oldest = this.endAtByStartTs.keys().next().value
        if (oldest !== undefined) this.endAtByStartTs.delete(oldest)
      }
    }
    this.send({ type: 'utterance', event: 'end', seq, ts })
  }

  /** VAD-end timestamp (Date.now) for an utterance start ts, if known. */
  utteranceEndAt(startTs: number | null): number | null {
    if (startTs === null) return null
    return this.endAtByStartTs.get(startTs) ?? null
  }

  setMuted(muted: boolean): void {
    this.send({ type: 'mic', muted })
  }

  setLanguages(inputLanguage: string, outputLanguage: string): void {
    this.send({ type: 'set_languages', input_language: inputLanguage, output_language: outputLanguage })
  }

  ping(): void {
    if (this.send({ type: 'ping', ts: Date.now() })) {
      this.pingSentAt = Date.now()
    }
  }

  /* ---------------------------------------------------------------- */
  /* inbound                                                           */
  /* ---------------------------------------------------------------- */

  private handleText(raw: string): void {
    let msg: Record<string, unknown>
    try {
      msg = JSON.parse(raw) as Record<string, unknown>
    } catch {
      return
    }
    const type = msg.type as string | undefined

    switch (type) {
      case 'ready':
        this.events.onReady?.({
          participantId: String(msg.participant_id ?? this.participantId),
          roomCode: String(msg.room_code ?? this.roomCode),
          inputLanguage: String(msg.input_language ?? ''),
          outputLanguage: String(msg.output_language ?? ''),
        })
        break

      case 'roster':
        this.events.onRoster?.((msg.participants as RosterParticipant[] | undefined) ?? [])
        break

      case 'transcript': {
        const e = this.events.onTranscript
        if (!e) break
        e({
          final: msg.final === true,
          segmentId: typeof msg.segment_id === 'string' ? msg.segment_id : null,
          participantId: String(msg.participant_id ?? ''),
          participantName: String(msg.participant_name ?? ''),
          language: String(msg.language ?? ''),
          text: String(msg.text ?? ''),
          seq: typeof msg.seq === 'number' ? msg.seq : null,
        })
        break
      }

      case 'translation':
        this.events.onTranslation?.({
          segmentId: String(msg.segment_id ?? ''),
          participantId: String(msg.participant_id ?? ''),
          participantName: String(msg.participant_name ?? ''),
          language: String(msg.language ?? ''),
          sourceLanguage: String(msg.source_language ?? ''),
          text: String(msg.text ?? ''),
          audio: msg.audio === true,
          utteranceTs: typeof msg.utterance_ts === 'number' ? msg.utterance_ts : null,
        })
        break

      case 'tts_start':
        this.pendingTts = {
          segmentId: String(msg.segment_id ?? ''),
          language: String(msg.language ?? ''),
          text: String(msg.text ?? ''),
          latency: (msg.latency as PipelineLatency | null) ?? null,
          utteranceTs: typeof msg.utterance_ts === 'number' ? msg.utterance_ts : null,
          chunks: [],
        }
        break

      case 'tts_end': {
        const pending = this.pendingTts
        this.pendingTts = null
        if (!pending) break
        const total = pending.chunks.reduce((n, c) => n + c.byteLength, 0)
        const pcm = new Uint8Array(total)
        let offset = 0
        for (const chunk of pending.chunks) {
          pcm.set(new Uint8Array(chunk), offset)
          offset += chunk.byteLength
        }
        this.events.onTtsSegment?.({
          segmentId: pending.segmentId,
          language: pending.language,
          text: pending.text,
          latency: pending.latency,
          utteranceTs: pending.utteranceTs,
          pcm: pcm.buffer,
        })
        break
      }

      case 'tts_dropped':
        this.events.onTtsDropped?.({
          segmentId: String(msg.segment_id ?? ''),
          reason: String(msg.reason ?? ''),
        })
        break

      case 'error':
        this.events.onError?.({
          stage: String(msg.stage ?? 'pipeline'),
          message: String(msg.message ?? 'Unknown pipeline error.'),
          segmentId: typeof msg.segment_id === 'string' ? msg.segment_id : undefined,
        })
        break

      case 'stt_restarted':
        this.events.onSttRestarted?.(String(msg.reason ?? ''))
        break

      case 'languages_updated':
        this.events.onLanguagesUpdated?.({
          inputLanguage: String(msg.input_language ?? ''),
          outputLanguage: String(msg.output_language ?? ''),
        })
        break

      case 'pong': {
        if (this.pingSentAt && typeof msg.ts === 'number' && msg.ts === this.pingSentAt) {
          const rtt = Date.now() - this.pingSentAt
          this.pingSentAt = 0
          this.events.onPong?.(rtt)
        }
        break
      }

      default:
        break
    }
  }

  private handleBinary(data: ArrayBuffer): void {
    if (this.pendingTts) {
      this.pendingTts.chunks.push(data)
    }
  }
}
