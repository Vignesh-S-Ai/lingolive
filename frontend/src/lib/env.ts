/**
 * Runtime environment configuration.
 *
 * Secrets must never live here — the backend owns all provider credentials
 * (Gnani, translation provider, LiveKit API secret). Only public, browser-safe
 * values are exposed through Vite.
 */
const DEFAULT_API_BASE = 'http://localhost:8000'

export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE).replace(/\/+$/, ''),
  liveKitUrl: import.meta.env.VITE_LIVEKIT_URL ?? '',
} as const
