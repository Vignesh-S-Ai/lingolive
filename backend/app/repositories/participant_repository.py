"""Participant repository for the real-time multilingual translator."""

import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db.models import Participant, Room
from .room_repository import get_room


def _as_uuid(value) -> Optional[uuid.UUID]:
    """Parse a participant id string into a UUID, or None if invalid."""
    try:
        return uuid.UUID(str(value))
    except (ValueError, AttributeError, TypeError):
        return None


def create_participant(
    db: Session,
    room_code: str,
    name: str,
    input_language: str,
    output_language: str,
) -> Participant:
    """Create a new participant in a room (creating the room if needed)."""
    room = get_room(db, room_code)
    if not room:
        room = Room(code=room_code, name=room_code)
        db.add(room)
        db.commit()
        db.refresh(room)

    participant = Participant(
        room_id=room.id,
        participant_id=name,  # Using name as identity for now
        name=name,
        input_language=input_language,
        output_language=output_language,
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


def get_participant(
    db: Session, participant_id: str
) -> Optional[Participant]:
    """Get a participant by ID."""
    pid = _as_uuid(participant_id)
    if pid is None:
        return None
    result = db.execute(select(Participant).where(Participant.id == pid))
    return result.scalar_one_or_none()


def get_participant_by_identity(
    db: Session, identity: str, room_code: str
) -> Optional[Participant]:
    """Get a participant by identity and room code."""
    room = get_room(db, room_code)
    if not room:
        return None
    result = db.execute(
        select(Participant).where(
            Participant.participant_id == identity,
            Participant.room_id == room.id,
        )
    )
    return result.scalars().first()


def list_participants(db: Session, room_code: str) -> List[Participant]:
    """List all participants in a room."""
    room = get_room(db, room_code)
    if not room:
        return []

    result = db.execute(select(Participant).where(Participant.room_id == room.id))
    return result.scalars().all()


def update_participant_language(
    db: Session,
    participant_id: str,
    input_language: str,
    output_language: str,
) -> Optional[Participant]:
    """Update a participant's input/output language preferences."""
    participant = get_participant(db, participant_id)
    if not participant:
        return None
    participant.input_language = input_language
    participant.output_language = output_language
    db.commit()
    db.refresh(participant)
    return participant
