"""Room repository for the real-time multilingual translator."""

from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db.models import Room


def create_room(db: Session, code: str, name: str) -> Room:
    """Create a new conversation room."""
    room = Room(code=code, name=name)
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


def get_room(db: Session, code: str) -> Optional[Room]:
    """Get a room by code."""
    result = db.execute(select(Room).where(Room.code == code))
    return result.scalar_one_or_none()


def get_rooms(db: Session, skip: int = 0, limit: int = 100) -> List[Room]:
    """List all rooms with pagination."""
    result = db.execute(select(Room).offset(skip).limit(limit))
    return result.scalars().all()


def list_rooms(db: Session, skip: int = 0, limit: int = 100) -> List[Room]:
    """List all rooms (alias kept for compatibility)."""
    return get_rooms(db, skip=skip, limit=limit)


def get_room_by_id(db: Session, room_id) -> Optional[Room]:
    """Get a room by ID."""
    result = db.execute(select(Room).where(Room.id == room_id))
    return result.scalar_one_or_none()
