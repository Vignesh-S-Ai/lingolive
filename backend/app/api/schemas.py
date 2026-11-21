"""Pydantic schemas for the API routes."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class RoomCreate(BaseModel):
    """Request body for creating a room."""

    code: str
    name: str


class RoomUpdate(BaseModel):
    """Request body for updating a room."""

    name: Optional[str] = None
    status: Optional[str] = None


class RoomResponse(BaseModel):
    """Room representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    code: str
    name: str
    status: str
    created_at: datetime
    updated_at: datetime


class ParticipantCreate(BaseModel):
    """Participant representation returned after joining a room."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    room_id: uuid.UUID
    participant_id: str
    name: str
    input_language: str
    output_language: str
    connection_status: str
    created_at: datetime
    livekit_token: Optional[str] = None


class ParticipantResponse(BaseModel):
    """Participant representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    room_id: uuid.UUID
    participant_id: str
    name: str
    input_language: str
    output_language: str
    connection_status: str
    created_at: datetime


class ParticipantUpdate(BaseModel):
    """Request body for updating a participant."""

    name: Optional[str] = None
    connection_status: Optional[str] = None


class LanguagePreferenceUpdate(BaseModel):
    """Request body for updating a participant's languages."""

    input_language: str
    output_language: str
