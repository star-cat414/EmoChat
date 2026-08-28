import "server-only";

import { createClient } from "@/lib/supabase";

export interface ProfileResult {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string | null;
  isSelf: boolean;
}

export async function getProfile(
  userId: string,
  currentUserId: string
): Promise<ProfileResult | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    username: data.username,
    avatar_url: data.avatar_url,
    bio: data.bio,
    created_at: data.created_at,
    isSelf: data.id === currentUserId,
  };
}
