"""Tokenization for Myanmar, English, and mixed text.

Myanmar script has no spaces between words, so word segmentation requires heuristics.
For the N-Gram + HMM project we use syllable-based tokenization for Myanmar (a common,
simple and defensible approach) combined with Latin word tokenization for English.

Myanmar syllables are segmented by treating sequences of consonants, vowels, and combining
signs as atomic units. A robust-enough heuristic:
  - A syllable starts at a consonant letter (with 'က' or other base consonants) and continues
    through following medial/vowel/diacritic signs until the next consonant-start marker.
"""

import re

from app.preprocessing.language_detector import detect_language
from app.preprocessing.text_cleaner import clean_text

# Myanmar consonant letters
MYANMAR_CONSONANT_RE = re.compile(r"[\u1000-\u101C\u101E-\u102A\u103F]")
# Combining signs (vowel signs, medials, tones, digits) - they attach to preceding syllable
MYANMAR_ATTACH_RE = re.compile(r"^[\u102B-\u103E\u103A\u1037\u1038]")


def tokenize_myanmar_syllables(text: str) -> list[str]:
    """Segment Myanmar text into syllables (crude word proxies)."""
    tokens: list[str] = []
    current = ""
    for ch in text:
        if MYANMAR_CONSONANT_RE.match(ch):
            if current:
                tokens.append(current)
            current = ch
        else:
            current += ch
    if current:
        tokens.append(current)
    return tokens


def tokenize_english(text: str) -> list[str]:
    """Tokenize English into lowercase word tokens."""
    return re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", text.lower())


def tokenize(text: str, language: str | None = None) -> list[str]:
    """Tokenize cleaned text. If language is None, auto-detect."""
    if not text or not text.strip():
        return []
    text = clean_text(text)
    if language is None:
        language = detect_language(text)

    if language == "myanmar":
        return tokenize_myanmar_syllables(text)
    if language == "english":
        return tokenize_english(text)
    if language == "mixed":
        # Split into Myanmar runs and Latin runs, tokenizing each appropriately.
        tokens: list[str] = []
        for run in re.findall(r"[\u1000-\u109F]+|[A-Za-z]+(?:'[A-Za-z]+)?", text):
            if MYANMAR_CONSONANT_RE.match(run) or any(
                ord(c) >= 0x1000 for c in run
            ):
                tokens.extend(tokenize_myanmar_syllables(run))
            else:
                tokens.append(run.lower())
        return tokens
    return []


def filter_stopwords(tokens: list[str]) -> list[str]:
    """Remove common emotional-neutral stopwords (best-effort for both languages)."""
    from app.preprocessing.text_cleaner import ENGLISH_STOPWORDS, MYANMAR_STOPWORDS

    return [t for t in tokens if t not in ENGLISH_STOPWORDS and t not in MYANMAR_STOPWORDS]
