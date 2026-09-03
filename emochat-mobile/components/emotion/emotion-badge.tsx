import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronDown } from "lucide-react-native";

import { emotionRows } from "@/lib/utils";
import { emotionToMeta, type Prediction } from "@/lib/emotions";

export function EmotionBadge({ prediction }: { prediction: Prediction }) {
  const [expanded, setExpanded] = useState(false);
  const meta = emotionToMeta(prediction.emotion);
  const rows = emotionRows(prediction.probabilities);

  return (
    <View className="mt-0.5 items-start">
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className="flex-row items-center gap-1 rounded-md border border-border bg-card px-1.5 py-px"
      >
        <Text className="text-[10px]">{meta.emoji}</Text>
        <Text style={{ color: meta.color }} className="text-[10px] font-medium">
          {meta.name}
        </Text>
        <ChevronDown
          size={10}
          color="#64748b"
          style={{ transform: expanded ? [{ rotate: "180deg" }] : undefined }}
        />
      </Pressable>

      {expanded && (
        <View className="mt-1 w-52 rounded-lg border border-border bg-card p-2 shadow-sm">
          <Text className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            HMM decode
          </Text>
          {rows.map(({ meta: m, probability }) => (
            <View key={m.label} className="mt-1.5 flex-row items-center gap-1.5">
              <Text className="w-16 shrink-0 text-[10px] leading-none text-foreground">
                {m.emoji} {m.name}
              </Text>
              <View className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                <View
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: m.color,
                    width: `${Math.max(probability * 100, 2)}%`,
                  }}
                />
              </View>
              <Text className="w-7 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
                {(probability * 100).toFixed(0)}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
