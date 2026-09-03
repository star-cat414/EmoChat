import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "@/lib/useAuth";
import { useConversations, type ConversationSummary } from "@/lib/useConversations";
import { Avatar } from "@/components/ui/avatar";
import { emotionToMeta } from "@/lib/emotions";
import { messagePreview, relativeTime } from "@/lib/utils";

export default function ChatListScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const userId = user?.id ?? "";
  const { conversations, loading, refresh } = useConversations(userId);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={conversations}
        keyExtractor={(c) => c.id}
        contentContainerClassName="p-3"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
        ListEmptyComponent={
          <View className="items-center px-6 py-16">
            <Text className="text-5xl mb-3">💬</Text>
            <Text className="mb-1 text-base font-semibold text-foreground">
              No conversations yet
            </Text>
            <Text className="text-center text-sm text-muted-foreground">
              Search for someone and start chatting to see it here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ConversationRow
            key={item.id}
            conversation={item}
            onPress={() => router.push(`/chat/${item.id}`)}
          />
        )}
      />
    </View>
  );
}

function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: ConversationSummary;
  onPress: () => void;
}) {
  const meta = conversation.last_emotion
    ? emotionToMeta(conversation.last_emotion.emotion)
    : null;
  const preview = conversation.last_message
    ? messagePreview(conversation.last_message)
    : "No messages yet";

  return (
    <Pressable
      onPress={onPress}
      className="mb-1 flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3 active:opacity-80"
    >
      <Avatar src={conversation.other.avatar_url} username={conversation.other.username} size="md" />
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="shrink text-[15px] font-semibold text-foreground" numberOfLines={1}>
            {conversation.other.username}
          </Text>
          {conversation.last_message && (
            <Text className="ml-2 text-xs text-muted-foreground">
              {relativeTime(conversation.last_message.created_at)}
            </Text>
          )}
        </View>
        <Text className="mt-0.5 text-sm text-muted-foreground" numberOfLines={1}>
          {preview}
        </Text>
      </View>
      {meta && (
        <View className="shrink items-center">
          <Pressable className="flex-row items-center gap-1 rounded-full border border-border bg-card px-1.5 py-0.5">
            <Text className="text-xs">{meta.emoji}</Text>
            <Text style={{ color: meta.color }} className="text-[11px] font-medium">
              {meta.name}
            </Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}
