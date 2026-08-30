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


@router.get("/model/evaluate")
def evaluate(request: Request):
    """Developer/admin-only model evaluation (metrics + confusion matrix)."""
    model = request.app.state.emotion_model
    return model.evaluate()


class CompleteRequest(BaseModel):
    text: str
    top_k: int = 4


@router.post("/ngram/complete")
def complete(req: CompleteRequest, request: Request):
    """N-Gram next-word / phrase completion suggestions."""
    model = request.app.state.emotion_model
    top_k = max(1, min(8, req.top_k))
    return model.complete(req.text, top_k=top_k)


@router.get("/model/metrics")
def metrics(request: Request):
    """Model internals: HMM transition matrix + N-Gram transition samples."""
    model = request.app.state.emotion_model
    return model.metrics()
