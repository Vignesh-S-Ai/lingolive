import * as React from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Plus, SearchX, Loader2 } from 'lucide-react'
import { RoomHeader, type RoomStatus } from '../features/room/room-header'
import { MediaNotice, RoomStatusBanner } from '../features/room/room-banners'
import { ParticipantRail } from '../features/room/participant-rail'
import { Stage } from '../features/room/stage'
import { TranscriptFeed } from '../features/room/transcript-feed'
import { ControlRail } from '../features/room/control-rail'
import { LiveMetricsPanel } from '../features/room/live-metrics'
import { playback } from '../features/room/audio-playback'
import { SIMULATED_PEERS } from '../features/room/simulator-script'
import { useSimulator, type SimulatorSpeaker } from '../features/room/use-simulator'
import { Button } from '../components/ui/button'
import { LinkButton } from '../components/ui/link-button'
import { Modal } from '../components/ui/modal'
import { Alert } from '../components/ui/alert'
import { useRoomSession } from '../hooks/use-room-session'
import { useMicrophone } from '../hooks/use-microphone'
import { useMediaDevices } from '../hooks/use-devices'
import { useLiveKitRoom } from '../hooks/useLiveKitRoom'
import { useSpeechPipeline } from '../hooks/useSpeechPipeline'
import { useConversationStore } from '../store/conversationStore'
import { useParticipantStore } from '../store/participantStore'
import { useSettingsStore } from '../store/settingsStore'
import { useHistoryStore } from '../store/historyStore'
import { useMetricsStore } from '../store/metricsStore'
import { api, ApiError } from '../services/api'
import { PipelineClient, type RosterParticipant } from '../services/pipelineService'
import { env } from '../lib/env'
import { speak, stopSpeaking } from '../lib/speech'
import type {
  Participant,
  ParticipantView,
  Room,
  TranslationPhase,
} from '../types'
import { v4 as uuidv4 } from 'uuid'

/** Stable empty list — a fresh `[]` per render would re-trigger effects. */
const NO_SIMULATED_SPEAKERS: SimulatorSpeaker[] = []

/* ------------------------------------------------------------------ */
/* Full-screen states                                                  */
/* ------------------------------------------------------------------ */

function JoiningScreen({ code }: { code: string }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.1] bg-elevated">
        <Loader2 className="h-5 w-5 animate-spin text-primary-bright" aria-hidden="true" />
      </span>
      <h1 className="mt-5 font-display text-xl font-bold tracking-tight">Joining room…</h1>
      <p className="mt-2 font-mono text-[13px] text-muted-2">{code}</p>
    </div>
  )
}

