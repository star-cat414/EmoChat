import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { predictEmotion } from "@/lib/api";
import type { EmotionLabel, Prediction } from "@/lib/emotions";
import type { EmotionRow, MessageBubbleData } from "@/lib/types";

function rowToPrediction(r: EmotionRow & { id?: string }): Prediction {
  const probabilities = {
    happy: r.happy_probability,
    sad: r.sad_probability,
    angry: r.angry_probability,
    fear: r.fear_probability,
    surprise: r.surprise_probability,
    neutral: r.neutral_probability,
  };
  return {
    emotion: r.predicted_emotion as EmotionLabel,
    confidence: Math.max(...Object.values(probabilities)),
    probabilities,
    language: "auto",
    model: "NGram-HMM",
    model_version: "1.0",
  };
}

export function useChat(conversationId: string, currentUserId: string) {
  const [messages, setMessages] = useState<MessageBubbleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [emotions, setEmotions] = useState<Record<string, Prediction>>({});
  const [analyzing, setAnalyzing] = useState(false);

  const emotionsOrder = useRef<EmotionLabel[]>([]);
  const orderedIds = useRef<Set<string>>(new Set());

  const mergePrediction = useCallback((prediction: Prediction, messageId: string) => {
    setEmotions((prev) => ({ ...prev, [messageId]: prediction }));
    if (!orderedIds.current.has(messageId)) {
      orderedIds.current.add(messageId);
      emotionsOrder.current = [...emotionsOrder.current, prediction.emotion];
    }
  }, []);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    setMessages((data as MessageBubbleData[]) ?? []);
    setLoading(false);

    const { data: preds } = await supabase
      .from("emotion_predictions")
      .select("*")
      .eq("conversation_id", conversationId);
    const map: Record<string, Prediction> = {};
    const order: EmotionLabel[] = [];
    for (const r of (preds as (EmotionRow & { id: string })[]) ?? []) {
      if (!r.message_id) continue;
      map[r.message_id] = rowToPrediction(r);
      if (!orderedIds.current.has(r.message_id)) {
        orderedIds.current.add(r.message_id);
        order.push(r.predicted_emotion as EmotionLabel);
      }
    }
    setEmotions(map);
    emotionsOrder.current = order;
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const msg = payload.new as MessageBubbleData;
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const upd = payload.new as MessageBubbleData;
          setMessages((prev) => prev.map((m) => (m.id === upd.id ? { ...m, ...upd } : m)));
        }
      )
      .subscribe();

    const emotionChannel = supabase
      .channel(`emotions:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "emotion_predictions",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as EmotionRow & { id?: string };
          if (!row.message_id) return;
          mergePrediction(rowToPrediction(row), row.message_id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(emotionChannel);
    };
  }, [conversationId, mergePrediction]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          message_type: "text",
          content: trimmed,
        })
        .select("*")
        .single();
      if (error || !data) return;
      const msg = data as MessageBubbleData;
      setAnalyzing(true);
      try {
        const previous = emotionsOrder.current.slice(-8);
        const prediction = await predictEmotion({
          text: trimmed,
          conversation_id: conversationId,
          user_id: currentUserId,
          previous_emotions: previous,
        });
        if (!prediction) return;
        const rec = {
          message_id: msg.id,
          user_id: currentUserId,
          conversation_id: conversationId,
          predicted_emotion: prediction.emotion,
          happy_probability: prediction.probabilities.happy,
          sad_probability: prediction.probabilities.sad,
          angry_probability: prediction.probabilities.angry,
          fear_probability: prediction.probabilities.fear,
          surprise_probability: prediction.probabilities.surprise,
          neutral_probability: prediction.probabilities.neutral,
        };
        await supabase.from("emotion_predictions").insert(rec);
        mergePrediction(prediction, msg.id);
      } finally {
        setAnalyzing(false);
      }
    },
    [conversationId, currentUserId, mergePrediction]
  );

  return { messages, loading, emotions, analyzing, sendMessage };
}
