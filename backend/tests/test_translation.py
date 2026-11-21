"""Test file for translation pipeline mock mode."""

from __future__ import annotations

import time

from app.services.translation.provider_factory import (
    TranslationProviderFactory,
    TranslationEngine,
)
class TranslationResponse:
    """Response model for translation requests containing translated text and processing time."""

    def __init__(self, translated_text: str, processing_time: float) -> None:
        self.translated_text = translated_text
        self.processing_time = processing_time

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, TranslationResponse):
            return NotImplemented
        return (
            self.translated_text == other.translated_text
            and abs(self.processing_time - other.processing_time) < 0.001
        )

    def __repr__(self) -> str:
        return f"TranslationResponse(translated_text={self.translated_text!r}, processing_time={self.processing_time:.3f})"

def test_mock_mode_initialization():
    """Test that the factory can be initialized in mock mode."""
def test_mock_translation_ta_hi():
    """Test Tamil to Hindi translation in mock mode."""
def test_mock_translation_hi_ta():
    """Test Hindi to Tamil translation in mock mode."""
    factory = TranslationProviderFactory(engine=TranslationEngine.MOCK)
def test_mock_translation_hi_te():
    """Test Hindi to Telugu translation in mock mode."""
    factory = TranslationProviderFactory(engine=TranslationEngine.MOCK)
def test_mock_translation_hi_english():
    """Test Hindi to English translation in mock mode."""
    factory = TranslationProviderFactory(engine=TranslationEngine.MOCK)
def test_explicit_mock_engine():
    """Test that the engine can be explicitly set to MOCK."""
    factory = TranslationProviderFactory(engine="mock")
    provider = factory.get_provider()
    assert provider.__class__.__name__ == "MockTranslationProvider"


def test_engine_name_parameter():
    """Test that providing an engine name works."""
    factory = TranslationProviderFactory(engine=TranslationEngine.MOCK)
    provider = factory.get_provider()
    assert provider.__class__.__name__ == "MockTranslationProvider"


def test_mock_provider_returns_mock_text():
    """Test that the mock provider returns the expected mock text format."""
    factory = TranslationProviderFactory(engine=TranslationEngine.MOCK)
    provider = factory.get_provider()

    # Test various language pairs with mock provider
    test_cases = [
        ("ta", "hi", "வணக்கம்"),
        ("hi", "ta", "नमस्ते"),
        ("ta", "te", "வணக்கம்"),
        ("te", "ta", "వ福岡ান్న"),
        ("hi", "te", "नमस्ते"),
        ("en", "hi", "Hello"),
    ]

    for source_lang, target_lang, source_text in test_cases:
        result = provider.translate(
            text=source_text, source_language=source_lang, target_language=target_lang
        )
        assert "[Mock] translated text" in result, (
            f"Expected '[Mock] translated text' for {source_lang}->{target_lang}, got: {result}"
        )
    provider = factory.get_provider()

    start_time = time.time()
    result = provider.translate(
        text="नमस्ते", source_language="hi", target_language="en"
    )
    processing_time = time.time() - start_time

    assert "[Mock] translated text" in result
    response = TranslationResponse(translated_text=result, processing_time=processing_time)
    assert response.translated_text == result


def test_mock_translation_english_ta():
    """Test English to Tamil translation in mock mode."""
    factory = TranslationProviderFactory(engine=TranslationEngine.MOCK)
    provider = factory.get_provider()

    start_time = time.time()
    result = provider.translate(
        text="Hello", source_language="en", target_language="ta"
    )
    processing_time = time.time() - start_time

    assert "[Mock] translated text" in result
    response = TranslationResponse(translated_text=result, processing_time=processing_time)
    assert response.translated_text == result


def test_mock_translation_english_te():
    """Test English to Telugu translation in mock mode."""
    factory = TranslationProviderFactory(engine=TranslationEngine.MOCK)
    provider = factory.get_provider()

    start_time = time.time()
    result = provider.translate(
        text="Hello", source_language="en", target_language="te"
    )
    processing_time = time.time() - start_time

    assert "[Mock] translated text" in result
    response = TranslationResponse(translated_text=result, processing_time=processing_time)
    assert response.translated_text == result


