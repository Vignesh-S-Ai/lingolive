import * as React from 'react'
import { v4 as uuidv4 } from 'uuid'
import { SCRIPT } from './simulator-script'
import type { TranscriptEntry, TranslationPhase } from '../../types'

export interface SimulatorSpeaker {
  id: string
  name: string
  inputLanguage: string
  outputLanguage: string
}

export interface UseSimulatorOptions {
  enabled: boolean
  speakers: SimulatorSpeaker[]
  periodMs?: number
  onPhase: (phase: TranslationPhase) => void
  onSpeaking: (participantId: string | null) => void
  onTurn: (entry: TranscriptEntry) => void
}

const RECOGNIZING_MS = 750
const TRANSLATING_MS = 950
const VOICE_MS = 700
const PLAYING_MS = 1400

/**
 * Drives the room while no real media transport is connected: it walks a
 * scripted multi-language conversation through the real translation phases so
 * the pipeline UI, transcript and speech playback are exercised end to end.
 *
 * Everything it produces is flagged `simulated: true` and rendered with an
 * explicit “Simulated” marker.
 */
export function useSimulator({
  enabled,
  speakers,
  periodMs = 6400,
  onPhase,
  onSpeaking,
  onTurn,
}: UseSimulatorOptions) {
  const callbacks = React.useRef({ onPhase, onSpeaking, onTurn })
  callbacks.current = { onPhase, onSpeaking, onTurn }

  const timers = React.useRef<number[]>([])
  const cursor = React.useRef(0)
  /** True while a scripted loop is running — gates the reset branch below. */
  const active = React.useRef(false)

  const clear = React.useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }, [])

  React.useEffect(() => {
    if (!enabled || speakers.length === 0) {
      // Only fire reset callbacks when a loop was actually running; firing
      // them on every effect re-run (e.g. a new empty `speakers` identity)
      // would notify stores from an infinite render loop.
      if (!active.current) return
      active.current = false
      clear()
      callbacks.current.onPhase('waiting')
      callbacks.current.onSpeaking(null)
      return
    }
    active.current = true

    let cancelled = false
    let loop = 0

    const schedule = () => {
      if (cancelled) return

      const speaker = speakers[cursor.current % speakers.length]
      const line = SCRIPT[cursor.current % SCRIPT.length]
      cursor.current += 1

      if (!speaker || !line) return

      const original = line[speaker.inputLanguage] ?? line['en-IN'] ?? ''
      const at = (ms: number, fn: () => void) => {
        timers.current.push(window.setTimeout(fn, ms))
      }

      at(0, () => {
        if (cancelled) return
        callbacks.current.onPhase('recognizing')
        callbacks.current.onSpeaking(speaker.id)
      })

      at(RECOGNIZING_MS, () => {
        if (cancelled) return
        callbacks.current.onPhase('translating')
      })

      at(RECOGNIZING_MS + TRANSLATING_MS, () => {
        if (cancelled) return
        const translations: TranscriptEntry['translations'] = {}
        for (const recipient of speakers) {
          const target = recipient.outputLanguage
          translations[recipient.id] = {
            text: line[target] ?? line['en-IN'] ?? '',
            language: target,
            participantName: recipient.name,
          }
        }
        callbacks.current.onTurn({
          id: uuidv4(),
          participantId: speaker.id,
          participantName: speaker.name,
          language: speaker.inputLanguage,
          originalText: original,
          translations,
          timestamp: Date.now(),
          simulated: true,
        })
        callbacks.current.onPhase('generating-voice')
      })

      at(RECOGNIZING_MS + TRANSLATING_MS + VOICE_MS, () => {
        if (cancelled) return
        callbacks.current.onPhase('playing')
      })

      at(RECOGNIZING_MS + TRANSLATING_MS + VOICE_MS + PLAYING_MS, () => {
        if (cancelled) return
        callbacks.current.onPhase('waiting')
        callbacks.current.onSpeaking(null)
      })

      loop = window.setTimeout(schedule, periodMs)
      timers.current.push(loop)
    }

    schedule()

    return () => {
      cancelled = true
      clear()
      if (active.current) {
        active.current = false
        callbacks.current.onPhase('waiting')
        callbacks.current.onSpeaking(null)
      }
    }
  }, [enabled, speakers, periodMs, clear])
}
