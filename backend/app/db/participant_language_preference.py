"""Participant language preference model."""

from __future__ import annotations

from datetime import datetime
import uuid

from sqlalchemy import (
    UUID,
    String,
    DateTime,
    Index,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from ..db.models import Base  # noqa: F401


class ParticipantLanguagePreference(Base):
    """Participant language preference model."""
    __tablename__ = "participant_language_preferences"

    id: Mapped[UUID] = mapped_column(
        UUID(primary_key=True), default=uuid.uuid4, nullable=False
    )
    participant_id: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    input_language: Mapped[str] = mapped_column(
        String(10), nullable=False
    )
    output_language: Mapped[str] = mapped_column(
        String(10), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    __table_args__ = (
        Index("ix_participant_lang_pref_input", "input_language"),
        Index("ix_participant_lang_pref_output", "output_language"),
    )
"""SQLAlchemy 2.0 model for ParticipantLanguagePreference entity."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import UUID, DateTime, String
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..session import Base


class ParticipantLanguagePreference(AsyncAttrs, Base):
    __tablename__ = "participant_language_preferences"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    participant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("participants.id", ondelete="CASCADE"), nullable=False
    )
    input_language: Mapped[str] = mapped_column(String(10), nullable=False)
    output_language: Mapped[str] = mapped_column(String(10), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    participant: Mapped["Participant"] = relationship(back_populates="language_preference")