def test_mock_translation_te_english():
    """Test Telugu to English translation in mock mode."""
    factory = TranslationProviderFactory(engine=TranslationEngine.MOCK)
    provider = factory.get_provider()

    start_time = time.time()
    result = provider.translate(
        text="హలో", source_language="te", target_language="en"
    )
    processing_time = time.time() - start_time

    assert "[Mock] translated text" in result
    response = TranslationResponse(translated_text=result, processing_time=processing_time)
    assert response.translated_text == result
    provider = factory.get_provider()

    start_time = time.time()
    result = provider.translate(
        text="नमस्ते", source_language="hi", target_language="te"
    )
    processing_time = time.time() - start_time

    assert "[Mock] translated text" in result
    response = TranslationResponse(translated_text=result, processing_time=processing_time)
    assert response.translated_text == result


def test_mock_translation_te_hi():
    """Test Telugu to Hindi translation in mock mode."""
    factory = TranslationProviderFactory(engine=TranslationEngine.MOCK)
    provider = factory.get_provider()

    start_time = time.time()
    result = provider.translate(
        text="వ福岡ान्न", source_language="te", target_language="hi"
    )
    processing_time = time.time() - start_time

    assert "[Mock] translated text" in result
    response = TranslationResponse(translated_text=result, processing_time=processing_time)
    assert response.translated_text == result


def test_mock_translation_english_hi():
    """Test English to Hindi translation in mock mode."""
    factory = TranslationProviderFactory(engine=TranslationEngine.MOCK)
    provider = factory.get_provider()

    start_time = time.time()
    result = provider.translate(
        text="Hello", source_language="en", target_language="hi"
    )
    processing_time = time.time() - start_time

    assert "[Mock] translated text" in result
    response = TranslationResponse(translated_text=result, processing_time=processing_time)
    assert response.translated_text == result
    provider = factory.get_provider()

    start_time = time.time()
    result = provider.translate(
        text="नमस्ते", source_language="hi", target_language="ta"
    )
    processing_time = time.time() - start_time

    assert "[Mock] translated text" in result
    response = TranslationResponse(translated_text=result, processing_time=processing_time)
    assert response.translated_text == result


def test_mock_translation_ta_te():
    """Test Tamil to Telugu translation in mock mode."""
    factory = TranslationProviderFactory(engine=TranslationEngine.MOCK)
    provider = factory.get_provider()

    start_time = time.time()
    result = provider.translate(
        text="வணக்கம்", source_language="ta", target_language="te"
    )
    processing_time = time.time() - start_time

    assert "[Mock] translated text" in result
    response = TranslationResponse(translated_text=result, processing_time=processing_time)
    assert response.translated_text == result


def test_mock_translation_te_ta():
    """Test Telugu to Tamil translation in mock mode."""
    factory = TranslationProviderFactory(engine=TranslationEngine.MOCK)
    provider = factory.get_provider()

    start_time = time.time()
    result = provider.translate(
        text="వ福岡ान्न", source_language="te", target_language="ta"
    )
    processing_time = time.time() - start_time

    assert "[Mock] translated text" in result
    response = TranslationResponse(translated_text=result, processing_time=processing_time)
    assert response.translated_text == result
    factory = TranslationProviderFactory(engine=TranslationEngine.MOCK)
    provider = factory.get_provider()

    start_time = time.time()
    result = provider.translate(
        text="வணக்கம்", source_language="ta", target_language="hi"
    )
    processing_time = time.time() - start_time

    assert "[Mock] translated text" in result
    # Verify TranslationResponse format
    response = TranslationResponse(translated_text=result, processing_time=processing_time)
    assert response.translated_text == result
    assert response.processing_time == processing_time
    factory = TranslationProviderFactory(engine=TranslationEngine.MOCK)
    provider = factory.get_provider()
    assert provider is not None
    assert provider.__class__.__name__ == "MockTranslationProvider"