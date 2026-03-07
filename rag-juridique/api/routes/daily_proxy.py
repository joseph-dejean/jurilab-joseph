"""
Daily.co Proxy — Routes exposées au frontend React

Proxifie les appels Daily.co API depuis le navigateur vers Daily.co côté serveur.
La clé API Daily.co (DAILY_API_KEY) n'est jamais exposée dans le bundle browser.
"""

import asyncio
import random
import string
import time
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from fastapi import APIRouter
from loguru import logger
from pydantic import BaseModel

from config.settings import get_settings

settings = get_settings()

DAILY_API_BASE = "https://api.daily.co/v1"
_TIMEOUT = httpx.Timeout(30.0)

# Shared async client — connection pooling across all requests
_client = httpx.AsyncClient(
    timeout=_TIMEOUT,
    limits=httpx.Limits(max_connections=20, max_keepalive_connections=5),
)

router = APIRouter()


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.DAILY_API_KEY}",
        "Content-Type": "application/json",
    }


# ─────────────────────────────────────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class CreateRoomRequest(BaseModel):
    appointmentId: str
    lawyerName: str
    clientName: str
    durationMinutes: int = 60
    maxParticipants: int = 10


class GenerateTokenRequest(BaseModel):
    roomId: str
    userId: str
    userName: str
    isOwner: bool = False


class GenerateGuestTokenRequest(BaseModel):
    roomId: str
    guestName: str = "Invité"


class ProcessMeetingRequest(BaseModel):
    roomId: str
    appointmentDate: str | None = None
    durationMinutes: int | None = None
    lawyerName: str
    clientName: str
    date: str  # formatted date for the Gemini prompt


# ─────────────────────────────────────────────────────────────────────────────
# ROOM MANAGEMENT
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/rooms")
async def create_room(req: CreateRoomRequest) -> dict[str, str]:
    """Create a Daily.co room."""
    if not settings.DAILY_API_KEY:
        return {"error": "DAILY_API_KEY not configured on server"}

    room_name = f"jurilab-{req.appointmentId}-{int(time.time() * 1000)}"
    expiration = int(time.time()) + (req.durationMinutes * 60) + 3600

    resp = await _client.post(
        f"{DAILY_API_BASE}/rooms",
        headers=_headers(),
        json={
            "name": room_name,
            "privacy": "private",
            "properties": {
                "enable_screenshare": True,
                "enable_chat": True,
                "enable_prejoin_ui": False,
                "enable_network_ui": True,
                "enable_people_ui": False,
                "exp": expiration,
                "max_participants": req.maxParticipants,
                "start_video_off": False,
                "start_audio_off": False,
            },
        },
    )

    if not resp.is_success:
        logger.error(f"Daily.co create room error: {resp.status_code} {resp.text}")
        return {"error": f"Failed to create room: {resp.status_code}"}

    room = resp.json()
    logger.info(f"Daily.co room created: {room['id']}")
    return {"roomUrl": room["url"], "roomId": room["id"]}


@router.delete("/rooms/{room_id}")
async def delete_room(room_id: str) -> dict[str, Any]:
    """Delete a Daily.co room."""
    if not settings.DAILY_API_KEY:
        return {"error": "DAILY_API_KEY not configured on server"}

    resp = await _client.delete(
        f"{DAILY_API_BASE}/rooms/{room_id}",
        headers=_headers(),
    )

    if not resp.is_success and resp.status_code != 404:
        logger.error(f"Daily.co delete room error: {resp.status_code}")
        return {"error": f"Failed to delete room: {resp.status_code}"}

    logger.info(f"Daily.co room deleted: {room_id}")
    return {"deleted": True}


@router.get("/rooms/{room_id}")
async def get_room_info(room_id: str) -> dict[str, Any]:
    """Get Daily.co room info."""
    if not settings.DAILY_API_KEY:
        return {"error": "DAILY_API_KEY not configured on server"}

    resp = await _client.get(
        f"{DAILY_API_BASE}/rooms/{room_id}",
        headers=_headers(),
    )

    if resp.status_code == 404:
        return {"room": None}
    if not resp.is_success:
        return {"error": f"Failed to get room: {resp.status_code}"}

    return {"room": resp.json()}


