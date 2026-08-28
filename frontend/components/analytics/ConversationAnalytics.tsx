"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import {
  EmotionDistributionChart,
  type DistributionDatum,
} from "@/components/analytics/EmotionDistributionChart";
import { EmotionTrendChart } from "@/components/analytics/EmotionTrendChart";
import { Avatar, initialsOf } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEmotionAnalytics, filterTrend, type TimeRange } from "@/lib/analytics";
import { EMOTION_META } from "@/lib/emotions";

export function ConversationAnalytics({
  currentUserId,
  conversationId,
  other,
}: {
  currentUserId: string;
  conversationId: string;
  other: { id: string; username: string; avatar_url: string | null };
}) {
  const { records, distribution, trend, mostCommon, loading } = useEmotionAnalytics({
    type: "conversation",
    id: conversationId,
  });
  const [range, setRange] = useState<TimeRange>("7d");
  const filteredTrend = useMemo(() => filterTrend(trend, range), [trend, range]);

  const mine = useMemo(
    () => records.filter((r) => r.user_id === currentUserId).length,
    [records, currentUserId]
  );

  const mostCommonMeta = EMOTION_META[mostCommon];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/chats/${conversationId}`}>
          <Button variant="ghost" size="icon" aria-label="Back to chat">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <Avatar src={other.avatar_url}>{initialsOf(other.username)}</Avatar>
        <div>
          <h1 className="text-lg font-semibold">{other.username}</h1>
          <p className="text-sm text-muted-foreground">Conversation Analytics</p>
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading analytics...</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Messages Analyzed" value={records.length.toString()} />
            <StatCard label="Your Messages" value={mine.toString()} />
            <StatCard
              label="Most Common"
              value={
                <span className="flex items-center justify-center gap-1">
                  <span>{mostCommonMeta.emoji}</span>
                  <span className={mostCommonMeta.softText}>{mostCommonMeta.name}</span>
                </span>
              }
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Emotion Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <EmotionDistributionChart data={distribution} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Emotion Trend</CardTitle>
                <RangeSelector range={range} setRange={setRange} />
              </div>
            </CardHeader>
            <CardContent>
              <EmotionTrendChart data={filteredTrend} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Emotions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {records.slice(-20).map((r, i) => (
                  <span
                    key={`${r.id}-${i}`}
                    title={EMOTION_META[r.predicted_emotion].name}
                    className="rounded-md px-1.5 py-0.5 text-sm"
                    style={{
                      background: `${EMOTION_META[r.predicted_emotion].color}22`,
                    }}
                  >
                    {EMOTION_META[r.predicted_emotion].emoji}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Per-Person Emotions</CardTitle>
            </CardHeader>
            <CardContent>
              <PerPersonRow currentUserId={currentUserId} otherUserId={other.id} records={records} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function PerPersonRow({
  currentUserId,
  otherUserId,
  records,
}: {
  currentUserId: string;
  otherUserId: string;
  records: ReturnType<typeof useEmotionAnalytics>["records"];
}) {
  const calc = (userId: string): DistributionDatum[] => {
    const subset = records.filter((r) => r.user_id === userId);
    const counts: Record<string, number> = {};
    for (const r of subset) counts[r.predicted_emotion] = (counts[r.predicted_emotion] ?? 0) + 1;
    const total = subset.length || 1;
    return (Object.keys(EMOTION_META) as (keyof typeof EMOTION_META)[]).map((e) => ({
      emotion: e,
      percent: Number((((counts[e] ?? 0) / total) * 100).toFixed(1)),
    }));
  };
  const me = calc(currentUserId);
  const them = calc(otherUserId);

  return (
    <div className="space-y-6">
      <SmallDist title="Your emotions" data={me} />
      <SmallDist title={`${otherUserId === currentUserId ? "Other" : "Their"} emotions`} data={them} />
    </div>
  );
}

function SmallDist({ title, data }: { title: string; data: DistributionDatum[] }) {
  const rows = [...data].sort((a, b) => b.percent - a.percent);
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{title}</p>
      <div className="space-y-1.5">
        {rows.map((d) => {
          const meta = EMOTION_META[d.emotion as keyof typeof EMOTION_META];
          return (
            <div key={d.emotion} className="flex items-center gap-2 text-sm">
              <span className="w-24 shrink-0">{meta.emoji} {meta.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${d.percent}%`, background: meta.color }}
                />
              </div>
              <span className="w-10 text-right text-xs text-muted-foreground">{d.percent}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-2xl font-bold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function RangeSelector({
  range,
  setRange,
}: {
  range: TimeRange;
  setRange: (r: TimeRange) => void;
}) {
  const options: { value: TimeRange; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "7d", label: "7 days" },
    { value: "30d", label: "30 days" },
    { value: "all", label: "All" },
  ];
  return (
    <div className="flex gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => setRange(o.value)}
          className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
            range === o.value ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
