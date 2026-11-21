import { create } from 'zustand'
import type { LivePartial, Room, TranscriptEntry, TranslationPhase } from '../types'

/** Keep the transcript bounded so long sessions never bloat memory. */
const MAX_TRANSCRIPTS = 300

export interface ConversationStore {
  room: Room | null
  roomId: string
  transcripts: TranscriptEntry[]
  phase: TranslationPhase
  /** True when the session is running on locally simulated events. */
  simulated: boolean
  /** Epoch ms when the session started — drives the duration timer. */
  startedAt: number | null
  error: string | null
  /** Latest non-final recognition line (live sessions). */
  partial: LivePartial | null

  setRoom: (room: Room | null) => void
  setRoomId: (id: string) => void
  addTranscript: (entry: TranscriptEntry) => void
  setTranscripts: (entries: TranscriptEntry[]) => void
  setPhase: (phase: TranslationPhase) => void
  setSimulated: (value: boolean) => void
  setError: (message: string | null) => void
  setPartial: (partial: LivePartial | null) => void
  /** Merge a backend translation into the segment addressed by `segmentId`. */
  attachTranslation: (
    segmentId: string,
    recipientId: string,
    translation: { text: string; language: string; participantName: string }
  ) => void
  /** Attach pipeline stage timings to a segment. */
  attachLatency: (segmentId: string, latency: TranscriptEntry['latency']) => void
  startSession: (roomId: string) => void
  endSession: () => void
}

export const useConversationStore = create<ConversationStore>((set) => ({
  room: null,
  roomId: '',
  transcripts: [],
  phase: 'waiting',
  simulated: false,
  startedAt: null,
  error: null,
  partial: null,

  setRoom: (room) => set({ room, roomId: room?.code ?? '' }),
  setRoomId: (roomId) => set({ roomId }),
  addTranscript: (entry) =>
    set((s) => {
      const transcripts = [...s.transcripts, entry]
      if (transcripts.length > MAX_TRANSCRIPTS) transcripts.splice(0, transcripts.length - MAX_TRANSCRIPTS)
      return { transcripts, partial: null }
    }),
  setTranscripts: (transcripts) => set({ transcripts: transcripts.slice(-MAX_TRANSCRIPTS) }),
  setPhase: (phase) => set((s) => (s.phase === phase ? s : { phase })),
  setSimulated: (simulated) => set((s) => (s.simulated === simulated ? s : { simulated })),
  setError: (error) => set((s) => (s.error === error ? s : { error })),
  setPartial: (partial) => set((s) => (s.partial === partial ? s : { partial })),

  attachTranslation: (segmentId, recipientId, translation) =>
    set((s) => {
      const index = s.transcripts.findIndex((t) => t.id === segmentId)
      if (index === -1) return s
      const transcripts = s.transcripts.slice()
      const entry = transcripts[index]
      transcripts[index] = {
        ...entry,
        translations: { ...entry.translations, [recipientId]: translation },
      }
      return { transcripts }
    }),

  attachLatency: (segmentId, latency) =>
    set((s) => {
      const index = s.transcripts.findIndex((t) => t.id === segmentId)
      if (index === -1 || !latency) return s
      const transcripts = s.transcripts.slice()
      transcripts[index] = { ...transcripts[index], latency }
      return { transcripts }
    }),

  startSession: (roomId) =>
    set({
      roomId,
      transcripts: [],
      phase: 'waiting',
      startedAt: Date.now(),
      error: null,
      partial: null,
    }),

  endSession: () =>
    set({
      room: null,
      roomId: '',
      transcripts: [],
      phase: 'waiting',
      simulated: false,
      startedAt: null,
      error: null,
      partial: null,
    }),
}))
