"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchModelEvaluation, type ModelEvaluation } from "@/lib/api";
import { EMOTION_META } from "@/lib/emotions";

const metricLabels: Record<string, string> = {
  accuracy: "Accuracy",
  precision: "Precision",
  recall: "Recall",
  f1: "F1 Score",
};

export function ModelEvaluationView() {
  const [data, setData] = useState<ModelEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const result = await fetchModelEvaluation();
    if (!result) {
      setError("Backend is offline. Start FastAPI (`uvicorn app.main:app --port 8000`).");
    }
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <p className="py-10 text-center text-muted-foreground">Evaluating the model…</p>;
  }

  if (error || !data) {
    return (
      <div className="py-10 text-center">
        <p className="text-destructive">{error ?? "No data"}</p>
        <Button className="mt-4" onClick={load}>
          <RefreshCw className="mr-1 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  const maxConfusion = Math.max(...data.confusion_matrix.matrix.flat());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">N-Gram + HMM evaluation</h2>
          <p className="text-sm text-muted-foreground">
            Curated dataset of {data.dataset_size} Myanmar + English samples (
            {data.split.train} train / {data.split.test} test)
          </p>
        </div>
        <Button variant="outline" onClick={load}>
          <RefreshCw className="mr-1 h-4 w-4" /> Re-run
        </Button>
      </div>

      {/* Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Emotion distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {data.emotions.map((e) => (
            <div key={e} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: EMOTION_META[e as keyof typeof EMOTION_META]?.color }}
              />
              <span className="capitalize">{e}</span>
              <span className="text-muted-foreground">
                {data.emotion_distribution[e] ?? 0}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Metrics table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Per-model metrics (test set)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4">Metric</th>
                {Object.keys(data.metrics).map((m) => (
                  <th key={m} className="py-2 pr-4 capitalize">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(metricLabels).map(([key, label]) => (
                <tr key={key} className="border-b">
                  <td className="py-2 pr-4">{label}</td>
                  {Object.keys(data.metrics).map((m) => {
                    const v = data.metrics[m]?.[key];
                    return (
                      <td key={m} className="py-2 pr-4 tabular-nums">
                        {typeof v === "number" ? (v * 100).toFixed(1) + "%" : "–"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Confusion matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Confusion matrix (combined N-Gram + HMM)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="border-separate border-spacing-1 text-xs">
              <thead>
                <tr>
                  <th></th>
                  {data.confusion_matrix.labels.map((l) => (
                    <th key={l} className="px-2 py-1 capitalize text-muted-foreground">
                      {l}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.confusion_matrix.matrix.map((row, i) => (
                  <tr key={i}>
                    <td className="pr-2 text-right capitalize">{data.confusion_matrix.labels[i]}</td>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className="min-w-[2.5rem] px-2 py-1 text-center font-medium rounded"
                        style={{
                          background: `rgba(59,130,246,${0.06 + (cell / (maxConfusion || 1)) * 0.5})`,
                        }}
                        title={`${data.confusion_matrix.labels[i]} → ${data.confusion_matrix.labels[j]}: ${cell}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Per-language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Per-language accuracy</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {data.per_language.map((l) => (
            <div key={l.language} className="rounded-md border px-3 py-2 text-xs">
              <span className="font-medium capitalize">{l.language}</span>
              <span className="ml-2 text-muted-foreground">
                {(l.accuracy * 100).toFixed(1)}% ({l.correct}/{l.total})
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
