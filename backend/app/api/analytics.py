"""Analytics endpoints.

These query REAL emotion_predictions records from Supabase (via service role) to compute
conversation and per-person emotion analytics. Frontend also computes most analytics
client-side from predictions it can access; these endpoints provide server-side aggregation.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.services.analytics_service import (
    emotion_distribution,
    emotion_trend,
    most_common_emotion,
)
from app.utils.supabase import get_supabase

router = APIRouter()


class AnalyticsResponse(BaseModel):
    total_messages: int
    analyzed: int
    distribution: dict[str, float]
    most_common: str
    trend: list[dict]


def _fetch_predictions(table: str, column: str, value: str, limit: int = 5000) -> list[dict]:
    try:
        client = get_supabase()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    data = (
        client.table(table)
        .select("*")
        .eq(column, value)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return data.data or []


@router.get("/analytics/conversation/{conversation_id}", response_model=AnalyticsResponse)
def conversation_analytics(conversation_id: str, request: Request):
    records = _fetch_predictions("emotion_predictions", "conversation_id", conversation_id)
    total_messages = _count_messages(conversation_id)
    return AnalyticsResponse(
        total_messages=total_messages,
        analyzed=len(records),
        distribution=emotion_distribution(records),
        most_common=most_common_emotion(records),
        trend=emotion_trend(records),
    )


@router.get("/analytics/person/{user_id}", response_model=AnalyticsResponse)
def person_analytics(user_id: str, request: Request):
    records = _fetch_predictions("emotion_predictions", "user_id", user_id)
    return AnalyticsResponse(
        total_messages=len(records),
        analyzed=len(records),
        distribution=emotion_distribution(records),
        most_common=most_common_emotion(records),
        trend=emotion_trend(records),
    )


def _count_messages(conversation_id: str) -> int:
    try:
        client = get_supabase()
    except RuntimeError:
        return 0
    resp = (
        client.table("messages")
        .select("id", count="exact")
        .eq("conversation_id", conversation_id)
        .execute()
    )
    return int(getattr(resp, "count", 0) or 0)
