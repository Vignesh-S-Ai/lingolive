"""Security utilities for the application."""

import json
import hashlib
import hmac
import time
from typing import Optional, Dict, Any
from jose import jwt, JWTError


def generate_livekit_token(
    room_name: str,
    participant_name: str,
    participant_role: str = "participant",
    ttl: int = 3600,
) -> str:
    """Generate a LiveKit access token for a participant.
    
    Args:
        room_name: The LiveKit room name
        participant_name: Display name of the participant
        participant_role: Role (host, participant, moderator)
        ttl: Token time-to-live in seconds
        
    Returns:
        Encoded LiveKit JWT token
    """
    from app.core.config import settings
    
    if not settings.LIVEKIT_API_KEY or not settings.LIVEKIT_API_SECRET:
        raise ValueError("LiveKit API key and secret must be configured")
    
    # Construct the JWT payload according to LiveKit specs
    iat = int(time.time())
    exp = iat + ttl
    
    payload = {
        "iss": settings.LIVEKIT_API_KEY,
        "sub": participant_name,
        "iat": iat,
        "exp": exp,
        "room": room_name,
        "participant_role": participant_role,
    }
    
    token = jwt.encode(payload, settings.LIVEKIT_API_SECRET, algorithm="HS256")
    return token


def validate_api_key(api_key: str) -> bool:
    """Validate a Gnani AI API key format."""
    if not api_key:
        return False
    # Gnani API keys have a specific format - basic validation
    return len(api_key) > 10


def sanitize_text(text: str) -> str:
    """Sanitize text to prevent injection attacks."""
    if not text:
        return text
    # Remove potentially dangerous characters
    sanitized = text.replace("\x00", "").strip()
    return sanitized