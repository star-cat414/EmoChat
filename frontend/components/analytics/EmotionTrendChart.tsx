"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

import { EMOTIONS, EMOTION_META } from "@/lib/emotions";

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
}

export function EmotionTrendChart({ data }: { data: TrendRow[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No trend data yet.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickFormatter={(d: string) => {
              const date = new Date(d + "T00:00:00");
              return date.toLocaleDateString([], { month: "short", day: "numeric" });
            }}
          />
          <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {EMOTIONS.map((e) => (
            <Area
              key={e}
              type="monotone"
              dataKey={e}
              name={EMOTION_META[e].name}
              stackId="1"
              stroke={EMOTION_META[e].color}
              fill={EMOTION_META[e].color}
              fillOpacity={0.6}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
