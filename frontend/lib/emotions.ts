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
  color: string; // text/hex
  bar: string; // tailwind bg class for progress bars
  softBg: string; // tailwind bg class
  softText: string; // tailwind text class
}

export const EMOTION_META: Record<EmotionLabel, EmotionMeta> = {
  happy: {
    label: "happy",
    emoji: "😊",
    name: "Happy",
    color: "var(--emotion-happy)",
    bar: "bg-emotion-happy",
    softBg: "bg-emotion-happy-bg",
    softText: "text-emotion-happy",
  },
  sad: {
    label: "sad",
    emoji: "😢",
    name: "Sad",
    color: "var(--emotion-sad)",
    bar: "bg-emotion-sad",
    softBg: "bg-emotion-sad-bg",
    softText: "text-emotion-sad",
  },
  angry: {
    label: "angry",
    emoji: "😡",
    name: "Angry",
    color: "var(--emotion-angry)",
    bar: "bg-emotion-angry",
    softBg: "bg-emotion-angry-bg",
    softText: "text-emotion-angry",
  },
  fear: {
    label: "fear",
    emoji: "😨",
    name: "Fear",
    color: "var(--emotion-fear)",
    bar: "bg-emotion-fear",
    softBg: "bg-emotion-fear-bg",
    softText: "text-emotion-fear",
  },
  surprise: {
    label: "surprise",
    emoji: "😮",
    name: "Surprise",
    color: "var(--emotion-surprise)",
    bar: "bg-emotion-surprise",
    softBg: "bg-emotion-surprise-bg",
    softText: "text-emotion-surprise",
  },
  neutral: {
    label: "neutral",
    emoji: "😐",
    name: "Neutral",
    color: "var(--emotion-neutral)",
    bar: "bg-emotion-neutral",
    softBg: "bg-emotion-neutral-bg",
    softText: "text-emotion-neutral",
  },
};

export function emotionToMeta(emotion: string): EmotionMeta {
  return EMOTION_META[(emotion as EmotionLabel) in EMOTION_META ? (emotion as EmotionLabel) : "neutral"];
}

export interface Prediction {
  emotion: EmotionLabel;
  confidence: number;
  probabilities: Record<EmotionLabel, number>;
  language: string;
  model: string;
  model_version: string;
}
