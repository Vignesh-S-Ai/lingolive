import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'dark' | 'light'

export interface SettingsState {
  /** Participant display name used when joining a room. */
  displayName: string
  /** Language the participant speaks (input). */
  inputLanguage: string
  /** Language the participant wants to receive (output). */
  outputLanguage: string

  /* --- Audio --- */
  micEnabled: boolean
  speakerEnabled: boolean
  playOriginalAudio: boolean
  playTranslatedAudio: boolean
  /** Playback volume 0–100 for spoken translations. */
  volume: number
  microphoneId: string
  speakerId: string

  /* --- Subtitles --- */
  showOriginal: boolean
  showTranslated: boolean

  /* --- Voice --- */
  /** `default` lets the provider pick per target language. */
  voice: string

  /* --- Appearance --- */
  theme: ThemePreference

  update: (partial: Partial<SettingsState>) => void
  reset: () => void
}

const defaults: Omit<SettingsState, 'update' | 'reset'> = {
  displayName: '',
  inputLanguage: 'ta-IN',
  outputLanguage: 'hi-IN',
  micEnabled: true,
  speakerEnabled: true,
  playOriginalAudio: false,
  playTranslatedAudio: true,
  volume: 80,
  microphoneId: '',
  speakerId: '',
  showOriginal: true,
  showTranslated: true,
  voice: 'default',
  theme: 'dark',
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      update: (partial) => set(partial),
      reset: () => set({ ...defaults }),
    }),
    {
      name: 'lingolive-settings',
      version: 1,
      partialize: (state) => {
        const { update: _u, reset: _r, ...persisted } = state
        return persisted
      },
    }
  )
)

/** Non-hook accessor for places outside React (services, effects). */
export const getSettings = () => useSettingsStore.getState()
