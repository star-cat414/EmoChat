import { View, Text } from "react-native";
import { Pie, PolarChart } from "victory-native";

import { EMOTIONS, EMOTION_META, EMOTION_COLORS } from "@/lib/emotions";
import type { DistributionDatum } from "@/lib/useEmotionAnalytics";

export function EmotionDistributionChart({ data }: { data: DistributionDatum[] }) {
  const chartData = EMOTIONS.map((e) => ({
    emotion: e,
    percent: data.find((d) => d.emotion === e)?.percent ?? 0,
  })).filter((d) => d.percent > 0);

  if (chartData.length === 0) {
    return (
      <View className="h-56 items-center justify-center">
        <Text className="text-sm text-muted-foreground">No emotion data yet.</Text>
      </View>
    );
  }

  const pieData = chartData.map((d) => ({
    label: EMOTION_META[d.emotion].name,
    value: d.percent,
    color: EMOTION_COLORS[d.emotion],
  }));

  return (
    <View className="items-center">
      <View className="h-56 w-56">
        <PolarChart<{ label: string; value: number; color: string }, "label", "value", "color">
          data={pieData}
          labelKey="label"
          valueKey="value"
          colorKey="color"
        >
          <Pie.Chart innerRadius="50%" />
        </PolarChart>
      </View>
      <View className="mt-2 w-full flex-row flex-wrap justify-center gap-x-4 gap-y-1">
        {chartData.map((d) => (
          <View key={d.emotion} className="flex-row items-center gap-1.5">
            <View
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: EMOTION_COLORS[d.emotion] }}
            />
            <Text className="text-xs text-muted-foreground">
              {EMOTION_META[d.emotion].emoji} {EMOTION_META[d.emotion].name}
            </Text>
            <Text className="text-xs font-medium">{d.percent}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
