/** Types mirroring the FastAPI backend contract (`backend/app/api/routes/*`). */

/** `GET /v1/health` */
export interface HealthResponse {
  status: string
  service: string
}

/** `POST|GET /v1/rooms/` · `GET /v1/rooms/{code}` */
export interface Room {
  id: string
  code: string
  name: string
  status: string
  created_at: string
  updated_at: string
}

/** `POST /v1/rooms/{code}/join` */
export interface Participant {
  id: string
  room_id: string
  participant_id: string
  name: string
  input_language: string
  output_language: string
  connection_status: 'connected' | 'disconnected' | 'connecting' | string
  created_at: string
  /** LiveKit join JWT (identity = participant row UUID). Present when LiveKit creds are configured. */
  livekit_token?: string | null
}

/** `POST /v1/translation/translate` */
export interface TranslateResponse {
  translated_text: string
  success: boolean
}

/** `POST /v1/tts/synthesize` */
export interface SynthesizeResponse {
  status: string
  text: string
}

/* ------------------------------------------------------------------ */
/* Domain types owned by the frontend                                   */
/* ------------------------------------------------------------------ */

export type ConnectionQuality = 'good' | 'fair' | 'poor' | 'unknown'

export type TranslationPhase =
  | 'idle'
  | 'listening'
  | 'recognizing'
  | 'translating'
  | 'generating-voice'
  | 'playing'
  | 'waiting'

export interface ParticipantView {
  id: string
  name: string
  /** Language the participant speaks. */
  inputLanguage: string
  /** Language the participant wants to hear. */
  outputLanguage: string
  isLocal: boolean
  micEnabled: boolean
  isSpeaking: boolean
  quality: ConnectionQuality
}

export interface TranscriptEntry {
  id: string
  participantId: string
  participantName: string
  /** Language the utterance was spoken in. */
  language: string
  originalText: string
  /** Per-target-recipient translations keyed by recipient participant id. */
  translations: Record<string, { text: string; language: string; participantName: string }>
  timestamp: number
  /** True when the entry was produced by the local demo simulator. */
  simulated: boolean
  /** Honest backend pipeline timings for this segment (live sessions only). */
  latency?: PipelineLatency
}

/** Stage timings reported by `/v1/rooms/{code}/pipeline` for one segment. */
export interface PipelineLatency {
  stt_ms: number | null
  /** Pause (client VAD end) → STT final — pure endpointing delay. */
  endpoint_ms?: number | null
  translate_ms: number | null
  tts_ms: number | null
  /** Pause → first TTS byte sent to this listener (server-measured). */
  first_audio_ms?: number | null
}

/** In-flight (non-final) recognition shown while someone is still speaking. */
export interface LivePartial {
  participantId: string
  participantName: string
  language: string
  text: string
  at: number
}

/** Aggregate metrics surfaced by the live pipeline panel. */
export interface PipelineMetrics {
  status: 'idle' | 'connecting' | 'open' | 'error' | 'closed'
  liveKitStatus: 'idle' | 'connecting' | 'connected' | 'error'
  /** Round-trip time of the last pipeline ping, ms. */
  pingMs: number | null
  /** Last segment's stage timings. */
  last: PipelineLatency | null
  /** Rolling averages over recent segments. */
  avg: PipelineLatency | null
  segments: number
  /** Set when the pipeline socket reported an error. */
  error: string | null
}
