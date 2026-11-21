"""Real-time speech pipeline WebSocket.

One connection per participant carries the whole speech-to-speech loop:

  browser mic (PCM 16 kHz mono Int16, binary frames)
      -> Gnani Prisma streaming STT
      -> broadcast transcripts (original) to the room
      -> NLLB translation grouped per target language
      -> Gnani Timbre TTS per target language
      -> targeted PCM audio + translation text back to each listener

JSON text frames carry control/events both ways; binary frames are audio
(up = microphone PCM, down = translated speech PCM).

Single-worker deployment: STT sessions and connection registries live in
process memory, exactly like the REST STT routes.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import time
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from ...db.session import SessionLocal
from ...repositories.participant_repository import (
    get_participant,
    update_participant_language,
)
from ...repositories.room_repository import get_room
from ...services.gnani.prisma_stt import GnaniPrismaSTT
from ...services.gnani.timbre_tts import GnaniTimbreTTS
from ...services.translation.translation_service import get_translation_provider

logger = logging.getLogger(__name__)

router = APIRouter(tags=["pipeline"])

MAX_AUDIO_BYTES = 256 * 1024          # ~8 s of 16 kHz mono Int16
TTS_QUEUE_MAX = 8                      # bounded per-listener audio queue
TRANSLATE_TIMEOUT_S = 120             # first NLLB call may load the model
TTS_TIMEOUT_S = 45
FINAL_DEDUPE_WINDOW_S = 3.0
# After the client VAD reports the pause, wait this long for Gnani's final
# before delivering the last partial hypothesis ourselves (Gnani endpointing
# otherwise costs 2-5 s more on the critical path).
PROVISIONAL_GRACE_S = 0.3  # TEMP: forced-exercise value; restore to 1.2
# Test knob: simulate slow Gnani endpointing (seconds before the real final
# is processed) so the provisional-final path can be exercised on demand.
FINAL_DELAY_S = float(os.environ.get("PIPELINE_FINAL_DELAY_S", "0") or "0")
AUDIO_IDLE_RESTART_S = 45             # restart only when NO audio flows this long
AUDIO_BUFFER_MAX = 96_000             # ~3 s of non-utterance audio across restarts
UTTERANCE_AUDIO_MAX = 2_000_000       # ~62 s retained for re-feed after a Gnani kill
REFEED_DEDUPE_WINDOW_S = 60           # skip a re-fed final identical to the pre-death one
WATCHDOG_INTERVAL_S = 5

# room_code -> {participant_id: PipelineConnection}
_rooms: Dict[str, Dict[str, "PipelineConnection"]] = {}


class PipelineConnection:
    """Server-side state for one participant's pipeline socket."""

    def __init__(
        self,
        ws: WebSocket,
        room_code: str,
        participant_id: str,
        name: str,
        input_language: str,
        output_language: str,
    ) -> None:
        self.ws = ws
        self.room_code = room_code
        self.participant_id = participant_id   # participant row UUID (str)
        self.name = name
        self.input_language = input_language
        self.output_language = output_language
        self.muted = False

        self.stt: Optional[GnaniPrismaSTT] = None
        self.stopping = False
        self.last_event_at: float = time.monotonic()
        self.last_audio_at: float = time.monotonic()
        self.audio_buffer = bytearray()
        self.events_q: asyncio.Queue = asyncio.Queue(maxsize=512)
        self.tts_q: asyncio.Queue = asyncio.Queue(maxsize=TTS_QUEUE_MAX)
        self.event_task: Optional[asyncio.Task] = None
        self.tts_task: Optional[asyncio.Task] = None
        self.watchdog_task: Optional[asyncio.Task] = None
        self.send_lock = asyncio.Lock()

        # utterance bookkeeping for honest latency measurement
        self.utterance_seq: Optional[int] = None
        self.utterance_client_ts: Optional[int] = None
        self.utterance_audio_t0: Optional[float] = None
        # set when the client's VAD reports speech end (utterance event=end);
        # endpoint_ms = final arrival - this instant (pure pause→final delay)
        self.utterance_end_at: Optional[float] = None
        # retention for re-feed: Gnani kills sessions at T_open+60 s unless a
        # final completes first, so an in-flight utterance may need re-sending
        # into the restarted session.
        self.awaiting_final = False
        self.utterance_audio = bytearray()
        self.refeed_active = False
        # Last partial hypothesis + provisional-final machinery: if Gnani has
        # not produced a final within PROVISIONAL_GRACE_S after the client's
        # pause, the partial is delivered instead (utterance_finalized then
        # suppresses the late real final).
        self.last_partial_text: Optional[str] = None
        self.partial_at: float = 0.0
        self.provisional_task: Optional[asyncio.Task] = None
        self.utterance_finalized: bool = False

        self.last_final_text = ""
        self.last_final_at = 0.0

    # ------------------------------------------------------------------
    # outbound helpers
    # ------------------------------------------------------------------
    async def send_json(self, payload: Dict[str, Any]) -> None:
        try:
            if self.ws.client_state is WebSocketState.CONNECTED:
                async with self.send_lock:
                    await self.ws.send_json(payload)
        except Exception as e:  # socket went away mid-send
            logger.debug(f"pipeline send failed ({self.participant_id}): {type(e).__name__}")

    async def send_bytes(self, data: bytes) -> None:
        try:
            if self.ws.client_state is WebSocketState.CONNECTED:
                async with self.send_lock:
                    await self.ws.send_bytes(data)
        except Exception as e:
            logger.debug(f"pipeline binary send failed ({self.participant_id}): {type(e).__name__}")

    # ------------------------------------------------------------------
    # STT
    # ------------------------------------------------------------------
    async def start_stt(self) -> None:
        stt = GnaniPrismaSTT(language_code=self.input_language or "indic-auto")
        stt.on_transcript(self._on_transcript)
        await stt.start()
        self.stt = stt
        self.last_event_at = time.monotonic()

    async def stop_stt(self) -> None:
        stt, self.stt = self.stt, None
        if stt is not None:
            try:
                await stt.stop()
            except Exception as e:
                logger.warning(f"STT stop error: {type(e).__name__}: {e}")

    def _on_transcript(self, text: str, is_final: bool):
        """Called from the STT reader task; enqueue for ordered handling."""
        self.last_event_at = time.monotonic()
        try:
            self.events_q.put_nowait(("transcript", text, is_final))
        except asyncio.QueueFull:
            logger.warning(f"STT event queue full for {self.participant_id}, dropping")

    def buffer_audio(self, data: bytes) -> None:
        """Hold mic audio while the STT stream is being (re)started."""
        self.audio_buffer.extend(data)
        if len(self.audio_buffer) > AUDIO_BUFFER_MAX:
            overflow = len(self.audio_buffer) - AUDIO_BUFFER_MAX
            del self.audio_buffer[:overflow]

    async def flush_audio_buffer(self) -> None:
        stt = self.stt
        buf = bytes(self.audio_buffer)
        self.audio_buffer.clear()
        if stt is not None and buf:
            await stt.send_audio(buf)


