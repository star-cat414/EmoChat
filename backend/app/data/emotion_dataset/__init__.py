"""Curated emotion dataset loader with Hugging Face data.

Training data primarily comes from two public Hugging Face datasets (fetched with
the Python standard library — raw CSV / datasets-server paging — so no extra
dependencies are required):

  - English : dair-ai/emotion       (Twitter emotion, train 16k / val 2k / test 2k)
  - Myanmar : linnaein/burmese-emotion-dataset (3,475 rows, CSV)

HF labels are aligned to EmoChat's scheme {happy, sad, angry, fear, surprise, neutral}:

    joy / love -> happy      sadness -> sad
    anger -> angry           fear -> fear      surprise -> surprise

'neutral' does not exist in either HF dataset, so the hand-curated neutral examples
below are always retained. The embedded curated set doubles as a per-class offline
fallback (and a full fallback) whenever Hugging Face is unreachable.

Each entry: {"text": str, "emotion": str, "language": "myanmar"|"english"}
"""

from __future__ import annotations

import csv
import io
import json
import logging
import os
import random
import urllib.request
from collections import defaultdict
from pathlib import Path
from urllib.error import HTTPError, URLError

logger = logging.getLogger("emochat")

DATA_DIR = Path(__file__).resolve().parent

EMOTIONS = ["happy", "sad", "angry", "fear", "surprise", "neutral"]

NEUTRAL = "neutral"
CORE_EMOTIONS = [e for e in EMOTIONS if e != NEUTRAL]

HF_MAX_PER_EMOTION = int(os.getenv("HF_MAX_PER_EMOTION", "500"))
HF_REFRESH = os.getenv("HF_REFRESH", "").strip().lower() in ("1", "true", "yes")

HF_CACHE_FILE = DATA_DIR / "hf_dataset_cache.json"

ENGLISH_HF_DATASET = "dair-ai/emotion"
ENGLISH_LABEL_MAP = {
    "sadness": "sad",
    "joy": "happy",
    "love": "happy",
    "anger": "angry",
    "fear": "fear",
    "surprise": "surprise",
}

MYANMAR_HF_CSV = (
    "https://huggingface.co/datasets/linnaein/burmese-emotion-dataset/"
    "resolve/main/burmese_emotion_dataset.csv"
)
MYANMAR_LABEL_MAP = {
    "0": "sad",
    "1": "happy",
    "2": "happy",  # love / affection -> happy
    "3": "angry",
    "4": "fear",
    "5": "surprise",
}

