import * as React from 'react'
import { api, ApiError } from '../services/api'

export type BackendStatus = 'checking' | 'online' | 'offline'

export interface BackendHealth {
  status: BackendStatus
  /** Human-readable reason shown to the user when offline. */
  detail: string | null
  /** Timestamp of the last completed check. */
  checkedAt: number | null
  refresh: () => void
}

/**
 * Polls `GET /v1/health` so the UI can show an honest platform status
 * instead of pretending integrations are live.
 */
export function useBackendHealth(pollMs = 0): BackendHealth {
  const [status, setStatus] = React.useState<BackendStatus>('checking')
  const [detail, setDetail] = React.useState<string | null>(null)
  const [checkedAt, setCheckedAt] = React.useState<number | null>(null)
  const [nonce, setNonce] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    setStatus('checking')

    api
      .health()
      .then((res) => {
        if (cancelled) return
        setStatus(res?.status ? 'online' : 'offline')
        setDetail(null)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setStatus('offline')
        setDetail(
          error instanceof ApiError
            ? error.isUnavailable
              ? 'Translation service is not reachable.'
              : error.message
            : 'Translation service is not reachable.'
        )
      })
      .finally(() => {
        if (!cancelled) setCheckedAt(Date.now())
      })

    return () => {
      cancelled = true
    }
  }, [nonce])

  React.useEffect(() => {
    if (!pollMs) return
    const id = window.setInterval(() => setNonce((n) => n + 1), pollMs)
    return () => window.clearInterval(id)
  }, [pollMs])

  const refresh = React.useCallback(() => setNonce((n) => n + 1), [])

  return { status, detail, checkedAt, refresh }
}
