import "server-only";

import { createClient } from "@/lib/supabase";

export interface CurrentUser {
  id: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string | null;
}

/** Get the authenticated user's email (from auth) + profile row. Returns null if not authed. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? null,
    username: profile?.username ?? null,
    avatar_url: profile?.avatar_url ?? null,
    bio: profile?.bio ?? null,
    created_at: profile?.created_at ?? user.created_at ?? null,
  };
}
