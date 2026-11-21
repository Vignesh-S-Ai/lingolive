"""Translation service interface and providers.

This module is the single source for the names imported by
``provider_factory`` and by the translation route
(``get_translation_provider`` / ``TranslationSegment``).
"""

from __future__ import annotations

import logging
import threading
from collections import OrderedDict
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel

logger = logging.getLogger(__name__)


class TranslationEngine(str, Enum):
    """Selectable translation engines."""

    GNANI = "gnani"
    GOOGLE = "google"
    OPENSOURCE = "opensource"
    MOCK = "mock"


class TranslationSegment(BaseModel):
    """A single original/translated text pair."""

    id: Optional[str] = None
    conversation_id: Optional[str] = None
    original_text: str
    translated_text: str
    source_language: str
    target_language: str
    created_at: Optional[datetime] = None


class _MockResult(str):
    """Mock output that behaves like ``str`` but can also be awaited.

    The mock provider is synchronous (used directly by the test-suite)
    while the translation route awaits the provider's result.
    """

    def __await__(self):
        async def _identity():
            return str(self)

        return _identity().__await__()


class TranslationProvider:
    """Base class for translation providers."""

    async def translate(
        self,
        text: str,
        source_language: str,
        target_language: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        raise NotImplementedError


class MockTranslationProvider(TranslationProvider):
    """Development mock provider — output is explicitly labelled as mock."""

    def translate(
        self,
        text: str,
        source_language: str,
        target_language: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> _MockResult:
        return _MockResult(
            f"[Mock] translated text ({source_language}->{target_language}): {text}"
        )


class GnaniTranslationProvider(TranslationProvider):
    """Gnani AI translation provider.

    The Gnani translation endpoint contract is not part of this backend
    build, so translation requests fail honestly instead of returning
    fabricated output.
    """

    def __init__(self, api_key: str = "", model: str = "default") -> None:
        self.api_key = api_key
        self.model = model

    async def translate(
        self,
        text: str,
        source_language: str,
        target_language: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        raise RuntimeError(
            "Gnani translation is not implemented in this backend build: "
            "no translation endpoint contract is available."
        )


class GoogleCloudTranslationProvider(TranslationProvider):
    """Google Cloud Translation provider (requires google-cloud-translate)."""

    def __init__(self) -> None:
        try:
            from google.cloud import translate_v2  # noqa: F401
        except ImportError as exc:  # pragma: no cover - optional dependency
            raise RuntimeError(
                "google-cloud-translate is not installed"
            ) from exc

    async def translate(
        self,
        text: str,
        source_language: str,
        target_language: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> str:  # pragma: no cover - requires Google credentials
        raise NotImplementedError("Google Cloud translation is not wired up")


class OpenSourceTranslationProvider(TranslationProvider):
    """Genuine open-source NLLB-200 machine translation (transformers).

    Covers English, Hindi, Tamil and Telugu in every direction
    (the six Indic pairs ta/hi/te plus en). Model weights are loaded
    lazily once per process and inference runs off the event loop.
    """

    MODEL_ID = "facebook/nllb-200-distilled-600M"
    _LANG = {
        "en": "eng_Latn",
        "hi": "hin_Deva",
        "ta": "tam_Taml",
        "te": "tel_Telu",
    }

    _model: Any = None
    _tokenizer: Any = None
    _load_error: Optional[str] = None
    _lock = threading.Lock()
    # Cap concurrent generates: torch's intra-op threads otherwise multiply
    # across parallel room requests and thrash the CPU.
    _infer_lock = threading.Semaphore(2)
    _cache_lock = threading.Lock()
    _cache: "OrderedDict[tuple[str, str, str], str]" = OrderedDict()
    _CACHE_MAX = 512

    def __init__(self, model_name: Optional[str] = None) -> None:
        self.model_name = model_name or self.MODEL_ID

    @classmethod
    def _ensure_loaded(cls) -> None:
        with cls._lock:
            if cls._model is not None or cls._load_error is not None:
                return
            try:
                import torch
                from transformers import (
                    AutoModelForSeq2SeqLM,
                    AutoTokenizer,
                )

                logger.info(f"Loading translation model {cls.MODEL_ID} ...")
                cls._tokenizer = AutoTokenizer.from_pretrained(cls.MODEL_ID)
                cls._model = AutoModelForSeq2SeqLM.from_pretrained(
                    cls.MODEL_ID,
                    torch_dtype=torch.float16,
                    low_cpu_mem_usage=True,
                )
                logger.info("Translation model loaded")
            except Exception as e:  # pragma: no cover - network/disk dependent
                cls._load_error = f"{type(e).__name__}: {e}"
                logger.error(f"Failed to load translation model: {cls._load_error}")

    @classmethod
    def _norm(cls, code: str) -> str:
        return (code or "").lower().replace("_", "-").split("-")[0]

    def _translate_sync(self, text: str, src: str, tgt: str) -> str:
        s, t = self._norm(src), self._norm(tgt)
        if s == t:
            return text
        if s not in self._LANG or t not in self._LANG:
            supported = ", ".join(sorted(self._LANG))
            raise RuntimeError(
                f"Unsupported translation pair {src}->{t}; "
                f"supported languages: {supported}"
            )
        key = (text, s, t)
        with self._cache_lock:
            hit = self._cache.get(key)
            if hit is not None:
                self._cache.move_to_end(key)
                return hit
        self._ensure_loaded()
        if self._load_error:
            raise RuntimeError(
                f"Translation model unavailable: {self._load_error}"
            )
        import torch

        enc = self._tokenizer(text, return_tensors="pt", src_lang=self._LANG[s])
        bos = self._tokenizer.convert_tokens_to_ids(self._LANG[t])
        # Speech segments are short — cap the decode budget accordingly.
        max_new = min(128, max(32, len(text)))
        with self._infer_lock:
            with torch.inference_mode():
                out = self._model.generate(
                    **enc, forced_bos_token_id=bos, max_new_tokens=max_new
                )
        result = self._tokenizer.batch_decode(out, skip_special_tokens=True)[0]
        with self._cache_lock:
            self._cache[key] = result
            self._cache.move_to_end(key)
            while len(self._cache) > self._CACHE_MAX:
                self._cache.popitem(last=False)
        return result

    async def translate(
        self,
        text: str,
        source_language: str,
        target_language: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        import asyncio

        return await asyncio.to_thread(
            self._translate_sync, text, source_language, target_language
        )

def get_translation_provider() -> TranslationProvider:
    """Return the provider selected by the shared factory.

    The factory is imported lazily so that ``provider_factory`` can import
    this module at load time without a circular import.
    """
    from .provider_factory import TranslationProviderFactory

    return TranslationProviderFactory().get_provider()
