"""Application configuration settings."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load environment variables from .env.txt file
load_dotenv(dotenv_path=str(BASE_DIR / ".env.txt"))

# Gnani AI Configuration
GNANI_API_KEY = os.getenv("GNANI_API_KEY", "")
GNANI_API_KEY_ID = os.getenv("GNANI_API_KEY_ID", "")
GNANI_BASE_URL = os.getenv("GNANI_BASE_URL", "https://api.vachana.ai")

# LiveKit Configuration
LIVEKIT_URL = os.getenv("LIVEKIT_URL", "wss://your-livekit-region.livekit.io")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "")

# Application Settings
APP_NAME = os.getenv("APP_NAME", "real-time-translator")
DEBUG = os.getenv("DEBUG", "True").lower() == "true"
PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "0.0.0.0")

# Database Configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{BASE_DIR}/database/app.db",
)

# CORS Origins (comma-separated from env)
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:3000,http://localhost:3001,http://localhost:5173"
    ).split(",")
    if origin.strip()
]

# Participant Settings
MAX_PARTICIPANTS = int(os.getenv("MAX_PARTICIPANTS", "50"))
DEFAULT_OUTPUT_LANGUAGE = os.getenv(
    "DEFAULT_OUTPUT_LANGUAGE", "en-IN"
)

# Audio Settings
SAMPLE_RATE = int(os.getenv("SAMPLE_RATE", "16000"))
CHANNELS = int(os.getenv("CHANNELS", "1"))
ENCODING = os.getenv("ENCODING", "pcm_s16le")

# Performance Settings
STT_CHUNK_DURATION_MS = int(os.getenv("STT_CHUNK_DURATION_MS", "1000"))
TTS_CHUNK_DURATION_MS = int(os.getenv("TTS_CHUNK_DURATION_MS", "500"))
VAD_SENSITIVITY = float(os.getenv("VAD_SENSITIVITY", "0.5"))


class Settings:
    """Module-level settings object exposing the configuration above.

    The application imports ``settings`` from this module and accesses the
    configuration as attributes (e.g. ``settings.CORS_ORIGINS``). All values
    come from the same environment variables as the module-level constants.
    """

    def __init__(self) -> None:
        # Gnani AI
        self.GNANI_API_KEY = GNANI_API_KEY
        self.GNANI_API_KEY_ID = GNANI_API_KEY_ID
        self.GNANI_BASE_URL = GNANI_BASE_URL
        # LiveKit
        self.LIVEKIT_URL = LIVEKIT_URL
        self.LIVEKIT_API_KEY = LIVEKIT_API_KEY
        self.LIVEKIT_API_SECRET = LIVEKIT_API_SECRET
        # Application
        self.APP_NAME = APP_NAME
        self.DEBUG = DEBUG
        self.PORT = PORT
        self.HOST = HOST
        # Database
        self.DATABASE_URL = DATABASE_URL
        # CORS
        self.CORS_ORIGINS = CORS_ORIGINS
        # Participants
        self.MAX_PARTICIPANTS = MAX_PARTICIPANTS
        self.DEFAULT_OUTPUT_LANGUAGE = DEFAULT_OUTPUT_LANGUAGE
        # Audio
        self.SAMPLE_RATE = SAMPLE_RATE
        self.CHANNELS = CHANNELS
        self.ENCODING = ENCODING
        # Performance
        self.STT_CHUNK_DURATION_MS = STT_CHUNK_DURATION_MS
        self.TTS_CHUNK_DURATION_MS = TTS_CHUNK_DURATION_MS
        self.VAD_SENSITIVITY = VAD_SENSITIVITY


# The settings instance the application expects (app.main imports this name).
settings = Settings()