# ----------------------------------------------------------------------
# room helpers
# ----------------------------------------------------------------------

def _room_conns(room_code: str) -> List[PipelineConnection]:
    return list(_rooms.get(room_code, {}).values())


async def _broadcast(room_code: str, payload: Dict[str, Any]) -> None:
    for conn in _room_conns(room_code):
        await conn.send_json(payload)


async def _broadcast_roster(room_code: str) -> None:
    roster = [
        {
            "id": c.participant_id,
            "name": c.name,
            "input_language": c.input_language,
            "output_language": c.output_language,
            "mic_enabled": not c.muted,
        }
        for c in _room_conns(room_code)
    ]
    await _broadcast(room_code, {"type": "roster", "participants": roster})


# ----------------------------------------------------------------------
# translation + TTS fan-out
# ----------------------------------------------------------------------

async def _translate(text: str, src: str, tgt: str) -> str:
    provider = get_translation_provider()
    return await asyncio.wait_for(
        provider.translate(text=text, source_language=src, target_language=tgt),
        timeout=TRANSLATE_TIMEOUT_S,
    )


async def _tts_pcm(text: str, language: str) -> tuple[bytes, int]:
    tts = GnaniTimbreTTS(language_code=language)
    await tts.start()
    try:
        return await asyncio.wait_for(tts.synthesize_pcm(text), timeout=TTS_TIMEOUT_S)
    finally:
        await tts.stop()