# ---------------------------------------------------------------------------
# Myanmar examples
# ---------------------------------------------------------------------------
MYANMAR_DATA: list[dict] = [
    # happy
    {"text": "ဒီနေ့ အရမ်းပျော်တယ်", "emotion": "happy"},
    {"text": "မင်းကိုတွေ့ရလို့ ပျော်လိုက်တာ", "emotion": "happy"},
    {"text": "ငါ့အတွက် သတင်းကောင်းပဲ", "emotion": "happy"},
    {"text": "အခုပဲ အောင်စာရင်းထွက်ပြီ", "emotion": "happy"},
    {"text": "ဒီဖြစ်ရပ်ကို မြင်ရတာ ပျော်တယ်", "emotion": "happy"},
    {"text": "မင်းနဲ့အတူရှိနေရတာ ပျော်တယ်", "emotion": "happy"},
    {"text": "အားလုံးပြီးမြောက်သွားလို့ ဝမ်းသာတယ်", "emotion": "happy"},
    {"text": "အခုလို ပျော်ရွှင်နေတာ ကောင်းလှပါတယ်", "emotion": "happy"},
    {"text": "ရလဒ်ရလို့ ပျော်လိုက်တာ", "emotion": "happy"},
    {"text": "မနက်ဖြန် ခရီးထွက်ရမယ် ပျော်တယ်", "emotion": "happy"},
    # sad
    {"text": "မင်းကို အရမ်းလွမ်းတယ်", "emotion": "sad"},
    {"text": "ငါက အရမ်းစိတ်မကောင်းဖြစ်နေတယ်", "emotion": "sad"},
    {"text": "အရမ်းဝမ်းနည်းနေတယ်", "emotion": "sad"},
    {"text": "ငိုချင်နေတယ်", "emotion": "sad"},
    {"text": "ဘာမှ မလုပ်ချင်ဘူး စိတ်ညစ်နေတယ်", "emotion": "sad"},
    {"text": "လွမ်းလိုက်တာ ငါ့ရဲ့သူငယ်ချင်း", "emotion": "sad"},
    {"text": "ဒီသတင်းကြားတော့ ဝမ်းနည်းသွားတယ်", "emotion": "sad"},
    {"text": "ငါအရမ်းစိတ်ဆင်းရဲနေတယ်", "emotion": "sad"},
    {"text": "အခုအခြေအနေလေးက ဝမ်းနည်းစရာပဲ", "emotion": "sad"},
    {"text": "နှလုံးညှိုးနွမ်းနေတယ်", "emotion": "sad"},
    # angry
    {"text": "ငါအရမ်းစိတ်ဆိုးနေတယ်", "emotion": "angry"},
    {"text": "မင်းဘာလို့ ဒီလိုလုပ်တာလဲ စိတ်ဆိုးတယ်", "emotion": "angry"},
    {"text": "ဒါလုပ်မိတာ မယုံနိုင်ဘူး ဒေါသထွက်တယ်", "emotion": "angry"},
    {"text": "လုံးဝမခံနိုင်ဘူး", "emotion": "angry"},
    {"text": "ငါ့ကို ဒီလိုဆက်ဆံတာ စိတ်နာတယ်", "emotion": "angry"},
    {"text": "ဒါက လုံးဝလွန်နေပြီ", "emotion": "angry"},
    {"text": "ဘာလို့ ဒီလောက်မရိုးသားတာလဲ", "emotion": "angry"},
    {"text": "မင်းရဲ့အပြုအမှုကို ဒေါသဖြစ်တယ်", "emotion": "angry"},
    {"text": "ငါ အရမ်းဒေါသထွက်နေတယ်", "emotion": "angry"},
    {"text": "ဒါမျိုးလုပ်ရတော့မယ်လို့ မထင်ဘူး", "emotion": "angry"},
    # fear
    {"text": "ငါကြောက်နေတယ်", "emotion": "fear"},
    {"text": "ဘာဖြစ်မလဲမသိဘူး ကြောက်လို့ကောင်းလိုက်တာ", "emotion": "fear"},
    {"text": "အရမ်းကြောက်ရွံ့နေတယ်", "emotion": "fear"},
    {"text": "လန့်နေတယ်", "emotion": "fear"},
    {"text": "ညဘက် တစ်ယောက်တည်း ကြောက်တယ်", "emotion": "fear"},
    {"text": "ဒီလိုအဖြစ်မျိုး ကြောက်စရာပဲ", "emotion": "fear"},
    {"text": "စိတ်ပူပြီး ကြောက်နေတယ်", "emotion": "fear"},
    {"text": "ဘာဖြစ်သွားမလဲဆိုတာ ကြောက်တယ်", "emotion": "fear"},
    {"text": "ငါ့ကို လန့်သွားစေတယ်", "emotion": "fear"},
    {"text": "အရမ်းလန့်နေတယ် မလုပ်နဲ့", "emotion": "fear"},
    # surprise
    {"text": "ဟာ ဒါတွေကြီးလား အံ့သြစရာပဲ", "emotion": "surprise"},
    {"text": "အရမ်းအံ့သြသွားတယ်", "emotion": "surprise"},
    {"text": "ဒါ မယုံနိုင်လောက်အောင်ပဲ", "emotion": "surprise"},
    {"text": "သူက အဲဒီလိုလုပ်မယ်လို့ မထင်ထားဘူး", "emotion": "surprise"},
    {"text": "အခုမှပဲ ဒါကိုသိရတာ အံ့သြတယ်", "emotion": "surprise"},
    {"text": "ဟေ့ ဒါဘာဖြစ်တာလဲ", "emotion": "surprise"},
    {"text": "ဒီသတင်းက အရမ်းအံ့သြစရာကောင်းတယ်", "emotion": "surprise"},
    {"text": "မမျှော်လင့်ဘဲ ဖြစ်သွားတာ", "emotion": "surprise"},
    {"text": "ကျွန်တော် အရမ်းအံ့သြသွားတယ်", "emotion": "surprise"},
    {"text": "ဘာကြီးလဲ ဒါ!", "emotion": "surprise"},
    # neutral
    {"text": "မနက်ဖြန် တွေ့မယ်", "emotion": "neutral"},
    {"text": "အခုအချိန်မှာ အိမ်မှာပဲ", "emotion": "neutral"},
    {"text": "ဒီအကြောင်းကို နောက်မှ ဆွေးနွေးရအောင်", "emotion": "neutral"},
    {"text": "ရေသောက်ပြီးပြီ", "emotion": "neutral"},
    {"text": "ငါအခု အလုပ်လုပ်နေတယ်", "emotion": "neutral"},
    {"text": "ကောင်းပြီ ဒါဆိုရင်", "emotion": "neutral"},
    {"text": "ဒီဖိုင်ကို ပို့ပေးပါ", "emotion": "neutral"},
    {"text": "အားလုံး အဆင်ပြေလား", "emotion": "neutral"},
    {"text": "အချိန် ဘယ်နှစ်နာရီလဲ", "emotion": "neutral"},
    {"text": "ဒီနားမှာ ဆိုင်တစ်ဆိုင်ရှိတယ်", "emotion": "neutral"},
]

