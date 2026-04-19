"""
POST /api/chat — Gemini-powered fan assistant.

The system prompt is enriched with live crowd and queue context so the
model can answer venue-specific questions (e.g. "Which food stall has
the shortest queue?") grounded in real data.
"""
from __future__ import annotations

import logging
import os
from typing import List

from dotenv import load_dotenv
from fastapi import APIRouter
from pydantic import BaseModel

from app.services.crowd_service import crowd_service
from app.services.queue_service import queue_service

# Load .env — try backend/, backend/.venv/, and CWD
_routes_dir = os.path.dirname(__file__)
_backend_dir = os.path.abspath(os.path.join(_routes_dir, "../../../"))

# Potential locations for .env
env_locations = [
    os.path.join(_backend_dir, ".env"),
    os.path.join(_backend_dir, "venv", ".env"),
    os.path.join(_backend_dir, ".venv", ".env"),
    ".env"
]

for loc in env_locations:
    if os.path.exists(loc):
        load_dotenv(dotenv_path=loc, override=False)

logger = logging.getLogger("crowdcontrol.chat")

router = APIRouter(prefix="/api/chat", tags=["Chat"])

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str        # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


class ChatResponse(BaseModel):
    reply: str


# ---------------------------------------------------------------------------
# Helper — build a concise venue context string
# ---------------------------------------------------------------------------

def _build_venue_context() -> str:
    snapshot = crowd_service.get_snapshot()
    queues   = queue_service.get_all_queues_with_history()

    zone_lines = "\n".join(
        f"  • {z.name} (Zone {z.zone_id}): {z.density_percent:.0f}% full, trend={z.trend}"
        for z in snapshot.zones
    )

    queue_lines = "\n".join(
        f"  • {q['name']} [{q['type']}]: {q['current_queue_length']} people, ~{q['predicted_wait_minutes']:.1f} min wait"
        for q in queues
    )

    return f"""
=== LIVE VENUE DATA (use this to answer questions) ===
Overall capacity: {snapshot.total_count}/{snapshot.total_capacity} ({snapshot.average_density:.0f}% full)

Zone densities:
{zone_lines}

Queue wait times:
{queue_lines}
""".strip()


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are CrowdBot, a friendly and knowledgeable AI assistant
for fans at a large sports venue. Your job is to help fans navigate the venue,
find food and facilities, avoid crowds, and enjoy the event.

Rules:
- Be concise, warm, and helpful (2-4 sentences max per reply).
- Use the live venue data below to give accurate, specific answers.
- If asked about queues or congestion, reference actual numbers.
- Never make up gate numbers or facilities not listed in the data.
- If unsure, say so honestly and suggest a general alternative.

{context}
"""


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    context = _build_venue_context()
    system  = SYSTEM_PROMPT.format(context=context)

    # Strip any accidental whitespace from the API key
    api_key = (os.getenv("GEMINI_API_KEY") or "").strip()

    if not api_key:
        logger.warning("GEMINI_API_KEY is not set — chatbot running in fallback mode")
        snapshot = crowd_service.get_snapshot()
        return ChatResponse(
            reply=f"I'm CrowdBot, but my AI connection isn't configured yet. "
                  f"Right now the venue is {snapshot.average_density:.0f}% full overall. "
                  f"Try the QueueSense tab for live wait times!"
        )

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        # Use system_instruction for Gemini 1.5 (cleaner, more intelligent)
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system
        )

        # Build conversation history for Gemini (all turns except the last)
        history = []
        for msg in request.messages[:-1]:
            role = "user" if msg.role == "user" else "model"
            history.append({"role": role, "parts": [msg.content]})

        chat_session = model.start_chat(history=history)

        # Send the latest message
        user_text = request.messages[-1].content
        response = chat_session.send_message(user_text)
        
        return ChatResponse(reply=response.text)

    except Exception as exc:
        logger.error("Gemini API error: %s", exc, exc_info=True)
        snapshot = crowd_service.get_snapshot()
        return ChatResponse(
            reply=f"I hit a snag talking to Gemini (error: {type(exc).__name__}). "
                  f"Venue is currently {snapshot.average_density:.0f}% full. "
                  f"Check the QueueSense tab for wait times!"
        )
