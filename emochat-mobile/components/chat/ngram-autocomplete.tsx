import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Sparkles, TrendingUp } from "lucide-react-native";

import { ngramComplete, type NGramSuggestion } from "@/lib/api";

export function NGramAutocomplete({
  text,
  activeWord,
  onPick,
}: {
  text: string;
  activeWord: boolean;
  onPick: (word: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<NGramSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = text.trim();
    if (!activeWord || !trimmed) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const res = await ngramComplete(trimmed, 4);
      if (!cancelled) {
        setSuggestions(res);
        setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [text, activeWord]);

  if (!activeWord || !suggestions.length) return null;

  return (
    <View className="mb-2 flex-row flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-2 shadow-sm">
      <View className="flex-row items-center gap-1 pr-1">
        <Sparkles size={12} color="#6366f1" />
        <Text className="text-[10px] font-semibold uppercase tracking-wider text-primary">
          N-Gram
        </Text>
      </View>

      {loading && suggestions.length === 0 && (
        <Text className="text-xs text-muted-foreground">predicting…</Text>
      )}

      {suggestions.map((s, i) => (
        <Pressable
          key={s.word + i}
          onPress={() => onPick(s.word)}
          className="flex-row items-center gap-1.5 rounded-full bg-muted px-3 py-1"
        >
          <TrendingUp size={12} color="#64748b" opacity={0.7} />
          <Text className="text-xs font-medium text-foreground">{s.word}</Text>
          <Text className="text-[10px] tabular-nums opacity-70 text-muted-foreground">
            {(s.probability * 100).toFixed(0)}%
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
