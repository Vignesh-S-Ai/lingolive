"""Participant management routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ...db.session import get_db
from ...db.models import Room, Participant
from ..schemas import (
    ParticipantResponse,
    ParticipantUpdate,
    LanguagePreferenceUpdate,
)

router = APIRouter(prefix="/participants", tags=["participants"])


@router.get("/{participant_id}", response_model=ParticipantResponse)
async def get_participant(
    participant_id: str,
    db: Session = Depends(get_db),
):
    """Get participant details."""
    from ...repositories.participant_repository import get_participant
    
    participant = get_participant(db=db, participant_id=participant_id)
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found",
        )
    return participant


@router.put("/{participant_id}/language", response_model=ParticipantResponse)
async def update_language_preference(
    participant_id: str,
    language_data: LanguagePreferenceUpdate,
    db: Session = Depends(get_db),
):
    """Update participant's language preferences."""
    from ...repositories.participant_repository import update_participant_language
    
    participant = update_participant_language(
        db=db,
        participant_id=participant_id,
        input_language=language_data.input_language,
        output_language=language_data.output_language,
    )
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found",
        )

    return participant