"""API routes package initialisation."""

from fastapi import APIRouter

from .health import router as health_router
from .participants import router as participants_router
from .rooms import router as rooms_router
from .translator import router as translator_router
from .pipeline import router as pipeline_router

router = APIRouter()
router.include_router(health_router)
router.include_router(rooms_router)
router.include_router(participants_router)
router.include_router(translator_router)
router.include_router(pipeline_router)
