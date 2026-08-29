import type {
  EmotionLabel,
  Prediction,
} from "@/lib/emotions";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface EmotionPredictRequest {
  text: string;
  conversation_id?: string | null;
  user_id?: string | null;
  previous_emotions?: string[];
}

/**
 * Call the FastAPI emotion predictor. Returns null on any failure so that
 * messaging is never blocked by NLP availability.
 */
export async function predictEmotion(
  req: EmotionPredictRequest
): Promise<Prediction | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${API_URL}/api/emotion/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return (await res.json()) as Prediction;
  } catch {
    return null;
  }
}

export async function transcribeVoice(file: File): Promise<{ transcript: string } | null> {
  try {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_URL}/api/voice/transcribe`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface VoiceEmotionResult extends Prediction {
  transcript: string;
}

export async function voiceEmotion(
  file: File,
  previous_emotions?: string[]
): Promise<VoiceEmotionResult | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const form = new FormData();
    form.append("file", file);
    if (previous_emotions?.length) {
      form.append("previous_emotions", previous_emotions.join(","));
    }
    const res = await fetch(`${API_URL}/api/voice/emotion`, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  [key: string]: number | string;
}

export interface ModelEvaluation {
  dataset_size: number;
  emotions: string[];
  emotion_distribution: Record<string, number>;
  per_language: {
    language: string;
    correct: number;
    total: number;
    accuracy: number;
  }[];
  metrics: Record<string, ModelMetrics>;
  confusion_matrix: { labels: string[]; matrix: number[][] };
  split: { train: number; test: number };
}

export async function fetchModelEvaluation(): Promise<ModelEvaluation | null> {
  try {
    const res = await fetch(`${API_URL}/api/model/evaluate`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface CallEmotionResult extends Prediction {
  transcript: string;
}

export async function callEmotion(
  file: File,
  previous_emotions?: string[]
): Promise<CallEmotionResult | null> {
  try {
    const form = new FormData();
    form.append("file", file);
    if (previous_emotions?.length) {
      form.append("previous_emotions", previous_emotions.join(","));
    }
    const res = await fetch(`${API_URL}/api/calls/emotion`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface NGramSuggestion {
  word: string;
  probability: number;
  order: number;
}

export interface NGramCompleteResult {
  text: string;
  prefix: string[];
  suggestions: NGramSuggestion[];
}

/** N-Gram next-word prediction for the smart input bar. Returns empty list on failure. */
export async function ngramComplete(
  text: string,
  topK = 4
): Promise<NGramSuggestion[]> {
  try {
    const res = await fetch(`${API_URL}/api/ngram/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, top_k: topK }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as NGramCompleteResult;
    return data.suggestions ?? [];
  } catch {
    return [];
  }
}

export interface HMMTransitionRow {
  [emotion: string]: number;
}

export interface NGramTransitionSample {
  context: string[];
  word: string;
  count: number;
  probability: number;
}

export interface ModelMetricsPayload {
  model: string;
  model_version: string;
  dataset_size: number;
  vocab_size: number;
  emotion_distribution: Record<string, number>;
  hmm: {
    states: string[];
    transition_matrix: HMMTransitionRow[] | null;
    initial: Record<string, number> | null;
  };
  ngram: {
    bigram_samples: NGramTransitionSample[];
    trigram_samples: NGramTransitionSample[];
  };
}

/** Model internals (HMM matrix + N-Gram transitions) for the metrics drawer. */
export async function fetchModelMetrics(): Promise<ModelMetricsPayload | null> {
  try {
    const res = await fetch(`${API_URL}/api/model/metrics`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
