"""Myanmar Unicode normalization and text cleaning.

Myanmar text in the wild often contains inconsistencies:
- Zawgyi vs Unicode fonts (we assume Unicode input; Zawgyi->Unicode conversion is out of scope
  but a converter could be plugged in here).
- Normalization of codepoint sequences for stacked consonants / ligatures.
- Removal of stray whitespace, emoji, punctuation, URLs.
"""

import re
import unicodedata

# Common English stopwords that carry little emotion for token filtering
ENGLISH_STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "of", "to", "in", "on", "for",
    "with", "at", "by", "from", "i", "me", "my", "you", "your", "he", "she",
    "it", "we", "our", "they", "them", "this", "that", "these", "those",
    "is", "am", "are", "was", "were", "be", "been", "being", "have", "has",
    "had", "do", "does", "did", "will", "would", "shall", "should", "can",
    "could", "may", "might", "must", "not", "no", "so", "very", "too", "just",
}

MYANMAR_STOPWORDS = {
    "က", "ကို", "တွေ", "များ", "တယ်", "သည်", "ရဲ့", "နဲ့", "လည်း", "သာ",
    "တော့", "ပြီး", "ပါ", "ပြီ", "ကြီး", "ခဲ့", "နေ", "လား", "ရှိ", "မှာ",
}

# Non-meaningful chars to drop (punctuation, symbols, emoji)
NOISE_RE = re.compile(r"[\u2190-\u2BFF\uFE0F\u200D\u2700-\u27BF\u00A0\r\n\t]+")
# Any remaining punctuation / symbols
PUNCT_RE = re.compile(r"[^\w\u1000-\u109F\s'" + "'" + r"]", re.UNICODE)
URL_RE = re.compile(r"https?://\S+|www\.\S+")
# Consecutive whitespace
WS_RE = re.compile(r"\s+")

# Myanmar independent vowels / vowels that map to a canonical form
MYANMAR_VOWEL_ALIASES = {
    "အာ": "ာ",
    "အီ": "ီ",
    "အူ": "ူ",
    "အေ": "ေ",
}
# Signs to strip at token edges (sentence-final particles like "တယ်" we intentionally keep
# as they carry emotional force, e.g. "ပျော်တယ်").


def normalize_unicode(text: str) -> str:
    """Normalize Myanmar text to canonical composed form."""
    text = unicodedata.normalize("NFC", text)
    for alias, canon in MYANMAR_VOWEL_ALIASES.items():
        text = text.replace(alias, canon)
    return text


def clean_text(text: str) -> str:
    """Full cleaning pipeline for Myanmar + English + mixed text."""
    if not text:
        return ""
    text = text.lower()
    text = URL_RE.sub(" ", text)
    text = normalize_unicode(text)
    text = NOISE_RE.sub(" ", text)
    text = PUNCT_RE.sub(" ", text)
    # Collapse whitespace and strip edges
    text = WS_RE.sub(" ", text).strip()
    return text
