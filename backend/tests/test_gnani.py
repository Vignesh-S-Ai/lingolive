"""Test script to verify Gnani STT and TTS can be imported and initialized."""

import os
from unittest.mock import patch, MagicMock

# Ensure the parent app package is on the path
if __package__ is None or __package__ == "":
    import sys
    from pathlib import Path
    backend_root = Path(__file__).resolve().parent.parent
    sys.path.insert(0, str(backend_root))

from app.services.gnani.prisma_stt import GnaniPrismaSTT  # noqa: E402, F811
from app.services.gnani.timbre_tts import GnaniTimbreTTS  # noqa: E402, F811


def test_stt_import():
    """Verify STT wrapper can be imported and basic attributes exist."""
    assert GnaniPrismaSTT is not None
    assert isinstance(GnaniPrismaSTT, type)


def test_tts_import():
    """Verify TTS wrapper can be imported."""
    assert GnaniTimbreTTS is not None
    assert isinstance(GnaniTimbreTTS, type)


def test_stt_init_without_network():
    """STT wrapper constructs the plugin without opening any connection."""
    stt = GnaniPrismaSTT(api_key="test-key", language_code="hi-IN")
    assert stt.is_listening is False
    assert stt.language_code == "hi-IN"
    assert stt.stt is not None


def test_tts_init_without_network():
    """TTS wrapper constructs the plugin without opening any connection."""
    tts = GnaniTimbreTTS(api_key="test-key", voice="Nalini",
                         language_code="hi-IN", model="timbre-v2.5")
    assert tts.is_speaking is False
    assert tts.voice == "Nalini"
    assert tts.tts is not None


if __name__ == "__main__":
    test_stt_import()
    test_tts_import()
    test_stt_init_without_network()
    test_tts_init_without_network()
    print("All Gnani import tests passed - modules load without network.")
