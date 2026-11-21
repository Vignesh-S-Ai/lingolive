import * as React from 'react'
import { api, ApiError } from '../services/api'
import type { Participant, Room } from '../types'
import { useSettingsStore } from '../store/settingsStore'

export type RoomSessionStatus =
  | 'connecting'
  | 'live'
  /** Backend unreachable — session runs on clearly-labelled simulated events. */
  | 'preview'
  /** `GET /v1/rooms/{code}` returned 404. */
  | 'not-found'
  /** Any other HTTP failure (5xx, validation, …). */
  | 'error'

export interface RoomSession {
  status: RoomSessionStatus
  room: Room | null
  participant: Participant | null
  message: string | null
  retry: () => void
}

/**
 * Resolves a room session against the real backend contract:
 *   1. `GET  /v1/rooms/{code}`        → room metadata (404 → not-found)
 *   2. `POST /v1/rooms/{code}/join`   → participant record + languages
 *
 * If the backend cannot be reached we do NOT fabricate a successful join —
 * we report `preview` and let the room page label the session as simulated.
 */
export function useRoomSession(
  roomCode: string,
  /** Result of a join already performed by the create/join flow. */
  seed?: { room: Room; participant: Participant } | null
): RoomSession {
  const [status, setStatus] = React.useState<RoomSessionStatus>(seed ? 'live' : 'connecting')
  const [room, setRoom] = React.useState<Room | null>(seed?.room ?? null)
  const [participant, setParticipant] = React.useState<Participant | null>(seed?.participant ?? null)
  const [message, setMessage] = React.useState<string | null>(null)
  const [nonce, setNonce] = React.useState(0)

  // Read through a ref so a new object identity on every render can't re-trigger the join.
  const seedRef = React.useRef(seed)
  seedRef.current = seed

  // Join exactly once per room code: changing display name or languages
  // mid-session must NOT re-join (it would spawn a duplicate participant).
  // Language changes travel over the pipeline socket / PUT language endpoint.
  const joinProfile = React.useRef({ name: '', input: '', output: '' })
  React.useEffect(() => {
    joinProfile.current = {
      name: useSettingsStore.getState().displayName.trim() || 'Guest',
      input: useSettingsStore.getState().inputLanguage,
      output: useSettingsStore.getState().outputLanguage,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode])

  React.useEffect(() => {
    // The join page already resolved this session — don't join twice.
    if (seedRef.current) return

    if (!roomCode) {
      setStatus('not-found')
      setMessage('No room code was provided in the address.')
      return
    }

    let cancelled = false
    setStatus('connecting')
    setMessage(null)

    const run = async () => {
      let resolvedRoom: Room
      try {
        resolvedRoom = await api.getRoom(roomCode)
      } catch (error) {
        if (cancelled) return
        if (error instanceof ApiError && error.isUnavailable) {
          setStatus('preview')
          setMessage(error.message)
          return
        }
        if (error instanceof ApiError && error.status === 404) {
          setStatus('not-found')
          setMessage('This room does not exist. It may have expired, or the code may be mistyped.')
          return
        }
        setStatus('error')
        setMessage(error instanceof ApiError ? error.message : 'Could not open this room.')
        return
      }

      if (cancelled) return
      setRoom(resolvedRoom)

      const profile = joinProfile.current
      try {
        const joined = await api.joinRoom(roomCode, {
          name: profile.name,
          input_language: profile.input,
          output_language: profile.output,
        })
        if (cancelled) return
        setParticipant(joined)
        setStatus('live')
      } catch (error) {
        if (cancelled) return
        if (error instanceof ApiError && error.isUnavailable) {
          setStatus('preview')
          setMessage(error.message)
          return
        }
        // Room exists but joining failed — still usable as a read-only preview.
        setStatus('preview')
        setMessage(error instanceof ApiError ? error.message : 'Could not join this room.')
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [roomCode, nonce])

  return { status, room, participant, message, retry: () => setNonce((n) => n + 1) }
}
