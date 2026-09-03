export type EmotionLabel =
  | "happy"
  | "sad"
  | "angry"
  | "fear"
  | "surprise"
  | "neutral";

export const EMOTIONS: EmotionLabel[] = [
  "happy",
  "sad",
  "angry",
  "fear",
  "surprise",
  "neutral",
];

export interface EmotionMeta {
  label: EmotionLabel;
  emoji: string;
  name: string;
  color: string; // brand hex for accents
  softBg: string; // nativewind bg class
  softText: string; // nativewind text class
}

export const EMOTION_COLORS: Record<EmotionLabel, string> = {
  happy: "#f59e0b",
  sad: "#3b82f6",
  angry: "#f43f5e",
  fear: "#8b5cf6",
  surprise: "#f97316",
  neutral: "#64748b",
};

export const EMOTION_SOFT_BG: Record<EmotionLabel, string> = {
  happy: "#fef3c7",
  sad: "#dbeafe",
  angry: "#ffe4e6",
  fear: "#ede9fe",
  surprise: "#ffedd5",
  neutral: "#e2e8f0",
};

export const EMOTION_META: Record<EmotionLabel, EmotionMeta> = {
  happy: {
    label: "happy",
    emoji: "😊",
    name: "Happy",
    color: "#f59e0b",
    softBg: "bg-emotion-happy-bg",
    softText: "text-emotion-happy",
  },
  sad: {
    label: "sad",
    emoji: "😢",
    name: "Sad",
    color: "#3b82f6",
    softBg: "bg-emotion-sad-bg",
    softText: "text-emotion-sad",
  },
  angry: {
    label: "angry",
    emoji: "😡",
    name: "Angry",
    color: "#f43f5e",
    softBg: "bg-emotion-angry-bg",
    softText: "text-emotion-angry",
  },
  fear: {
    label: "fear",
    emoji: "😨",
    name: "Fear",
    color: "#8b5cf6",
    softBg: "bg-emotion-fear-bg",
    softText: "text-emotion-fear",
  },
  surprise: {
    label: "surprise",
    emoji: "😮",
    name: "Surprise",
    color: "#f97316",
    softBg: "bg-emotion-surprise-bg",
    softText: "text-emotion-surprise",
  },
  neutral: {
    label: "neutral",
    emoji: "😐",
    name: "Neutral",
    color: "#64748b",
    softBg: "bg-emotion-neutral-bg",
    softText: "text-emotion-neutral",
  },
};

const LABELS: EmotionLabel[] = [
  "happy",
  "sad",
  "angry",
  "fear",
  "surprise",
  "neutral",
];

export function emotionToMeta(emotion: string): EmotionMeta {
  return EMOTION_META[
    (LABELS as string[]).includes(emotion)
      ? (emotion as EmotionLabel)
      : "neutral"
  ];
}

export interface Prediction {
  emotion: EmotionLabel;
  confidence: number;
  probabilities: Record<EmotionLabel, number>;
  language: string;
  model: string;
  model_version: string;
}
