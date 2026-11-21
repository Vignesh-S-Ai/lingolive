"""Gnani Prisma Streaming STT service."""

import asyncio
import inspect
import logging
from typing import AsyncIterator, Optional, Callable, Any
from datetime import datetime

from livekit import rtc
from livekit.plugins.gnani import STT as GnaniSTT

from app.core.config import settings

logger = logging.getLogger(__name__)


class GnaniPrismaSTT:
    """Gnani Prisma v3.0 streaming STT integration.

    Uses the livekit-plugins-gnani WebSocket streaming API: audio frames are
    pushed into a RecognizeStream and transcript events are surfaced through
    callbacks.
    """

    def __init__(
        self,
        api_key: str = None,
        language_code: str = "indic-auto",
        sample_rate: int = 16000,
    ):
        """Initialize Gnani Prisma STT.

        Args:
            api_key: Gnani API key (falls back to settings.GNANI_API_KEY)
            language_code: Language code or 'indic-auto' for auto-detection
            sample_rate: Audio sample rate (8000 or 16000)
        """
        self.api_key = api_key or settings.GNANI_API_KEY
        self.language_code = language_code
        self.sample_rate = sample_rate

        if not self.api_key:
            raise ValueError("Gnani API key is required for STT")

        # Initialize the Gnani STT plugin (plugin kwarg is `language`).
        self.stt = GnaniSTT(
            api_key=self.api_key,
            language=self.language_code,
            sample_rate=self.sample_rate,
        )

        self.is_listening = False
        self._stream: Any = None
        self._reader_task: Optional[asyncio.Task] = None
        self.message_callback: Optional[Callable[[str, str], None]] = None
        self.partial_transcript_callback: Optional[Callable[[str, bool], Any]] = None

    def on_transcript(self, callback: Callable[[str, bool], Any]):
        """Set callback for transcript segments.

        Args:
            callback: Function that receives (text, is_final)
        """
        self.partial_transcript_callback = callback

    def on_message(self, callback: Callable[[str, str], None]):
        """Set callback for messages/events.

        Args:
            callback: Function that receives (event_type, data)
        """
        self.message_callback = callback

    async def _read_events(self):
        """Consume SpeechEvents from the stream and fire callbacks."""
        try:
            async for ev in self._stream:
                if not ev.alternatives:
                    continue
                text = ev.alternatives[0].text
                is_final = "FINAL" in str(getattr(ev.type, "name", ev.type))
                if self.partial_transcript_callback:
                    res = self.partial_transcript_callback(text, is_final)
                    if inspect.isawaitable(res):
                        await res
                if self.message_callback:
                    self.message_callback("transcript", text)
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.error(f"Gnani STT stream error: {type(e).__name__}: {e}")
        finally:
            # The remote stream ended (server timeout, network, or stop()).
            # Flag it so callers can transparently restart.
            self.is_listening = False

    async def start(self):
        """Start the STT session (opens the Gnani WebSocket stream)."""
        if self.is_listening:
            logger.warning("STT already listening")
            return

        try:
            self._stream = self.stt.stream(language=self.language_code)
            self._reader_task = asyncio.create_task(
                self._read_events(), name="gnani-stt-reader"
            )
            self.is_listening = True
            logger.info(
                f"Gnani Prisma STT started with language={self.language_code}"
            )
        except Exception as e:
            logger.error(f"Failed to start Gnani STT: {type(e).__name__}: {e}")
            raise

    async def stop(self):
        """Stop the STT session."""
        if not self.is_listening:
            return
        self.is_listening = False
        try:
            if self._stream is not None:
                self._stream.end_input()
                await self._stream.aclose()
                self._stream = None
            if self._reader_task is not None:
                self._reader_task.cancel()
                try:
                    await self._reader_task
                except (asyncio.CancelledError, Exception):
                    pass
                self._reader_task = None
            logger.info("Gnani Prisma STT stopped")
        except Exception as e:
            logger.error(f"Error stopping Gnani STT: {type(e).__name__}: {e}")

    async def send_audio(self, pcm_data: bytes):
        """Send audio PCM data to Gnani STT.

        Args:
            pcm_data: Raw PCM audio bytes (16-bit little-endian, mono)
        """
        if not self.is_listening or self._stream is None:
            logger.warning("STT not listening, cannot send audio")
            return

        if len(pcm_data) % 2 != 0:
            logger.error(
                "PCM data length must be a multiple of 2 bytes (16-bit samples)"
            )
            return

        try:
            frame = rtc.AudioFrame(
                data=pcm_data,
                sample_rate=self.sample_rate,
                samples_per_channel=len(pcm_data) // 2,
                num_channels=1,
            )
            self._stream.push_frame(frame)
        except Exception as e:
            logger.error(f"Error sending audio to STT: {type(e).__name__}: {e}")

    async def listen(
        self,
        audio_chunks: AsyncIterator[bytes],
    ) -> AsyncIterator[tuple[str, bool]]:
        """Listen to STT transcript stream.

        Args:
            audio_chunks: Async iterator of PCM audio chunks

        Yields:
            Tuple of (transcript_text, is_final)
        """
        async for chunk in audio_chunks:
            await self.send_audio(chunk)

    def set_language(self, language_code: str):
        """Set or change the language code dynamically."""
        self.language_code = language_code
        try:
            # Reconnect with new language if possible
            pass
        except Exception as e:
            logger.error(f"Error changing language: {e}")
