import { create } from 'zustand'
import type { ParticipantView, ConnectionQuality } from '../types'

interface LocalState {
  id: string
  name: string
  inputLanguage: string
  outputLanguage: string
  micEnabled: boolean
  micPermission: 'granted' | 'denied' | 'unknown'
  isSpeaking: boolean
  quality: ConnectionQuality
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface ParticipantStore {
  local: LocalState
  remote: Record<string, ParticipantView>
  connectionStatus: ConnectionStatus
  /** Set when the backend could not be reached — drives the preview banner. */
  usingPreview: boolean

  setLocal: (partial: Partial<LocalState>) => void
  setLocalIdentity: (id: string) => void
  upsertRemote: (participant: ParticipantView) => void
  removeRemote: (id: string) => void
  clearRemote: () => void
  setSpeaking: (id: string, speaking: boolean) => void
  setQuality: (id: string, quality: ConnectionQuality) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  setUsingPreview: (value: boolean) => void
  reset: () => void
}

const initialLocal: LocalState = {
  id: 'local',
  name: 'You',
  inputLanguage: 'ta-IN',
  outputLanguage: 'hi-IN',
  micEnabled: true,
  micPermission: 'unknown',
  isSpeaking: false,
  quality: 'unknown',
}

export const useParticipantStore = create<ParticipantStore>((set) => ({
  local: initialLocal,
  remote: {},
  connectionStatus: 'disconnected',
  usingPreview: false,

  setLocal: (partial) => set((s) => ({ local: { ...s.local, ...partial } })),

  setLocalIdentity: (id) => set((s) => ({ local: { ...s.local, id } })),

  upsertRemote: (participant) =>
    set((s) => ({ remote: { ...s.remote, [participant.id]: participant } })),

  removeRemote: (id) =>
    set((s) => {
      const next = { ...s.remote }
      delete next[id]
      return { remote: next }
    }),

  clearRemote: () => set({ remote: {} }),

  setSpeaking: (id, speaking) =>
    set((s) => {
      if (id === s.local.id) return { local: { ...s.local, isSpeaking: speaking } }
      const existing = s.remote[id]
      if (!existing) return s
      return { remote: { ...s.remote, [id]: { ...existing, isSpeaking: speaking } } }
    }),

  setQuality: (id, quality) =>
    set((s) => {
      if (id === s.local.id) return { local: { ...s.local, quality } }
      const existing = s.remote[id]
      if (!existing || existing.quality === quality) return s
      return { remote: { ...s.remote, [id]: { ...existing, quality } } }
    }),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setUsingPreview: (usingPreview) => set({ usingPreview }),
  reset: () =>
    set({ local: initialLocal, remote: {}, connectionStatus: 'disconnected', usingPreview: false }),
}))
