"""Hidden Markov Model for emotion context modeling.

Hidden states: Happy, Sad, Angry, Fear, Surprise, Neutral.

The HMM captures EMOTIONAL CONTEXT between consecutive messages:
  Message 1 -> Happy, Message 2 -> Happy, Message 3 -> Sad, ...

Components:
  - Initial probabilities   P(state_1 = s)
  - Transition probabilities P(state_t = s | state_{t-1} = s')
  - Emission probabilities  P(observation_t | state_t = s)

For the emission we use the N-Gram emotion scores (the likelihood that an observed
message text came from each emotion class). This is the classic HMM formulation where
the "observation" is the message and the emission is its n-gram likelihood per state.

For a new conversation with no history, prediction uses only initial * emission.
"""

from __future__ import annotations

import math

import numpy as np

EMOTIONS = ["happy", "sad", "angry", "fear", "surprise", "neutral"]
EMOTION_INDEX = {e: i for i, e in enumerate(EMOTIONS)}


class HMM:
    def __init__(self, emotions: list[str] | None = None):
        self.emotions = emotions or EMOTIONS
        self.n = len(self.emotions)
        self.index = {e: i for i, e in enumerate(self.emotions)}

        # Initial / transition matrices (log-space to avoid underflow).
        self.initial_log: np.ndarray | None = None          # shape (n,)
        self.transition_log: np.ndarray | None = None       # shape (n, n)
        self.emission_log: np.ndarray | None = None         # shape (n,)

    # ------------------------------------------------------------------ fit
    def fit(
        self,
        sequences: list[list[str]],
        emission_counts: dict[str, int] | None = None,
    ) -> None:
        """Estimate parameters from labeled emotion sequences.

        Args:
            sequences: list of emotion-label sequences, e.g. [["happy","happy","sad"], ...].
            emission_counts: counts of how many observations were observed under each state
                                (used to seed emission priors); optional.
        """
        initial = np.zeros(self.n)
        transition = np.zeros((self.n, self.n))
        emission = np.ones(self.n)  # Laplace prior on emission

        for seq in sequences:
            if not seq:
                continue
            if isinstance(seq[0], dict):  # tolerance for structured seqs
                seq = [s["emotion"] for s in seq]
            for i, label in enumerate(seq):
                idx = self.index.get(label)
                if idx is None:
                    continue
                if i == 0:
                    initial[idx] += 1
                else:
                    prev = self.index.get(seq[i - 1])
                    if prev is not None:
                        transition[prev, idx] += 1
                emission[idx] += 1

        if emission_counts:
            for label, count in emission_counts.items():
                if label in self.index:
                    emission[self.index[label]] += count

        self.initial_log = _log_normalize(initial)
        self.transition_log = _log_normalize_rows(transition)
        self.emission_log = _log_normalize(emission)

    # --------------------------------------------------------------- forward
    def predict(self, log_emissions: list[np.ndarray]) -> np.ndarray:
        """Predict state distribution after a sequence of log-emission vectors.

        Args:
            log_emissions: list of length T; each is log-emission (n,) per message.

        Returns:
            Posterior distribution over the final state, shape (n,).
        """
        if not log_emissions:
            raise ValueError("No observations")

        if self.initial_log is None or self.transition_log is None:
            raise RuntimeError("HMM not fitted")

        # Forward algorithm in log space.
        alpha_log = self.initial_log + log_emissions[0]
        for t in range(1, len(log_emissions)):
            # alpha_t[j] = max_i (alpha_{t-1}[i] * trans[i,j]) * emission_t[j]
            # Use log-sum of (alpha_prev[:,None] + trans) over i.
            candidates = alpha_log[:, None] + self.transition_log  # (n, n)
            next_alpha = np.max(candidates, axis=0)
            alpha_log = next_alpha + log_emissions[t]

        # Convert log to probs (softmax).
        return _softmax(alpha_log)

    def viterbi(self, log_emissions: list[np.ndarray]) -> list[str]:
        """Viterbi decoding -> most likely emotion sequence."""
        if not log_emissions:
            return []
        if self.initial_log is None or self.transition_log is None:
            raise RuntimeError("HMM not fitted")

        T = len(log_emissions)
        # delta[t][s] = best log prob of path ending at state s at time t
        delta = np.zeros((T, self.n))
        psi = np.zeros((T, self.n), dtype=int)

        delta[0] = self.initial_log + log_emissions[0]
        for t in range(1, T):
            for s in range(self.n):
                vals = delta[t - 1] + self.transition_log[:, s]
                psi[t, s] = int(np.argmax(vals))
                delta[t, s] = vals[psi[t, s]] + log_emissions[t][s]

        # Backtrack
        path = [0] * T
        path[T - 1] = int(np.argmax(delta[T - 1]))
        for t in range(T - 2, -1, -1):
            path[t] = psi[t + 1, path[t + 1]]

        return [self.emotions[s] for s in path]


def _log_normalize(v: np.ndarray) -> np.ndarray:
    v = v + 1e-12
    return np.log(v / v.sum())


def _log_normalize_rows(m: np.ndarray) -> np.ndarray:
    m = m + 1e-12
    sums = m.sum(axis=1, keepdims=True)
    return np.log(m / sums)


def _softmax(v: np.ndarray) -> np.ndarray:
    e = np.exp(v - v.max())
    return e / e.sum()


def log_softmax(v: np.ndarray) -> np.ndarray:
    m = v.max()
    return v - m - math.log(np.exp(v - m).sum())
