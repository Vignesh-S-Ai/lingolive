"""Voice Activity Detection for the real-time translator."""

import asyncio
import logging
from typing import Optional, AsyncIterator
from collections import deque

logger = logging.getLogger(__name__)


class VoiceActivityDetector:
    """Voice Activity Detection using energy-based detection.
    
    Detects speech vs silence in audio frames to determine when
    a speaker is actively talking.
    """
    
    def __init__(
        self,
        sample_rate: int = 16000,
        frame_duration_ms: int = 30,
        silence_threshold: float = 0.01,
        speech_threshold: float = 0.1,
        silence_duration_ms: int = 500,
    ):
        """Initialize VAD.
        
        Args:
            sample_rate: Audio sample rate in Hz
            frame_duration_ms: Duration of each audio frame in ms
            silence_threshold: Energy threshold for silence detection
            speech_threshold: Energy threshold for speech detection
            silence_duration_ms: Duration of continuous silence to end a speech segment
        """
        self.sample_rate = sample_rate
        self.frame_duration_ms = frame_duration_ms
        self.silence_threshold = silence_threshold
        self.speech_threshold = speech_threshold
        self.silence_duration_ms = silence_duration_ms
        
        self.frame_size = int(sample_rate * frame_duration_ms / 1000)
        self.silence_frames_required = int(silence_duration_ms / frame_duration_ms)
        
        self.silence_counter = 0
        self.speech_detected = False
        self.is_speaking = False
    
    def update(self, audio_frame: bytes) -> bool:
        """Update VAD with a new audio frame and return True if speech detected.
        
        Args:
            audio_frame: Raw PCM audio bytes
            
        Returns:
            True if speech is currently detected
        """
        if not audio_frame:
            return self.speech_detected
        
        # Calculate frame energy
        frame_energy = self._calculate_energy(audio_frame)
        
        if frame_energy > self.speech_threshold:
            self.silence_counter = 0
            self.speech_detected = True
            self.is_speaking = True
        elif frame_energy > self.silence_threshold:
            self.silence_counter += 1
            if self.silence_counter >= self.silence_frames_required and self.is_speaking:
                self.is_speaking = False
                self.speech_detected = False
        else:
            self.silence_counter += 1
            if self.silence_counter >= self.silence_frames_required:
                self.speech_detected = False
                self.is_speaking = False
        
        return self.speech_detected
    
    def _calculate_energy(self, audio_frame: bytes) -> float:
        """Calculate the energy of an audio frame."""
        if not audio_frame:
            return 0.0
        
        # Convert to numpy if available, otherwise use basic calculation
        try:
            import numpy as np
            samples = np.frombuffer(audio_frame, dtype=np.int16)
            energy = np.mean(samples ** 2)
            return float(energy)
        except ImportError:
            # Fallback: simple energy calculation
            abs_values = [abs(b) for b in audio_frame if b]
            if not abs_values:
                return 0.0
            return sum(abs_values) / len(abs_values)
    
    def reset(self):
        """Reset VAD state."""
        self.silence_counter = 0
        self.speech_detected = False
        self.is_speaking = False