"""Gnani Timbre Streaming TTS service."""

import logging
from typing import AsyncIterator, Optional, Callable, Any

from livekit.plugins.gnani import TTS as GnaniTTS
from pydantic import BaseModel

from app.core.config import settings

logger = logging.getLogger(__name__)


class GnaniTimbreTTS:
    """Gnani Timbre v2.5 streaming TTS integration.

    Uses the livekit-plugins-gnani SSE/REST synthesis API to convert text
    into streamed speech audio.
    """

    class AudioConfig(BaseModel):
        """TTS audio configuration."""
        encoding: str = "linear_pcm"
        container: str = "wav"
        sample_rate: int = 48000
        sample_width: int = 2  # 16-bit = 2 bytes
        num_channels: int = 1

    def __init__(
        self,
        api_key: str = None,
        voice: str = "Nalini",
        language_code: str = "hi-IN",
        model: str = "timbre-v2.5",
        audio_config: AudioConfig = None,
    ):
        """Initialize Gnani Timbre TTS.

        Args:
            api_key: Gnani API key (falls back to settings.GNANI_API_KEY)
            voice: Voice name (e.g., 'Nalini' for Hindi, 'Asmita' for Tamil)
            language_code: Target language BCP-47 code (timbre-v2.5 only)
            model: TTS model version
            audio_config: Audio output configuration
        """
        self.api_key = api_key or settings.GNANI_API_KEY
        self.voice = voice
        self.language_code = language_code
        self.model = model
        self.audio_config = audio_config or self.AudioConfig()

        if not self.api_key:
            raise ValueError("Gnani API key is required for TTS")

        # Initialize the Gnani TTS plugin (matches plugin kwarg names).
        self.tts = GnaniTTS(
            api_key=self.api_key,
            voice=self.voice,
            language=self.language_code,
            model=self.model,
        )

        self.is_speaking = False
        self.audio_chunks: list[bytes] = []
        self.audio_bytes: int = 0
        self.text_callback: Optional[Callable[[str], None]] = None

    def on_text(self, callback: Callable[[str], None]):
        """Set callback for generated text.

        Args:
            callback: Function that receives generated text
        """
        self.text_callback = callback

    async def start(self):
        """Prepare the TTS session (plugin synthesis is per-call)."""
        if self.is_speaking:
            logger.warning("TTS already speaking")
            return

        self.is_speaking = True
        self.audio_chunks = []
        self.audio_bytes = 0
        logger.info(
            f"Gnani Timbre TTS ready: voice={self.voice}, "
            f"language={self.language_code}, model={self.model}"
        )

    async def stop(self):
        """Stop the TTS synthesis session."""
        self.is_speaking = False
        logger.info("Gnani Timbre TTS stopped")

    async def synthesize(self, text: str) -> int:
        """Synthesize text to speech (one-shot) and collect audio bytes.

        Args:
            text: Text to synthesize

        Returns:
            Total number of audio bytes produced.
        """
        if not text or not text.strip():
            logger.warning("Empty text provided for TTS synthesis")
            return 0

        from livekit.agents.utils import http_context

        try:
            # Plugin REST calls need the agents HTTP context outside a worker.
            async with http_context.open():
                stream = self.tts.synthesize(text.strip())
                total = 0
                async for chunk in stream:
                    data = bytes(chunk.frame.data)
                    self.audio_chunks.append(data)
                    total += len(data)
                self.audio_bytes += total
            logger.info(
                f"TTS synthesis complete: {total} bytes for "
                f"'{text.strip()[:50]}'"
            )
            return total
        except Exception as e:
            logger.error(f"Error synthesizing TTS: {type(e).__name__}: {e}")
            raise

    async def synthesize_pcm(self, text: str) -> tuple[bytes, int]:
        """Synthesize text and return raw PCM plus its sample rate.

        Args:
            text: Text to synthesize

        Returns:
            Tuple of (pcm_bytes, sample_rate). PCM is 16-bit LE mono.
        """
        if not text or not text.strip():
            return b"", 0

        from livekit.agents.utils import http_context

        async with http_context.open():
            stream = self.tts.synthesize(text.strip())
            parts: list[bytes] = []
            rate = self.tts.sample_rate
            async for chunk in stream:
                frame = chunk.frame
                parts.append(bytes(frame.data))
                rate = getattr(frame, "sample_rate", None) or rate
            self.audio_bytes += sum(len(p) for p in parts)
            return b"".join(parts), rate

    async def synthesize_stream(
        self, text: str
    ) -> AsyncIterator[bytes]:
        """Synthesize text to speech with streaming audio chunks.

        Args:
            text: Text to synthesize

        Yields:
            Audio chunks as bytes
        """
        if not text or not text.strip():
            return

        from livekit.agents.utils import http_context

        try:
            async with http_context.open():
                stream = self.tts.synthesize(text.strip())
                async for chunk in stream:
                    data = bytes(chunk.frame.data)
                    self.audio_chunks.append(data)
                    self.audio_bytes += len(data)
                    yield data
        except Exception as e:
            logger.error(f"Error during TTS streaming: {type(e).__name__}: {e}")

    def set_voice(self, voice: str):
        """Change the TTS voice."""
        self.voice = voice
        try:
            # Reconnect with new voice if possible
            pass
        except Exception as e:
            logger.error(f"Error changing voice: {e}")

    def set_language(self, language_code: str):
        """Change the target language."""
        self.language_code = language_code
        try:
            # Update TTS language
            pass
        except Exception as e:
            logger.error(f"Error changing language: {e}")
