"use client";

import { Mic, Play, Pause, ChevronDown } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { emotionToMeta, type Prediction } from "@/lib/emotions";
import { emotionRows } from "@/lib/utils";
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
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}
    >
      <div className={cn("flex max-w-[85%] flex-col sm:max-w-[65%]", isOwn ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-xl px-2.5 py-1.5 text-[13px] leading-snug break-words",
            isOwn
              ? "bg-primary text-white rounded-br-sm"
              : "border border-border bg-accent text-foreground rounded-bl-sm",
            isVoice && "p-0 bg-transparent border-0 max-w-[260px] sm:max-w-[300px]"
          )}
        >
          {isVoice ? (
            <VoiceBubble message={message} isOwn={isOwn} />
          ) : (
            message.content
          )}
        </div>

        {prediction && <EmotionMicroBadge prediction={prediction} />}

        <p className="mt-0.5 px-1 text-[10px] text-muted-foreground">
          {formatTime(message.created_at)}
        </p>
      </div>
    </motion.div>
  );
}

function EmotionMicroBadge({ prediction }: { prediction: Prediction }) {
  const [expanded, setExpanded] = useState(false);
  const meta = emotionToMeta(prediction.emotion);
  const rows = emotionRows(prediction.probabilities);

  return (
    <div className="mt-0.5 flex flex-col items-start">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 rounded-md border border-border bg-card px-1.5 py-px text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted"
        aria-expanded={expanded}
      >
        <span>{meta.emoji}</span>
        <span style={{ color: meta.color }}>{meta.name}</span>
        <ChevronDown className={cn("h-2.5 w-2.5 transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-1 w-52 space-y-1 overflow-hidden rounded-lg border border-border bg-card p-2 shadow-sm"
        >
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            HMM decode
          </p>
          {rows.map(({ meta: m, probability }) => (
            <div key={m.label} className="flex items-center gap-1.5">
              <span className="w-16 shrink-0 text-[10px] leading-none text-foreground">{m.emoji} {m.name}</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{ background: m.color, width: `${Math.max(probability * 100, 2)}%` }}
                />
              </div>
              <span className="w-7 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
                {(probability * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function VoiceBubble({ message, isOwn }: { message: MessageBubbleData; isOwn: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioUrl = message.audio_url || "";

  const togglePlay = useCallback(() => {
    if (!audioUrl) return;
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onloadedmetadata = () => setDuration(audio ? audio.duration : 0);
      audio.ontimeupdate = () => {
        if (!audio) return;
        setProgress(audio.currentTime);
        if (audio.currentTime >= audio.duration) {
          setPlaying(false);
          setProgress(0);
        }
      };
      audio.onended = () => setPlaying(false);
    }
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  }, [audioUrl, playing]);

  const pct = duration ? (progress / duration) * 100 : 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl border border-border bg-card p-2 shadow-sm",
        isOwn
          ? "border-primary/30 bg-primary/10"
          : "border-border bg-card"
      )}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={togglePlay}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
            isOwn
              ? "bg-primary text-white hover:bg-primary/90"
              : "bg-primary/10 text-primary hover:bg-primary/20"
          )}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <Pause className="h-3.5 w-3.5 fill-current" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="h-1 w-full overflow-hidden rounded-full bg-current opacity-15">
            <div
              className="h-full rounded-full bg-primary transition-all duration-100"
              style={{ width: `${Math.max(pct, pct > 0 ? 3 : 0)}%` }}
            />
          </div>
        </div>
        <span className={cn("text-[10px] tabular-nums shrink-0", isOwn ? "text-foreground/60" : "text-muted-foreground")}>
          {formatDuration(duration || progress)}
        </span>
      </div>
      {message.transcript && (
        <div className={cn("flex items-start gap-1 text-[11px] leading-snug", isOwn ? "text-foreground/70" : "text-muted-foreground")}>
          <Mic className="mt-px h-2.5 w-2.5 shrink-0 opacity-50" />
          <span className="line-clamp-2">{message.transcript}</span>
        </div>
      )}
    </div>
  );
}
