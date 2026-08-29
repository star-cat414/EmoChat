"use client";

import { Mic, Play, ChevronDown } from "lucide-react";
import { useRef, useState } from "react";
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}
    >
      <div className={cn("flex max-w-[80%] flex-col sm:max-w-[68%]", isOwn ? "items-end" : "items-start")}>
        {/* Bubble */}
        <div
          className={cn(
            "relative rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed break-words",
            isOwn
              ? "bg-primary text-white rounded-br-md"
              : "border border-border bg-[#eef2ff] text-foreground rounded-bl-md"
          )}
        >
          {isVoice ? <VoiceBubble message={message} isOwn={isOwn} /> : message.content}
        </div>

        {/* Emotion micro-badge (compact, non-dominant) */}
        {prediction && <EmotionMicroBadge prediction={prediction} />}

        <p className="mt-0.5 px-1 text-[11px] text-muted-foreground">
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
    <div className="mt-1 flex flex-col items-start">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-border bg-white px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted"
        aria-expanded={expanded}
      >
        <span>{meta.emoji}</span>
        <span style={{ color: meta.color }}>{meta.name}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-1 w-56 space-y-1.5 overflow-hidden rounded-xl border border-border bg-white p-2.5 shadow-sm"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            HMM decode
          </p>
          {rows.map(({ meta: m, probability }) => (
            <div key={m.label} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-[11px] leading-none text-foreground">{m.emoji} {m.name}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{ background: m.color, width: `${Math.max(probability * 100, 2)}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
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

  const togglePlay = () => {
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
  };

  return (
    <div style={{ width: "min(260px, 72vw)" }}>
      <div className="flex items-center gap-2">
        <button
          onClick={togglePlay}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-colors",
            isOwn
              ? "bg-white/25 hover:bg-white/40"
              : "bg-primary hover:bg-indigo-700"
          )}
          aria-label={playing ? "Pause" : "Play"}
        >
          <Play className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-current opacity-25">
            <div
              className="h-full rounded-full bg-current opacity-90"
              style={{ width: duration ? `${(progress / duration) * 100}%` : "0%" }}
            />
          </div>
        </div>
        <span className={cn("text-xs tabular-nums", isOwn ? "text-white/80" : "text-muted-foreground")}>
          {formatDuration(duration || progress)}
        </span>
      </div>
      <div className={cn("mt-1.5 flex items-start gap-1 text-xs", isOwn ? "text-white/80" : "text-muted-foreground")}>
        <Mic className="mt-0.5 h-3 w-3 shrink-0" />
        <span>{message.transcript || "Transcript unavailable"}</span>
      </div>
    </div>
  );
}
