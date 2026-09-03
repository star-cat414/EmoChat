import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  useEmotionAnalytics,
  filterTrend,
  type TimeRange,
} from "@/lib/useEmotionAnalytics";
import { emotionToMeta } from "@/lib/emotions";
import { EmotionDistributionChart } from "@/components/analytics/emotion-distribution-chart";
import { EmotionTrendChart } from "@/components/analytics/emotion-trend-chart";

const RANGES: TimeRange[] = ["today", "7d", "30d", "all"];

export function AnalyticsView({
  title,
  query,
}: {
  title: string;
  query: { type: "conversation" | "user"; id: string };
}) {
  const [range, setRange] = useState<TimeRange>("30d");
  const { distribution, trend, mostCommon, loading } = useEmotionAnalytics(query);

  const commonMeta = emotionToMeta(mostCommon);
  const filteredTrend = filterTrend(trend, range);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-border bg-card px-3 py-3">
        <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-lg">
          <ArrowLeft size={20} color="#0f172a" />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-foreground">{title}</Text>
      </View>

      <ScrollView contentContainerClassName="p-4" showsVerticalScrollIndicator={false}>
        <View className="mb-4 flex-row gap-2">
          {RANGES.map((r) => (
            <Pressable
              key={r}
              onPress={() => setRange(r)}
              className={`flex-1 items-center rounded-lg py-2 ${
                range === r ? "bg-primary" : "bg-card border border-border"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  range === r ? "text-white" : "text-muted-foreground"
                }`}
              >
                {r === "all" ? "All" : r}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator className="mt-20" color="#6366f1" />
        ) : (
          <>
            <View className="mb-4 items-center rounded-2xl border border-border bg-card p-4">
              <Text className="text-sm text-muted-foreground">Most common emotion</Text>
              <View className="mt-2 flex-row items-center gap-2">
                <Text className="text-3xl">{commonMeta.emoji}</Text>
                <Text style={{ color: commonMeta.color }} className="text-xl font-bold">
                  {commonMeta.name}
                </Text>
              </View>
            </View>

            <Text className="mb-2 text-base font-semibold text-foreground">Distribution</Text>
            <View className="mb-6 rounded-2xl border border-border bg-card p-4">
              <EmotionDistributionChart data={distribution} />
            </View>

            <Text className="mb-2 text-base font-semibold text-foreground">Trend</Text>
            <View className="mb-4 rounded-2xl border border-border bg-card p-4">
              <EmotionTrendChart data={filteredTrend} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
