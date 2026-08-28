"use client";

import { useEffect } from "react";

import { Phone, PhoneOff, MicOff, Mic, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabaseClient";
import { EMOTION_META } from "@/lib/emotions";
import {
  useVoiceCall,
  type CallEmotionUpdate,
  type CallStatus,
} from "@/components/calls/useVoiceCall";

interface IncomingCallData {
  id: string;
  caller_id: string;
}

interface VoiceCallPanelProps {
  conversationId: string;
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function StatusBadge({ status }: { status: CallStatus }) {
  const map: Record<CallStatus, string> = {
    idle: "",
    outgoing: "Calling…",
    ringing: "Ringing…",
    connecting: "Connecting…",
    active: "On call",
    ended: "Call ended",
    declined: "Call declined",
    missed: "Missed call",
  };
  return map[status];
}

function TimelineDot({ update }: { update: CallEmotionUpdate }) {
  const meta = EMOTION_META[update.emotion];
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: meta.color }}
      />
      <span>{meta.label}</span>
    </div>
  );
}

export function VoiceCallPanel({
  conversationId,
  currentUserId,
  otherUserId,
  otherUserName,
}: VoiceCallPanelProps) {
  const call = useVoiceCall({ conversationId, currentUserId, otherUserId });

  // Monitor for incoming calls in this conversation.
  useEffect(() => {
    if (!conversationId || !currentUserId || call.callId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`incoming:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "voice_calls",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          const row = payload.new as IncomingCallData;
          if (row.caller_id === otherUserId && call.status === "idle") {
            // Auto-accept for single-window demo simplicity.
            call.acceptCall(row.id, row.caller_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, currentUserId, otherUserId]);

  const inCall = call.status === "active" || call.status === "connecting" || call.status === "ringing";

  return (
    <div className="flex flex-col border-b p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium capitalize">{otherUserName}</span>
          <span className="text-muted-foreground">{StatusBadge({ status: call.status })}</span>
        </div>
        <div className="flex items-center gap-1">
          {inCall && (
            <>
              {call.status === "active" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={call.toggleMute}
                  aria-label={call.muted ? "Unmute" : "Mute"}
                >
                  {call.muted ? <MicOff size={16} /> : <Mic size={16} />}
                </Button>
              )}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock size={12} /> {formatDuration(call.duration)}
              </span>
              <Button variant="destructive" size="sm" onClick={call.endCall} aria-label="End call">
                <PhoneOff size={16} />
              </Button>
            </>
          )}
          {!inCall && call.status === "idle" && (
            <Button variant="success" size="sm" onClick={call.startCall} aria-label="Start call">
              <Phone size={16} className="mr-1" /> Call
            </Button>
          )}
          {!inCall && (call.status === "ended" || call.status === "declined" || call.status === "missed") && (
            <Button variant="default" size="sm" onClick={call.startCall} aria-label="Call again">
              <Phone size={16} className="mr-1" /> Call again
            </Button>
          )}
        </div>
      </div>

      {call.error && <p className="mt-2 text-xs text-destructive">{call.error}</p>}

      {/* Live emotion during the call */}
      {call.status === "active" && call.currentEmotion && (
        <div className="mt-3 rounded-md border p-2">
          <p className="text-xs font-medium text-muted-foreground">Current emotion</p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: EMOTION_META[call.currentEmotion.emotion].color }}
            />
            <span className="text-sm font-semibold">
              {EMOTION_META[call.currentEmotion.emotion].label}
            </span>
            <span className="text-xs text-muted-foreground">
              {Math.round(call.currentEmotion.confidence * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Timeline */}
      {call.emotionTimeline.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-muted-foreground">Emotion timeline</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {call.emotionTimeline.map((u, i) => (
              <TimelineDot key={i} update={u} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
