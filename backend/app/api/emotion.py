"""Text emotion prediction endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter()


class PredictRequest(BaseModel):
    text: str
    conversation_id: str | None = None
    user_id: str | None = None
    previous_emotions: list[str] | None = None


class PredictResponse(BaseModel):
    emotion: str
    confidence: float
    probabilities: dict[str, float]
    language: str
    model: str
    model_version: str


@router.post("/emotion/predict", response_model=PredictResponse)
def predict(req: PredictRequest, request: Request):
    model = request.app.state.emotion_model
    result = model.predict(
        text=req.text,
        previous_emotions=req.previous_emotions,
    )
    return result


@router.post("/model/evaluate")
def evaluate(request: Request):
    """Developer/admin-only model evaluation (metrics + confusion matrix)."""
    model = request.app.state.emotion_model
    return model.evaluate()