function RoomMissingScreen({ code }: { code: string }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-warning/35 bg-warning/10 text-warning">
        <SearchX className="h-5 w-5" aria-hidden="true" />
      </span>
      <h1 className="mt-5 font-display text-xl font-bold tracking-tight">Room not found</h1>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-muted">
        <span className="font-mono text-foreground">{code}</span> does not exist on the server. It
        may have expired, or the code may be mistyped.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        <LinkButton to="/join-conversation" variant="secondary">
          Try another code
        </LinkButton>
        <LinkButton to="/create-conversation">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create a room
        </LinkButton>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Room                                                                */
/* ------------------------------------------------------------------ */

export default function LiveConversationRoom() {
  const { roomId = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const seed = React.useMemo(() => {
    const state = location.state as { room?: Room; participant?: Participant } | null
    if (state?.room && state?.participant) return { room: state.room, participant: state.participant }
    return null
  }, [location.state])

  const session = useRoomSession(roomId, seed)

  const settings = useSettingsStore()
  const conversation = useConversationStore()
  const participantStore = useParticipantStore()
  const history = useHistoryStore()

  const [speakingId, setSpeakingId] = React.useState<string | null>(null)
  const [languageBusy, setLanguageBusy] = React.useState(false)
  const [languageError, setLanguageError] = React.useState<string | null>(null)
  const [confirmLeave, setConfirmLeave] = React.useState(false)
  const [clock, setClock] = React.useState(() => Date.now())
  const [pipelineClient, setPipelineClient] = React.useState<PipelineClient | null>(null)

  const localId = session.participant?.id ?? 'local'
  const localName = settings.displayName.trim() || 'You'
  const ready = session.status === 'live' || session.status === 'preview'
  const isLive = session.status === 'live'
  const isPreview = session.status === 'preview'
  const roomStatus: RoomStatus =
    session.status === 'not-found' ? 'not-found' : session.status === 'error' ? 'error' : session.status

  const phaseResetTimer = React.useRef<number | null>(null)
  const ttsCountRef = React.useRef(0)
  const bumpPhase = React.useCallback((phase: TranslationPhase, resetInMs?: number) => {
    useConversationStore.getState().setPhase(phase)
    if (phaseResetTimer.current !== null) window.clearTimeout(phaseResetTimer.current)
    if (resetInMs) {
      phaseResetTimer.current = window.setTimeout(() => {
        useConversationStore.getState().setPhase('waiting')
        phaseResetTimer.current = null
      }, resetInMs)
    }
  }, [])

  /* --- clock --- */
  React.useEffect(() => {
    if (!ready) return
    const id = window.setInterval(() => setClock(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [ready])

  /* --- session lifecycle --- */
  React.useEffect(() => {
    if (!ready) return
    conversation.startSession(roomId)
    conversation.setSimulated(!isLive)
    conversation.setRoom(session.room ?? null)
    return () => conversation.endSession()
    // Intentionally keyed on the room code + mode only: starting twice would wipe the transcript.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, ready, isLive])

  /* --- seed simulated peers into the participant store (preview only) --- */
  React.useEffect(() => {
    if (!ready || isLive) return
    const store = useParticipantStore.getState()
    for (const peer of SIMULATED_PEERS) {
      store.upsertRemote({
        id: peer.id,
        name: peer.name,
        inputLanguage: peer.inputLanguage,
        outputLanguage: peer.outputLanguage,
        isLocal: false,
        micEnabled: true,
        isSpeaking: false,
        quality: 'unknown',
      })
    }
    return () => useParticipantStore.getState().clearRemote()
  }, [roomId, ready, isLive])

  /* --- keep the local participant mirror in sync --- */
  React.useEffect(() => {
    const store = useParticipantStore.getState()
    store.setLocalIdentity(localId)
    store.setLocal({
      name: localName,
      inputLanguage: settings.inputLanguage,
      outputLanguage: settings.outputLanguage,
      micEnabled: settings.micEnabled,
      isSpeaking: speakingId === localId,
      quality: isLive ? 'good' : 'unknown',
    })
    store.setConnectionStatus(isLive ? 'connected' : isPreview ? 'error' : 'connecting')
    store.setUsingPreview(isPreview)
  }, [
    localId,
    localName,
    settings.inputLanguage,
    settings.outputLanguage,
    settings.micEnabled,
    speakingId,
    isLive,
    isPreview,
  ])

  React.useEffect(() => {
    const store = useParticipantStore.getState()
    for (const peer of SIMULATED_PEERS) store.setSpeaking(peer.id, speakingId === peer.id)
  }, [speakingId])

  /* ================================================================== */
  /* Live mode: LiveKit (original audio) + pipeline (STT → TTS loop)     */
  /* ================================================================== */

  const liveKitToken = session.participant?.livekit_token ?? null
  const liveKitEnabled = isLive && !!env.liveKitUrl && !!liveKitToken
  const liveKit = useLiveKitRoom({
    enabled: liveKitEnabled,
    url: env.liveKitUrl || null,
    token: liveKitToken,
  })

  /* --- pipeline socket: one per participant while live --- */
  React.useEffect(() => {
    if (!isLive || !session.participant) {
      setPipelineClient(null)
      return
    }
    const participantId = session.participant.id
    const client = new PipelineClient(roomId, participantId, {
      onStatus: (status) => {
        useMetricsStore.getState().setStatus(status)
        if (status === 'error') {
          useMetricsStore.getState().setError('Speech pipeline disconnected.')
        } else if (status === 'open') {
          useMetricsStore.getState().setError(null)
        }
      },

      onRoster: (roster: RosterParticipant[]) => {
        const store = useParticipantStore.getState()
        const seen = new Set<string>()
        for (const p of roster) {
          if (p.id === participantId) continue // self is driven by settings
          seen.add(p.id)
          const existing = store.remote[p.id]
          store.upsertRemote({
            id: p.id,
            name: p.name,
            inputLanguage: p.input_language,
            outputLanguage: p.output_language,
            isLocal: false,
            micEnabled: p.mic_enabled,
            isSpeaking: existing?.isSpeaking ?? false,
            quality: existing?.quality ?? 'unknown',
          })
        }
        for (const id of Object.keys(useParticipantStore.getState().remote)) {
          if (!seen.has(id)) useParticipantStore.getState().removeRemote(id)
        }
      },

      onTranscript: (event) => {
        const conv = useConversationStore.getState()
        if (!event.final) {
          conv.setPartial({
            participantId: event.participantId,
            participantName: event.participantName,
            language: event.language,
            text: event.text,
            at: Date.now(),
          })
          if (event.participantId === participantId) bumpPhase('recognizing')
          return
        }
        conv.addTranscript({
          id: event.segmentId ?? uuidv4(),
          participantId: event.participantId,
          participantName: event.participantName,
          language: event.language,
          originalText: event.text,
          translations: {},
          timestamp: Date.now(),
          simulated: false,
        })
        if (event.participantId === participantId) bumpPhase('translating')
      },

      onTranslation: (event) => {
        const conv = useConversationStore.getState()
        conv.attachTranslation(event.segmentId, participantId, {
          text: event.text,
          language: event.language,
          participantName: event.participantName,
        })
        if (event.audio) bumpPhase('generating-voice')
      },

      onTtsSegment: (segment) => {
        const conv = useConversationStore.getState()
        ttsCountRef.current += 1
        if (segment.latency) {
          conv.attachLatency(segment.segmentId, segment.latency)
          useMetricsStore.getState().recordSegment(segment.latency)
          const endAt = pipelineClient?.utteranceEndAt(segment.utteranceTs)
          if (endAt) useMetricsStore.getState().setFirstAudio(Date.now() - endAt)
        }
        const s = useSettingsStore.getState()
        if (s.speakerEnabled && s.playTranslatedAudio) {
          playback.setVolume(s.volume / 100)
          playback.enqueue(segment)
          bumpPhase('playing', 1600)
        }
      },

      onTtsDropped: () => {
        /* queue overflow on a slow listener — the next segment still plays */
      },

      onError: (event) => {
        useMetricsStore.getState().setError(`${event.stage}: ${event.message}`)
      },

      onSttRestarted: (reason) => {
        // Recognition session was recycled (Gnani idle kill / language change).
        if (reason) console.info(`[pipeline] recognition restarted (${reason})`)
      },

      onPong: (rttMs) => useMetricsStore.getState().setPing(rttMs),
    })

    setPipelineClient(client)
    client.connect()
    return () => {
      client.close()
      setPipelineClient((current) => (current === client ? null : current))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive, roomId, session.participant?.id])

  /* --- microphone capture → pipeline (live) / meter-only hook (preview) --- */
  const speech = useSpeechPipeline({
    enabled: isLive,
    muted: !settings.micEnabled,
    deviceId: settings.microphoneId || undefined,
    client: pipelineClient,
  })
  const mic = useMicrophone(!isLive && settings.micEnabled, settings.microphoneId || undefined)
  const devices = useMediaDevices()

  const micLevel = isLive ? speech.level : mic.level
  const micLive = isLive ? speech.live : mic.live
  const micPermission = isLive ? speech.permission : mic.permission
  const micError = isLive ? speech.error : mic.error

  /* --- LiveKit mic publish follows the mute setting --- */
  React.useEffect(() => {
    const manager = liveKit.managerRef.current
    if (!manager || !liveKitEnabled) return
    void manager.setMicEnabled(settings.micEnabled)
  }, [liveKitEnabled, settings.micEnabled, liveKit.status])

  /* --- original-audio routing:
     listeners hear a peer's LiveKit track directly exactly when that peer
     speaks a language matching the listener's output (the pipeline skips
     translating those pairs); otherwise the track is muted because the
     translated TTS arrives over the pipeline instead. --- */
  React.useEffect(() => {
    const manager = liveKit.managerRef.current
    if (!manager || liveKit.status !== 'connected') return
    const s = useSettingsStore.getState()
    const volume = s.volume / 100
    manager.applyVolumes((identity) => {
      const peer = useParticipantStore.getState().remote[identity]
      if (!peer) return 0
      if (peer.inputLanguage === s.outputLanguage) {
        return s.playTranslatedAudio ? volume : 0
      }
      return s.playOriginalAudio ? volume : 0
    })
  }, [
    liveKit.status,
    participantStore.remote,
    settings.outputLanguage,
    settings.volume,
    settings.playOriginalAudio,
    settings.playTranslatedAudio,
  ])

  /* --- playback volume / mute follow the settings --- */
  React.useEffect(() => {
    playback.setVolume(settings.volume / 100)
    if (!settings.speakerEnabled || !isLive) {
      playback.stopAll()
      if (!settings.speakerEnabled) stopSpeaking()
    }
  }, [settings.volume, settings.speakerEnabled, isLive])

  React.useEffect(() => () => playback.dispose(), [])

  /* --- participants --- */
  const local = participantStore.local
  const participants: ParticipantView[] = React.useMemo(
    () => [
      {
        id: local.id,
        name: local.name,
        inputLanguage: local.inputLanguage,
        outputLanguage: local.outputLanguage,
        isLocal: true,
        micEnabled: local.micEnabled,
        isSpeaking: local.isSpeaking,
        quality: local.quality,
      },
      ...Object.values(participantStore.remote),
    ],
    [local, participantStore.remote]
  )

  const activeSpeaker = React.useMemo(
    () => participants.find((p) => p.isSpeaking) ?? null,
    [participants]
  )

  /* --- speech playback (preview mode: OS voices) --- */
  const playTurn = React.useCallback(
    (entry: Parameters<typeof conversation.addTranscript>[0]) => {
      conversation.addTranscript(entry)
      if (!settings.speakerEnabled || !settings.playTranslatedAudio) return
      const volume = settings.volume / 100
      if (settings.playOriginalAudio) speak(entry.originalText, entry.language, { volume })
      const translation = entry.translations[localId]
      if (translation) speak(translation.text, translation.language, { volume })
    },
    [conversation, settings, localId]
  )

  /* --- simulated conversation engine (preview only) --- */
  const simulatorSpeakers = React.useMemo(
    () => [
      {
        id: localId,
        name: localName,
        inputLanguage: settings.inputLanguage,
        outputLanguage: settings.outputLanguage,
      },
      ...SIMULATED_PEERS,
    ],
    [localId, localName, settings.inputLanguage, settings.outputLanguage]
  )

  const setPhase = React.useCallback(
    (phase: TranslationPhase) => conversation.setPhase(phase),
    [conversation]
  )

  useSimulator({
    enabled: isPreview,
    speakers: isPreview ? simulatorSpeakers : NO_SIMULATED_SPEAKERS,
    onPhase: setPhase,
    onSpeaking: setSpeakingId,
    onTurn: playTurn,
  })

  /* --- live phase hint while the local VAD hears speech --- */
  React.useEffect(() => {
    if (!isLive) return
    if (speech.speaking) useConversationStore.getState().setPhase('listening')
  }, [isLive, speech.speaking])

  React.useEffect(() => () => stopSpeaking(), [])

  /* --- language changes (real API + pipeline control when live) --- */
  const changeLanguages = async (input: string, output: string) => {
    const previous = { inputLanguage: settings.inputLanguage, outputLanguage: settings.outputLanguage }
    settings.update({ inputLanguage: input, outputLanguage: output })
    setLanguageError(null)

    if (session.status !== 'live' || !session.participant) return

    setLanguageBusy(true)
    try {
      await api.updateParticipantLanguage(session.participant.id, {
        input_language: input,
        output_language: output,
      })
      pipelineClient?.setLanguages(input, output)
    } catch (error) {
      settings.update(previous)
      setLanguageError(
        error instanceof ApiError ? error.message : 'Could not update your languages.'
      )
    } finally {
      setLanguageBusy(false)
    }
  }

  /* --- leave --- */
  const doLeave = () => {
    stopSpeaking()
    playback.stopAll()
    const transcripts = conversation.transcripts
    const last = transcripts[transcripts.length - 1]
    const languages = Array.from(
      new Set([
        settings.inputLanguage,
        settings.outputLanguage,
        ...transcripts.map((t) => t.language),
      ])
    )

    if (conversation.startedAt && roomId) {
      history.record({
        id: uuidv4(),
        code: roomId,
        name: session.room?.name || 'Untitled conversation',
        startedAt: conversation.startedAt,
        endedAt: Date.now(),
        durationMs: Math.max(0, Date.now() - conversation.startedAt),
        participants: participants.map((p) => ({
          name: p.name,
          inputLanguage: p.inputLanguage,
          outputLanguage: p.outputLanguage,
        })),
        transcriptCount: transcripts.length,
        languages,
        summary: last
          ? `${last.participantName}: ${last.originalText}`
          : 'Ended before anyone spoke',
        preview: session.status !== 'live',
      })
    }

    conversation.endSession()
    navigate('/', { replace: true })
  }

  /* --- dev/test handle: lets CDP browser tests assert live state --- */
  React.useEffect(() => {
    if (!import.meta.env.DEV) return
    const w = window as unknown as { __roomDebug?: unknown }
    w.__roomDebug = {
      transcripts: () => useConversationStore.getState().transcripts,
      translations: () =>
        useConversationStore.getState().transcripts.flatMap((t) =>
          Object.entries(t.translations).map(([recipientId, v]) => ({
            segmentId: t.id,
            speakerId: t.participantId,
            speakerLanguage: t.language,
            recipientId,
            ...v,
          }))
        ),
      partial: () => useConversationStore.getState().partial,
      metrics: () => {
        const m = useMetricsStore.getState()
        return {
          pipeline: m.status,
          liveKit: m.liveKitStatus,
          pingMs: m.pingMs,
          segments: m.segments,
          last: m.last,
          avg: m.avg,
          firstAudioMs: m.firstAudioMs,
          error: m.error,
        }
      },
      roster: () => {
        const p = useParticipantStore.getState()
        return { local: p.local, remote: Object.values(p.remote), status: p.connectionStatus }
      },
      ttsCount: () => ttsCountRef.current,
      playback: () => playback.stats(),
      livekit: () => {
        const room = liveKit.managerRef.current?.room
        if (!room) return null
        const remotes: { id: string; audio: number; speaking: boolean }[] = []
        for (const p of room.remoteParticipants.values()) {
          let audio = 0
          for (const t of p.audioTrackPublications.values())
            if (t.isSubscribed && t.track) audio++
          remotes.push({ id: p.identity, audio, speaking: p.isSpeaking })
        }
        return {
          state: room.state,
          localPublished: !!liveKit.managerRef.current?.localAudioTrack,
          remotes,
        }
      },
    }
    return () => {
      delete w.__roomDebug
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* --- early exits --- */
  if (session.status === 'connecting') return <JoiningScreen code={roomId} />
  if (session.status === 'not-found') return <RoomMissingScreen code={roomId} />

  const durationMs = conversation.startedAt ? Math.max(0, clock - conversation.startedAt) : 0
  const latest = conversation.transcripts[conversation.transcripts.length - 1] ?? null

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
      <RoomHeader
        roomName={session.room?.name || settings.displayName || 'Untitled conversation'}
        roomCode={roomId}
        status={roomStatus}
        durationMs={durationMs}
        onLeave={() => setConfirmLeave(true)}
      />
      {isPreview && <MediaNotice />}
      <RoomStatusBanner status={roomStatus} message={session.message} onRetry={session.retry} />

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-[264px_minmax(0,1fr)_308px] lg:overflow-hidden">
        {/* Participants */}
        <aside className="order-2 min-h-0 border-t border-white/[0.08] bg-surface/30 lg:order-1 lg:border-r lg:border-t-0">
          <div className="h-full">
            <ParticipantRail participants={participants} localQuality={local.quality} />
          </div>
        </aside>

        {/* Stage + transcript */}
        <section className="order-1 flex min-h-0 flex-col px-4 py-4 sm:px-6 lg:order-2">
          <div className="min-h-0 flex-1">
            <Stage
              phase={conversation.phase}
              speaker={activeSpeaker}
              latest={latest}
              localId={localId}
              localOutputLanguage={settings.outputLanguage}
              showOriginal={settings.showOriginal}
              showTranslated={settings.showTranslated}
              micLevel={micLevel}
              micEnabled={settings.micEnabled}
              micLive={micLive}
              micError={micError}
              simulated={isPreview}
            />
          </div>

          <div className="mt-4 flex h-[300px] shrink-0 flex-col lg:h-[46%] lg:min-h-[220px]">
            <TranscriptFeed
              entries={conversation.transcripts}
              partial={conversation.partial}
              localId={localId}
              localOutputLanguage={settings.outputLanguage}
              showOriginal={settings.showOriginal}
              showTranslated={settings.showTranslated}
              onSpeak={(text, lang) => speak(text, lang, { volume: settings.volume / 100 })}
            />
          </div>
        </section>

        {/* Controls */}
        <aside className="order-3 min-h-0 border-t border-white/[0.08] bg-surface/30 lg:order-3 lg:border-l lg:border-t-0">
          <div className="flex h-full min-h-0 flex-col">
            {isLive && (
              <div className="shrink-0 border-b border-white/[0.07] p-3">
                <LiveMetricsPanel />
              </div>
            )}
            <div className="min-h-0 flex-1">
              <ControlRail
                micEnabled={settings.micEnabled}
                onToggleMic={() => {
                  const next = !settings.micEnabled
                  settings.update({ micEnabled: next })
                  pipelineClient?.setMuted(!next)
                }}
                micLevel={micLevel}
                micLive={micLive}
                micPermission={micPermission}
                micError={micError}
                microphoneId={settings.microphoneId}
                onMicrophoneChange={(id) => settings.update({ microphoneId: id })}
                microphones={devices.microphones}
                onRequestDeviceAccess={() => void devices.requestAccess()}
                speakerEnabled={settings.speakerEnabled}
                onToggleSpeaker={() => {
                  const next = !settings.speakerEnabled
                  settings.update({ speakerEnabled: next })
                  if (!next) {
                    stopSpeaking()
                    playback.stopAll()
                  }
                }}
                volume={settings.volume}
                onVolumeChange={(volume) => settings.update({ volume })}
                playOriginal={settings.playOriginalAudio}
                playTranslated={settings.playTranslatedAudio}
                onTogglePlayOriginal={() =>
                  settings.update({ playOriginalAudio: !settings.playOriginalAudio })
                }
                onTogglePlayTranslated={() =>
                  settings.update({ playTranslatedAudio: !settings.playTranslatedAudio })
                }
                showOriginal={settings.showOriginal}
                showTranslated={settings.showTranslated}
                onToggleShowOriginal={() => settings.update({ showOriginal: !settings.showOriginal })}
                onToggleShowTranslated={() =>
                  settings.update({ showTranslated: !settings.showTranslated })
                }
                inputLanguage={settings.inputLanguage}
                outputLanguage={settings.outputLanguage}
                onLanguagesChange={changeLanguages}
                languageBusy={languageBusy}
                languageError={languageError}
                providersOffline={!isLive}
              />
            </div>
          </div>
        </aside>
      </main>

      {/* Leave confirmation */}
      <Modal
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title="Leave this conversation?"
        description="Your session will be saved to history so you can reopen it later."
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setConfirmLeave(false)}>
              Stay
            </Button>
            <Button variant="danger" onClick={doLeave}>
              Leave conversation
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-background/60 px-4 py-3 text-[13px]">
            <span className="text-muted-2">Room</span>
            <span className="truncate font-mono text-foreground">{roomId}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-background/60 px-4 py-3 text-[13px]">
            <span className="text-muted-2">Lines captured</span>
            <span className="text-foreground">{conversation.transcripts.length}</span>
          </div>
          {isLive ? (
            <Alert variant="warning" title="Live session">
              Your microphone is streamed to the room's translation pipeline while you stay on this
              page. Leaving disconnects your microphone and voice session immediately.
            </Alert>
          ) : (
            <Alert variant="warning" title="Media is simulated">
              LiveKit and Gnani are not connected, so no audio was recorded and no real participant
              was contacted during this session.
            </Alert>
          )}
        </div>
      </Modal>
    </div>
  )
}
