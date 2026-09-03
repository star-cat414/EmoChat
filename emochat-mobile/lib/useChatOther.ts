import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ChatOther } from "@/lib/types";

export function useChatOther(
  conversationId: string,
  currentUserId: string
) {
  const [other, setOther] = useState<ChatOther | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!conversationId || !currentUserId) return;
    const { data: members } = await supabase
      .from("conversation_members")
      .select("conversation_id, user_id")
      .eq("conversation_id", conversationId)
      .neq("user_id", currentUserId);

    const otherUser = members?.[0]?.user_id;
    if (!otherUser) {
      setOther(null);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .eq("id", otherUser)
      .maybeSingle();

    setOther({
      id: otherUser,
      username: profile?.username ?? "Unknown",
      avatar_url: profile?.avatar_url ?? null,
    });
    setLoading(false);
  }, [conversationId, currentUserId]);

  useEffect(() => {
    load();
  }, [load]);

  return { other, loading };
}
