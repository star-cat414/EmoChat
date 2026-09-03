import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string | null;
}

export function useProfile(userId: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: p } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, bio, created_at")
      .eq("id", userId)
      .maybeSingle();

    setProfile({
      id: userId,
      email: user?.email ?? null,
      username: p?.username ?? null,
      avatar_url: p?.avatar_url ?? null,
      bio: p?.bio ?? null,
      created_at: p?.created_at ?? user?.created_at ?? null,
    });
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { profile, loading, refresh: load };
}