_CLAUSE_SPLIT_RE = re.compile(r"(?<=[.!?;,\u0964])\s+")
_CLAUSE_MIN_LEN = 24
# Below this length a single TTS request is already fast (~0.5 s); splitting
# would only add a second session handshake with no first-audio gain.
_CLAUSE_SPLIT_MIN_CHARS = 100


def _split_clauses(text: str) -> list[str]:
    """Split a translated sentence into TTS-sized clauses.

    Long sentences are streamed clause-by-clause so audible output starts
    while the rest of the sentence is still being rendered. Fragments shorter
    than ~12 chars or clauses shorter than ~24 chars are merged forward to
    avoid choppy speech.
    """
    if len(text) < _CLAUSE_SPLIT_MIN_CHARS:
        return [text]
    parts = [p.strip() for p in _CLAUSE_SPLIT_RE.split(text) if p and p.strip()]
    if len(parts) <= 1:
        return [text]
    merged = [parts[0]]
    for p in parts[1:]:
        if len(merged[-1]) < _CLAUSE_MIN_LEN or len(p) < 12:
            merged[-1] = f"{merged[-1]} {p}"
        else:
            merged.append(p)
    return merged or [text]


class _TTSJob:
    __slots__ = (
        "segment_id",
        "pcm",
        "rate",
        "language",
        "text",
        "utterance_ts",
        "latency",
        "end_mono",
    )

    def __init__(self, segment_id, pcm, rate, language, text, utterance_ts, latency, end_mono=None):
        self.segment_id = segment_id
        self.pcm = pcm
        self.rate = rate
        self.language = language
        self.text = text
        self.utterance_ts = utterance_ts
        self.latency = latency
        self.end_mono = end_mono


async def _tts_worker(conn: PipelineConnection) -> None:
    """Drains one listener's audio queue in order; drops oldest on overflow."""
    while True:
        job = await conn.tts_q.get()
        if job is None:
            break
        try:
            latency = job.latency
            if latency is not None and job.end_mono is not None:
                latency = {
                    **latency,
                    "first_audio_ms": round((time.monotonic() - job.end_mono) * 1000),
                }
            await conn.send_json(
                {
                    "type": "tts_start",
                    "segment_id": job.segment_id,
                    "language": job.language,
                    "text": job.text,
                    "utterance_ts": job.utterance_ts,
                    "latency": latency,
                }
            )
            await conn.send_bytes(job.pcm)
            await conn.send_json({"type": "tts_end", "segment_id": job.segment_id})
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.warning(f"TTS delivery failed for {conn.participant_id}: {type(e).__name__}: {e}")
            break


def _enqueue_tts(conn: PipelineConnection, job: _TTSJob) -> None:
    try:
        conn.tts_q.put_nowait(job)
        return
    except asyncio.QueueFull:
        pass
    # Bounded queue: drop the oldest unsent segment so late audio never
    # piles up behind a slow listener.
    try:
        dropped = conn.tts_q.get_nowait()
        if isinstance(dropped, _TTSJob):
            asyncio.ensure_future(
                conn.send_json(
                    {"type": "tts_dropped", "segment_id": dropped.segment_id, "reason": "queue_overflow"}
                )
            )
    except asyncio.QueueEmpty:
        pass
    try:
        conn.tts_q.put_nowait(job)
    except asyncio.QueueFull:
        logger.warning(f"TTS queue overflow for {conn.participant_id}, segment dropped")


async def _provisional_final(conn: PipelineConnection) -> None:
    """Deliver the last partial hypothesis if Gnani's final is slow.

    The client VAD already heard the pause; waiting for Gnani's endpointing
    costs 2-5 s more on the critical path. After PROVISIONAL_GRACE_S (which
    lets late partials land) we run the normal final path with the best text
    we have — ``utterance_finalized`` then suppresses the real final when it
    eventually arrives.
    """
    try:
        await asyncio.sleep(PROVISIONAL_GRACE_S)
    except asyncio.CancelledError:
        return
    if conn.stopping or not conn.awaiting_final or conn.utterance_finalized:
        return
    text = (conn.last_partial_text or "").strip()
    if not text:
        return  # no hypothesis yet — keep waiting for Gnani
    logger.info(
        f"provisional final ({PROVISIONAL_GRACE_S}s grace) for "
        f"{conn.participant_id}: {text!r}"
    )
    try:
        await _handle_final(conn, text)
    except asyncio.CancelledError:
        raise
    except Exception as e:
        logger.error(f"provisional final handling failed: {type(e).__name__}: {e}")


