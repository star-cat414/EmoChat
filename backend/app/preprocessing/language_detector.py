"""Detect whether text is Myanmar, English, or mixed."""

import re

# Unicode range for Myanmar script (U+1000 - U+109F)
MYANMAR_RE = re.compile(r"[\u1000-\u109F]")
# Basic Latin letters (A-Z, a-z)
LATIN_RE = re.compile(r"[A-Za-z]")


def detect_language(text: str) -> str:
    """Detect language of a text string.

    Returns one of: "myanmar", "english", "mixed", "unknown".
    """
    if not text or not text.strip():
        return "unknown"

    myanmar_count = len(MYANMAR_RE.findall(text))
    latin_count = len(LATIN_RE.findall(text))

    if myanmar_count == 0 and latin_count == 0:
        return "unknown"
    if myanmar_count == 0:
        return "english"
    if latin_count == 0:
        return "myanmar"
    return "mixed"
