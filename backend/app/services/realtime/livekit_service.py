"""LiveKit room and media management service (server-side cloud API)."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, Optional

from livekit import rtc
from livekit.api import (
    AccessToken,
    CreateRoomRequest,
    ListRoomsRequest,
    LiveKitAPI,
    RoomParticipantIdentity,
    VideoGrants,
)

from app.core.config import settings

logger = logging.getLogger(__name__)

# participant_role -> extra LiveKit grants.
_ROLE_GRANTS = {
    "host": {"room_admin": True},
    "moderator": {"room_admin": True},
}


class LiveKitRoomService:
    """LiveKit room management via the LiveKit Cloud HTTP API."""

    def __init__(self):
        self.rooms: Dict[str, Any] = {}
        self.participants: Dict[str, Dict[str, Any]] = {}
        self.token_cache: Dict[str, str] = {}

    def _api(self) -> LiveKitAPI:
        return LiveKitAPI(
            url=settings.LIVEKIT_URL,
            api_key=settings.LIVEKIT_API_KEY,
            api_secret=settings.LIVEKIT_API_SECRET,
        )

    async def create_room(self, room_name: str) -> Optional[Any]:
        """Create a room on LiveKit Cloud.

        Args:
            room_name: The room name/code

        Returns:
            LiveKit room model (has .sid/.name) or None on failure.
        """
        if not settings.LIVEKIT_API_KEY or not settings.LIVEKIT_API_SECRET:
            logger.warning("LiveKit API credentials not configured")
            return None
        try:
            async with self._api() as lk:
                room_info = await lk.room.create_room(
                    CreateRoomRequest(name=room_name)
                )
            self.rooms[room_name] = room_info
            logger.info(
                f"Created LiveKit room: {room_name} sid={room_info.sid}"
            )
            return room_info
        except Exception as e:
            logger.error(
                f"Failed to create LiveKit room {room_name}: "
                f"{type(e).__name__}: {e}"
            )
            return None

    async def get_room(self, room_name: str) -> Optional[Any]:
        """Get a LiveKit room by name from the cloud (list API)."""
        if room_name in self.rooms:
            return self.rooms[room_name]
        try:
            async with self._api() as lk:
                resp = await lk.room.list_rooms(ListRoomsRequest())
            for info in resp.rooms:
                if info.name == room_name:
                    self.rooms[room_name] = info
                    return info
            return None
        except Exception as e:
            logger.error(
                f"Failed to list LiveKit rooms: {type(e).__name__}: {e}"
            )
            return None

    async def generate_participant_token(
        self,
        room_name: str,
        participant_name: str,
        participant_role: str = "participant",
        identity: Optional[str] = None,
    ) -> Optional[str]:
        """Generate a LiveKit access token for a participant.

        Args:
            room_name: The LiveKit room name
            participant_name: Display name of the participant
            participant_role: Role (host, participant, moderator)
            identity: Unique LiveKit identity (defaults to the display name).
                Callers should pass a unique id (e.g. the participant row UUID)
                so rejoining with the same display name never kicks the
                previous session.

        Returns:
            Encoded JWT token or None on failure.
        """
        if not settings.LIVEKIT_API_KEY or not settings.LIVEKIT_API_SECRET:
            logger.warning("LiveKit API credentials not configured")
            return None

        try:
            extra = _ROLE_GRANTS.get(participant_role, {})
            token = (
                AccessToken(
                    settings.LIVEKIT_API_KEY,
                    settings.LIVEKIT_API_SECRET,
                )
                .with_identity(identity or participant_name)
                .with_name(participant_name)
                .with_grants(
                    VideoGrants(
                        room=room_name,
                        room_join=True,
                        can_publish=True,
                        can_subscribe=True,
                        can_publish_data=True,
                        **extra,
                    )
                )
            )
            token_str = token.to_jwt()
            self.token_cache[f"{room_name}:{participant_name}"] = token_str
            logger.info(
                f"Generated LiveKit token for {participant_name} "
                f"in {room_name} (role={participant_role})"
            )
            return token_str
        except Exception as e:
            logger.error(
                f"Failed to generate LiveKit token: {type(e).__name__}: {e}"
            )
            return None

    async def disconnect_participant(
        self, room_name: str, participant_identity: str
    ):
        """Disconnect a participant from a LiveKit Cloud room."""
        try:
            async with self._api() as lk:
                await lk.room.remove_participant(
                    RoomParticipantIdentity(
                        room=room_name, identity=participant_identity
                    )
                )
            logger.info(
                f"Disconnected {participant_identity} from room {room_name}"
            )
        except Exception as e:
            logger.error(
                f"Error disconnecting participant: {type(e).__name__}: {e}"
            )

    async def handle_audio_track(
        self,
        track: rtc.Track,
        participant_name: str,
        room_name: str,
        on_audio_chunk: callable,
    ):
        """Handle incoming audio track from a participant (agent-side helper)."""
        try:
            if room_name not in self.participants:
                self.participants[room_name] = {}

            self.participants[room_name][participant_name] = {
                "track": track,
                "connected": True,
                "connected_at": datetime.utcnow(),
            }

            async def on_frame(frame: rtc.AudioFrame):
                await on_audio_chunk(
                    frame.data, frame.sample_rate, frame.num_channels
                )

            track.on("frame", on_frame)
            logger.info(
                f"Started handling audio track for {participant_name} "
                f"in room {room_name}"
            )

        except Exception as e:
            logger.error(
                f"Error handling audio track: {type(e).__name__}: {e}"
            )


# Module-level instance the API routes import and use.
livekit_service = LiveKitRoomService()
