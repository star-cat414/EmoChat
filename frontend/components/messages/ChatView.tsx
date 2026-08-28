"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";

import { createClient } from "@/lib/supabaseClient";
import { predictEmotion } from "@/lib/api";
import type { EmotionLabel, Prediction } from "@/lib/emotions";
import { MessageBubble, type MessageBubbleData } from "@/components/messages/MessageBubble";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import { VoiceCallPanel } from "@/components/calls/VoiceCallPanel";
import { Avatar, initialsOf } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ChatOther {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface EmotionRow {
  message_id: string;
  predicted_emotion: EmotionLabel;
  happy_probability: number;
  sad_probability: number;
  angry_probability: number;
  fear_probability: number;
  surprise_probability: number;
  neutral_probability: number;
}

export function ChatView({
  conversationId,
  currentUserId,
  other,
}: {
  conversationId: string;
  currentUserId: string;
  other: ChatOther;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [messages, setMessages] = useState<MessageBubbleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [emotions, setEmotions] = useState<Record<string, Prediction>>({});
  const [online, setOnline] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track a stable ordered list of past emotions for HMM context.
  const emotionsOrder = useRef<EmotionLabel[]>([]);

  const predictionToRecord = useCallback((p: Prediction): EmotionRow => {
    const { happy, sad, angry, fear, surprise, neutral } = p.probabilities;
    return {
      message_id: "",
      predicted_emotion: p.emotion,
      happy_probability: happy,
      sad_probability: sad,
      angry_probability: angry,
      fear_probability: fear,
      surprise_probability: surprise,
      neutral_probability: neutral,
    };
  }, []);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    setMessages((data as MessageBubbleData[]) ?? []);
    setLoading(false);

    // Load predictions for all messages.
    const { data: preds } = await supabase
      .from("emotion_predictions")
      .select("*")
      .eq("conversation_id", conversationId);
    const map: Record<string, Prediction> = {};
    const order: EmotionLabel[] = [];
    for (const r of (preds as (EmotionRow & { id: string })[]) ?? []) {
      if (!r.message_id) continue;
      map[r.message_id] = {
        emotion: r.predicted_emotion,
        confidence: Math.max(
          r.happy_probability,
          r.sad_probability,
          r.angry_probability,
          r.fear_probability,
          r.surprise_probability,
          r.neutral_probability
        ),
        probabilities: {
          happy: r.happy_probability,
          sad: r.sad_probability,
          angry: r.angry_probability,
          fear: r.fear_probability,
          surprise: r.surprise_probability,
          neutral: r.neutral_probability,
        },
        language: "auto",
        model: "NGram-HMM",
        model_version: "1.0",
      };
      order.push(r.predicted_emotion);
    }
    setEmotions(map);
    emotionsOrder.current = order;
  }, [supabase, conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime subscription.
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const msg = payload.new as MessageBubbleData;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, conversationId]);

  // Auto-scroll to bottom on new messages.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, emotions]);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, []);

  const analyzeText = useCallback(
    async (messageId: string, content: string) => {
      setAnalyzing(true);
      try {
        const previous = emotionsOrder.current.slice(-8);
        const prediction = await predictEmotion({
          text: content,
          conversation_id: conversationId,
          user_id: currentUserId,
          previous_emotions: previous,
        });
        if (!prediction) return;

        const record = predictionToRecord(prediction);
        record.message_id = messageId;
        await supabase
          .from("emotion_predictions")
          .insert({ ...record, user_id: currentUserId, conversation_id: conversationId });

        setEmotions((prev) => ({ ...prev, [messageId]: prediction }));
        emotionsOrder.current = [...emotionsOrder.current, prediction.emotion];
      } finally {
        setAnalyzing(false);
      }
    },
    [conversationId, currentUserId, supabase, predictionToRecord]
  );

  const sendMessage = useCallback(async () => {
    const content = text.trim();
    if (!content || sending) return;

    setSending(true);
    setText("");
    const session = await supabase.auth.getSession();
    const senderId = session.data.session?.user.id ?? currentUserId;

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        message_type: "text",
        content,
      })
      .select("*")
      .single();

    setSending(false);
    if (error || !data) return;

    const msg = data as MessageBubbleData;
    // Trigger emotion analysis asynchronously (never blocks sending).
    analyzeText(msg.id, content);
    scrollToBottom();
  }, [text, sending, conversationId, currentUserId, supabase, analyzeText, scrollToBottom]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-56px)] max-w-4xl flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")} className="md:hidden" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar src={other.avatar_url}>
          {initialsOf(other.username)}
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{other.username}</p>
          <p className="text-xs text-muted-foreground">
            {online ? "● Online" : "1-to-1 conversation"}
          </p>
        </div>
        <a
          href={`/analytics/conversation/${conversationId}`}
          className={cn(
            "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors hover:bg-muted"
          )}
        >
          Analytics
        </a>
      </div>

      {/* Voice calls */}
      <VoiceCallPanel
        conversationId={conversationId}
        currentUserId={currentUserId}
        otherUserId={other.id}
        otherUserName={other.username}
      />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-10">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            Say hi to {other.username}!
          </p>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              isOwn={m.sender_id === currentUserId}
              prediction={emotions[m.id] ?? null}
            />
          ))
        )}
        {analyzing && (
          <p className="text-right text-xs text-muted-foreground">Analyzing emotion...</p>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-end gap-2">
          <VoiceRecorder
            conversationId={conversationId}
            currentUserId={currentUserId}
            onAdded={(msg) =>
              setMessages((prev) =>
                prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
              )
            }
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="max-h-32 flex-1 resize-none rounded-xl border border-border bg-transparent px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button onClick={sendMessage} disabled={sending || !text.trim()} aria-label="Send">
            {sending ? (
              <span className="text-xs">Sending...</span>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
