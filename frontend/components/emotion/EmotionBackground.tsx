"use client";

import type { EmotionLabel } from "@/lib/emotions";

/**
 * Aurora ambient background. A clean `--background` surface with soft,
 * slowly-drifting brand-colored blobs and a faint tint derived from the
 * active emotion. A pure component (no effects) so it safely sits behind
 * server-rendered pages too.
 */

export type AmbientEmotion = EmotionLabel | null;

const EMOTION_TINTS: Record<EmotionLabel, string> = {
  happy:    "rgba(245, 158, 11, 0.2)",
  sad:      "rgba(59, 130, 246, 0.2)",
  angry:    "rgba(244, 63, 94, 0.18)",
  fear:     "rgba(139, 92, 246, 0.2)",
  surprise: "rgba(249, 115, 22, 0.18)",
  neutral:  "rgba(100, 116, 139, 0.12)",
};

export function EmotionBackground({ emotion }: { emotion?: AmbientEmotion }) {
  const tint = emotion ? EMOTION_TINTS[emotion] : EMOTION_TINTS.neutral;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background" aria-hidden="true">
      <span
        className="aurora-blob-1 absolute -top-32 -left-24 h-[30rem] w-[30rem] rounded-full blur-[90px]"
        style={{ background: "var(--aurora-1)" }}
      />
      <span
        className="aurora-blob-2 absolute -right-24 -bottom-36 h-[28rem] w-[28rem] rounded-full blur-[90px]"
        style={{ background: "var(--aurora-2)" }}
      />
      <span
        className="absolute top-1/2 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-[110px]"
        style={{ background: tint }}
      />
    </div>
  );
}