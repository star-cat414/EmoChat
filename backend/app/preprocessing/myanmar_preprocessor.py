"""Myanmar preprocessor: normalization -> cleaning -> syllable tokenization.

First-class Myanmar support for EmoChat. Provides a single entry point used by the
emotion model and by tests.
"""

from app.preprocessing.language_detector import detect_language
from app.preprocessing.text_cleaner import clean_text, normalize_unicode
from app.preprocessing.tokenizer import (
    filter_stopwords,
    tokenize,
    tokenize_myanmar_syllables,
)


class MyanmarPreprocessor:
    def __init__(self, remove_stopwords: bool = True):
        self.remove_stopwords = remove_stopwords

    def preprocess(self, text: str) -> dict:
        """Return normalized + tokenized representation.

        Returns:
            {
                "original": str,
                "clean": str,
                "language": str,
                "tokens": list[str],
                "n_tokens": int,
            }
        """
        language = detect_language(text)
        clean = clean_text(text)
        tokens = tokenize(clean, language)
        if self.remove_stopwords:
            tokens = filter_stopwords(tokens)
        return {
            "original": text,
            "clean": clean,
            "language": language,
            "tokens": tokens,
            "n_tokens": len(tokens),
        }