# ─────────────────────────────────────────────────────────────────────────────
# TOKENS
# ─────────────────────────────────────────────────────────────────────────────

def _token_payload(room_name: str, user_id: str, user_name: str, is_owner: bool) -> dict:
    expiration = int(time.time()) + (24 * 60 * 60)
    return {
        "properties": {
            "room_name": room_name,
            "user_id": user_id,
            "user_name": user_name,
            "is_owner": is_owner,
            "exp": expiration,
            "enable_screenshare": True,
            "enable_recording": False,
        },
    }


@router.post("/meeting-tokens")
async def generate_token(req: GenerateTokenRequest) -> dict[str, str]:
    """Generate a meeting token."""
    if not settings.DAILY_API_KEY:
        return {"error": "DAILY_API_KEY not configured on server"}

    resp = await _client.post(
        f"{DAILY_API_BASE}/meeting-tokens",
        headers=_headers(),
        json=_token_payload(req.roomId, req.userId, req.userName, req.isOwner),
    )

    if not resp.is_success:
        logger.error(f"Daily.co token error: {resp.status_code} {resp.text}")
        return {"error": f"Failed to generate token: {resp.status_code}"}

    logger.info(f"Daily.co token generated for user: {req.userName}")
    return {"token": resp.json()["token"]}


@router.post("/meeting-tokens/guest")
async def generate_guest_token(req: GenerateGuestTokenRequest) -> dict[str, str]:
    """Generate a guest token."""
    if not settings.DAILY_API_KEY:
        return {"error": "DAILY_API_KEY not configured on server"}

    guest_id = f"guest-{int(time.time() * 1000)}-{''.join(random.choices(string.ascii_lowercase + string.digits, k=9))}"

    resp = await _client.post(
        f"{DAILY_API_BASE}/meeting-tokens",
        headers=_headers(),
        json=_token_payload(req.roomId, guest_id, req.guestName, False),
    )

    if not resp.is_success:
        logger.error(f"Daily.co guest token error: {resp.status_code} {resp.text}")
        return {"error": f"Failed to generate guest token: {resp.status_code}"}

    logger.info(f"Daily.co guest token generated for: {req.guestName}")
    return {"token": resp.json()["token"]}


# ─────────────────────────────────────────────────────────────────────────────
# TRANSCRIPT
# ─────────────────────────────────────────────────────────────────────────────

def _parse_vtt(vtt_content: str) -> str:
    """Extract plain text from a WebVTT string."""
    lines = vtt_content.splitlines()
    texts: list[str] = []
    past_header = False
    for line in lines:
        line = line.strip()
        if not past_header:
            if line == "WEBVTT":
                past_header = True
            continue
        if not line or line.isdigit() or "-->" in line or line.startswith("NOTE"):
            continue
        texts.append(line)
    return " ".join(texts)


async def _fetch_vtt(url: str, session_id: str) -> str:
    """Fetch and parse a single VTT file (used in parallel gather)."""
    try:
        resp = await _client.get(url)
        if resp.is_success:
            text = _parse_vtt(resp.text)
            logger.info(f"Parsed VTT for session {session_id}: {len(text)} chars")
            return text
    except Exception as exc:
        logger.warning(f"Failed to fetch VTT for session {session_id}: {exc}")
    return ""


