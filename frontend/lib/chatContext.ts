import "server-only";

import { createClient } from "@/lib/supabase";

export interface OtherUser {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

/** Load the other user in a direct conversation, plus whether current user is a member. */
export async function getChatContext(
  conversationId: string,
  currentUserId: string
): Promise<{ other: OtherUser | null; isMember: boolean }> {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId);

  const members = membership ?? [];
  const isMember = members.some((m) => m.user_id === currentUserId);
  if (!isMember || members.length !== 2) {
    return { other: null, isMember };
  }

  const other = members.find((m) => m.user_id !== currentUserId);
  if (!other) return { other: null, isMember };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio")
    .eq("id", other.user_id)
    .maybeSingle();

  return { other: profile as OtherUser | null, isMember };
}
