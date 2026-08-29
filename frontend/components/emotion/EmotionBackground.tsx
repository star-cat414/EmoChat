"use client";

import { useEffect } from "react";
import type { EmotionLabel } from "@/lib/emotions";

/**
 * Light-theme ambient background. Per the design spec the app uses a clean
 * #F8FAFC background with only very subtle Indigo/Mint accents (no heavy
 * gradients or glassmorphic blobs). The active emotion is accepted for API
 * compatibility but rendered as faint ambient tints only.
 */

export type AmbientEmotion = EmotionLabel | null;

const EMOTION_TINTS: Record<
  EmotionLabel,
  { glow1: string }
> = {
  happy:    { glow1: "rgba(245, 158, 11, 0.05)" },
  sad:      { glow1: "rgba(59, 130, 246, 0.05)" },
  angry:    { glow1: "rgba(239, 68, 68, 0.05)" },
  fear:     { glow1: "rgba(139, 92, 246, 0.05)" },
  surprise: { glow1: "rgba(249, 115, 22, 0.05)" },
  neutral:  { glow1: "rgba(100, 116, 139, 0.04)" },
};

export function EmotionBackground({ emotion }: { emotion?: AmbientEmotion }) {
  const tint = emotion ? EMOTION_TINTS[emotion] : EMOTION_TINTS.neutral;

  useEffect(() => {
    // Very subtle emotion tint on the page background.
    document.documentElement.style.setProperty("--glow-1", tint.glow1);
  }, [tint.glow1]);

  return <div className="fixed inset-0 -z-10 bg-background" aria-hidden="true" />;
}
