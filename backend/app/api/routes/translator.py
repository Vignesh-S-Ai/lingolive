"""Translation and STT API routes."""

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ...db.session import get_db
from ...db.models import Room, Participant, Conversation
from ...services.gnani.prisma_stt import GnaniPrismaSTT
from ...services.gnani.timbre_tts import GnaniTimbreTTS
from ...services.translation.translation_service import (
    get_translation_provider,
    TranslationSegment,
)
from ...services.realtime.livekit_service import livekit_service

router = APIRouter(prefix="", tags=["translation"])

# In-process registry of active streaming STT sessions (single-worker deploy).
_stt_sessions: dict = {}


@router.post("/stt/stream/start")
async def start_stt_session(
    room_code: str,
    participant_id: str,
    input_language: str = "indic-auto",
    db: Session = Depends(get_db),
):
    """Start a Gnani Prisma streaming STT session for a participant."""
    from ...repositories.room_repository import get_room
    from ...repositories.participant_repository import (
        get_participant,
        get_participant_by_identity,
    )

    room = get_room(db, room_code)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Accept either the UUID `id` or the name-based `participant_id`.
    participant = get_participant(db, participant_id)
    if participant is None:
        participant = get_participant_by_identity(db, participant_id, room_code)
    if not participant or participant.room_id != room.id:
        raise HTTPException(status_code=404, detail="Participant not in room")

    try:
        stt = GnaniPrismaSTT(
            api_key="",  # Will use settings.GNANI_API_KEY
            language_code=input_language,
        )
        await stt.start()
        old = _stt_sessions.pop(participant_id, None)
        if old is not None:
            await old.stop()
        _stt_sessions[participant_id] = stt
        return {"status": "started", "participant_id": participant_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"STT error: {str(e)}")


@router.post("/stt/stream/stop")
async def stop_stt_session(participant_id: str):
    """Stop the Gnani STT session for a participant."""
    stt = _stt_sessions.pop(participant_id, None)
    if stt is None:
        raise HTTPException(
            status_code=404,
            detail="No active STT session for this participant",
        )
    await stt.stop()
    return {"status": "stopped", "participant_id": participant_id}


@router.post("/stt/stream/feed")
async def feed_stt_audio(
    participant_id: str,
    audio_chunk: bytes = Body(..., media_type="application/octet-stream"),
    db: Session = Depends(get_db),
):
    """Feed a raw PCM audio chunk (request body) to the ongoing STT session."""
    stt = _stt_sessions.get(participant_id)
    if stt is None:
        raise HTTPException(
            status_code=404,
            detail="No active STT session for this participant",
        )
    await stt.send_audio(audio_chunk)
    return {
        "status": "fed",
        "participant_id": participant_id,
        "bytes": len(audio_chunk),
    }


@router.post("/translation/translate")
async def translate_text(
    text: str,
    source_language: str,
    target_language: str,
    context: Optional[dict] = None,
    db: Session = Depends(get_db),
):
    """Translate text using the Gnani translation provider."""
    try:
        provider = get_translation_provider()
        translated = await provider.translate(
            text=text,
            source_language=source_language,
            target_language=target_language,
            context=context or {},
        )
        return {"translated_text": translated, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation error: {str(e)}")


@router.post("/tts/synthesize")
async def synthesize_tts(
    text: str,
    voice: str = "Nalini",
    language_code: str = "hi-IN",
    model: str = "timbre-v2.5",
    db: Session = Depends(get_db),
):
    """Synthesize text to speech using Gnani Timbre (real synthesis)."""
    try:
        tts = GnaniTimbreTTS(
            api_key="",  # Will use settings.GNANI_API_KEY
            voice=voice,
            language_code=language_code,
            model=model,
        )
        await tts.start()
        audio_bytes = await tts.synthesize(text=text)
        await tts.stop()
        if audio_bytes == 0:
            raise RuntimeError("Gnani TTS returned no audio")
        return {
            "status": "completed",
            "text": text[:50],
            "audio_bytes": audio_bytes,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")


@router.post("/tts/stream")
async def synthesize_tts_stream(
    text: str,
    voice: str = "Nalini",
    language_code: str = "hi-IN",
    model: str = "timbre-v2.5",
):
    """Synthesize text to speech with streaming audio chunks."""
    try:
        from livekit.plugins.gnani import TTS as GnaniTTS
        from pydantic import BaseModel

        class AudioConfig(BaseModel):
            encoding: str = "linear_pcm"
            container: str = "wav"
            sample_rate: int = 48000
            sample_width: int = 2
            num_channels: int = 1

        tts = GnaniTTS(
            api_key="",
            voice=voice,
            language=language_code,
            model=model,
        )
        await tts.connect()
        audio_chunks = []

        async for chunk in tts.stream(text=text.strip()):
            audio_chunks.append(chunk)

        await tts.disconnect()
        return {
            "status": "completed",
            "audio_chunks": len(audio_chunks),
            "text": text[:50],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS streaming error: {str(e)}")