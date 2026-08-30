"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Activity } from "lucide-react";

import {
  fetchModelMetrics,
  type ModelMetricsPayload,
  type HMMTransitionRow,
} from "@/lib/api";

export function ModelDebugDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<ModelMetricsPayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    fetchModelMetrics().then((d) => {
      if (cancelled) return;
      setData(d);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        />
      )}
      {/* Panel */}
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: open ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col rounded-l-2xl border-l border-border bg-card shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">Model Metrics</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                N-Gram · HMM internals
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="glass-scroll flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {loading && (
            <p className="animate-pulse text-center text-sm text-muted-foreground">
              Loading model internals…
            </p>
          )}

          {!loading && !data && (
            <p className="text-center text-sm text-muted-foreground">
              Model metrics unavailable (backend offline?).
            </p>
          )}

          {data && (
            <>
              {/* Overview */}
              <section className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Overview
                </p>
                <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm">
                  <Row k="Model" v={data.model} />
                  <Row k="Version" v={data.model_version} />
                  <Row k="Corpus size" v={String(data.dataset_size)} />
                  <Row k="Vocabulary" v={String(data.vocab_size)} />
                </div>
              </section>

              {/* Emotion distribution */}
              <section className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Emotion distribution
                </p>
                <div className="rounded-xl border border-border bg-background px-4 py-3">
                  {Object.entries(data.emotion_distribution).map(([label, count]) => (
                    <div key={label} className="flex items-center justify-between py-0.5 text-xs">
                      <span className="capitalize text-muted-foreground">{label}</span>
                      <span className="font-semibold tabular-nums text-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* HMM transition matrix */}
              <section className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  HMM transition matrix
                </p>
                {data.hmm.transition_matrix ? (
                  <TransitionMatrix
                    states={data.hmm.states}
                    matrix={data.hmm.transition_matrix}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">Not fitted.</p>
                )}
              </section>

              {/* N-Gram transitions */}
              <NGramSamples samples={data.ngram.bigram_samples} title="N-Gram bigram transitions" />
              <NGramSamples samples={data.ngram.trigram_samples} title="N-Gram trigram transitions" />
            </>
          )}
        </div>
      </motion.aside>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-1 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-semibold text-foreground">{v}</span>
    </div>
  );
}

function TransitionMatrix({
  states,
  matrix,
}: {
  states: string[];
  matrix: HMMTransitionRow[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-background p-3">
      <table className="w-full border-collapse text-[10px]">
        <thead>
          <tr>
            <th className="pr-1 text-left font-medium text-muted-foreground" />
            {states.map((s) => (
              <th key={s} className="px-1 pb-1 font-medium capitalize text-muted-foreground">
                {s.slice(0, 3)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td className="pr-1 font-semibold capitalize text-muted-foreground">
                {states[i].slice(0, 3)}
              </td>
              {states.map((s) => {
                const v = row[s] ?? 0;
                const alpha = Math.min(1, v * 4);
                return (
                  <td key={s} className="px-1 py-0.5 text-center">
                    <span
                      className="inline-block w-full rounded px-1 py-0.5 tabular-nums"
                      style={{
                        backgroundColor: `rgba(99, 102, 241, ${alpha})`,
                        color: alpha > 0.35 ? "#fff" : "#4f46e5",
                      }}
                    >
                      {v.toFixed(2)}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NGramSamples({
  samples,
  title,
}: {
  samples: ModelMetricsPayload["ngram"]["bigram_samples"];
  title: string;
}) {
  if (!samples.length) return null;
  return (
    <section className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1 rounded-xl border border-border bg-background px-4 py-3">
        {samples.map((s, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-2 py-0.5 text-xs"
          >
            <span className="truncate text-muted-foreground">
              {s.context.join(" · ")} →{" "}
              <span className="font-semibold text-foreground">{s.word}</span>
            </span>
            <span className="shrink-0 tabular-nums text-primary">
              {(s.probability * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