async def _handle_final(conn: PipelineConnection, text: str) -> None:
    """One completed utterance: broadcast it, translate per target language,
    synthesize once per language, deliver to each listener."""
    # A provisional claim (or an earlier final) already delivered this
    # utterance — a late Gnani final must not run the pipeline twice.
    if conn.utterance_finalized:
        return
    room = _rooms.get(conn.room_code, {})
    targets = [c for c in room.values() if c.output_language != conn.input_language]

    segment_id = uuid.uuid4().hex
    now = time.monotonic()
    stt_ms = (
        round((now - conn.utterance_audio_t0) * 1000)
        if conn.utterance_audio_t0 is not None
        else None
    )
    endpoint_ms = (
        round((now - conn.utterance_end_at) * 1000)
        if conn.utterance_end_at is not None
        else None
    )
    latency_base = {
        "stt_ms": stt_ms,
        "endpoint_ms": endpoint_ms,
        "translate_ms": None,
        "tts_ms": None,
    }
    utterance_ts = conn.utterance_client_ts
    utterance_seq = conn.utterance_seq
    # Kept for first_audio_ms (pause → first TTS byte) on each listener.
    utterance_end_mono = conn.utterance_end_at
    logger.info(f"DIAG claim: {conn.name} endpoint_ms={endpoint_ms} stt_ms={stt_ms} text={text[:60]!r}")
    # Claim the utterance immediately: a concurrent restart must not re-feed
    # audio we already have a final for.
    conn.utterance_audio_t0 = None
    conn.utterance_client_ts = None
    conn.utterance_seq = None
    conn.utterance_end_at = None
    conn.awaiting_final = False
    conn.utterance_finalized = True
    conn.last_partial_text = None
    conn.partial_at = 0.0
    conn.utterance_audio.clear()

    # 1) original transcript to everybody (including the speaker)
    await _broadcast(
        conn.room_code,
        {
            "type": "transcript",
            "final": True,
            "segment_id": segment_id,
            "participant_id": conn.participant_id,
            "participant_name": conn.name,
            "language": conn.input_language,
            "text": text,
            "seq": utterance_seq,
        },
    )

    if not targets:
        return

    # 2) translate once per distinct target language
    langs = sorted({c.output_language for c in targets})
    results: Dict[str, Any] = {}
    translate_t0 = time.monotonic()

    async def _one(lang: str) -> None:
        try:
            results[lang] = ("ok", await _translate(text, conn.input_language, lang))
        except asyncio.TimeoutError:
            results[lang] = ("error", "Translation timed out.")
        except Exception as e:
            results[lang] = ("error", f"Translation failed: {type(e).__name__}: {e}")

    await asyncio.gather(*[_one(lang) for lang in langs])
    translate_ms = round((time.monotonic() - translate_t0) * 1000)
    latency_base = {
        "stt_ms": stt_ms,
        "endpoint_ms": endpoint_ms,
        "translate_ms": translate_ms,
        "tts_ms": None,
    }

    # 3) tell every listener what they will hear (speaker gets a text-only
    #    preview of what the others will receive — no audio for own voice)
    for target in targets:
        status, payload = results.get(target.output_language, ("error", "No translation available."))
        if status == "ok":
            await target.send_json(
                {
                    "type": "translation",
                    "segment_id": segment_id,
                    "participant_id": conn.participant_id,
                    "participant_name": conn.name,
                    "language": target.output_language,
                    "source_language": conn.input_language,
                    "text": payload,
                    "audio": target.participant_id != conn.participant_id,
                    "utterance_ts": utterance_ts,
                }
            )
        else:
            await target.send_json(
                {
                    "type": "error",
                    "stage": "translate",
                    "segment_id": segment_id,
                    "message": payload,
                }
            )

    # 4) synthesize per language in parallel; each language is clause-streamed
    #    so the listener hears the first clause while the rest is rendered.
    async def _synth_lang(lang: str) -> None:
        listeners = [
            c
            for c in targets
            if c.output_language == lang and c.participant_id != conn.participant_id
        ]
        if not listeners:
            return
        status, translated = results.get(lang, ("error", None))
        if status != "ok" or not translated:
            return

        for i, clause in enumerate(_split_clauses(translated)):
            t0 = time.monotonic()
            try:
                pcm, rate = await _tts_pcm(clause, lang)
            except asyncio.TimeoutError:
                for c in listeners:
                    await c.send_json(
                        {"type": "error", "stage": "tts", "segment_id": segment_id, "message": "Voice generation timed out."}
                    )
                return
            except Exception as e:
                for c in listeners:
                    await c.send_json(
                        {"type": "error", "stage": "tts", "segment_id": segment_id,
                         "message": f"Voice generation failed: {type(e).__name__}: {e}"}
                    )
                return
            tts_ms = round((time.monotonic() - t0) * 1000)
            # Only the first clause carries the latency sample (it is the one
            # that ends the pause→audio measurement); later clauses send null.
            latency = {**latency_base, "tts_ms": tts_ms} if i == 0 else None
            seg_id = segment_id if i == 0 else f"{segment_id}c{i}"
            job = _TTSJob(
                seg_id, pcm, rate, lang, clause, utterance_ts, latency, utterance_end_mono
            )
            for c in listeners:
                _enqueue_tts(c, job)

    await asyncio.gather(*[_synth_lang(lang) for lang in langs])


