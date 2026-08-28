"""Conversation / person emotion analytics computed from emotion_predictions.

These are real analytics derived from stored prediction records (no fake data).
"""

from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone

PRIMARY_EMOTIONS = ["happy", "sad", "angry", "fear", "surprise", "neutral"]


def emotion_distribution(records: list[dict]) -> dict:
    """Compute percentage distribution across the six emotions."""
    counter = Counter(r.get("predicted_emotion") for r in records)
    total = len(records) or 1
    dist = {}
    for e in PRIMARY_EMOTIONS:
        dist[e] = round((counter.get(e, 0) / total) * 100, 2)
    return dist


def most_common_emotion(records: list[dict]) -> str:
    if not records:
        return "neutral"
    counter = Counter(r.get("predicted_emotion") for r in records)
    return counter.most_common(1)[0][0]


def emotion_trend(records: list[dict], days: int | None = None) -> list[dict]:
    """Aggregate emotions by day for a line/area chart.

    Returns list of {"date": "YYYY-MM-DD", "emotion": str, "count": int} plus per-emotion
    daily counts for stacked-area charts: {"date", "happy": n, "sad": n, ...}.
    """
    by_day: dict[str, Counter] = {}
    for r in records:
        created = r.get("created_at")
        if not created:
            continue
        try:
            dt = datetime.fromisoformat(str(created).replace("Z", "+00:00"))
        except ValueError:
            continue
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        key = dt.astimezone(timezone.utc).date().isoformat()
        by_day.setdefault(key, Counter())[r.get("predicted_emotion")] += 1

    rows = []
    for day in sorted(by_day.keys()):
        row = {
            "date": day,
            "total": sum(by_day[day].values()),
            "top_emotion": by_day[day].most_common(1)[0][0]
            if by_day[day]
            else "neutral",
        }
        for e in PRIMARY_EMOTIONS:
            row[e] = by_day[day].get(e, 0)
        rows.append(row)

    if days:
        rows = rows[-days:]
    return rows
