"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp } from "lucide-react";

import { ngramComplete, type NGramSuggestion } from "@/lib/api";

/**
 * N-Gram auto-complete overlay shown above the input bar.
 * Fetches next-word suggestions from the backend N-Gram language model
 * and renders them as selectable glass pills with confidence percentages.
 * Accepts a suggestion via click or the Tab key.
 */
export function NGramAutocomplete({
  text,
  activeWord,
  onPick,
}: {
  text: string;
  /** Whether the cursor is inside a word (show completion) or at a boundary (show next-word). */
  activeWord: boolean;
  onPick: (word: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<NGramSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const trimmed = text.trim();
    // Only run when the parent signals a word boundary (a trailing space typed).
    if (!activeWord || !trimmed) {
      setSuggestions([]);
      setSelected(0);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const res = await ngramComplete(trimmed, 4);
      if (!cancelled) {
        setSuggestions(res);
        setSelected(0);
        setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [text]);

  // Handle Tab to accept the highlighted suggestion.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !suggestions.length) return;
      const pill = suggestions[selected % suggestions.length];
      if (pill) {
        e.preventDefault();
        onPick(pill.word);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [suggestions, selected, onPick]);

  if (!activeWord || !suggestions.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="mb-2 flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-white px-2.5 py-2 shadow-sm"
    >
      <span className="flex items-center gap-1 pr-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
        <Sparkles className="h-3 w-3" /> N-Gram
      </span>

      {loading && suggestions.length === 0 && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
          predicting…
        </span>
      )}

      {suggestions.map((s, i) => (
        <button
          key={s.word + i}
          onClick={() => onPick(s.word)}
          onMouseEnter={() => setSelected(i)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            i === selected
              ? "bg-primary text-white shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-primary"
          }`}
        >
          <TrendingUp className="h-3 w-3 opacity-70" />
          {s.word}
          <span className="tabular-nums text-[10px] opacity-70">
            {(s.probability * 100).toFixed(0)}%
          </span>
        </button>
      ))}

      <span className="ml-auto hidden pl-1 text-[10px] text-muted-foreground sm:inline">
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono">Tab</kbd> to accept
      </span>
    </motion.div>
  );
}