# ---------------------------------------------------------------------------
# English examples
# ---------------------------------------------------------------------------
ENGLISH_DATA: list[dict] = [
    # happy
    {"text": "I am so happy today", "emotion": "happy"},
    {"text": "This is the best news ever", "emotion": "happy"},
    {"text": "I am thrilled to see you", "emotion": "happy"},
    {"text": "So excited for tomorrow", "emotion": "happy"},
    {"text": "I love this so much", "emotion": "happy"},
    {"text": "I am overjoyed right now", "emotion": "happy"},
    {"text": "That makes me really happy", "emotion": "happy"},
    {"text": "Great job, I am proud of you", "emotion": "happy"},
    {"text": "I passed my exam, fantastic", "emotion": "happy"},
    {"text": "So glad to hear that", "emotion": "happy"},
    # sad
    {"text": "I am really sad today", "emotion": "sad"},
    {"text": "I miss you so much", "emotion": "sad"},
    {"text": "I feel so down right now", "emotion": "sad"},
    {"text": "That makes me really sad", "emotion": "sad"},
    {"text": "I am heartbroken", "emotion": "sad"},
    {"text": "I have been crying all day", "emotion": "sad"},
    {"text": "So disappointed and sad", "emotion": "sad"},
    {"text": "I feel lonely today", "emotion": "sad"},
    {"text": "My heart is heavy", "emotion": "sad"},
    {"text": "I wish things were different", "emotion": "sad"},
    # angry
    {"text": "I am so angry right now", "emotion": "angry"},
    {"text": "Why would you do that to me", "emotion": "angry"},
    {"text": "I am furious about this", "emotion": "angry"},
    {"text": "This is completely unacceptable", "emotion": "angry"},
    {"text": "I can't stand this anymore", "emotion": "angry"},
    {"text": "I am so annoyed with you", "emotion": "angry"},
    {"text": "Stop lying to me", "emotion": "angry"},
    {"text": "I am really mad right now", "emotion": "angry"},
    {"text": "That really ticks me off", "emotion": "angry"},
    {"text": "You are driving me crazy", "emotion": "angry"},
    # fear
    {"text": "I am so scared right now", "emotion": "fear"},
    {"text": "I am afraid of what happens next", "emotion": "fear"},
    {"text": "This is terrifying", "emotion": "fear"},
    {"text": "I am worried and frightened", "emotion": "fear"},
    {"text": "Please don't leave me alone, I am scared", "emotion": "fear"},
    {"text": "I feel really anxious", "emotion": "fear"},
    {"text": "I am panicking right now", "emotion": "fear"},
    {"text": "Something feels really off and scary", "emotion": "fear"},
    {"text": "I am shaking with fear", "emotion": "fear"},
    {"text": "That really scared me", "emotion": "fear"},
    # surprise
    {"text": "Wow, I am so surprised", "emotion": "surprise"},
    {"text": "I did not expect that at all", "emotion": "surprise"},
    {"text": "That is unbelievable", "emotion": "surprise"},
    {"text": "What a shocking surprise", "emotion": "surprise"},
    {"text": "No way, I can't believe it", "emotion": "surprise"},
    {"text": "I am astonished by this", "emotion": "surprise"},
    {"text": "You really surprised me", "emotion": "surprise"},
    {"text": "Whoa, that came out of nowhere", "emotion": "surprise"},
    {"text": "That is amazing and unexpected", "emotion": "surprise"},
    {"text": "I am blown away by this news", "emotion": "surprise"},
    # neutral
    {"text": "I am going to the store", "emotion": "neutral"},
    {"text": "The weather is fine today", "emotion": "neutral"},
    {"text": "Let us talk about this later", "emotion": "neutral"},
    {"text": "I will be home this evening", "emotion": "neutral"},
    {"text": "Okay, see you tomorrow", "emotion": "neutral"},
    {"text": "I just finished my lunch", "emotion": "neutral"},
    {"text": "Can you send me that file", "emotion": "neutral"},
    {"text": "I am working right now", "emotion": "neutral"},
    {"text": "What time is the meeting", "emotion": "neutral"},
    {"text": "That sounds reasonable", "emotion": "neutral"},
]

