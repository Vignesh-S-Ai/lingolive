/**
 * Speech playback via the browser's Web Speech API.
 *
 * The Gnani Timbre integration is not connected in this deployment, so the
 * room uses the operating system's own voices instead — and says so in the UI.
 */
export const speechSupported =
  typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

export interface SpeakOptions {
  volume?: number
  rate?: number
  onEnd?: () => void
  onError?: () => void
}

/** Queue a utterance. Returns false when the browser has no speech engine. */
export function speak(text: string, lang: string, options: SpeakOptions = {}): boolean {
  if (!speechSupported || !text?.trim()) return false
  try {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.volume = Math.min(1, Math.max(0, options.volume ?? 1))
    utterance.rate = options.rate ?? 1
    if (options.onEnd) utterance.onend = options.onEnd
    if (options.onError) utterance.onerror = options.onError
    window.speechSynthesis.speak(utterance)
    return true
  } catch {
    options.onError?.()
    return false
  }
}

export function stopSpeaking() {
  if (!speechSupported) return
  try {
    window.speechSynthesis.cancel()
  } catch {
    /* no-op */
  }
}
