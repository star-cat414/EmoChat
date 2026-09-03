import { Text, View } from "react-native";

import type { MessageBubbleData } from "@/lib/types";
import type { Prediction } from "@/lib/emotions";
import { EmotionBadge } from "@/components/emotion/emotion-badge";
import { VoiceBubble } from "@/components/chat/voice-bubble";
import { formatTime } from "@/lib/utils";

export function MessageBubble({
  message,
  isOwn,
  prediction,
}: {
  message: MessageBubbleData;
  isOwn: boolean;
  prediction: Prediction | null;
}) {
  const isVoice = message.message_type === "voice";

  return (
    <View className={`flex w-full ${isOwn ? "items-end" : "items-start"}`}>
      <View className={`flex max-w-[85%] flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {isVoice ? (
          <View className="max-w-[280px]">
            <VoiceBubble message={message} isOwn={isOwn} />
          </View>
        ) : (
          <View
            className={`rounded-xl px-2.5 py-1.5 text-[13px] leading-snug ${
              isOwn
                ? "bg-primary text-white rounded-br-sm"
                : "border border-border bg-accent text-foreground rounded-bl-sm"
            }`}
          >
            <Text className={`text-[13px] leading-snug ${isOwn ? "text-white" : "text-foreground"}`}>
              {message.content}
            </Text>
          </View>
        )}

        {prediction ? <EmotionBadge prediction={prediction} /> : null}

        <Text className="mt-0.5 px-1 text-[10px] text-muted-foreground">
          {formatTime(message.created_at)}
        </Text>
      </View>
    </View>
  );
}
