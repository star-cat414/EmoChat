"""General N-Gram next-word predictor (Unigram + Bigram + Trigram interpolation).

This is a language-modeling autocomplete used for the "N-Gram Predictor" UI overlay.
Unlike the emotion classifier (which builds one model per emotion class), this builds a
single generic language model over the entire curated corpus so it can suggest the most
likely next word given the words typed so far.

Scoring:
    For each candidate word w:
        P(w | prefix) = max over the available context orders
            - Unigram : P(w)
            - Bigram  : P(w | last)
            - Trigram : P(w | prev2, last)  (only if two words of context are present)

We apply Laplace (add-one) smoothing against the vocabulary size, and return the top-K
candidates normalized to sum to 1 (with their raw probabilities attached).
"""

from __future__ import annotations

from collections import defaultdict

from app.models.ngram import make_ngrams


class NGramPredictor:
    def __init__(self, n: int = 3):
        self.n = n
        self.counts: dict[tuple[str, ...], int] = defaultdict(int)
        self.context_counts: dict[tuple[str, ...], int] = defaultdict(int)
        self.vocabulary: set[str] = set()
        self.total_ngrams = 0

    def fit(self, documents: list[list[str]]) -> None:
        """Fit a generic language model over tokenized documents."""
        for doc in documents:
            for ngram in make_ngrams(doc, self.n):
                self.counts[ngram] += 1
                self.total_ngrams += 1
                self.vocabulary.update(ngram)
            for context in self._contexts(doc):
                self.context_counts[context] += 1

    def _contexts(self, doc: list[str]) -> list[tuple[str, ...]]:
        nlist = make_ngrams(doc, self.n)
        return [n[:-1] for n in nlist]

    @property
    def vocab_size(self) -> int:
        return len(self.vocabulary)

    # ------------------------------------------------------------ probabilities
    def unigram_prob(self, word: str) -> float:
        return (self.counts.get((word,), 0) + 1) / (self.total_ngrams + self.vocab_size)

    def bigram_prob(self, prev: str, word: str) -> float:
        ctx = self.context_counts.get((prev,), 0)
        return (self.counts.get((prev, word), 0) + 1) / (ctx + self.vocab_size)

    def trigram_prob(self, prev2: str, prev: str, word: str) -> float:
        ctx = self.context_counts.get((prev2, prev), 0)
        return (self.counts.get((prev2, prev, word), 0) + 1) / (ctx + self.vocab_size)

    # ------------------------------------------------------------ suggestions
    def suggest(self, prefix: list[str], top_k: int = 4) -> list[dict]:
        """Return top-k next-word suggestions with probabilities given a token prefix.

        Args:
            prefix: tokens already typed (e.g. ["hello", "my"]). An empty list means
                    predict the start of a sentence (uses <s> context).
            top_k: number of suggestions to return.

        Returns:
            List of {"word": str, "probability": float, "order": int} sorted desc by
            probability. "order" is the highest n-gram order that produced the estimate.
        """
        if not self.vocabulary:
            return []

        tail = prefix[-2:] if prefix else ["<s>"]

        if len(tail) >= 2:
            prev2, last = tail
            scored: list[tuple[float, str, int]] = []
            for w in self.vocabulary:
                p = self.trigram_prob(prev2, last, w)
                scored.append((p, w, 3))
        elif len(tail) == 1:
            last = tail[0]
            scored = [(self.bigram_prob(last, w), w, 2) for w in self.vocabulary]
        else:
            scored = [(self.unigram_prob(w), w, 1) for w in self.vocabulary]

        scored.sort(key=lambda x: x[0], reverse=True)
        # Exclude sentence-boundary pseudo-tokens from suggestions.
        suggestions = [(p, w, o) for p, w, o in scored if w not in ("<s>", "</s>")][:top_k]

        total = sum(p for p, _, _ in suggestions) or 1.0
        return [
            {
                "word": w,
                "probability": round(p / total, 4),
                "order": o,
            }
            for p, w, o in suggestions
        ]

    def transition_samples(self, order: int = 2, limit: int = 12) -> list[dict]:
        """Sample the most common {context -> word} transitions for the metrics drawer.

        Args:
            order: 2 (bigram) or 3 (trigram) context length.
            limit: max number of samples to return.

        Returns:
            List of {"context": [...], "word": str, "count": int, "probability": float}.
        """
        ctx_len = order
        samples: list[dict] = []
        seen: set[tuple[str, ...]] = set()

        # Most frequent n-grams first.
        ngrams = sorted(self.counts.items(), key=lambda kv: kv[1], reverse=True)
        for ngram, count in ngrams:
            if len(ngram) != ctx_len + 1 or len(ngram) > self.n:
                continue
            if any(t in ("<s>", "</s>") for t in ngram):
                continue
            context = ngram[:-1]
            if context in seen:
                continue
            seen.add(context)
            context_count = sum(c for g, c in self.counts.items() if g[:-1] == context)
            prob = (count + 1) / (context_count + self.vocab_size)
            samples.append(
                {
                    "context": list(context),
                    "word": ngram[-1],
                    "count": count,
                    "probability": round(prob, 6),
                }
            )
            if len(samples) >= limit:
                break

        return samples