async def _stt_watchdog(conn: PipelineConnection) -> None:
    """Keep the Gnani stream alive without disturbing in-flight speech.

    Gnani hard-kills sessions at T_open+60 s unless a final completes first,
    so an utterance near that boundary can die mid-endpointing. We:

    - Never touch a stream that is receiving audio (our own restart would
      destroy endpointing the same way).
    - Restart on death (or true audio idle), and if an utterance was in
      flight, re-feed its retained audio into the new session so the final
      still arrives (deduped against a possible pre-death final).
    """
    while True:
        await asyncio.sleep(WATCHDOG_INTERVAL_S)
        if conn.stopping:
            return
        stt = conn.stt
        healthy = stt is not None and stt.is_listening
        now = time.monotonic()

        if healthy:
            if conn.muted:
                continue
            if now - conn.last_audio_at < AUDIO_IDLE_RESTART_S:
                continue  # audio flowing — leave the session alone
            reason = "idle"
        else:
            reason = "closed"

        refeed = conn.awaiting_final and len(conn.utterance_audio) > 0
        if reason == "idle":
            # True idle: any in-flight utterance was abandoned by the client.
            conn.awaiting_final = False
            conn.utterance_audio.clear()
            conn.refeed_active = False
            refeed = False

        logger.warning(f"Restarting STT ({reason}) for {conn.participant_id}")
        await conn.stop_stt()
        if conn.stopping:
            return
        try:
            await conn.start_stt()
            await conn.flush_audio_buffer()
            if refeed and conn.stt is not None:
                await conn.stt.send_audio(bytes(conn.utterance_audio))
                conn.refeed_active = True
                logger.warning(
                    f"Re-fed {len(conn.utterance_audio)} B of utterance audio "
                    f"for {conn.participant_id}"
                )
            await conn.send_json({"type": "stt_restarted", "reason": reason})
        except Exception as e:
            logger.warning(f"STT restart failed: {type(e).__name__}: {e}")
            await conn.send_json(
                {"type": "error", "stage": "stt", "message": f"Recognition restarted failed: {e}"}
            )
            await asyncio.sleep(5)


async def _event_worker(conn: PipelineConnection) -> None:
    """Ordered processing of this participant's STT events."""
    while True:
        item = await conn.events_q.get()
        if item is None:
            break
        kind, text, is_final = item
        if kind != "transcript":
            continue
        text = (text or "").strip()
        if not text:
            continue
        if not is_final:
            # Late partial for an utterance we already delivered — drop it.
            if conn.utterance_finalized:
                continue
            conn.last_partial_text = text
            conn.partial_at = time.monotonic()
            await conn.send_json(
                {
                    "type": "transcript",
                    "final": False,
                    "participant_id": conn.participant_id,
                    "participant_name": conn.name,
                    "language": conn.input_language,
                    "text": text,
                    "seq": conn.utterance_seq,
                }
            )
            continue

        # de-duplicate repeated finals (STT often re-emits the last segment;
        # a re-feed after session death can also reproduce the pre-death final)
        now = time.monotonic()
        if text == conn.last_final_text and (
            now - conn.last_final_at < FINAL_DEDUPE_WINDOW_S
            or (conn.refeed_active and now - conn.last_final_at < REFEED_DEDUPE_WINDOW_S)
        ):
            conn.refeed_active = False
            continue
        conn.refeed_active = False
        conn.last_final_text = text
        conn.last_final_at = now

        if FINAL_DELAY_S > 0:
            await asyncio.sleep(FINAL_DELAY_S)
        try:
            await _handle_final(conn, text)
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.error(f"final handling failed: {type(e).__name__}: {e}")
            await conn.send_json(
                {"type": "error", "stage": "pipeline", "message": f"Could not process speech: {type(e).__name__}"}
            )


