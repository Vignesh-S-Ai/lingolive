"""Audio buffer for streaming STT and TTS operations."""

import asyncio
import logging
import threading
from typing import AsyncIterator, Optional, Deque, Any
from collections import deque

logger = logging.getLogger(__name__)


class AudioBuffer:
    """Circular buffer for audio streaming operations.
    
    Manages audio frame buffering for:
    - STT input buffering
    - TTS output buffering
    - Audio interruption handling
    """
    
    def __init__(
        self,
        sample_rate: int = 16000,
        channel_count: int = 1,
        frame_size: int = 512,
        buffer_duration_ms: int = 300,
    ):
        """Initialize audio buffer.
        
        Args:
            sample_rate: Audio sample rate in Hz
            channel_count: Number of audio channels
            frame_size: Number of samples per frame
            buffer_duration_ms: Buffer duration in milliseconds
        """
        self.sample_rate = sample_rate
        self.channel_count = channel_count
        self.frame_size = frame_size
        self.buffer_duration_ms = buffer_duration_ms
        
        # Calculate buffer size
        frames_per_buffer = buffer_duration_ms * sample_rate / 1000 / frame_size
        self.max_frames = int(frames_per_buffer) + 2
        
        # Buffer storage
        self._buffer: Deque[bytes] = deque(maxlen=self.max_frames)
        self._lock = asyncio.Lock()
        self._stop_event = asyncio.Event()
    
    async def put(self, audio_data: bytes):
        """Put audio data into the buffer.
        
        Args:
            audio_data: Raw PCM audio bytes
        """
        async with self._lock:
            if not self._stop_event.is_set():
                self._buffer.append(audio_data)
    
    async def get(self) -> Optional[bytes]:
        """Get audio data from the buffer.
        
        Returns:
            Raw PCM audio bytes or None if buffer is empty
        """
        async with self._lock:
            if self._buffer:
                return self._buffer.popleft()
            return None
    
    async def get_all(self) -> list[bytes]:
        """Get all buffered audio data.
        
        Returns:
            List of raw PCM audio bytes
        """
        async with self._lock:
            result = list(self._buffer)
            self._buffer.clear()
            return result
    
    def size(self) -> int:
        """Get the current buffer size."""
        return len(self._buffer)
    
    async def clear(self):
        """Clear the buffer."""
        async with self._lock:
            self._buffer.clear()
    
    async def wait_until_speech(
        self,
        timeout_ms: int = 5000,
    ) -> Optional[bytes]:
        """Wait for speech to start in the buffer.
        
        Args:
            timeout_ms: Maximum wait time in milliseconds
            
        Returns:
            Buffered audio data when speech starts, or None on timeout
        """
        start_time = asyncio.get_event_loop().time()
        
        while not self._stop_event.is_set():
            elapsed = (asyncio.get_event_loop().time() - start_time) * 1000
            if elapsed > timeout_ms:
                return None
            
            if self._buffer:
                return await self.get()
            
            await asyncio.sleep(0.01)
        
        return None
    
    async def stop(self):
        """Stop the buffer and clear all data."""
        self._stop_event.set()
        await self.clear()