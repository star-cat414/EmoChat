import type { EmotionLabel, Prediction } from "@/lib/emotions";
import { API_URL } from "@/lib/constants";

export interface EmotionPredictRequest {
  text: string;
  conversation_id?: string | null;
  user_id?: string | null;
  previous_emotions?: string[];
}

/** A file reference compatible with react-native FormData uploads. */
export interface UploadFile {
  uri: string;
  name: string;
  type: string;
}

async function timeoutSignal(ms: number): Promise<{ signal: AbortSignal; clear: () => void }> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(t) };
}

export async function predictEmotion(
  req: EmotionPredictRequest
): Promise<Prediction | null> {
  try {
    const { signal, clear } = await timeoutSignal(8000);
    const res = await fetch(`${API_URL}/api/emotion/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal,
    });
    clear();
    if (!res.ok) return null;
    return (await res.json()) as Prediction;
  } catch {
    return null;
  }
}

export async function transcribeVoice(file: UploadFile): Promise<{ transcript: string } | null> {
  try {
    const form = new FormData();
    form.append("file", file as unknown as Blob);
    const res = await fetch(`${API_URL}/api/voice/transcribe`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) return null;
    return (await res.json()) as { transcript: string };
  } catch {
    return null;
  }
}

export interface VoiceEmotionResult extends Prediction {
  transcript: string;
}

export type VoiceEmotionOutcome =
  | ({ ok: true } & VoiceEmotionResult)
  | { ok: false; error: string };

async function extractError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: unknown };
    if (typeof body?.detail === "string" && body.detail) return body.detail;
  } catch {
    // not JSON — fall through
  }
  return `request failed (HTTP ${res.status})`;
}

export async function voiceEmotion(
  file: UploadFile,
  previous_emotions?: string[]
): Promise<VoiceEmotionOutcome> {
  try {
    const { signal, clear } = await timeoutSignal(30000);
    const form = new FormData();
    form.append("file", file as unknown as Blob);
    if (previous_emotions?.length) {
      form.append("previous_emotions", previous_emotions.join(","));
    }
    const res = await fetch(`${API_URL}/api/voice/emotion`, {
      method: "POST",
      body: form,
      signal,
    });
    clear();
    if (!res.ok) return { ok: false, error: await extractError(res) };
    const data = (await res.json()) as VoiceEmotionResult;
    return { ok: true, ...data };
  } catch (e) {
    const aborted =
      (e as Error)?.name === "AbortError" ||
      (e as { message?: string })?.message?.includes("abort");
    return {
      ok: false,
      error: aborted
        ? "AI request timed out"
        : "cannot reach the AI server (is the backend running?)",
    };
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
    const res = await fetch(`${API_URL}/api/model/evaluate`);
    if (!res.ok) return null;
    return (await res.json()) as ModelEvaluation;
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
