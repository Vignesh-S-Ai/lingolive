/**
 * Room code helpers.
 *
 * Codes are generated client-side because `POST /v1/rooms/` requires `{ code, name }`
 * in the body. They are lowercase, URL-safe, and short enough to read aloud.
 */

const WORDS = [
  'lotus', 'mint', 'coral', 'ember', 'maple', 'quartz', 'indigo', 'cobalt',
  'zenith', 'harbor', 'orchid', 'delta', 'aurora', 'vellum', 'cinder', 'willow',
  'marble', 'tulip', 'jasmin', 'saffron',
]

const CODE_PATTERN = /^[a-z0-9][a-z0-9-]{2,31}$/

export function isValidRoomCode(code: string): boolean {
  return CODE_PATTERN.test(code.trim().toLowerCase())
}

export function normalizeRoomCode(code: string): string {
  return code.trim().toLowerCase().replace(/\s+/g, '-')
}

function suffix(): string {
  return Math.random().toString(16).slice(2, 6)
}

export function generateRoomCode(): string {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)] ?? 'room'
  return `${word}-${suffix()}`
}
