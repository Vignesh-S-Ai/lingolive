import { env } from '../lib/env'
import type { HealthResponse, Participant, Room, SynthesizeResponse, TranslateResponse } from '../types'

const DEFAULT_TIMEOUT_MS = 8000

export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'parse'

/** Unified error for every backend call. `status === 0` means the backend never answered. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number
  readonly path: string

  constructor(message: string, kind: ApiErrorKind, status: number, path: string) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.path = path
  }

  /** True when the backend could not be reached at all (down, wrong URL, CORS, offline). */
  get isUnavailable() {
    return this.kind === 'network' || this.kind === 'timeout'
  }
}

function buildUrl(path: string, query?: Record<string, string | number | undefined>) {
  const url = new URL(`${env.apiBaseUrl}${path}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

async function request<T>(
  path: string,
  init: RequestInit & { query?: Record<string, string | number | undefined>; timeoutMs?: number } = {}
): Promise<T> {
  const { query, timeoutMs = DEFAULT_TIMEOUT_MS, ...rest } = init
  const url = buildUrl(path, query)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let response: Response
  try {
    response = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
        ...rest.headers,
      },
    })
  } catch (error) {
    clearTimeout(timer)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(`The service took too long to respond.`, 'timeout', 0, path)
    }
    throw new ApiError(`Cannot reach the translation service.`, 'network', 0, path)
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}.`
    try {
      const body = (await response.json()) as { detail?: string }
      if (body?.detail) detail = body.detail
    } catch {
      /* non-JSON error body — keep the status message */
    }
    throw new ApiError(detail, 'http', response.status, path)
  }

  if (response.status === 204) return undefined as T

  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError('The service returned an unreadable response.', 'parse', response.status, path)
  }
}

/* ------------------------------------------------------------------ */
/* Endpoints — mirrors backend/app/api/routes/*                         */
/* ------------------------------------------------------------------ */

export const api = {
  /** `GET /v1/health` */
  health: (timeoutMs = 3500) => request<HealthResponse>('/v1/health', { timeoutMs }),

  /** `POST /v1/rooms/` — body `{ code, name }` → 201 */
  createRoom: (input: { code: string; name: string }) =>
    request<Room>('/v1/rooms/', { method: 'POST', body: JSON.stringify(input) }),

  /** `GET /v1/rooms/` */
  listRooms: () => request<Room[]>('/v1/rooms/'),

  /** `GET /v1/rooms/{code}` — 404 when the room does not exist */
  getRoom: (code: string) => request<Room>(`/v1/rooms/${encodeURIComponent(code)}`),

  /** `POST /v1/rooms/{code}/join` — body `{ name, input_language, output_language }` */
  joinRoom: (
    code: string,
    input: { name: string; input_language: string; output_language: string }
  ) =>
    request<Participant>(`/v1/rooms/${encodeURIComponent(code)}/join`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  /** `PUT /v1/participants/{id}/language` */
  updateParticipantLanguage: (
    participantId: string,
    input: { input_language: string; output_language: string }
  ) =>
    request<Participant>(`/v1/participants/${encodeURIComponent(participantId)}/language`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  /** `POST /v1/translation/translate` — query params (backend contract). */
  translate: (input: { text: string; sourceLanguage: string; targetLanguage: string }) =>
    request<TranslateResponse>('/v1/translation/translate', {
      method: 'POST',
      query: {
        text: input.text,
        source_language: input.sourceLanguage,
        target_language: input.targetLanguage,
      },
    }),

  /** `POST /v1/tts/synthesize` — query params (backend contract). */
  synthesize: (input: { text: string; languageCode: string; voice?: string }) =>
    request<SynthesizeResponse>('/v1/tts/synthesize', {
      method: 'POST',
      query: {
        text: input.text,
        language_code: input.languageCode,
        voice: input.voice,
      },
    }),
}

export type Api = typeof api
