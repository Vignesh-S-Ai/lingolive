import { useSettingsStore } from './settingsStore'
import { useParticipantStore } from './participantStore'
import { useConversationStore } from './conversationStore'
import { useMetricsStore } from './metricsStore'
import { useHistoryStore } from './historyStore'

/** Dev-only: expose stores so CDP diagnostics can trace update loops. */
if (import.meta.env.DEV) {
  ;(window as unknown as { __stores?: Record<string, unknown> }).__stores = {
    settings: useSettingsStore,
    participant: useParticipantStore,
    conversation: useConversationStore,
    metrics: useMetricsStore,
    history: useHistoryStore,
  }
}
