import { supabase } from "@/lib/supabase";

export interface SearchUser {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

export async function searchUsers(
  query: string,
  excludeId?: string
): Promise<SearchUser[]> {
  const q = query.trim();
  if (!q) return [];
  let builder = supabase
    .from("profiles")
    .select("id, username, avatar_url, bio")
    .ilike("username", `%${q}%`)
    .order("username")
    .limit(20);
  if (excludeId) builder = builder.neq("id", excludeId);
  const { data } = await builder;
  return (data as SearchUser[]) ?? [];
}

export async function openOrCreateConversation(
  otherUserId: string
): Promise<string | null> {
  const { data, error } = await supabase.rpc("create_direct_conversation", {
    other_user_id: otherUserId,
  });
  if (error) return null;
  return data as string;
}
