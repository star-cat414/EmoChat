import { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, BarChart3, Send } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/lib/useAuth";
import { useChat } from "@/lib/useChat";
import { useChatOther } from "@/lib/useChatOther";
import { MessageBubble } from "@/components/chat/message-bubble";
import { VoiceRecorder } from "@/components/voice/voice-recorder";
import { NGramAutocomplete } from "@/components/chat/ngram-autocomplete";
import { Avatar } from "@/components/ui/avatar";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id ?? "";
  const router = useRouter();
  const { user } = useAuth();
  const currentUserId = user?.id ?? "";

  const { other, loading: otherLoading } = useChatOther(conversationId, currentUserId);
  const { messages, loading, emotions, analyzing, sendMessage } = useChat(
    conversationId,
    currentUserId
  );

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const activeWord = text.endsWith(" ");

  const displayMessages = useMemo(() => [...messages].reverse(), [messages]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    await sendMessage(content);
    setSending(false);
  };

  const handlePick = (word: string) => {
    setText((prev) => {
      const trimmedPrev = prev.trimEnd();
      const sep = trimmedPrev && trimmedPrev.length > 0 ? " " : "";
      return `${trimmedPrev}${sep}${word} `;
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        {/* Header */}
        <View className="flex-row items-center gap-3 border-b border-border bg-card px-3 py-2.5">
          <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-lg">
            <ArrowLeft size={20} color="#0f172a" />
          </Pressable>
          <Avatar src={other?.avatar_url} username={other?.username} size="sm" />
          <View className="min-w-0 flex-1">
            <Text className="truncate text-[15px] font-semibold text-foreground">
              {otherLoading || !other ? "…" : other.username}
            </Text>
            <Text className="text-xs text-muted-foreground">Chat</Text>
          </View>
          <Pressable
            onPress={() => router.push(`/analytics/${conversationId}`)}
            className="flex-row items-center gap-1 rounded-lg px-2 py-1.5"
          >
            <BarChart3 size={16} color="#6366f1" />
            <Text className="text-sm font-medium text-primary">Mood</Text>
          </Pressable>
        </View>

        {/* Messages */}
        <FlatList
          data={displayMessages}
          keyExtractor={(m) => m.id}
          inverted
          contentContainerClassName="px-2.5 py-3"
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isOwn={item.sender_id === currentUserId}
              prediction={emotions[item.id] ?? null}
            />
          )}
          ListEmptyComponent={
            !loading ? (
              <View className="items-center py-16">
                <Text className="text-sm text-muted-foreground">
                  Say hi to {other?.username ?? "them"}!
                </Text>
              </View>
            ) : null
          }
        />

        {analyzing && (
          <Text className="px-4 pb-1 text-right text-xs text-muted-foreground">
            Decoding emotion…
          </Text>
        )}

        {/* Composer */}
        <View className="border-t border-border bg-background px-2.5 py-2">
          <View className="mx-auto w-full max-w-xl">
            {activeWord && (
              <NGramAutocomplete text={text} activeWord={activeWord} onPick={handlePick} />
            )}
            <View className="flex-row items-end gap-1.5 rounded-2xl border border-border bg-muted px-2 py-1.5">
              <VoiceRecorder
                conversationId={conversationId}
                currentUserId={currentUserId}
                onAdded={() => {}}
              />
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Message…"
                placeholderTextColor="#64748b"
                multiline
                className="max-h-28 flex-1 px-1 py-1 text-[14px] text-foreground"
              />
              <Pressable
                onPress={handleSend}
                disabled={sending || !text.trim()}
                className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary disabled:opacity-40"
              >
                <Send size={16} color="#fff" />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