@router.get("/transcript")
async def get_transcript(
    room_id: str,
    appointment_date: str | None = None,
    duration_minutes: int | None = None,
) -> dict[str, Any]:
    """
    Fetch the transcript for a completed Daily.co meeting.
    Returns {"transcript": "...", "ready": bool}.
    """
    if not settings.DAILY_API_KEY:
        return {"error": "DAILY_API_KEY not configured on server", "ready": False}

    resp = await _client.get(
        f"{DAILY_API_BASE}/transcript",
        headers=_headers(),
        params={"room_name": room_id},
    )

    if resp.status_code == 404:
        return {"transcript": "", "ready": False}
    if not resp.is_success:
        logger.error(f"Daily.co transcript API error: {resp.status_code} {resp.text}")
        return {"transcript": "", "ready": False}

    transcripts = resp.json().get("data", [])
    if not transcripts:
        return {"transcript": "", "ready": False}

    # Filter to appointment window if provided
    if appointment_date and duration_minutes:
        apt_start = datetime.fromisoformat(appointment_date.replace("Z", "+00:00"))
        window_start = apt_start - timedelta(minutes=15)
        window_end = apt_start + timedelta(minutes=duration_minutes + 60)
        transcripts = [
            t for t in transcripts
            if t.get("start_ts")
            and window_start <= datetime.fromtimestamp(t["start_ts"], tz=timezone.utc) <= window_end
        ]
        if not transcripts:
            return {"transcript": "", "ready": False}

    # Keep sessions with >=2 participants or significant duration, fallback to all
    relevant = [
        t for t in transcripts
        if (t.get("participants_count", 0) >= 2
            or (t.get("participants") and len(t["participants"]) >= 2)
            or t.get("duration", 0) > 30)
    ]
    if not relevant:
        relevant = transcripts

    relevant.sort(key=lambda t: t.get("start_ts", 0))

    # Extract text from each transcript; fetch VTT files in parallel
    vtt_tasks: list[tuple[int, asyncio.Task]] = []
    texts: list[str | None] = []

    for i, t in enumerate(relevant):
        if t.get("transcript"):
            texts.append(t["transcript"])
        elif t.get("text"):
            texts.append(t["text"])
        elif t.get("vtt_url"):
            texts.append(None)  # placeholder
            task = asyncio.create_task(_fetch_vtt(t["vtt_url"], t.get("id", str(i))))
            vtt_tasks.append((i, task))
        else:
            texts.append("")

    # Await all VTT fetches concurrently
    for idx, task in vtt_tasks:
        texts[idx] = await task

    # Combine non-empty segments
    parts: list[str] = []
    for t, text in zip(relevant, texts):
        if text and text.strip():
            ts_label = (
                datetime.fromtimestamp(t["start_ts"], tz=timezone.utc).strftime("%d/%m/%Y %H:%M")
                if t.get("start_ts") else "Session"
            )
            parts.append(f"\n--- {ts_label} ---\n{text.strip()}")

    if not parts:
        return {"transcript": "", "ready": False}

    combined = "\n\n".join(parts)
    logger.info(f"Transcript ready for room {room_id}: {len(combined)} chars")
    return {"transcript": combined, "ready": True}


# ─────────────────────────────────────────────────────────────────────────────
# PROCESS MEETING (single attempt — frontend handles retry loop)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/process-meeting")
async def process_meeting(req: ProcessMeetingRequest) -> dict[str, Any]:
    """
    Single-attempt transcript fetch + Gemini summary.
    Returns {"transcript": "...", "summary": "...", "ready": bool}.
    """
    result = await get_transcript(
        room_id=req.roomId,
        appointment_date=req.appointmentDate,
        duration_minutes=req.durationMinutes,
    )

    if not result.get("ready") or not result.get("transcript"):
        return {"transcript": "", "summary": "", "ready": False}

    transcript = result["transcript"]

    try:
        import vertexai
        from vertexai.generative_models import GenerationConfig, GenerativeModel

        vertexai.init(project=settings.GCP_PROJECT_ID, location=settings.GCP_REGION)

        prompt = f"""Tu es un assistant juridique expert. Génère un résumé professionnel et structuré de cette consultation.

Avocat : {req.lawyerName}
Client : {req.clientName}
Date : {req.date}

Transcript :
{transcript}

Génère un résumé en français avec les sections : Contexte, Points clés, Décisions, Actions à suivre, Recommandations.
"""
        model = GenerativeModel(
            settings.GEMINI_FLASH_MODEL,
            generation_config=GenerationConfig(temperature=0.3, max_output_tokens=2048),
        )
        response = await asyncio.get_event_loop().run_in_executor(
            None, lambda: model.generate_content(prompt)
        )
        summary = response.text.strip()
        logger.info(f"Meeting summary generated ({len(summary)} chars)")
    except Exception as exc:
        logger.error(f"Gemini summary error: {exc}")
        summary = ""

    return {"transcript": transcript, "summary": summary, "ready": True}