# ----------------------------------------------------------------------
# control messages
# ----------------------------------------------------------------------

async def _handle_control(conn: PipelineConnection, msg: Dict[str, Any]) -> None:
    mtype = msg.get("type")

    if mtype == "ping":
        await conn.send_json({"type": "pong", "ts": msg.get("ts"), "server_ts": int(time.time() * 1000)})
        return

    if mtype == "utterance":
        event = msg.get("event")
        if event == "start":
            conn.utterance_seq = msg.get("seq")
            conn.utterance_client_ts = msg.get("ts")
            conn.utterance_audio_t0 = time.monotonic()
            conn.utterance_end_at = None
            conn.awaiting_final = True
            conn.utterance_finalized = False
            conn.last_partial_text = None
            conn.partial_at = 0.0
            if conn.provisional_task is not None:
                conn.provisional_task.cancel()
                conn.provisional_task = None
            conn.utterance_audio.clear()
            logger.info(f"DIAG start: {conn.name} seq={conn.utterance_seq}")
        elif event == "end":
            # Stray end (no unclaimed utterance on this connection) — nothing
            # to endpoint; ignore so it cannot arm a bogus provisional final.
            if not conn.awaiting_final:
                return
            # Client VAD heard the pause — start the endpointing clock and
            # arm the provisional-final fallback for slow Gnani finals.
            conn.utterance_end_at = time.monotonic()
            logger.info(
                f"DIAG end: {conn.name} awaiting={conn.awaiting_final} finalized={conn.utterance_finalized} "
                f"partial={'yes' if conn.last_partial_text else 'no'} "
                f"final_age={round(time.monotonic() - conn.last_final_at, 2)}s"
            )
            if conn.provisional_task is not None:
                conn.provisional_task.cancel()
            conn.provisional_task = asyncio.ensure_future(_provisional_final(conn))
        return

    if mtype == "mic":
        conn.muted = bool(msg.get("muted", False))
        await _broadcast_roster(conn.room_code)
        return

    if mtype == "set_languages":
        input_language = str(msg.get("input_language") or conn.input_language)
        output_language = str(msg.get("output_language") or conn.output_language)
        db = SessionLocal()
        try:
            update_participant_language(
                db, conn.participant_id, input_language, output_language
            )
        finally:
            db.close()

        input_changed = input_language != conn.input_language
        conn.input_language = input_language
        conn.output_language = output_language

        if input_changed and conn.stt is not None:
            # Restart recognition with the new language. Any in-flight
            # utterance audio belongs to the old language — drop it.
            conn.awaiting_final = False
            conn.utterance_audio.clear()
            conn.refeed_active = False
            conn.last_partial_text = None
            if conn.provisional_task is not None:
                conn.provisional_task.cancel()
                conn.provisional_task = None
            await conn.stop_stt()
            try:
                await conn.start_stt()
            except Exception as e:
                await conn.send_json(
                    {"type": "error", "stage": "stt", "message": f"Could not restart recognition: {e}"}
                )

        await conn.send_json(
            {
                "type": "languages_updated",
                "input_language": conn.input_language,
                "output_language": conn.output_language,
            }
        )
        await _broadcast_roster(conn.room_code)
        return


# ----------------------------------------------------------------------
# endpoint
# ----------------------------------------------------------------------

