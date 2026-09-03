import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { EMOTION_META } from "@/lib/emotions";
import type { EmotionMeta, EmotionLabel } from "@/lib/emotions";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString([], { month: "short", day: "numeric" }) +
    ", " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return formatDate(iso);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

export function messagePreview(m: {
  message_type: string;
  content?: string | null;
  transcript?: string | null;
}): string {
  if (m.message_type === "voice") {
    const t = m.transcript?.trim();
    return t ? `"${t}"` : "🎤 Voice message";
  }
  return m.content ?? "";
}

export function emotionRows(
  probabilities: Record<EmotionLabel, number>
): { meta: EmotionMeta; probability: number }[] {
  return (Object.entries(probabilities) as [EmotionLabel, number][])
    .map(([label, probability]) => ({ meta: EMOTION_META[label], probability }))
    .sort((a, b) => b.probability - a.probability);
}
