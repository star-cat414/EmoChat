"""Speech-to-text service using the OpenAI Whisper API."""

from __future__ import annotations

import logging

logger = logging.getLogger("emochat")


class SpeechService:
    def __init__(self, api_key: str = ""):
        self.api_key = api_key

    def transcribe(self, mime_type: str, audio_bytes: bytes, language: str | None = None) -> str:
        """Transcribe audio bytes to text via the Whisper API."""
        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY not configured in backend/.env")

        try:
            from openai import OpenAI
        except ImportError as exc:  # pragma: no cover - environment issue
            raise RuntimeError(
                "OpenAI SDK not installed in the Python that runs the server "
                "(run: pip install openai)"
            ) from exc

        client = OpenAI(api_key=self.api_key)
        ext = _extension_for_mime(mime_type)
        filename = f"voice.{ext}"

        kwargs: dict = {"model": "whisper-1", "file": (filename, audio_bytes, mime_type)}
        if language:
            kwargs["language"] = language

        response = client.audio.transcriptions.create(**kwargs)
        text = (response.text or "").strip() if hasattr(response, "text") else str(response).strip()
        logger.info("Whisper transcription: %r", text)
        return text


def _extension_for_mime(mime: str) -> str:
    ext = {
        "audio/webm": "webm",
        "audio/mp4": "m4a",
        "audio/ogg": "ogg",
        "audio/wav": "wav",
        "audio/mpeg": "mp3",
    }.get(mime, "webm")
    return ext
