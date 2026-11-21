import * as React from 'react'
import { LiveKitRoomManager, type LiveKitManagerStatus } from '../services/liveKitService'
import { useMetricsStore } from '../store/metricsStore'
import { useParticipantStore } from '../store/participantStore'

export interface UseLiveKitRoomOptions {
  /** Only connect while the session is live (never in preview mode). */
  enabled: boolean
  url: string | null
  token: string | null
}

export interface UseLiveKitRoomResult {
  status: LiveKitManagerStatus
  error: string | null
  /** Imperative manager — used to apply volume/mic sync from the room page. */
  managerRef: React.MutableRefObject<LiveKitRoomManager | null>
}

/**
 * Connects a livekit-client Room for the current session and mirrors
 * speaking / connection-quality signals into the participant store.
 * Tears the room down on unmount or when the session leaves live mode.
 */
export function useLiveKitRoom({ enabled, url, token }: UseLiveKitRoomOptions): UseLiveKitRoomResult {
  const [status, setStatus] = React.useState<LiveKitManagerStatus>('idle')
  const [error, setError] = React.useState<string | null>(null)
  const managerRef = React.useRef<LiveKitRoomManager | null>(null)

  // Latest handlers without re-connecting when their identity changes.
  const eventsRef = React.useRef({
    onSpeaking: (id: string, speaking: boolean) => useParticipantStore.getState().setSpeaking(id, speaking),
    onQuality: (id: string, quality: 'good' | 'fair' | 'poor' | 'unknown') =>
      useParticipantStore.getState().setQuality(id, quality),
    onStatus: (s: LiveKitManagerStatus) => useMetricsStore.getState().setLiveKitStatus(s),
  })

  React.useEffect(() => {
    if (!enabled || !url || !token) {
      setStatus('idle')
      useMetricsStore.getState().setLiveKitStatus('idle')
      return
    }

    let cancelled = false
    const manager = new LiveKitRoomManager({
      onStatus: (s, err) => {
        eventsRef.current.onStatus(s)
        if (cancelled) return
        setStatus(s)
        setError(s === 'error' ? err ?? 'Voice room connection failed.' : null)
      },
      onSpeaking: (id, speaking) => eventsRef.current.onSpeaking(id, speaking),
      onQuality: (id, quality) => eventsRef.current.onQuality(id, quality),
    })
    managerRef.current = manager

    manager.connect(url, token).catch(() => {
      /* status/error already reported through onStatus */
    })

    return () => {
      cancelled = true
      managerRef.current = null
      void manager.dispose()
    }
  }, [enabled, url, token])

  return { status, error, managerRef }
}
