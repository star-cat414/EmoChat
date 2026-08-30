"""Curated emotion dataset loader with Hugging Face data.

Training data comes from several public Hugging Face datasets (fetched with the
Python standard library — raw CSV / datasets-server paging — so no extra
dependencies are required):

  - English : dair-ai/emotion          (Twitter emotion, train 16k / val 2k / test 2k)
  - English : go_emotions-en           (Reddit, 43k+ train, 28-class incl. neutral)
  - English : ISEAR English subset     (psychology narratives, 6.1k rows)
  - Myanmar : linnaein/burmese-emotion-dataset   (3,475 rows, CSV)
  - Myanmar : kalixlouiis/myanmar-sentiment-analysis (1,665 rows, CSV, neutral only)
  - Myanmar : DatarrX/nava-rasa-myanmar-corpus    (450 rows, CSV)

(All but dair-ai/emotion are the Hugging Face mirrors of data also distributed on
Kaggle — GoEmotions, ISEAR, and the Burmese sentiment corpora.)

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
import time
import urllib.request
from pathlib import Path
from urllib.error import HTTPError, URLError

logger = logging.getLogger("emochat")

DATA_DIR = Path(__file__).resolve().parent

EMOTIONS = ["happy", "sad", "angry", "fear", "surprise", "neutral"]

NEUTRAL = "neutral"
CORE_EMOTIONS = [e for e in EMOTIONS if e != NEUTRAL]

HF_MAX_PER_EMOTION = int(os.getenv("HF_MAX_PER_EMOTION", "3000"))
HF_MAX_NEUTRAL = int(os.getenv("HF_MAX_NEUTRAL", "1500"))
HF_REFRESH = os.getenv("HF_REFRESH", "").strip().lower() in ("1", "true", "yes")

HF_CACHE_FILE = DATA_DIR / "hf_dataset_cache_v2.json"

# A finished fetch must yield at least this many english rows; otherwise the cache
# write is skipped so a rate-limited build never becomes a permanent degraded cache.
HF_MIN_ENGLISH_ROWS = int(os.getenv("HF_MIN_ENGLISH_ROWS", "1500"))

# Legacy id kept for reference; the loader now pages many sources (see ENGLISH_SOURCES).
ENGLISH_HF_DATASET = "dair-ai/emotion"
ENGLISH_LABEL_MAP = {
    "sadness": "sad",
    "joy": "happy",
    "love": "happy",
    "anger": "angry",
    "fear": "fear",
    "surprise": "surprise",
}

# GoEmotions basic-Ekman label ids (config `simplified_ekman`, column `labels_ekman`).
GOE_EKMAN_MAP = {
    0: "angry",  # anger
    2: "fear",  # fear
    3: "happy",  # joy
    4: "sad",  # sadness
    5: "surprise",
    6: "neutral",
}

# ISEAR emotion ids (column `EMOT`).
ISEAR_MAP = {
    1: "happy",  # joy
    2: "fear",
    3: "angry",
    4: "sad",  # sadness
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

# Myanmar sentiment (3-class) — only Neutral is kept; Negative is too ambiguous
# between sad/angry, and Positive product praise is not reliably "happy".
KALIX_CSV = (
    "https://huggingface.co/datasets/kalixlouiis/myanmar-sentiment-analysis/"
    "resolve/main/myanmar_sentiment_dataset.csv"
)
KALIX_LABEL_MAP = {
    "Neutral": "neutral",
}

# Classical nine-rasas corpus — disgust (ဝိဘစ္ဆရသ) is intentionally excluded.
NAVA_CSV = (
    "https://huggingface.co/datasets/DatarrX/nava-rasa-myanmar-corpus/"
    "resolve/main/data.csv"
)
NAVA_RASA_MAP = {
    "သိင်္ဂါရရသ": "happy",  # love / romance
    "ဟဿရသ": "happy",  # humor
    "ကရုဏာရသ": "sad",  # grief / pathos
    "ရုဒ္ဒရသ": "angry",  # anger
    "ဝီရရသ": "surprise",  # heroism (stirring)
    "ဘယာနကရသ": "fear",  # terror
    "အဗ္ဘုတရသ": "surprise",  # wonder
    "သန္တရသ": "neutral",  # peace
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
    {"text": "ဒီကနေ့ ရာသီဥတုကောင်းတယ်", "emotion": "neutral"},
    {"text": "ငါ ရုံးကို သွားနေတယ်", "emotion": "neutral"},
    {"text": "ညစာစားဖို့ ဟင်းချက်နေတယ်", "emotion": "neutral"},
    {"text": "ဒီစာအုပ်ကို ဖတ်ပြီးပြီ", "emotion": "neutral"},
    {"text": "အလုပ်ပြီးရင် အိမ်ပြန်မယ်", "emotion": "neutral"},
    {"text": "သူက ဆရာဝန်တစ်ယောက်ပါ", "emotion": "neutral"},
    {"text": "ဒီလမ်းက စျေးဆီသွားတယ်", "emotion": "neutral"},
    {"text": "မနက်ဖြန် အစည်းအဝေးရှိတယ်", "emotion": "neutral"},
    {"text": "ငါ့ဖုန်းအားသွင်းထားတယ်", "emotion": "neutral"},
    {"text": "ရေသန့်ဘူးဝယ်ပြီးပြီ", "emotion": "neutral"},
    {"text": "တခြားအချိန်ကျရင် ပြောရအောင်", "emotion": "neutral"},
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
    {"text": "I'll call you back in an hour", "emotion": "neutral"},
    {"text": "The train arrives at noon", "emotion": "neutral"},
    {"text": "Please send the report by Friday", "emotion": "neutral"},
    {"text": "I need to buy groceries later", "emotion": "neutral"},
    {"text": "The meeting starts at three", "emotion": "neutral"},
    {"text": "This document has been filed", "emotion": "neutral"},
    {"text": "He works at the bank downtown", "emotion": "neutral"},
    {"text": "I usually wake up at seven", "emotion": "neutral"},
    {"text": "The shop closes at nine", "emotion": "neutral"},
    {"text": "Can you pass the salt please", "emotion": "neutral"},
    {"text": "I left my keys on the table", "emotion": "neutral"},
    {"text": "We can discuss this tomorrow", "emotion": "neutral"},
]

DATASET: list[dict] = MYANMAR_DATA + ENGLISH_DATA


def load_dataset() -> list[dict]:
    """Return the training dataset.

    Prefers Hugging Face data (cached locally after the first fetch) for all six
    emotions, always keeps the full embedded curated set, and falls back to the
    embedded set when Hugging Face is unavailable.
    """
    rows = _load_composed()
    if not rows:
        logger.warning("HF load failed or empty — falling back to embedded dataset")
        rows = _with_language([dict(d) for d in DATASET])
    return rows


def _with_language(rows: list[dict]) -> list[dict]:
    """Tag embedded rows (which have no language field) by script."""
    from app.preprocessing.language_detector import detect_language

    out: list[dict] = []
    for r in rows:
        if r.get("language"):
            out.append(r)
            continue
        lang = detect_language(r.get("text", ""))
        out.append({**r, "language": "english" if lang == "english" else "myanmar"})
    return out


def _load_composed() -> list[dict]:
    """Merge balanced HF rows with the full embedded curated set.

    The curated (clean, hand-written) sentences are always appended to every class so
    common demo inputs stay robust; the HF rows add real-world variety.
    """
    hf_rows = _load_hf_cached()
    balanced = _balance(hf_rows, HF_MAX_PER_EMOTION, HF_MAX_NEUTRAL)
    return balanced + _with_language([dict(d) for d in DATASET])


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
    english_count = sum(1 for r in rows if r.get("language") == "english")
    if english_count < HF_MIN_ENGLISH_ROWS:
        # Refuse to persist a degraded cache (e.g. while HF rate-limits us),
        # so the server never trains on a Myanmar-only build by accident.
        logger.warning(
            "skipping HF cache write: only %d english rows (need >= %d)",
            english_count,
            HF_MIN_ENGLISH_ROWS,
        )
        return rows
    try:
        HF_CACHE_FILE.write_text(
            json.dumps(rows, ensure_ascii=False), encoding="utf-8"
        )
        logger.info("Hugging Face dataset cached (%d rows)", len(rows))
    except OSError:
        pass
    return rows


def _build_hf_rows() -> list[dict]:
    """Pull every Hugging Face source (paged APIs + raw CSVs), then balance."""
    rows: list[dict] = []
    for src in ENGLISH_SOURCES:
        rows.extend(
            _page_hf(
                dataset=src["dataset"],
                config=src["config"],
                splits=src["splits"],
                text_field=src["text_field"],
                extract=src["extract"],
            )
        )
    rows.extend(_fetch_csv(MYANMAR_HF_CSV, MYANMAR_LABEL_MAP))
    if os.getenv("MYANMAR_INCLUDE_KALIX", "1").strip().lower() in ("1", "true", "yes"):
        rows.extend(_fetch_csv(KALIX_CSV, KALIX_LABEL_MAP))
    if os.getenv("MYANMAR_INCLUDE_NAVA", "1").strip().lower() in ("1", "true", "yes"):
        rows.extend(_fetch_csv(NAVA_CSV, NAVA_RASA_MAP))
    return _balance(rows, HF_MAX_PER_EMOTION, HF_MAX_NEUTRAL)


def _balance(rows: list[dict], per_emotion: int, neutral_cap: int) -> list[dict]:
    """Deterministically cap each (language, emotion) class at its cap.

    Balancing per language (instead of globally) keeps the Myanmar classes from
    being flushed out by the much larger English sources, and keeps per-language
    class sizes even so the n-gram priors do not drift toward the largest class.
    """
    rng = random.Random(42)
    out: list[dict] = []
    for language in ("english", "myanmar"):
        for emotion in EMOTIONS:
            cap = neutral_cap if emotion == NEUTRAL else per_emotion
            pool = [
                r for r in rows
                if r.get("language") == language and r.get("emotion") == emotion
            ]
            rng.shuffle(pool)
            out.extend(pool[:cap])
    return out


def _page_hf(
    dataset: str,
    config: str,
    splits: tuple[str, ...],
    text_field: str,
    extract,
) -> list[dict]:
    """Page a Hugging Face dataset via the datasets-server rows API.

    Stops early once every emotion reaches its cap.
    """
    caps = {e: (HF_MAX_NEUTRAL if e == NEUTRAL else HF_MAX_PER_EMOTION) for e in EMOTIONS}
    counts = {e: 0 for e in EMOTIONS}
    out: list[dict] = []
    seen: set[tuple[str, str]] = set()

    for split in splits:
        offset = 0
        while True:
            if all(counts[e] >= caps[e] for e in EMOTIONS):
                return out
            url = (
                "https://datasets-server.huggingface.co/rows"
                f"?dataset={dataset}&config={config}&split={split}"
                f"&offset={offset}&length=100"
            )
            payload = _get_json(url)
            if payload is None:
                return out  # keep whatever pages we already collected
            time.sleep(0.2)
            total = int(payload.get("num_rows_total") or 0)
            rows = payload.get("rows", [])
            if not rows:
                return out
            for item in rows:
                row = item.get("row", {})
                text = str(row.get(text_field) or "").strip()
                if not text:
                    continue
                emotion = extract(row)
                if emotion not in EMOTIONS or counts[emotion] >= caps[emotion]:
                    continue
                key = (text, emotion)
                if key in seen:
                    continue
                seen.add(key)
                counts[emotion] += 1
                out.append({"text": text, "emotion": emotion, "language": "english"})
            offset += len(rows)
            if offset >= total:
                break
    return out


def _extract_dair(row: dict) -> str | None:
    """dair-ai/emotion: `label` is an int index into the class-label names."""
    value = row.get("label")
    if isinstance(value, int):
        # Feature names are the classic Twitter emotion label order.
        names = ("sadness", "joy", "love", "anger", "fear", "surprise")
        try:
            return ENGLISH_LABEL_MAP.get(names[value])
        except IndexError:
            return None
    return ENGLISH_LABEL_MAP.get(value)


def _extract_goe(row: dict) -> str | None:
    """go_emotions-en: `labels_ekman` is a list of basic-Emotion ids; keep single-label."""
    value = row.get("labels_ekman")
    if not isinstance(value, list) or len(value) != 1:
        return None
    return GOE_EKMAN_MAP.get(int(value[0]))


def _extract_isear(row: dict) -> str | None:
    """ISEAR: `EMOT` is the numeric emotion id; keep joy/fear/anger/sadness only."""
    value = row.get("EMOT")
    if not isinstance(value, int):
        return None
    return ISEAR_MAP.get(value)


ENGLISH_SOURCES: list[dict] = [
    {
        "dataset": "dair-ai/emotion",
        "config": "split",
        "splits": ("train", "validation", "test"),
        "text_field": "text",
        "extract": _extract_dair,
    },
    {
        "dataset": "AiLab-IMCS-UL/go_emotions-en",
        "config": "simplified_ekman",
        "splits": ("train", "validation", "test"),
        "text_field": "text",
        "extract": _extract_goe,
    },
    {
        "dataset": "savalera/isear-from-original",
        "config": "original",
        "splits": ("train",),
        "text_field": "SIT",
        "extract": _extract_isear,
    },
]


def _fetch_csv(url: str, label_map: dict[str, str]) -> list[dict]:
    """Download and parse a `text,label` CSV from Hugging Face."""
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            raw = resp.read()
    except (HTTPError, URLError, OSError):
        return []
    try:
        reader = csv.DictReader(io.StringIO(raw.decode("utf-8-sig")))
    except (UnicodeDecodeError, ValueError):
        return []
    out: list[dict] = []
    seen: set[str] = set()
    for entry in reader:
        text = (entry.get("text") or "").strip()
        emotion = label_map.get((entry.get("label") or "").strip())
        if text and emotion and text not in seen:
            seen.add(text)
            out.append({"text": text, "emotion": emotion, "language": "myanmar"})
    return out


def _get_json(url: str) -> dict | None:
    """GET JSON with retry/backoff on transient failures (rate limits, 5xx)."""
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except HTTPError as exc:
            if exc.code == 429 or exc.code >= 500:
                delay = 5 * (attempt + 1)
                logger.warning("transient %s on %s — retrying in %ss", exc.code, url, delay)
                time.sleep(delay)
                continue
            logger.warning("HTTP %s on %s", exc.code, url)
            return None
        except (URLError, OSError, ValueError):
            time.sleep(5 * (attempt + 1))
            continue
    logger.warning("giving up on %s after retries", url)
    return None


def get_datasource_summary() -> dict:
    """Describe where the current training data comes from (for metrics/debug)."""
    embedded = {e: 0 for e in EMOTIONS}
    for d in DATASET:
        embedded[d["emotion"]] += 1
    return {
        "source": "huggingface" if HF_CACHE_FILE.exists() else "embedded",
        "hf_max_per_emotion": HF_MAX_PER_EMOTION,
        "hf_max_neutral": HF_MAX_NEUTRAL,
        "datasets": {
            "english": [
                "dair-ai/emotion",
                "go_emotions-en (Ekman)",
                "ISEAR English subset",
            ],
            "myanmar": [
                "linnaein/burmese-emotion-dataset",
                "kalixlouiis/myanmar-sentiment-analysis",
                "DatarrX/nava-rasa-myanmar-corpus",
            ],
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
