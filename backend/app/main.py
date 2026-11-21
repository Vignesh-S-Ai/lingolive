"""Main FastAPI application entry point."""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import router as api_router

# Surface app logger info/warning lines (uvicorn only configures its own loggers).
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)


def _warm_translation_model() -> None:
    """Load the NLLB model off the event loop so the first real request is fast."""
    import logging

    log = logging.getLogger("app.warmup")
    try:
        from app.services.translation.translation_service import (
            OpenSourceTranslationProvider,
        )

        provider = OpenSourceTranslationProvider()
        # Synchronous tiny inference: loads weights once (class-level cache).
        provider._translate_sync("hello", "en", "hi")
        log.info("Translation model warm-up complete")
    except Exception as e:  # pragma: no cover - warm-up must never block startup
        log.warning(f"Translation model warm-up skipped: {type(e).__name__}: {e}")


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Create database tables on startup (dev SQLite) and warm the MT model."""
    from app.db import Base, engine

    Base.metadata.create_all(bind=engine)
    warm = asyncio.create_task(asyncio.to_thread(_warm_translation_model))
    yield
    warm.cancel()
    try:
        await warm
    except (asyncio.CancelledError, Exception):
        pass


app = FastAPI(
    title="Real-Time Multilingual Voice Communication Platform",
    description="Backend service for real-time multilingual voice communication with Gnani AI integration",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router, prefix="/v1")  # Also register under /v1


@app.get("/", tags=["health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "Backend service is running"}


@app.get("/health", tags=["health"])
async def health_detailed():
    """Detailed health check."""
    return {
        "status": "ok",
        "service": "real-time-translator-backend",
        "version": "0.1.0",
        "gnani_integration": "pending_config" if not settings.GNANI_API_KEY else "healthy",
        "livekit_integration": "pending_config" if not settings.LIVEKIT_API_KEY else "healthy",
    }