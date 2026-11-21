"""Transcript segment model for STT output."""

from __future__ import annotations

from datetime import datetime
import uuid

from sqlalchemy import (
    UUID,
    String,
    DateTime,
    Text,
    Boolean,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from ..db.models import Base  # noqa: F401


class TranscriptSegment(Base):
    """ transcript segment model for STT output."""
    __tablename__ = "transcript_segments"

    id: Mapped[UUID] = mapped_column(
        UUID(primary_key=True), default=uuid.uuid4, nullable=False
    )
    conversation_id: Mapped[UUID] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False
    )
    participant_id: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    language_code: Mapped[str] = mapped_column(
        String(10), nullable=False
    )
    is_final: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    # Relationships
    conversation: Mapped["Conversation"] = relationship(
        back_pop="transcript_segments", cascade_save_default=True
    )

    __table_args__ = (
        Index("ix_transcript_segments_conv_id", "conversation_id"),
        Index("ix_transcript_segments_final", "is_final"),
        Index("ix_transcript_segments_lang", "language_code"),
    )
"""SQLAlchemy 2.0 model for TranscriptSegment entity."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import UUID, DateTime, String, Text, Boolean
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..session import Base


class TranscriptSegment(AsyncAttrs, Base):
    __tablename__ = "transcript_segments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False
    )
    participant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("participants.id", ondelete="SET NULL"), nullable=True
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    language_code: Mapped[str] = mapped_column(String(10), nullable=False)
    is_final: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    conversation: Mapped["Conversation"] = relationship(back_populates="transcript_segments")
    participant: Mapped["Participant"] = relationship(back_populates="transcript_segments")