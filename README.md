# Real-Time Multilingual Voice Communication Platform

## Project Vision
Build a real-time multilingual communication platform that enables people who speak different languages to communicate naturally.

## Primary Use Case
Three people join the same virtual conversation:
- Person A speaks only Tamil
- Person B speaks only Hindi  
- Person C speaks only Telugu

Each participant speaks naturally in their own language. The system automatically:
1. Captures microphone audio
2. Recognizes spoken language
3. Converts speech to text
4. Translates to other participants' preferred languages
5. Generates natural translated speech
6. Streams translated audio to appropriate participants
7. Displays translated subtitles in real time

## Core Product Principle
**Speak your language. Understand everyone.**

## Supported Languages (Initial)
| Language | Code |
|---|---|
| Tamil | ta-IN |
| Hindi | hi-IN |
| Telugu | te-IN |

## Additional Languages (Design-Ready)
- Kannada (kn-IN)
- Malayalam (ml-IN)
- Bengali (bn-IN)
- Marathi (mr-IN)
- Gujarati (gu-IN)
- Punjabi (pa-IN)
- Indian English (en-IN)

## Technology Stack

### Frontend
- React 18 + TypeScript
- Vite build tool
- Tailwind CSS
- LiveKit Client SDK
- WebRTC browser APIs
- Zustand (state management)

### Backend
- Python 3.11+
- FastAPI
- Pydantic
- AsyncIO
- PostgreSQL
- SQLAlchemy + Alembic
- WebSocket
- Redis

### Real-Time Communication
- LiveKit for room management and real-time media transport
- WebRTC for microphone capture and low-latency communication
- LiveKit Agents for AI orchestration

### AI Infrastructure
- Gnani Prisma v3.0 for Streaming STT
- Gnani Timbre v2.5 for Streaming TTS
- Gnani Translation Intelligence

## Key Performance Targets
| Metric | Target |
|---|---|
| Audio capture and transmission | Under 100 ms |
| Partial transcript availability | Under 500 ms |
| Translation after stable text | Under 300 ms |
| TTS first audio byte | Under 250 ms |
| End-of-phrase to translated playback | P50 under 1.5 seconds |
| End-to-end latency | Continuously measured and optimized |

## Development Milestones
- M0: Workspace inspection and architecture
- M1: Project foundation
- M2: Real-time communication
- M3: Gnani AI integration
- M4: Translation orchestration
- M5: Complete user interface
- M6: Performance engineering
- M7: Testing and stabilization
- M8: Deployment readiness

## Architecture Documentation
See `docs/architecture.md` for detailed system design.

## Setup Instructions
See `INSTALL.md` for setup and configuration.