DATASET: list[dict] = MYANMAR_DATA + ENGLISH_DATA


def load_dataset() -> list[dict]:
    """Return the training dataset.

    Prefers Hugging Face data (cached locally after the first fetch) for the five
    non-neutral emotions, always keeps the curated neutral examples, and falls back
    to the fully embedded curated set when Hugging Face is unavailable.
    """
    rows = _load_composed()
    if not rows:
        logger.warning("HF load failed or empty — falling back to embedded dataset")
        rows = [dict(d) for d in DATASET]
    return rows


def _load_composed() -> list[dict]:
    """Merge balanced HF rows with the full embedded curated set.

    The curated (clean, hand-written) sentences are always appended to every class so
    common demo inputs stay robust; the HF rows add real-world variety.
    """
    hf_rows = _load_hf_cached()
    balanced = _balance(hf_rows, HF_MAX_PER_EMOTION)
    return balanced + [dict(d) for d in DATASET]


def _load_hf_cached() -> list[dict]:
    """Return cached HF rows, rebuilding (and re-caching) when stale or absent."""
    if not HF_REFRESH and HF_CACHE_FILE.exists():
        try:
            data = json.loads(HF_CACHE_FILE.read_text(encoding="utf-8"))
            if isinstance(data, list):
                return data
        except (OSError, ValueError):
            pass

    rows = _build_hf_rows()
    try:
        HF_CACHE_FILE.write_text(
            json.dumps(rows, ensure_ascii=False), encoding="utf-8"
        )
        logger.info("Hugging Face dataset cached (%d rows)", len(rows))
    except OSError:
        pass
    return rows


def _build_hf_rows() -> list[dict]:
    rows: list[dict] = []
    rows.extend(_fetch_english())
    rows.extend(_fetch_myanmar())
    return _balance(rows, HF_MAX_PER_EMOTION)


