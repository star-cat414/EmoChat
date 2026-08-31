"""Call emotion analysis endpoint.

During a call the client captures short audio segments, transcribes them, and posts here
to get an N-Gram + HMM emotion prediction. Updates are periodic, not continuous.
"""

from __future__ import annotations

from fastapi import APIRouter, File, Request, UploadFile
from pydantic import BaseModel

from app.api.voice import _transcribe

router = APIRouter()


class CallEmotionResponse(BaseModel):
    transcript: str
    emotion: str
    confidence: float
    probabilities: dict[str, float]
    model: str
    model_version: str


@router.post("/calls/emotion", response_model=CallEmotionResponse)
async def call_emotion(
    request: Request,
    file: UploadFile = File(...),
    previous_emotions: str = "",
) -> CallEmotionResponse:
    from app.config import settings

    model = request.app.state.emotion_model

    audio = await file.read()
    mime = file.content_type or "audio/webm"
    transcript = _transcribe(mime, audio)

    prev: list[str] = [e.strip() for e in previous_emotions.split(",") if e.strip()] or None
    result = model.predict(text=transcript, previous_emotions=prev)
    return CallEmotionResponse(
        transcript=transcript,
        emotion=result["emotion"],
        confidence=result["confidence"],
        probabilities=result["probabilities"],
        model=result["model"],
        model_version=result["model_version"],
    )
