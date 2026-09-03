import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Audio } from "expo-av";
import { Mic, Square } from "lucide-react-native";

import { supabase } from "@/lib/supabase";
import { voiceEmotion, type UploadFile } from "@/lib/api";
import type { MessageBubbleData } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

function extForRecording(uri: string): string {
  const m = uri.match(/\.([a-zA-Z0-9]+)(\?.*)?$/);
  return m ? m[1] : "m4a";
}

export function VoiceRecorder({
  conversationId,
  currentUserId,
  onAdded,
}: {
  conversationId: string;
  currentUserId: string;
  onAdded: (message: MessageBubbleData) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  const start = useCallback(async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        alert("Microphone access denied.");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      alert("Unable to start recording.");
    }
  }, []);

  const stop = useCallback(async () => {
    const rec = recordingRef.current;
    if (!rec) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    setProcessing(true);
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recordingRef.current = null;
      if (!uri) {
        setProcessing(false);
        return;
      }
      await uploadAndInsert(uri);
    } catch {
      // ignore
    } finally {
      setProcessing(false);
    }
  }, [conversationId, currentUserId, onAdded]);

  const uploadAndInsert = async (uri: string) => {
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user.id ?? currentUserId;
    const ext = extForRecording(uri) || "m4a";
    const name = `voice-${Date.now()}.${ext}`;
    const mime = ext === "webm" ? "audio/webm" : ext === "mp3" ? "audio/mpeg" : "audio/mp4";

    const file: UploadFile = { uri, name, type: mime };

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("voice-messages")
      .upload(`${userId}/${name}`, file as unknown as Blob, { contentType: mime });
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
    if (msgError || !msg) {
      alert("Unable to send voice message.");
      return;
    }

    onAdded(msg as MessageBubbleData);

    (async () => {
      const result = await voiceEmotion(file);
      if (!result.ok) return;
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

  if (recording) {
    return (
      <View className="flex-row items-center gap-1.5">
        <Pressable
          onPress={stop}
          className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive"
        >
          <Square size={14} color="#fff" fill="currentColor" />
        </Pressable>
        <Text className="text-xs tabular-nums font-medium text-destructive">
          {formatDuration(elapsed)}
        </Text>
      </View>
    );
  }

  if (processing) {
    return (
      <View className="h-9 w-9 shrink-0 items-center justify-center">
        <View className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent" />
      </View>
    );
  }

  return (
    <Pressable
      onPress={start}
      className="h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground"
    >
      <Mic size={18} color="#64748b" />
    </Pressable>
  );
}
