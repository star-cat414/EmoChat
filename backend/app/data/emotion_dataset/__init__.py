"""Curated emotion dataset loader.

Dataset is embedded as structured Python data (easy to inspect for the final-year
project) and exported to CSV for training/evaluation. Contains Myanmar and English
examples across the six emotion classes.

Each entry: {"text": str, "emotion": str, "language": "myanmar"|"english"}
"""

from __future__ import annotations

import csv
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent / "emotion_dataset"

EMOTIONS = ["happy", "sad", "angry", "fear", "surprise", "neutral"]

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
    """Return the full curated dataset."""
    return [dict(d) for d in DATASET]


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
