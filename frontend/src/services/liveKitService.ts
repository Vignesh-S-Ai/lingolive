import {
  Room,
  RoomEvent,
  ParticipantEvent,
  ConnectionQuality,
  type Participant,
  type RemoteParticipant,
  type LocalAudioTrack,
} from 'livekit-client'

/**
 * Thin imperative manager around a livekit-client `Room`.
 *
 * Identity contract: the backend mints tokens with `identity = participant
 * row UUID`, which is exactly the id space used by the pipeline roster and
 * the participant store — so LiveKit participants map 1:1 onto roster rows.
 */

export type LiveKitManagerStatus = 'idle' | 'connecting' | 'connected' | 'error'

export interface LiveKitManagerEvents {
  onStatus?: (status: LiveKitManagerStatus, error?: string) => void
  onSpeaking?: (participantId: string, speaking: boolean) => void
  onQuality?: (participantId: string, quality: 'good' | 'fair' | 'poor' | 'unknown') => void
}

function mapQuality(q: ConnectionQuality): 'good' | 'fair' | 'poor' | 'unknown' {
  switch (q) {
    case ConnectionQuality.Excellent:
    case ConnectionQuality.Good:
      return 'good'
    case ConnectionQuality.Poor:
      return 'poor'
    case ConnectionQuality.Lost:
      return 'poor'
    default:
      return 'unknown'
  }
}

export class LiveKitRoomManager {
  room: Room | null = null
  status: LiveKitManagerStatus = 'idle'
  private disposed = false
  /** Per-participant speaking listeners (IsSpeakingChanged fires on the Participant, not the Room). */
  private speakingHandlers = new Map<string, (speaking: boolean) => void>()

  constructor(private readonly events: LiveKitManagerEvents = {}) {}

  private attachSpeaking(participant: Participant): void {
    if (this.speakingHandlers.has(participant.identity)) return
    const handler = (speaking: boolean) => this.events.onSpeaking?.(participant.identity, speaking)
    this.speakingHandlers.set(participant.identity, handler)
    participant.on(ParticipantEvent.IsSpeakingChanged, handler)
    // Seed current state for participants that were already speaking.
    this.events.onSpeaking?.(participant.identity, participant.isSpeaking)
  }

  private detachSpeaking(participant: Participant): void {
    const handler = this.speakingHandlers.get(participant.identity)
    if (!handler) return
    participant.off(ParticipantEvent.IsSpeakingChanged, handler)
    this.speakingHandlers.delete(participant.identity)
  }

  async connect(url: string, token: string): Promise<void> {
    if (this.disposed) return
    this.setStatus('connecting')

    const room = new Room({
      dynacast: true,
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })
    this.room = room

    room.on(RoomEvent.ConnectionStateChanged, () => {
      if (this.disposed) return
      if (room.state === 'connected') this.setStatus('connected')
      else if (room.state === 'reconnecting') this.setStatus('connecting')
      else if (room.state === 'disconnected') this.setStatus('idle')
    })

    room.on(RoomEvent.ParticipantConnected, (p: RemoteParticipant) => {
      this.attachSpeaking(p)
      this.events.onQuality?.(p.identity, mapQuality(p.connectionQuality))
    })

    room.on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => {
      this.detachSpeaking(p)
      this.events.onSpeaking?.(p.identity, false)
      this.events.onQuality?.(p.identity, 'unknown')
    })

    room.on(RoomEvent.ConnectionQualityChanged, (quality: ConnectionQuality, participant) => {
      this.events.onQuality?.(participant.identity, mapQuality(quality))
    })

    try {
      await room.connect(url, token)
      if (this.disposed) {
        await room.disconnect().catch(() => undefined)
        return
      }
      this.setStatus('connected')
      // Participants that joined before our listeners existed.
      for (const p of room.remoteParticipants.values()) this.attachSpeaking(p)
      this.attachSpeaking(room.localParticipant)
      await room.localParticipant.setMicrophoneEnabled(true).catch(() => undefined)
    } catch (error) {
      this.setStatus('error', error instanceof Error ? error.message : 'Could not join the voice room.')
      throw error
    }
  }

  async setMicEnabled(enabled: boolean): Promise<void> {
    const local = this.room?.localParticipant
    if (!local) return
    try {
      await local.setMicrophoneEnabled(enabled)
    } catch {
      /* device issues surface through the speech pipeline hook as well */
    }
  }

  /** Set the playback volume of one remote participant's original-audio track. */
  setRemoteVolume(identity: string, volume: number): void {
    const participant = this.room?.remoteParticipants.get(identity)
    if (!participant) return
    for (const publication of participant.audioTrackPublications.values()) {
      const track = publication.track
      if (track && 'setVolume' in track) {
        try {
          ;(track as { setVolume: (v: number) => void }).setVolume(Math.max(0, Math.min(1, volume)))
        } catch {
          /* track may be detached mid-reconnect */
        }
      }
    }
  }

  /** Apply a volume function to every remote participant (kept in sync with the roster). */
  applyVolumes(resolve: (identity: string) => number): void {
    const room = this.room
    if (!room) return
    for (const participant of room.remoteParticipants.keys()) {
      this.setRemoteVolume(participant, resolve(participant))
    }
  }

  get localAudioTrack(): LocalAudioTrack | null {
    const pubs = this.room?.localParticipant.audioTrackPublications
    if (!pubs) return null
    for (const pub of pubs.values()) {
      if (pub.track) return pub.track as LocalAudioTrack
    }
    return null
  }

  async dispose(): Promise<void> {
    this.disposed = true
    const room = this.room
    this.room = null
    if (room) {
      for (const p of [...room.remoteParticipants.values(), room.localParticipant]) {
        this.detachSpeaking(p)
      }
      this.speakingHandlers.clear()
      try {
        await room.localParticipant?.setMicrophoneEnabled(false).catch(() => undefined)
        await room.disconnect()
      } catch {
        /* already gone */
      }
      room.removeAllListeners()
    }
    this.setStatus('idle')
  }

  private setStatus(status: LiveKitManagerStatus, error?: string): void {
    this.status = status
    this.events.onStatus?.(status, error)
  }
}
