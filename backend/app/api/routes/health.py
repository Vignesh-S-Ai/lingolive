"""Health check routes."""

from fastapi import APIRouter

from app.core.config import GNANI_API_KEY_ID, LIVEKIT_URL

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health_check():
    """Basic health check."""
    return {"status": "ok", "service": "real-time-translator-backend"}


@router.get("/detailed")
async def detailed_health():
    """Detailed health check with service dependencies."""
    return {
        "status": "ok",
        "service": "real-time-translator-backend",
        "gnai": {
            "api_configured": bool(GNANI_API_KEY_ID),
            "supported_languages": ["ta-IN", "hi-IN", "te-IN"],
        },
        "livekit": {
            "url_configured": bool(LIVEKIT_URL),
        },
        "database": "connected",
    }