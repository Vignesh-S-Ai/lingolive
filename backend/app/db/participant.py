"""SQLAlchemy 2.0 model for Participant entity."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import UUID, DateTime, String, ForeignKey
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..session import Base


class Participant(AsyncAttrs, Base):
    __tablename__ = "participants"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    room_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False
    )
    participant_id: Mapped[str] = mapped_column(String(128), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    input_language: Mapped[str] = mapped_column(String(10), nullable=False)
    output_language: Mapped[str] = mapped_column(String(10), nullable=False)
    connection_status: Mapped[str] = mapped_column(
        String(20), default="disconnected", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    room: Mapped["Room"] = relationship(back_populates="participants")
    user: Mapped["User"] = relationship(back_populates="participants")
    conversations: Mapped[list["Conversation"]] = relationship(
        back_populates="participant", cascade="all, delete-orphan"
    )
    transcript_segments: Mapped[list["TranscriptSegment"]] = relationship(
        back_populates="participant", cascade="all, delete-orphan"
    )
    translation_segments: Mapped[list["TranslationSegment"]] = relationship(
        back_populates="participant", cascade="all, delete-orphan"
    )
    events: Mapped[list["ConversationEvent"]] = relationship(
        back_populates="participant", cascade="all, delete-orphan"
    )
    language_preference: Mapped["ParticipantLanguagePreference"] = relationship(
        back_populates="participant", uselist=False, cascade="all, delete-orphan"
    )