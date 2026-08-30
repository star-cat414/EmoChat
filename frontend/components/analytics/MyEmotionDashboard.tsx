"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  EmotionDistributionChart,
  type DistributionDatum,
} from "@/components/analytics/EmotionDistributionChart";
import { EmotionTrendChart } from "@/components/analytics/EmotionTrendChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { useEmotionAnalytics } from "@/lib/analytics";
import { EMOTION_META } from "@/lib/emotions";

export function MyEmotionDashboard({ currentUserId }: { currentUserId: string }) {
  const { records, distribution, trend, mostCommon, loading } = useEmotionAnalytics({
    type: "user",
    id: currentUserId,
  });

  const today = new Date().toISOString().slice(0, 10);

  const todayCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of records) {
      if (r.created_at && r.created_at.slice(0, 10) === today) {
        counts[r.predicted_emotion] = (counts[r.predicted_emotion] ?? 0) + 1;
      }
    }
    return counts;
  }, [records, today]);

  const uType = mostCommon as keyof typeof EMOTION_META;
  const todayEmotion = (Object.keys(EMOTION_META) as (keyof typeof EMOTION_META)[]).reduce(
    (best, e) => ((todayCounts[e] ?? 0) > (todayCounts[best] ?? 0) ? e : best),
    "neutral" as keyof typeof EMOTION_META
  );
  const todayMeta = EMOTION_META[todayEmotion];
  const totalToday = Object.values(todayCounts).reduce((a, b) => a + b, 0);

  const mostActive = useMemo(() => {
    const convs: Record<string, number> = {};
    for (const r of records) {
      if (r.conversation_id) convs[r.conversation_id] = (convs[r.conversation_id] ?? 0) + 1;
    }
    return Object.entries(convs).sort((a, b) => b[1] - a[1])[0];
  }, [records]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <PageHeader
        title="My Emotion Dashboard"
        subtitle="Your mood across all analyzed conversations"
      />

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading analytics...</p>
      ) : (
        <div className="space-y-6">
          {/* Today's emotion */}
          <Card className="bg-gradient-to-br from-primary/10 to-emotion-happy/10">
            <CardContent className="flex items-center gap-4 p-6">
              <span className="text-4xl">{todayMeta.emoji}</span>
              <div>
                <p className="text-sm text-muted-foreground">Today&apos;s Emotion</p>
                <p className="text-2xl font-bold">{todayMeta.name}</p>
                <p className="text-xs text-muted-foreground">
                  {totalToday} analyzed message{totalToday === 1 ? "" : "s"} today
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Emotion Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <EmotionDistributionChart data={distribution as DistributionDatum[]} />
              </CardContent>
            </Card>

            {/* Most active + recent */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Emotion Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {records.slice(-8).reverse().map((r, i) => {
                      const m = EMOTION_META[r.predicted_emotion];
                      return (
                        <div key={`${r.id}-${i}`} className="flex items-center gap-2 text-sm">
                          <span>{m.emoji}</span>
                          <span className={m.softText}>{m.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {formatWhen(r.created_at)}
                          </span>
                        </div>
                      );
                    })}
                    {records.length === 0 && (
                      <p className="text-sm text-muted-foreground">No analyzed messages yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Overall Emotion</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="flex items-center gap-2 text-2xl font-bold">
                    <span>{EMOTION_META[uType].emoji}</span>
                    <span className={EMOTION_META[uType].softText}>
                      {EMOTION_META[uType].name}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Across {records.length} analyzed message{records.length === 1 ? "" : "s"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Most Active Conversation</CardTitle>
                </CardHeader>
                <CardContent>
                  {mostActive ? (
                    <Link
                      href={`/analytics/conversation/${mostActive[0]}`}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Conversation with {mostActive[1]} analyzed messages{" "}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <p className="text-sm text-muted-foreground">No conversation data yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Emotion Trend (7 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <EmotionTrendChart data={trend.slice(-7)} />
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Open chats to see per-conversation analytics <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}
