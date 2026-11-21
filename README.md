LingoLive
Speak your language. Understand everyone.
LingoLive is a real-time multilingual voice communication platform
designed to help people communicate naturally, even when they speak
different languages.

Participants join the same live conversation, speak in their preferred
language, and receive translated speech and subtitles in the language
they understand.

🌐 Live Demo: https://lingolive-seven.vercel.app/
💻 GitHub Repository: https://github.com/Vignesh-S-Ai/lingolive
🌍 Supported Languages
LingoLive currently supports four languages:

  Language   Locale
  English    en-IN
Tamil      ta-IN
Telugu     te-IN
Hindi      hi-IN

Each participant can select their preferred language for a conversation.
💡 The Problem We Want to Solve
Language differences can make even simple conversations difficult.
LingoLive aims to remove that barrier by allowing people to speak
naturally in their own language while other participants hear the
conversation translated into theirs.
Example Use Case
Imagine three people in one live room:
- Person A speaks Tamil.
- Person B speaks Hindi.
- Person C speaks Telugu.
Each person speaks normally. LingoLive processes the audio, translates
the recognized speech into the other participants' selected languages,
and delivers translated audio and subtitles to the appropriate
participants.
⚡ How LingoLive Works
1. Join a conversation -- Participants enter the same live room.
2. Capture audio -- The browser captures each participant's
   microphone audio.
3. Speech recognition -- Streaming speech-to-text converts spoken
   audio into text.
4. Translation -- The recognized text is translated into the target
   participants' languages.
5. Speech generation -- Text-to-speech generates translated voice
   audio.
6. Audio delivery -- Translated audio is routed to the relevant
   participants.
7. Live subtitles -- Transcript and translation updates are
   displayed in the conversation.
🏗️ System Architecture
Participant Microphone
         |
         v
    LiveKit / WebRTC
         |
         v
   Streaming Audio
         |
         v
  Speech-to-Text (STT)
     Gnani Prisma
         |
         v
    Translation
       NLLB
         |
         v
  Text-to-Speech (TTS)
     Gnani Timbre
         |
         v
  LiveKit Audio Delivery
         |
         v
Participant hears translated
speech in their selected language
         |
         v
   Live Transcript / Subtitles
The backend coordinates audio processing, speech recognition,
translation, speech generation, participant language preferences, and
targeted audio delivery. The frontend provides the live room experience
and conversation controls.
🧰 Technology Stack
  Area                   Technologies
  Frontend               React 18, TypeScript, Vite, Tailwind CSS
State management       Zustand
Real-time media        LiveKit, WebRTC
Backend                Python 3.11+, FastAPI, Pydantic, AsyncIO
Speech-to-Text         Gnani Prisma
Translation            Meta NLLB
Text-to-Speech         Gnani Timbre
Database layer         PostgreSQL, SQLAlchemy, Alembic
Real-time events       WebSockets
Build and deployment   Vite, Vercel
🎯 Performance Engineering
Real-time communication depends on keeping the delay between speaking
and hearing a translation as low as possible. These are the engineering
targets guiding optimization:

  Metric                                                  Target
  Audio capture and transmission                    Under 100 ms
Partial transcript availability                   Under 500 ms
Translation after stable text                     Under 300 ms
TTS first audio byte                              Under 250 ms
End-of-phrase to translated playback     P50 under 1.5 seconds

End-to-end latency is measured and optimized across the complete audio
pipeline. These values are targets, not guaranteed production
measurements.
✨ Key Features
- Real-time, multi-participant voice conversations
- Four supported languages: English, Tamil, Telugu, and Hindi
- Streaming speech recognition
- Automatic text translation
- AI-generated translated speech
- Participant-specific language preferences
- Targeted translated-audio delivery
- Live transcript and subtitle updates
- Room-based communication using LiveKit and WebRTC
🚀 Try the Deployed Application
Visit the live application:

https://lingolive-seven.vercel.app/

For local installation and environment configuration, see
[`INSTALL.md`](./INSTALL.md).
Configuration note: Live voice features depend on the backend and
the required third-party service credentials. Configure the
appropriate environment variables for your deployment. Never commit
API keys, access tokens, or other secrets to the repository.

📌 Project Principle
Speak your language. Understand everyone.

LingoLive brings people into one conversation, without asking them to
speak the same language.
Built to make multilingual conversations feel natural.
