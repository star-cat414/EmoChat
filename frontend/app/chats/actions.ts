"use server";

import { createClient } from "@/lib/supabase";

/** Search registered users by username prefix. Excludes the current user. */
export async function searchUsers(query: string, currentUserId: string) {
  if (!query.trim()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio")
    .ilike("username", `${query.trim()}%`)
    .neq("id", currentUserId)
    .limit(20);
  if (error) return [];
  return data ?? [];
}

/**
 * Find an existing 1-to-1 conversation between the two users, or create one.
 * Uses a security-definer RPC on the backend so both membership rows are created
 * atomically without violating RLS. Never creates duplicates.
 */
export async function openOrCreateConversation(
  currentUserId: string,
  otherUserId: string
): Promise<{ conversationId: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_direct_conversation", {
    other_user_id: otherUserId,
  });
  if (error || !data) {
    throw new Error(error?.message || "Failed to open conversation");
  }

  return { conversationId: data as string };
}
