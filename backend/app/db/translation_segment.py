"""Translation segment model."""

from __future__ import annotations

from datetime import datetime
import uuid

from sqlalchemy import (
    UUID,
    String,
    DateTime,
    Text,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from ..db.models import Base  # noqa: F401


class TranslationSegment(Base):
    """Translation segment model."""
    __tablename__ = "translation_segments"

    id: Mapped[UUID] = mapped_column(
        UUID(primary_key=True), default=uuid.uuid4, nullable=False
    )
    conversation_id: Mapped[UUID] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False
    )
    source_participant_id: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    target_participant_id: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    translated_text: Mapped[str] = mapped_column(Text, nullable=False)
    source_language: Mapped[str] = mapped_column(
        String(10), nullable=False
    )
    target_language: Mapped[str] = mapped_column(
        String(10), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    # Relationships
    conversation: Mapped["Conversation"] = relationship(
        back_pop="translation_segments", cascade_save_default=True
    )

    __table_args__ = (
        Index("ix_translation_segments_conv_id", "conversation_id"),
        Index("ix_translation_segments_source", "source_language"),
        Index("ix_translation_segments_target", "target_language"),
    )
"""SQLAlchemy 2.0 model for TranslationSegment entity."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import UUID, DateTime, String, Text
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..session import Base


class TranslationSegment(AsyncAttrs, Base):
    __tablename__ = "translation_segments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False
    )
    participant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("participants.id", ondelete="SET NULL"), nullable=True
    )
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    translated_text: Mapped[str] = mapped_column(Text, nullable=False)
    source_language: Mapped[str] = mapped_column(String(10), nullable=False)
    target_language: Mapped[str] = mapped_column(String(10), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    conversation: Mapped["Conversation"] = relationship(back_populates="translation_segments")
    participant: Mapped["Participant"] = relationship(back_populates="translation_segments")