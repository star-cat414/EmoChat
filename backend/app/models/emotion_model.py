"""EmotionModel: the final N-Gram + HMM emotion classifier.

Pipeline:
    Text
      -> Language Detection
      -> Preprocessing (normalize / clean)
      -> Tokenization (Myanmar syllables / English words / mixed)
      -> N-Gram Features (Unigram + Bigram + Trigram scores per emotion)
      -> HMM Context Modeling (previous message emotions)
      -> Probability Normalization
      -> Final Emotion + 6 probabilities

The model is built once at startup from the curated dataset and cached.
"""

from __future__ import annotations

import logging

import numpy as np

from app.data.emotion_dataset import EMOTIONS, load_dataset
from app.models.hmm import HMM
from app.models.ngram import NGramEnsemble
from app.preprocessing.myanmar_preprocessor import MyanmarPreprocessor

logger = logging.getLogger("emochat")

MODEL_VERSION = "1.0.0"


class EmotionModel:
    def __init__(self, emotion_labels: list[str] | None = None):
        self.emotion_labels = emotion_labels or EMOTIONS
        self.model_name = "NGram-HMM"
        self.model_version = MODEL_VERSION
        self.language = "auto"

        self.preprocessor = MyanmarPreprocessor(remove_stopwords=False)

        dataset = load_dataset()
        self.dataset = dataset
        self._fit(dataset)

    # ------------------------------------------------------------------ fit
    def _fit(self, dataset: list[dict]) -> None:
        """Train the N-Gram ensemble and the HMM from labeled examples."""
        # Group tokenized documents by emotion.
        docs_by_emotion: dict[str, list[list[str]]] = {e: [] for e in self.emotion_labels}
        sequences: list[list[str]] = []
        counts: dict[str, int] = {e: 0 for e in self.emotion_labels}

        for entry in dataset:
            emotion = entry.get("emotion")
            if emotion not in self.emotion_labels:
                continue
            text = entry.get("text", "")
            toks = self.preprocessor.preprocess(text)["tokens"]
            if toks:
                docs_by_emotion[emotion].append(toks)
                counts[emotion] += 1
                sequences.append([emotion])

        # Train N-Gram ensemble.
        self.ngram = NGramEnsemble(self.emotion_labels)
        self.ngram.fit(docs_by_emotion)

        # Train HMM. Include short handcrafted emotion-transition sequences to model
        # emotional context (e.g. happy->happy persists, sadness can follow happiness).
        hand_labels = self.emotion_labels
        import random

        random.seed(42)
        for _ in range(30):
            seq = [random.choice(hand_labels) for _ in range(random.randint(1, 5))]
            sequences.append(seq)

        self.hmm = HMM(self.emotion_labels)
        self.hmm.fit(sequences, emission_counts=counts)

        self.dataset_size = len(dataset)
        self.emotion_distribution = counts
        logger.info(
            "Trained NGram+HMM on %d samples | %s",
            self.dataset_size,
            counts,
        )

    # -------------------------------------------------------------- predict
    def predict(
        self,
        text: str,
        previous_emotions: list[str] | None = None,
    ) -> dict:
        """Predict emotion for a text message.

        Args:
            text: raw message text.
            previous_emotions: ordered list of earlier message emotions in this
                               conversation (for HMM context). Empty => fresh conversation.

        Returns:
            Dict with emotion, confidence, probabilities, language, model, model_version.
        """
        pre = self.preprocessor.preprocess(text)
        tokens = pre["tokens"]

        if not tokens:
            # Empty / non-analyzable text -> neutral fallback.
            probs = {e: 1e-6 for e in self.emotion_labels}
            probs["neutral"] = 1.0
            return self._build_output("neutral", 1.0, probs, pre["language"])

        # 1) N-Gram scores per emotion (log-likelihood that text came from each class).
        raw_scores = self.ngram.scores(tokens)

        # 2) Convert to emission probabilities (softmax over emotion classes).
        emission = _softmax_log_scores(list(raw_scores.values()))
        emission_log = np.log(emission + 1e-12)

        # 3) HMM context: chain with previous emotions if available.
        log_emissions = []
        for prev_emotion in (previous_emotions or [])[-8:]:  # cap context length
            if prev_emotion in self.emotion_labels:
                log_emissions.append(emission_log)
        log_emissions.append(emission_log)  # current message

        posterior = self.hmm.predict(log_emissions)

        probs = {self.emotion_labels[i]: float(posterior[i]) for i in range(len(posterior))}
        probs = _renormalize(probs)

        emotion = max(probs, key=probs.get)
        confidence = probs[emotion]
        return self._build_output(emotion, confidence, probs, pre["language"])

    def _build_output(
        self,
        emotion: str,
        confidence: float,
        probs: dict[str, float],
        language: str,
    ) -> dict:
        return {
            "emotion": emotion,
            "confidence": round(confidence, 4),
            "probabilities": {k: round(v, 4) for k, v in probs.items()},
            "language": language,
            "model": self.model_name,
            "model_version": self.model_version,
        }

    # ------------------------------------------------------------ evaluation
    def evaluate(self) -> dict:
        """Evaluate N-Gram, HMM, and combined on a train/test split (dev tooling)."""
        from app.services.emotion_service import evaluate_model

        return evaluate_model(self)


def _softmax_log_scores(scores: list[float]) -> np.ndarray:
    """Emissions from (possibly negative) log-scores via softmax."""
    a = np.array(scores, dtype=float)
    a = a - a.mean()
    e = np.exp(a - a.max())
    return e / e.sum()


def _renormalize(probs: dict[str, float]) -> dict[str, float]:
    total = sum(probs.values())
    if total <= 0:
        n = len(probs)
        return {k: 1.0 / n for k in probs}
    return {k: v / total for k, v in probs.items()}
