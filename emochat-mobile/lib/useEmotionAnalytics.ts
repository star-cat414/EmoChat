import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { EMOTIONS, type EmotionLabel } from "@/lib/emotions";

export interface PredictionRecord {
  message_id: string | null;
  user_id: string;
  conversation_id: string | null;
  predicted_emotion: EmotionLabel;
  language: string | null;
  created_at: string;
}

export interface DistributionDatum {
  emotion: string;
  percent: number;
  [key: string]: string | number;
}

export interface TrendRow {
  date: string;
  happy: number;
  sad: number;
  angry: number;
  fear: number;
  surprise: number;
  neutral: number;
  total: number;
  top_emotion?: string;
  [key: string]: number | string | undefined;
}

export type TimeRange = "today" | "7d" | "30d" | "all";

const RANGE_DAYS: Record<Exclude<TimeRange, "all">, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
};

export function useEmotionAnalytics(query: { type: "conversation" | "user"; id: string }) {
  const [records, setRecords] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let builder = supabase
      .from("emotion_predictions")
      .select("message_id, user_id, conversation_id, predicted_emotion, language, created_at")
      .order("created_at", { ascending: true });

    if (query.type === "conversation") {
      builder = builder.eq("conversation_id", query.id);
    } else {
      builder = builder.eq("user_id", query.id);
    }

    const { data } = await builder.limit(5000);
    setRecords((data as PredictionRecord[]) ?? []);
    setLoading(false);
  }, [query.type, query.id]);

  useEffect(() => {
    load();
  }, [load]);

  const distribution = useMemo<DistributionDatum[]>(() => {
    const counts: Record<string, number> = {};
    for (const r of records) {
      counts[r.predicted_emotion] = (counts[r.predicted_emotion] ?? 0) + 1;
    }
    const total = records.length || 1;
    return EMOTIONS.map((e) => ({
      emotion: e,
      percent: Number(
        (((counts[e as EmotionLabel] ?? 0) / total) * 100).toFixed(1)
      ),
    }));
  }, [records]);

  const trend = useMemo<TrendRow[]>(() => {
    const byDay: Record<string, Record<string, number>> = {};
    for (const r of records) {
      const key = r.created_at
        ? new Date(r.created_at).toISOString().slice(0, 10)
        : "";
      if (!key) continue;
      byDay[key] = byDay[key] ?? {};
      byDay[key][r.predicted_emotion] =
        (byDay[key][r.predicted_emotion] ?? 0) + 1;
    }
    return Object.keys(byDay)
      .sort()
      .map((date) => {
        const row: TrendRow = {
          date,
          happy: 0,
          sad: 0,
          angry: 0,
          fear: 0,
          surprise: 0,
          neutral: 0,
          total: 0,
        };
        let total = 0;
        let top = "";
        let topCount = 0;
        for (const e of EMOTIONS) {
          row[e] = byDay[date][e] ?? 0;
          total += row[e];
          if (row[e] > topCount) {
            topCount = row[e];
            top = e;
          }
        }
        row.total = total;
        row.top_emotion = top;
        return row;
      });
  }, [records]);

  const mostCommon = useMemo<EmotionLabel>(() => {
    if (records.length === 0) return "neutral";
    let best = "neutral" as EmotionLabel;
    let bestCount = 0;
    for (const e of EMOTIONS) {
      const c = records.filter((r) => r.predicted_emotion === e).length;
      if (c > bestCount) {
        bestCount = c;
        best = e as EmotionLabel;
      }
    }
    return best;
  }, [records]);

  return { records, distribution, trend, mostCommon, loading };
}

export function filterTrend(trend: TrendRow[], range: TimeRange): TrendRow[] {
  if (range === "all") return trend;
  const days = RANGE_DAYS[range];
  const nowStart = new Date();
  nowStart.setHours(0, 0, 0, 0);
  if (range === "today") {
    const today = nowStart.toISOString().slice(0, 10);
    return trend.filter((r) => r.date === today);
  }
  const cutoff = new Date(nowStart);
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return trend.filter((r) => r.date >= cutoffStr);
}
