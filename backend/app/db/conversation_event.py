"""Conversation event model for tracking."""

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


class ConversationEvent(Base):
    """Conversation event model for tracking."""
    __tablename__ = "conversation_events"

    id: Mapped[UUID] = mapped_column(
        UUID(primary_key=True), default=uuid.uuid4, nullable=False
    )
    room_id: Mapped[UUID] = mapped_column(
        ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False
    )
    participant_id: Mapped[str] = mapped_column(
        String(100), nullable=True
    )
    event_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )
    event_data: Mapped[str] = mapped_column(
        Text, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    # Relationships
    room: Mapped["Room"] = relationship(back_pop="conversation_events")

    __table_args__ = (
        Index("ix_conversation_events_room_id", "room_id"),
        Index("ix_conversation_events_type", "event_type"),
        Index("ix_conversation_events_created", "created_at"),
    )
"""SQLAlchemy 2.0 model for ConversationEvent entity."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import UUID, DateTime, String, JSON
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..session import Base


class ConversationEvent(AsyncAttrs, Base):
    __tablename__ = "conversation_events"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    room_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False
    )
    participant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("participants.id", ondelete="SET NULL"), nullable=True
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    data: Mapped[dict] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    room: Mapped["Room"] = relationship(back_populates="events")
    participant: Mapped["Participant"] = relationship(back_populates="events")