"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

import { EMOTIONS, EMOTION_META } from "@/lib/emotions";

export interface DistributionDatum {
  emotion: string;
  percent: number;
}

export function EmotionDistributionChart({
  data,
}: {
  data: DistributionDatum[];
}) {
  const chartData = EMOTIONS.map((e) => {
    const found = data.find((d) => d.emotion === e);
    return {
      name: EMOTION_META[e].name,
      value: found?.percent ?? 0,
      emoji: EMOTION_META[e].emoji,
      color: EMOTION_META[e].color,
    };
  }).filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No emotion data yet.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={1}
          >
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${value}%`]}
            contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-3">
        {chartData.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
            <span className="text-muted-foreground">{d.emoji} {d.name}</span>
            <span className="ml-auto font-medium">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
