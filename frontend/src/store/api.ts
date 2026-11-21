/**
 * api.ts - Minimal backend API client for transcript/translation events.
 * In production, this would connect to the real backend. Mock mode is clearly labeled.
 */

export const backendApi = {
  // Fetch transcripts for a given room ID from the backend
  async getTranscripts(roomId: string) {
    // Simulate API call - in mock mode this returns placeholder data
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      entries: [
        { participantId: 'local', text: 'Hello, how are you?', timestamp: Date.now(), language: 'en-US' },
        { participantId: 'remote-1', text: 'I am fine, thank you!', timestamp: Date.now() - 1000, language: 'es-ES' },
      ],
    };
  },

  // Send translation events to backend
  async sendTranslation(event: { roomId: string; text: string; sourceLang: string; targetLang: string }) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { status: 'ok', event };
  },
};