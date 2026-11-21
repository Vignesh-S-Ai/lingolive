"""Room management routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ...db.session import get_db
from ...db.models import Room, Participant
from ..schemas import RoomCreate, RoomUpdate, RoomResponse, ParticipantCreate
from ...services.realtime.livekit_service import livekit_service

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post("/", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room(
    room_data: RoomCreate,
    db: Session = Depends(get_db),
):
    """Create a new conversation room."""
    from ...repositories.room_repository import create_room as cr
    
    # Check if room already exists
    existing_room = db.query(Room).filter(Room.code == room_data.code).first()
    if existing_room:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Room code already exists",
        )
    
    room = cr(db=db, code=room_data.code, name=room_data.name)
    
    # Try to create LiveKit room on the cloud
    try:
        lk_room = await livekit_service.create_room(room_name=room.code)
        if lk_room is not None:
            room.livekit_room_id = lk_room.sid
            db.commit()
            db.refresh(room)
    except Exception as e:
        # Log error but don't block room creation
        print(f"LiveKit room creation warning: {e}")
    
    return room


@router.get("/", response_model=List[RoomResponse])
async def list_rooms(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """List all rooms."""
    from ...repositories.room_repository import get_rooms
    return get_rooms(db=db, skip=skip, limit=limit)


@router.get("/{room_code}", response_model=RoomResponse)
async def get_room(
    room_code: str,
    db: Session = Depends(get_db),
):
    """Get room details by code."""
    from ...repositories.room_repository import get_room
    room = get_room(db=db, code=room_code)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )
    return room


@router.post("/{room_code}/join", response_model=ParticipantCreate)
async def participant_join(
    room_code: str,
    participant_data: dict,
    db: Session = Depends(get_db),
):
    """Handle participant joining a room."""
    from ...repositories.participant_repository import create_participant
    
    participant = create_participant(
        db=db,
        room_code=room_code,
        name=participant_data.get("name", ""),
        input_language=participant_data.get("input_language", "en-IN"),
        output_language=participant_data.get("output_language", "en-IN"),
    )
    
    # Generate LiveKit token (identity = row UUID so rejoining with the same
    # display name never disconnects another live session).
    try:
        lk_token = await livekit_service.generate_participant_token(
            room_name=room_code,
            participant_name=participant.name,
            identity=str(participant.id),
        )
        participant.livekit_token = lk_token
    except Exception as e:
        print(f"LiveKit token generation warning: {e}")
    
    return participant