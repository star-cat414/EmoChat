import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { useAuth } from "@/lib/useAuth";
import { searchUsers, openOrCreateConversation, type SearchUser } from "@/lib/search";
import { Avatar } from "@/components/ui/avatar";

export default function SearchScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const res = await searchUsers(trimmed, user?.id);
      setResults(res);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, user?.id]);

  const onOpen = async (other: SearchUser) => {
    setSearching(true);
    const convId = await openOrCreateConversation(other.id);
    setSearching(false);
    if (!convId) return;
    router.push(`/chat/${convId}`);
  };

  return (
    <View className="flex-1 bg-background p-3">
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search usernames…"
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
        autoCorrect={false}
        className="mb-3 h-12 rounded-xl border border-border bg-card px-4 text-[15px] text-foreground"
      />

      {loading ? (
        <ActivityIndicator className="mt-10" color="#6366f1" />
      ) : results.length === 0 && query.trim() ? (
        <Text className="mt-10 text-center text-sm text-muted-foreground">
          No users found.
        </Text>
      ) : results.length === 0 ? (
        <Text className="mt-10 text-center text-sm text-muted-foreground">
          Type a username to find someone to chat with.
        </Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(u) => u.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onOpen(item)}
              disabled={searching}
              className="mb-1 flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3 active:opacity-80"
            >
              <Avatar src={item.avatar_url} username={item.username} size="md" />
              <View className="min-w-0 flex-1">
                <Text className="text-[15px] font-semibold text-foreground">
                  {item.username}
                </Text>
                {item.bio ? (
                  <Text className="mt-0.5 text-sm text-muted-foreground" numberOfLines={1}>
                    {item.bio}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
