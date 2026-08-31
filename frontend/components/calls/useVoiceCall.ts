"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabaseClient";
import { callEmotion } from "@/lib/api";
import type { EmotionLabel } from "@/lib/emotions";

export type CallStatus =
  | "idle"
  | "outgoing"
  | "ringing"
  | "connecting"
  | "active"
  | "ended"
  | "declined"
  | "missed";

export interface CallEmotionUpdate {
  emotion: EmotionLabel;
  confidence: number;
  timestamp: number;
  transcript: string;
}

interface UseCallOptions {
  conversationId: string;
  currentUserId: string;
  otherUserId: string;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const CAPTURE_MS = 6000;

export function useVoiceCall({ conversationId, currentUserId, otherUserId }: UseCallOptions) {
  const supabaseRef = useRef<ReturnType<typeof createClient>>(null as never);
  if (!supabaseRef.current) supabaseRef.current = createClient();

  const [status, setStatus] = useState<CallStatus>("idle");
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<CallEmotionUpdate | null>(null);
  const [emotionTimeline, setEmotionTimeline] = useState<CallEmotionUpdate[]>([]);
  const [callId, setCallId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabaseRef.current.channel> | null>(null);
  const callIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const captureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emotionBalancerRef = useRef<EmotionLabel[]>([]);
  const statusRef = useRef<CallStatus>("idle");

  const setStatusBoth = (s: CallStatus) => {
    statusRef.current = s;
    setStatus(s);
  };

  const setCallIdBoth = (id: string | null) => {
    callIdRef.current = id;
    setCallId(id);
  };

  const broadcast = useCallback((event: string, payload: Record<string, unknown>) => {
    channelRef.current?.send({ type: "broadcast", event, payload });
  }, []);

  const cleanupPeer = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);
    timerRef.current = null;
    captureTimeoutRef.current = null;
  }, []);

  const handleIce = useCallback(
    (payload: { candidate?: RTCIceCandidateInit; from?: string }) => {
      if (!payload.candidate || payload.from === currentUserId) return;
      pcRef.current?.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(() => {});
    },
    [currentUserId]
  );

  // ---- Emotion capture ----
  const runCapture = useCallback(
    (mediaRecorder: MediaRecorder, chunks: Blob[]) => {
      mediaRecorder.start();
      captureTimeoutRef.current = setTimeout(() => {
        if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
      }, CAPTURE_MS);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        if (statusRef.current === "active" && chunks.length) {
          const blob = new Blob(chunks, { type: "audio/webm" });
          const file = new File([blob], `call-${Date.now()}.webm`, { type: "audio/webm" });
          const result = await callEmotion(file, emotionBalancerRef.current);
          if (result.ok) {
            if (statusRef.current === "active") {
              const update: CallEmotionUpdate = {
                emotion: result.emotion as EmotionLabel,
                confidence: result.confidence,
                timestamp: Date.now(),
                transcript: result.transcript,
              };
              emotionBalancerRef.current.push(result.emotion as EmotionLabel);
              setCurrentEmotion(update);
              setEmotionTimeline((prev) => [...prev, update]);
              supabaseRef.current.from("voice_emotion_predictions").insert({
                call_id: callIdRef.current,
                user_id: currentUserId,
                transcript: result.transcript,
                predicted_emotion: result.emotion as EmotionLabel,
                happy_probability: result.probabilities.happy,
                sad_probability: result.probabilities.sad,
                angry_probability: result.probabilities.angry,
                fear_probability: result.probabilities.fear,
                surprise_probability: result.probabilities.surprise,
                neutral_probability: result.probabilities.neutral,
              });
            }
          } else {
            setError(`Voice AI unavailable: ${result.error}`);
          }
        }
        chunks.length = 0;
        if (statusRef.current === "active") {
          runCapture(mediaRecorder, chunks);
        }
      };
    },
    [currentUserId]
  );

  const startEmotionCapture = useCallback(() => {
    if (!streamRef.current) return;
    emotionBalancerRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current);
    runCapture(mediaRecorder, []);
  }, [runCapture]);

  // ---- Peer ----
  const createPeer = useCallback(() => {
    cleanupPeer();
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate) broadcast("ice-candidate", { candidate: e.candidate, from: currentUserId });
    };
    pc.ontrack = (e) => {
      const audio = new Audio();
      audio.srcObject = e.streams[0];
      audio.autoplay = true;
      audio.play().catch(() => {});
    };
    return pc;
  }, [broadcast, cleanupPeer, currentUserId]);

  const endCall = useCallback(async () => {
    broadcast("end-call", { from: currentUserId });
    if (callIdRef.current) {
      await supabaseRef.current
        .from("voice_calls")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", callIdRef.current);
    }
    if (channelRef.current) supabaseRef.current.removeChannel(channelRef.current);
    channelRef.current = null;
    cleanupPeer();
    setCallIdBoth(null);
    setDuration(0);
    setStatusBoth("ended");
  }, [broadcast, cleanupPeer, currentUserId]);

  const bindChannelEvents = useCallback(
    (ch: ReturnType<typeof supabaseRef.current.channel>, isCaller: boolean) => {
        ch.on("broadcast", { event: "offer" }, async ({ payload }) => {
          // Only the callee responds to an offer.
          if (statusRef.current !== "ringing" && statusRef.current !== "active") return;
          if (isCaller) return;
          const p = payload as { sdp?: string };
          if (!p.sdp) return;
          createPeer();
          await pcRef.current!.setRemoteDescription({ type: "offer", sdp: p.sdp });
          const answer = await pcRef.current!.createAnswer();
          await pcRef.current!.setLocalDescription(answer);
          broadcast("answer", { sdp: pcRef.current!.localDescription!.sdp, from: currentUserId });
          setStatusBoth("active");
        });
        // Caller retransmits the offer once the callee signals it's ready.
        ch.on("broadcast", { event: "ready" }, async () => {
          if (!isCaller || !pcRef.current?.localDescription?.sdp) return;
          broadcast("offer", { sdp: pcRef.current.localDescription.sdp, from: currentUserId });
        });
      ch.on("broadcast", { event: "answer" }, ({ payload }) => {
        const p = payload as { sdp?: string };
        if (p.sdp && pcRef.current) {
          pcRef.current.setRemoteDescription({ type: "answer", sdp: p.sdp });
          setStatusBoth("active");
        }
      });
      ch.on("broadcast", { event: "ice-candidate" }, ({ payload: p }) => handleIce(p));
      ch.on("broadcast", { event: "end-call" }, () => {
        if (pcRef.current) {
          if (channelRef.current) supabaseRef.current.removeChannel(channelRef.current);
          channelRef.current = null;
          cleanupPeer();
          setCallIdBoth(null);
          setDuration(0);
          setStatusBoth("ended");
        }
      });
      return ch;
    },
    [broadcast, cleanupPeer, createPeer, currentUserId, handleIce]
  );

  const setupChannel = useCallback(
    (cid: string | null, isCaller: boolean) => {
      if (!cid) return;
      const ch = supabaseRef.current.channel(`call-signaling:${cid}`, {
        config: { broadcast: { self: false } },
      });
      bindChannelEvents(ch, isCaller);
      ch.subscribe();
      channelRef.current = ch;
    },
    [bindChannelEvents]
  );

  // ---- Start a call (caller) ----
  const startCall = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch {
      setError("Microphone access was denied.");
      setStatusBoth("idle");
      return;
    }

    const { data, error: err } = await supabaseRef.current
      .from("voice_calls")
      .insert({
        conversation_id: conversationId,
        caller_id: currentUserId,
        receiver_id: otherUserId,
        status: "ringing",
      })
      .select("id")
      .single();
    if (err || !data) {
      setError("Could not start the call.");
      setStatusBoth("idle");
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      return;
    }
    setCallIdBoth((data as { id: string }).id);
    setStatusBoth("ringing");
    setupChannel(callIdRef.current, true);
    startEmotionCapture();
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);

    // Give the channel a moment to subscribe, then send the offer.
    setTimeout(async () => {
      if (!pcRef.current) createPeer();
      const pc = pcRef.current!;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      broadcast("offer", { sdp: pc.localDescription!.sdp, from: currentUserId });
    }, 400);
  }, [
    broadcast,
    conversationId,
    createPeer,
    currentUserId,
    otherUserId,
    setupChannel,
    startEmotionCapture,
  ]);

  // ---- Accept an incoming call (callee) ----
  const acceptCall = useCallback(
    async (incomingCallId: string, incomingCallerId: string) => {
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      } catch {
        setError("Microphone access was denied.");
        supabaseRef.current.from("voice_calls").update({ status: "missed" }).eq("id", incomingCallId);
        setStatusBoth("missed");
        return;
      }

      setCallIdBoth(incomingCallId);
      setStatusBoth("ringing"); // waiting for offer
      setupChannel(incomingCallId, false);
      startEmotionCapture();
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);

      await supabaseRef.current
        .from("voice_calls")
        .update({ status: "active", started_at: new Date().toISOString() })
        .eq("id", incomingCallId);

      // In case the caller already sent the offer before we joined, re-request it.
      // The caller listens for a "ready" signal to retransmit the offer.
      broadcast("ready", { from: currentUserId, caller: incomingCallerId });
    },
    [broadcast, currentUserId, setupChannel, startEmotionCapture]
  );

  const declineCall = useCallback(
    async (incomingCallId: string) => {
      await supabaseRef.current
        .from("voice_calls")
        .update({ status: "declined", ended_at: new Date().toISOString() })
        .eq("id", incomingCallId);
      setStatusBoth("declined");
    },
    []
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (channelRef.current && callIdRef.current) {
        supabaseRef.current.removeChannel(channelRef.current);
      }
      cleanupPeer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    duration,
    muted,
    currentEmotion,
    emotionTimeline,
    callId,
    error,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
  };
}
