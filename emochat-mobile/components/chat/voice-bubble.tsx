import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Audio } from "expo-av";
import { Mic, Pause, Play } from "lucide-react-native";

import { formatDuration } from "@/lib/utils";
import type { MessageBubbleData } from "@/lib/types";

export function VoiceBubble({
  message,
  isOwn,
}: {
  message: MessageBubbleData;
  isOwn: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  const cleanup = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const togglePlay = useCallback(async () => {
    const url = message.audio_url;
    if (!url) return;

    if (playing) {
      await soundRef.current?.pauseAsync();
      setPlaying(false);
      return;
    }

    try {
      let sound = soundRef.current;
      if (!sound) {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
        const { sound: s } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setProgress(status.positionMillis / 1000);
              setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
              if (status.didJustFinish) {
                setPlaying(false);
                setProgress(0);
              }
            }
          }
        );
        sound = s;
        soundRef.current = s;
      } else {
        await sound.playAsync();
      }
      setPlaying(true);
    } catch {
      // ignore playback errors
    }
  }, [message.audio_url, playing]);

  const pct = duration ? (progress / duration) * 100 : 0;

  return (
    <View
      className={`flex-col gap-1 rounded-xl border border-border bg-card p-2 shadow-sm ${
        isOwn ? "border-primary/30 bg-primary/10" : ""
      }`}
    >
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={togglePlay}
          className={`h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isOwn ? "bg-primary" : "bg-primary/10"
          }`}
        >
          {playing ? (
            <Pause size={14} color={isOwn ? "#fff" : "#6366f1"} fill="currentColor" />
          ) : (
            <Play
              size={14}
              color={isOwn ? "#fff" : "#6366f1"}
              fill="currentColor"
              style={{ marginLeft: 2 }}
            />
          )}
        </Pressable>
        <View className="min-w-0 flex-1">
          <View className="h-1 w-full overflow-hidden rounded-full bg-current opacity-15">
            <View
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max(pct, pct > 0 ? 3 : 0)}%` }}
            />
          </View>
        </View>
        <Text className={`shrink-0 text-[10px] tabular-nums ${isOwn ? "text-foreground/60" : "text-muted-foreground"}`}>
          {formatDuration(duration || progress)}
        </Text>
      </View>
      {message.transcript ? (
        <View className="flex-row items-start gap-1">
          <Mic size={10} color="#64748b" className="mt-px shrink-0 opacity-50" />
          <Text
            className={`flex-1 text-[11px] leading-snug ${
              isOwn ? "text-foreground/70" : "text-muted-foreground"
            }`}
            numberOfLines={2}
          >
            {message.transcript}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
