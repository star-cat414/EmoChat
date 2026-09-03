import { View, Text, useWindowDimensions } from "react-native";
import { CartesianChart, StackedArea } from "victory-native";

import { EMOTIONS, EMOTION_COLORS, EMOTION_META } from "@/lib/emotions";
import type { EmotionLabel } from "@/lib/emotions";
import type { TrendRow } from "@/lib/useEmotionAnalytics";

const KEYS = [...EMOTIONS, "total"] as (EmotionLabel | "total")[];

export function EmotionTrendChart({ data }: { data: TrendRow[] }) {
  if (!data || data.length === 0) {
    return (
      <View className="h-56 items-center justify-center">
        <Text className="text-sm text-muted-foreground">No trend data yet.</Text>
      </View>
    );
  }

  return (
    <View style={{ height: 224, width: "100%" }}>
      <CartesianChart<TrendRow, "date", EmotionLabel | "total">
        data={data}
        xKey="date"
        yKeys={KEYS}
        domainPadding={{ left: 6, right: 6, top: 8, bottom: 8 }}
        frame={{ lineColor: "transparent" }}
      >
        {({ points, chartBounds }) => {
          const series = EMOTIONS.map((e) => points[e]);
          return (
            <StackedArea
              points={series}
              y0={chartBounds.bottom}
              colors={EMOTIONS.map((e) => EMOTION_COLORS[e])}
              curveType="monotoneX"
            />
          );
        }}
      </CartesianChart>
      <Legend />
    </View>
  );
}

function Legend() {
  return (
    <View className="mt-2 flex-row flex-wrap justify-center gap-x-4 gap-y-1">
      {EMOTIONS.map((e) => (
        <View key={e} className="flex-row items-center gap-1">
          <View
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: EMOTION_COLORS[e] }}
          />
          <Text className="text-[11px] text-muted-foreground">
            {EMOTION_META[e].emoji} {EMOTION_META[e].name}
          </Text>
        </View>
      ))}
    </View>
  );
}
