"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Square, TriangleAlert } from "lucide-react";

import { createClient } from "@/lib/supabaseClient";
import { voiceEmotion } from "@/lib/api";
import type { MessageBubbleData } from "@/components/messages/MessageBubble";
import { Button } from "@/components/ui/button";
import { cn, formatDuration } from "@/lib/utils";

export function VoiceRecorder({
  conversationId,
  currentUserId,
  onAdded,
}: {
  conversationId: string;
  currentUserId: string;
  onAdded: (message: MessageBubbleData) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      alert("Microphone access denied.");
    }
  };

  const stop = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (timerRef.current) clearInterval(timerRef.current);
    recorder.addEventListener(
      "stop",
      () => {
        setRecording(false);
        setProcessing(true);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        uploadAndInsert(blob).finally(() => setProcessing(false));
      },
      { once: true }
    );
    recorder.stop();
  };

  const uploadAndInsert = async (blob: Blob) => {
    const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user.id ?? currentUserId;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("voice-messages")
      .upload(`${userId}/${file.name}`, file, { contentType: "audio/webm" });
    if (uploadError) {
      alert("Unable to upload voice message.");
      return;
    }

    const { data: urlData } = supabase.storage
      .from("voice-messages")
      .getPublicUrl(uploadData.path);
    const audioUrl = urlData.publicUrl;

    const { data: msg, error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        message_type: "voice",
        audio_url: audioUrl,
      })
      .select("*")
      .single();
    if (msgError) {
      alert("Unable to send voice message.");
      return;
    }

    onAdded(msg as MessageBubbleData);

    // Transcribe + analyze asynchronously (never blocks sending).
    (async () => {
      const result = await voiceEmotion(file);
      if (!result.ok) {
        setVoiceError(result.error);
        return;
      }
      setVoiceError(null);
      const msgId = (msg as { id: string }).id;
      await supabase.from("messages").update({ transcript: result.transcript }).eq("id", msgId);
      const p = result.probabilities;
      await supabase.from("emotion_predictions").insert({
        message_id: msgId,
        user_id: userId,
        conversation_id: conversationId,
        predicted_emotion: result.emotion,
        happy_probability: p.happy,
        sad_probability: p.sad,
        angry_probability: p.angry,
        fear_probability: p.fear,
        surprise_probability: p.surprise,
        neutral_probability: p.neutral,
        language: result.language,
        model_name: result.model,
        model_version: result.model_version,
      });
    })();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="flex flex-col items-end gap-1">
      {voiceError && (
        <p className="flex max-w-[260px] items-start gap-1 rounded-md bg-destructive/10 px-2 py-1 text-[11px] leading-snug text-destructive">
          <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
          <span>Voice AI unavailable: {voiceError}</span>
        </p>
      )}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant={recording ? "destructive" : "ghost"}
          size="icon"
          onClick={recording ? stop : start}
          disabled={processing}
          aria-label={recording ? "Stop recording" : "Record voice message"}
          className={cn(recording && "animate-pulse")}
        >
          {processing ? (
            <span className="h-3 w-3 rounded-full bg-current" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>
        <span className="w-11 text-xs tabular-nums text-muted-foreground">
          {recording ? formatDuration(elapsed) : processing ? "…" : ""}
        </span>
      </div>
    </div>
  );
}
