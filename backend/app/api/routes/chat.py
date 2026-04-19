"""
POST /api/chat — Gemini-powered fan assistant.

The system prompt is enriched with live crowd and queue context so the
model can answer venue-specific questions (e.g. "Which food stall has
the shortest queue?") grounded in real data.
"""
from __future__ import annotations

import json
import os
from typing import List

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.crowd_service import crowd_service
from app.services.queue_service import queue_service

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
- Be concise, warm, and helpful.
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

    try:
        # Use google-genai (new SDK) if available, fall back to google-generativeai
        try:
            import google.generativeai as genai

            api_key = os.getenv("GEMINI_API_KEY")
            if api_key:
                genai.configure(api_key=api_key)

            model = genai.GenerativeModel("gemini-1.5-flash")

            # Build conversation history for Gemini
            history = []
            messages = request.messages[:-1]   # all but last
            for msg in messages:
                role = "user" if msg.role == "user" else "model"
                history.append({"role": role, "parts": [msg.content]})

            chat_session = model.start_chat(history=history)

            # Inject system prompt into the first user turn prefix (Gemini 1.5 approach)
            user_text = request.messages[-1].content
            full_prompt = f"{system}\n\nFan: {user_text}" if not history else user_text

            response = chat_session.send_message(full_prompt)
            return ChatResponse(reply=response.text)

        except Exception as inner:
            return ChatResponse(
                reply=f"I'm having a little trouble connecting right now. "
                      f"Based on live data: overall venue is {crowd_service.get_snapshot().average_density:.0f}% full. "
                      f"Try the QueueSense tab for wait times!"
            )

    except Exception as e:
        return ChatResponse(reply="Sorry, I couldn't process that. Please try again!")
