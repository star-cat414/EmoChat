"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { emotionToMeta, type Prediction } from "@/lib/emotions";
import { emotionRows } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function EmotionCard({ prediction }: { prediction: Prediction | null }) {
  const [expanded, setExpanded] = useState(false);

  if (!prediction) {
    return (
      <div className="mt-1.5 text-xs text-muted-foreground">
        Emotion analysis temporarily unavailable
      </div>
    );
  }

  const meta = emotionToMeta(prediction.emotion);
  const rows = emotionRows(prediction.probabilities);

  return (
    <div className="mt-1.5 max-w-[260px]">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-border/70 px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted/50 cursor-pointer",
          expanded && "bg-muted/40"
        )}
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-1.5 font-medium">
          <span>{meta.emoji}</span>
          <span className={meta.softText}>{meta.name}</span>
          <span className="text-muted-foreground">
            {(prediction.confidence * 100).toFixed(0)}%
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div className="mt-1.5 space-y-1.5 rounded-lg border border-border/70 bg-card p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Emotion Analysis
          </p>
          {rows.map(({ meta: m, probability }) => (
            <div key={m.label} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-[11px] leading-none" title={m.name}>
                {m.emoji} {m.name}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", m.bar)}
                  style={{ width: `${Math.max(probability * 100, 2)}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                {(probability * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