def _balance(rows: list[dict], per_emotion: int) -> list[dict]:
    """Deterministically cap each emotion class to at most `per_emotion` rows."""
    grouped: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        grouped[r.get("emotion")].append(r)
    rng = random.Random(42)
    out: list[dict] = []
    for emotion in CORE_EMOTIONS:
        items = grouped.get(emotion, [])
        if not items:
            continue
        rng.shuffle(items)
        out.extend(items[:per_emotion])
    return out


def _fetch_english() -> list[dict]:
    """Page dair-ai/emotion via the HF datasets-server rows API.

    Stops early once every non-neutral class reaches HF_MAX_PER_EMOTION.
    """
    target = {e: 0 for e in CORE_EMOTIONS}
    out: list[dict] = []
    seen: set[tuple[str, str]] = set()

    for split in ("train", "validation", "test"):
        offset = 0
        while True:
            if all(v >= HF_MAX_PER_EMOTION for v in target.values()):
                return out
            url = (
                "https://datasets-server.huggingface.co/rows"
                f"?dataset={ENGLISH_HF_DATASET}&config=split&split={split}"
                f"&offset={offset}&length=100"
            )
            payload = _get_json(url)
            if payload is None:
                return out
            total = int(payload.get("num_rows_total") or 0)
            names: list[str] | None = None
            for feature in payload.get("features", []):
                if feature.get("name") == "label" and isinstance(feature.get("type"), dict):
                    names = feature["type"].get("names")
                    break
            rows = payload.get("rows", [])
            if not rows:
                return out
            for item in rows:
                row = item.get("row", {})
                text = str(row.get("text") or "").strip()
                if not text:
                    continue
                emotion = _map_english_label(row.get("label"), names)
                if emotion not in target:
                    continue
                key = (text, emotion)
                if key in seen or target[emotion] >= HF_MAX_PER_EMOTION:
                    continue
                seen.add(key)
                target[emotion] += 1
                out.append({"text": text, "emotion": emotion, "language": "english"})
            offset += len(rows)
            if offset >= total:
                break
    return out


def _map_english_label(label, names: list[str] | None) -> str | None:
    if isinstance(label, int) and names:
        try:
            return ENGLISH_LABEL_MAP.get(names[label])
        except (IndexError, TypeError):
            return None
    return ENGLISH_LABEL_MAP.get(label)


def _fetch_myanmar() -> list[dict]:
    """Download and parse the Myanmar emotion CSV from Hugging Face."""
    try:
        with urllib.request.urlopen(MYANMAR_HF_CSV, timeout=30) as resp:
            raw = resp.read()
    except (HTTPError, URLError, OSError):
        return []
    reader = csv.DictReader(io.StringIO(raw.decode("utf-8-sig")))
    out: list[dict] = []
    for entry in reader:
        text = (entry.get("text") or "").strip()
        emotion = MYANMAR_LABEL_MAP.get((entry.get("label") or "").strip())
        if text and emotion:
            out.append({"text": text, "emotion": emotion, "language": "myanmar"})
    return out


def _get_json(url: str) -> dict | None:
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except (HTTPError, URLError, OSError, ValueError):
        return None


def get_datasource_summary() -> dict:
    """Describe where the current training data comes from (for metrics/debug)."""
    embedded = {e: 0 for e in EMOTIONS}
    for d in DATASET:
        embedded[d["emotion"]] += 1
    return {
        "source": "huggingface" if HF_CACHE_FILE.exists() else "embedded",
        "hf_max_per_emotion": HF_MAX_PER_EMOTION,
        "datasets": {
            "english": "dair-ai/emotion",
            "myanmar": "linnaein/burmese-emotion-dataset",
        },
        "embedded_distribution": embedded,
    }


def export_csv() -> Path:
    """Write the dataset to CSV (idempotent) and return the path."""
    path = DATA_DIR / "emotion_dataset.csv"
    if not path.exists():
        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f, fieldnames=["text", "emotion", "language"]
            )
            writer.writeheader()
            writer.writerows(DATASET)
    return path