@router.websocket("/rooms/{room_code}/pipeline")
async def room_pipeline(ws: WebSocket, room_code: str, participant_id: str):
    await ws.accept()

    db = SessionLocal()
    conn: Optional[PipelineConnection] = None
    try:
        room = get_room(db, room_code)
        participant = get_participant(db, participant_id) if room else None
        if (
            room is None
            or participant is None
            or participant.room_id != room.id
        ):
            await ws.send_json({"type": "error", "stage": "auth", "message": "Unknown room or participant."})
            await ws.close(code=4401)
            return

        conn = PipelineConnection(
            ws=ws,
            room_code=room_code,
            participant_id=str(participant.id),
            name=participant.name,
            input_language=participant.input_language,
            output_language=participant.output_language,
        )

        try:
            await conn.start_stt()
        except Exception as e:
            logger.error(f"STT start failed for {participant.name}: {type(e).__name__}: {e}")
            await ws.send_json(
                {"type": "error", "stage": "stt", "message": f"Speech recognition unavailable: {type(e).__name__}: {e}"}
            )
            await ws.close(code=1011)
            return

        _rooms.setdefault(room_code, {})[conn.participant_id] = conn
        logger.info(f"DIAG connect: {conn.name} ({conn.participant_id[:8]})")
        conn.event_task = asyncio.create_task(_event_worker(conn), name=f"pipe-events-{conn.participant_id[:8]}")
        conn.tts_task = asyncio.create_task(_tts_worker(conn), name=f"pipe-tts-{conn.participant_id[:8]}")
        conn.watchdog_task = asyncio.create_task(_stt_watchdog(conn), name=f"pipe-watch-{conn.participant_id[:8]}")

        await conn.send_json(
            {
                "type": "ready",
                "participant_id": conn.participant_id,
                "room_code": room_code,
                "input_language": conn.input_language,
                "output_language": conn.output_language,
            }
        )
        await _broadcast_roster(room_code)

        while True:
            message = await ws.receive()
            if message.get("type") == "websocket.disconnect":
                break
            if "bytes" in message and message["bytes"] is not None:
                data = message["bytes"]
                if len(data) > MAX_AUDIO_BYTES:
                    await ws.close(code=1009)
                    break
                conn.last_audio_at = time.monotonic()
                if conn.muted:
                    continue
                if conn.utterance_audio_t0 is None:
                    conn.utterance_audio_t0 = time.monotonic()
                awaiting = conn.awaiting_final
                if awaiting:
                    # Retain utterance audio: Gnani may kill the session
                    # mid-endpointing and the watchdog will re-feed it.
                    conn.utterance_audio.extend(data)
                    if len(conn.utterance_audio) > UTTERANCE_AUDIO_MAX:
                        overflow = len(conn.utterance_audio) - UTTERANCE_AUDIO_MAX
                        del conn.utterance_audio[:overflow]
                if conn.stt is None or not conn.stt.is_listening:
                    if not awaiting:
                        # Stream is (re)starting — buffer briefly instead of dropping.
                        conn.buffer_audio(data)
                    continue
                if conn.audio_buffer:
                    await conn.flush_audio_buffer()
                try:
                    await conn.stt.send_audio(data)
                except Exception as e:
                    logger.error(f"send_audio failed: {type(e).__name__}: {e}")
                    if not awaiting:
                        conn.buffer_audio(data)
                continue
            if "text" in message and message["text"] is not None:
                try:
                    msg = json.loads(message["text"])
                except (json.JSONDecodeError, TypeError):
                    continue
                if isinstance(msg, dict):
                    try:
                        await _handle_control(conn, msg)
                    except Exception as e:
                        logger.error(f"control message failed: {type(e).__name__}: {e}")
                        await conn.send_json({"type": "error", "stage": "control", "message": str(e)})
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"pipeline connection error: {type(e).__name__}: {e}")
        try:
            if ws.client_state is WebSocketState.CONNECTED:
                await ws.send_json({"type": "error", "stage": "pipeline", "message": f"Connection error: {type(e).__name__}"})
                await ws.close(code=1011)
        except Exception:
            pass
    finally:
        db.close()
        if conn is not None:
            conn.stopping = True
            room_map = _rooms.get(conn.room_code, {})
            if room_map.get(conn.participant_id) is conn:
                del room_map[conn.participant_id]
                if not room_map:
                    _rooms.pop(conn.room_code, None)
            for task in (conn.event_task, conn.tts_task, conn.watchdog_task):
                if task is not None:
                    task.cancel()
            for task in (conn.event_task, conn.tts_task, conn.watchdog_task):
                if task is not None:
                    try:
                        await task
                    except (asyncio.CancelledError, Exception):
                        pass
            await conn.stop_stt()
            await _broadcast_roster(conn.room_code)
