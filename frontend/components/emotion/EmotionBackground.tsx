"use client";

import type { EmotionLabel } from "@/lib/emotions";

/**
 * Ambient background: a clean `--background` surface with two faint, static
 * color washes for depth. Minimal and distraction-free.
 */

export type AmbientEmotion = EmotionLabel | null;

export function EmotionBackground({ emotion: _emotion }: { emotion?: AmbientEmotion }) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background" aria-hidden="true">
      <span
        className="absolute top-[-14rem] left-1/2 h-[28rem] w-[36rem] -translate-x-1/2 rounded-full blur-[120px]"
        style={{ background: "var(--aurora-1)" }}
      />
      <span
        className="absolute -right-24 -bottom-40 h-[22rem] w-[28rem] rounded-full blur-[120px]"
        style={{ background: "var(--aurora-2)" }}
      />
    </div>
  );
}