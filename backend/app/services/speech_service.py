"""Speech-to-text service.

Primary: OpenAI Whisper API. Fallback: local offline Whisper model (faster-whisper,
CPU). The fallback is used automatically when the API is unavailable or the OpenAI
account has no credits, so voice messages keep working offline.
"""

from __future__ import annotations

import logging
import os
import tempfile

logger = logging.getLogger("emochat")


class SpeechService:
    def __init__(self, api_key: str = "", local_fallback: bool = True, model: str | None = None):
        self.api_key = api_key
        self.local_fallback = local_fallback
        self._model = None
        self._local_model_size = model or os.getenv("STT_LOCAL_MODEL", "base").strip()

    def transcribe(self, mime_type: str, audio_bytes: bytes, language: str | None = None) -> str:
        """Transcribe audio bytes. Uses the API, falling back to local Whisper on any failure."""
        try:
            return self._transcribe_api(mime_type, audio_bytes, language)
        except Exception as api_error:  # noqa: BLE001 - fall back on any STT API failure
            if not self.local_fallback:
                raise
            logger.warning("Cloud transcription failed (%s) — using local Whisper", api_error)
            try:
                return self._transcribe_local(audio_bytes, mime_type, language)
            except RuntimeError:
                raise
            except Exception as exc:  # noqa: BLE001
                raise RuntimeError(f"Local transcription failed: {exc}") from exc

    def _transcribe_api(self, mime_type: str, audio_bytes: bytes, language: str | None) -> str:
        """Transcribe via the OpenAI Whisper API."""
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

    def _transcribe_local(self, audio_bytes: bytes, mime_type: str, language: str | None) -> str:
        """Transcribe offline with faster-whisper (CPU, int8)."""
        try:
            from faster_whisper import WhisperModel
        except ImportError as exc:
            raise RuntimeError(
                "Offline transcription requested but faster-whisper is not installed "
                "(run: pip install faster-whisper av)"
            ) from exc

        if self._model is None:
            logger.info("Loading local Whisper model '%s' (first use downloads it)", self._local_model_size)
            self._model = WhisperModel(
                self._local_model_size,
                device="cpu",
                compute_type="int8",
                cpu_threads=max(1, (os.cpu_count() or 4) // 2),
            )

        ext = _extension_for_mime(mime_type)
        with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as fh:
            fh.write(audio_bytes)
            tmp_path = fh.name
        try:
            segments, _info = self._model.transcribe(
                tmp_path,
                language=language,
                vad_filter=False,
                beam_size=1,
            )
            text = "".join(seg.text for seg in segments).strip()
        finally:
            try:
                os.remove(tmp_path)
            except OSError:
                pass
        logger.info("Local Whisper transcription: %r", text)
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