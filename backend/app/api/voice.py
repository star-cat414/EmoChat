"""Voice processing endpoints: transcription and emotion from speech.

Voice emotion pipeline:
    Voice -> Speech-to-Text (Whisper API) -> Text -> N-Gram + HMM -> Emotion

This keeps the implementation aligned with the project's NLP research focus (the emotion
classification is done by N-Gram + HMM on the transcribed text, not a raw-audio NN).
"""

from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel

from app.config import settings
from app.services.speech_service import SpeechService

router = APIRouter()

_speech: SpeechService | None = None


def _get_speech() -> SpeechService:
    global _speech
    if _speech is None:
        _speech = SpeechService(api_key=settings.OPENAI_API_KEY)
    return _speech


def _transcribe(mime: str, audio: bytes) -> str:
    """Transcribe audio, converting any STT failure into a readable 503."""
    try:
        return _get_speech().transcribe(mime, audio)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=f"Speech-to-text unavailable: {exc}") from exc
    except Exception as exc:  # openai.* errors (rate limit, quota, auth, network...)
        detail = str(exc) or type(exc).__name__
        raise HTTPException(
            status_code=503,
            detail=f"Speech-to-text unavailable: {detail}",
        ) from exc


class TranscribeResponse(BaseModel):
    transcript: str
    language: str = "auto"


class VoiceEmotionResponse(BaseModel):
    transcript: str
    emotion: str
    confidence: float
    probabilities: dict[str, float]
    language: str
    model: str
    model_version: str


@router.post("/voice/transcribe", response_model=TranscribeResponse)
async def transcribe(request: Request, file: UploadFile = File(...)) -> TranscribeResponse:
    audio = await file.read()
    mime = file.content_type or "audio/webm"
    transcript = _transcribe(mime, audio)
    return TranscribeResponse(transcript=transcript)


@router.post("/voice/emotion", response_model=VoiceEmotionResponse)
async def voice_emotion(
    request: Request,
    file: UploadFile = File(...),
    transcript: str = Form(default=""),
    previous_emotions: str = Form(default=""),
) -> VoiceEmotionResponse:
    """Transcribe audio (if needed) then run N-Gram + HMM emotion prediction."""
    model = request.app.state.emotion_model

    if not transcript:
        audio = await file.read()
        mime = file.content_type or "audio/webm"
        transcript = _transcribe(mime, audio)

    prev: list[str] = [e.strip() for e in previous_emotions.split(",") if e.strip()] or None
    result = model.predict(text=transcript, previous_emotions=prev)
    result["transcript"] = transcript
    return VoiceEmotionResponse(**result)
