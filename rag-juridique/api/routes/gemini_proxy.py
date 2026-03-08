"""
Proxy Gemini - Routes exposées au frontend React

Proxifie les appels Gemini depuis le navigateur vers Vertex AI (ADC).
Plus aucune clé API Gemini n'est nécessaire côté client.
"""

import asyncio
import json
from concurrent.futures import ThreadPoolExecutor
from typing import Any

import vertexai
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from loguru import logger
from pydantic import BaseModel
from vertexai.generative_models import GenerationConfig, GenerativeModel

from config.settings import get_settings

settings = get_settings()

# Init Vertex AI once at module load (uses ADC automatically on Cloud Run)
# Guard against empty GCP_PROJECT_ID so the app still starts without it configured
if settings.GCP_PROJECT_ID:
    vertexai.init(project=settings.GCP_PROJECT_ID, location=settings.GCP_REGION)

router = APIRouter()

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG COMMUNE
# ─────────────────────────────────────────────────────────────────────────────

_FLASH_MODEL = settings.GEMINI_FLASH_MODEL

_SAFETY_OFF = None  # Use Vertex AI defaults

_LEGAL_SYSTEM = """Tu es un assistant juridique francais, reconnu pour ton excellence juridique et ta pédagogie.
RÈGLES FONDAMENTALES :
1. **Persona** : Professionnel, objectif, clair.
2. **Méthodologie** : Syllogisme (Faits -> Problème -> Majeure -> Mineure -> Conclusion).
3. **Formatage** : Markdown riche (Titres ###, **Gras**, Listes).
4. **Citations & Liens (CRITIQUE)** :
   - Pour CHAQUE citation juridique, tu DOIS générer un lien hypertexte Markdown menant vers Légifrance.
"""

_GEN_CONFIG = GenerationConfig(temperature=0.3, top_k=20, top_p=0.8, max_output_tokens=4096)


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

async def _sse_from_sync_gen(sync_gen_factory):
    """Runs a synchronous streaming generator in a thread and yields SSE lines."""
    loop = asyncio.get_event_loop()
    queue: asyncio.Queue = asyncio.Queue()

    def run():
        try:
            for chunk_text in sync_gen_factory():
                loop.call_soon_threadsafe(queue.put_nowait, {"text": chunk_text})
        except Exception as exc:
            loop.call_soon_threadsafe(queue.put_nowait, {"error": str(exc)})
        finally:
            loop.call_soon_threadsafe(queue.put_nowait, None)  # sentinel

    executor = ThreadPoolExecutor(max_workers=1)
    future = loop.run_in_executor(executor, run)

    while True:
        item = await queue.get()
        if item is None:
            break
        yield f"data: {json.dumps(item)}\n\n"

    await future
    yield "data: [DONE]\n\n"


def _format_history(raw_history: list[dict]) -> list[dict]:
    """Convert [{role, text}] to Vertex AI Content format."""
    contents = []
    for msg in raw_history:
        role = "user" if msg.get("role") == "user" else "model"
        contents.append({"role": role, "parts": [{"text": msg.get("text", "")}]})
    return contents


# ─────────────────────────────────────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class HistoryMessage(BaseModel):
    role: str
    text: str


class LegalChatRequest(BaseModel):
    history: list[HistoryMessage] = []
    message: str


class WorkspaceChatRequest(BaseModel):
    history: list[HistoryMessage] = []
    message: str
    contextData: dict[str, Any] = {}


class AnalyzeRequest(BaseModel):
    query: str


class MeetingSummaryRequest(BaseModel):
    transcript: str
    lawyerName: str
    clientName: str
    date: str


class ParseEventRequest(BaseModel):
    input: str
    currentDate: str  # ISO string from the browser


