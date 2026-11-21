import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface HistoryParticipant {
  name: string
  inputLanguage: string
  outputLanguage: string
}

export interface HistoryEntry {
  /** Stable per session; the room code is the reopen key. */
  id: string
  code: string
  name: string
  startedAt: number
  endedAt: number
  durationMs: number
  participants: HistoryParticipant[]
  transcriptCount: number
  /** Distinct language codes touched during the session. */
  languages: string[]
  /** One-line digest of the last thing that was said. */
  summary: string
  /** True when the session ran without a reachable backend. */
  preview: boolean
}

export interface HistoryStore {
  entries: HistoryEntry[]
  record: (entry: HistoryEntry) => void
  remove: (code: string) => void
  clear: () => void
}

const MAX_ENTRIES = 30

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set) => ({
      entries: [],
      record: (entry) =>
        set((s) => {
          const next = [entry, ...s.entries.filter((e) => e.code !== entry.code)]
          return { entries: next.slice(0, MAX_ENTRIES) }
        }),
      remove: (code) => set((s) => ({ entries: s.entries.filter((e) => e.code !== code) })),
      clear: () => set({ entries: [] }),
    }),
    {
      name: 'lingolive-history',
      version: 1,
      partialize: (state) => ({ entries: state.entries }),
    }
  )
)
