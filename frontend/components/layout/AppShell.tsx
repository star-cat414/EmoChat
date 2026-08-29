"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";

import { EmotionBackground } from "@/components/emotion/EmotionBackground";
import { LiquidTopNav, type LiquidTopNavUser } from "@/components/layout/LiquidTopNav";
import { ModelDebugDrawer } from "@/components/layout/ModelDebugDrawer";
import { createClient } from "@/lib/supabaseClient";
import type { EmotionLabel } from "@/lib/emotions";

export interface AppShellUser {
  id: string;
  username: string | null;
  avatar_url: string | null;
  email?: string | null;
}

export function AppShell({ user, children }: { user: AppShellUser; children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [debugOpen, setDebugOpen] = useState(false);
  const [liveState, setLiveState] = useState<{
    emotion: EmotionLabel;
    confidence: number;
  } | null>(null);

  // Derive the "live" HMM state from the user's most recent decoded emotion.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("emotion_predictions")
        .select("predicted_emotion, happy_probability, sad_probability, angry_probability, fear_probability, surprise_probability, neutral_probability")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (cancelled || !data || data.length === 0) return;
      const row = data[0];
      const probs = [
        row.happy_probability,
        row.sad_probability,
        row.angry_probability,
        row.fear_probability,
        row.surprise_probability,
        row.neutral_probability,
      ];
      const confidence = Math.max(...probs);
      setLiveState({ emotion: row.predicted_emotion as EmotionLabel, confidence });
    })();

    // Realtime update whenever a new emotion prediction is stored.
    const channel = supabase
      .channel(`shell-emotion:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "emotion_predictions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const probs = [
            Number(row.happy_probability ?? 0),
            Number(row.sad_probability ?? 0),
            Number(row.angry_probability ?? 0),
            Number(row.fear_probability ?? 0),
            Number(row.surprise_probability ?? 0),
            Number(row.neutral_probability ?? 0),
          ];
          const confidence = Math.max(...probs, 0) || 0;
          setLiveState({
            emotion: (row.predicted_emotion as EmotionLabel) ?? "neutral",
            confidence,
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase, user.id]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <EmotionBackground emotion={liveState?.emotion ?? null} />
      <LiquidTopNav
        user={user}
        liveState={liveState}
        onToggleDebug={() => setDebugOpen((o) => !o)}
        debugOpen={debugOpen}
      />
      <main className="relative z-10 flex-1 px-3 pb-8 pt-4 md:px-4">
        {children}
      </main>

      <AnimatePresence>
        {debugOpen && (
          <ModelDebugDrawer open={debugOpen} onClose={() => setDebugOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
