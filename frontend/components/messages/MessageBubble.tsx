"use client";

import { Mic, Play } from "lucide-react";
import { useState } from "react";

import { EmotionCard } from "@/components/emotion/EmotionCard";
import type { Prediction } from "@/lib/emotions";
import { cn, formatTime, formatDuration } from "@/lib/utils";

export interface MessageBubbleData {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: string;
  content: string | null;
  audio_url: string | null;
  transcript: string | null;
  created_at: string;
}

export function MessageBubble({
  message,
  isOwn,
  prediction,
}: {
  message: MessageBubbleData;
  isOwn: boolean;
  prediction: Prediction | null;
}) {
  const isVoice = message.message_type === "voice";

  return (
    <div
      className={cn(
        "flex w-full",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn("max-w-[78%] sm:max-w-[65%]", isOwn ? "items-end" : "items-start")}>
        {isVoice ? (
          <VoiceBubble message={message} isOwn={isOwn} />
        ) : (
          <div
            className={cn(
              "rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed break-words",
              isOwn
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-card border border-border text-foreground rounded-bl-md"
            )}
          >
            {message.content}
          </div>
        )}

        <div className="mt-1 flex items-center justify-end gap-2 pr-1">
          <EmotionCard prediction={prediction} />
        </div>

        <p className="px-1 text-[11px] text-muted-foreground">
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}

function VoiceBubble({
  message,
  isOwn,
}: {
  message: MessageBubbleData;
  isOwn: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioUrl = message.audio_url || "";

  const togglePlay = () => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => {
      setProgress(audio.currentTime);
      if (audio.currentTime >= audio.duration) {
        setPlaying(false);
        setProgress(0);
      }
    };
    audio.onended = () => setPlaying(false);
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl p-3",
        isOwn ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border rounded-bl-md"
      )}
      style={{ width: "min(260px, 78vw)" }}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={togglePlay}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            isOwn ? "bg-white/20 hover:bg-white/30" : "bg-primary/10 hover:bg-primary/20"
          )}
          aria-label={playing ? "Pause" : "Play"}
        >
          <Play className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-current opacity-30">
            <div
              className="h-full rounded-full bg-current opacity-80"
              style={{ width: duration ? `${(progress / duration) * 100}%` : "0%" }}
            />
          </div>
        </div>
        <span className="text-xs tabular-nums">
          {formatDuration(duration || progress)}
        </span>
      </div>
      <div className="mt-1.5 flex items-start gap-1 text-xs">
        <Mic className="mt-0.5 h-3 w-3 shrink-0" />
        <span>{message.transcript || "Transcript unavailable"}</span>
      </div>
    </div>
  );
}