class AnswerScheduleRequest(BaseModel):
    query: str
    events: list[dict[str, Any]]
    currentDate: str  # ISO string


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES — STREAMING
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/legal-chat")
async def legal_chat(req: LegalChatRequest):
    """Streaming legal chat — replaces frontend streamLegalChat()."""
    history = _format_history([m.model_dump() for m in req.history])

    def sync_gen():
        model = GenerativeModel(
            _FLASH_MODEL,
            system_instruction=_LEGAL_SYSTEM,
            generation_config=_GEN_CONFIG,
        )
        chat = model.start_chat(history=history)
        for chunk in chat.send_message(req.message, stream=True):
            if chunk.text:
                yield chunk.text

    return StreamingResponse(
        _sse_from_sync_gen(sync_gen),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/workspace-chat")
async def workspace_chat(req: WorkspaceChatRequest):
    """Streaming workspace chat with agenda context — replaces streamWorkspaceChat()."""
    history = _format_history([m.model_dump() for m in req.history])
    ctx = req.contextData

    context_str = f"\nCONTEXTE ADMINISTRATIF :\n- Avocat : {ctx.get('userName', 'Maître')}\n- Date : {ctx.get('currentTime', '')}\n"
    appointments = ctx.get("appointments", {})
    upcoming = appointments.get("upcoming", []) if appointments else []
    if upcoming:
        context_str += "\nAGENDA (Prochains Rendez-vous) :\n"
        for i, apt in enumerate(upcoming, 1):
            context_str += (
                f"{i}. {apt.get('formattedDate', '')} - Client : {apt.get('clientName', 'N/A')}"
                f" - Type : {apt.get('type', '')} - Statut : {apt.get('status', '')}\n"
            )
    else:
        context_str += "\nAGENDA : Aucun rendez-vous à venir.\n"

    system = _LEGAL_SYSTEM + context_str

    def sync_gen():
        model = GenerativeModel(
            _FLASH_MODEL,
            system_instruction=system,
            generation_config=_GEN_CONFIG,
        )
        chat = model.start_chat(history=history)
        for chunk in chat.send_message(req.message, stream=True):
            if chunk.text:
                yield chunk.text

    return StreamingResponse(
        _sse_from_sync_gen(sync_gen),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES — JSON (non-streaming)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/analyze")
async def analyze_legal_case(req: AnalyzeRequest):
    """Analyze user query to detect legal specialty — replaces analyzeLegalCase()."""
    specialties = [
        "Criminal Law", "Family Law", "Corporate Law", "Real Estate",
        "Labor Law", "Intellectual Property", "Immigration", "Tax Law", "General Practice",
    ]
    prompt = f"""Tu es un assistant juridique expert. Analyse la requête suivante d'un utilisateur cherchant un avocat.

Requête de l'utilisateur : "{req.query}"
Spécialités disponibles : {', '.join(specialties)}.

Instructions :
1. Détermine la spécialité juridique la plus pertinente.
2. Rédige une phrase d'analyse en français commençant par "Votre cas semble concerner" (15-30 mots).
3. Sur une nouvelle ligne, écris UNIQUEMENT la spécialité choisie (en anglais, exactement comme dans la liste).
"""
    try:
        model = GenerativeModel(_FLASH_MODEL, generation_config=GenerationConfig(temperature=0.3, max_output_tokens=256))
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: model.generate_content(prompt))
        lines = [l.strip() for l in response.text.strip().split("\n") if l.strip()]
        summary = lines[0] if lines else "Votre cas semble concerner une question juridique."
        specialty_raw = lines[-1] if len(lines) > 1 else "General Practice"
        found = next((s for s in specialties if s in specialty_raw), "General Practice")
        return {"summary": summary, "specialty": found}
    except Exception as exc:
        logger.error(f"analyze_legal_case error: {exc}")
        return {"summary": "Votre cas semble concerner une question juridique.", "specialty": "General Practice"}


@router.post("/meeting-summary")
async def generate_meeting_summary(req: MeetingSummaryRequest):
    """Generate a structured meeting summary — replaces generateMeetingSummary()."""
    if not req.transcript or not req.transcript.strip():
        return {"error": "Transcript vide"}

    prompt = f"""Tu es un assistant juridique expert. Génère un résumé professionnel et structuré de cette consultation.

Avocat : {req.lawyerName}
Client : {req.clientName}
Date : {req.date}

Transcript :
{req.transcript}

Génère un résumé en français avec les sections : Contexte, Points clés, Décisions, Actions à suivre, Recommandations.
"""
    try:
        model = GenerativeModel(_FLASH_MODEL, generation_config=GenerationConfig(temperature=0.3, max_output_tokens=2048))
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: model.generate_content(prompt))
        return {"summary": response.text.strip()}
    except Exception as exc:
        logger.error(f"generate_meeting_summary error: {exc}")
        return {"error": str(exc)}


@router.post("/calendar/parse-event")
async def parse_calendar_event(req: ParseEventRequest):
    """Parse natural language into a calendar event — replaces parseNaturalLanguageEvent()."""
    system_instruction = """Tu es un assistant de calendrier intelligent. Tu dois extraire les détails d'un événement à partir du texte de l'utilisateur (en français ou anglais)."""

    prompt = f"""{system_instruction}

Date et heure actuelles: {req.currentDate}

Texte de l'utilisateur: "{req.input}"

Extrais les détails de l'événement et retourne un JSON valide avec les champs :
title (string), start (ISO datetime), end (ISO datetime), description (string), location (string), isAllDay (boolean).
Retourne UNIQUEMENT le JSON, sans bloc markdown.
"""
    try:
        model = GenerativeModel(_FLASH_MODEL, generation_config=GenerationConfig(temperature=0.1, max_output_tokens=512))
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: model.generate_content(prompt))
        text = response.text.strip()
        first = text.find("{")
        last = text.rfind("}")
        if first != -1 and last != -1:
            parsed = json.loads(text[first:last + 1])
        else:
            parsed = json.loads(text)
        return {"event": parsed}
    except Exception as exc:
        logger.error(f"parse_calendar_event error: {exc}")
        return {"event": None, "error": str(exc)}


@router.post("/calendar/answer")
async def answer_schedule_query(req: AnswerScheduleRequest):
    """Answer a schedule question based on calendar events — replaces answerScheduleQuery()."""
    simplified = [
        {"title": e.get("title", ""), "start": e.get("start", ""), "end": e.get("end", ""), "source": e.get("source", "")}
        for e in req.events
    ]
    prompt = f"""Date et heure actuelles: {req.currentDate}
Événements du calendrier: {json.dumps(simplified, ensure_ascii=False)}

Question de l'utilisateur: "{req.query}"

Réponds à la question de l'utilisateur concernant son emploi du temps. Sois concis et utile. Réponds en français.
"""
    try:
        model = GenerativeModel(_FLASH_MODEL, generation_config=GenerationConfig(temperature=0.3, max_output_tokens=512))
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: model.generate_content(prompt))
        return {"answer": response.text.strip()}
    except Exception as exc:
        logger.error(f"answer_schedule_query error: {exc}")
        return {"answer": "Désolé, j'ai rencontré une erreur en vérifiant votre emploi du temps."}
