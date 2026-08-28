import "server-only";

import { createClient } from "@/lib/supabase";

export interface ConversationSummary {
  id: string;
  other: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
  last_message: {
    id: string;
    message_type: string;
    content: string | null;
    transcript: string | null;
    sender_id: string;
    created_at: string;
  } | null;
  last_emotion: { emotion: string; confidence: number } | null;
  unread: number;
}

export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("conversation_members")
    .select("conversation_id, joined_at")
    .eq("user_id", userId);

  if (!memberships || memberships.length === 0) return [];

  const conversationIds = memberships.map((m) => m.conversation_id);

  // Other members of each conversation.
  const { data: members } = await supabase
    .from("conversation_members")
    .select("conversation_id, user_id, profiles:user_id(username, avatar_url)")
    .in("conversation_id", conversationIds)
    .neq("user_id", userId);

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, updated_at")
    .in("id", conversationIds)
    .order("updated_at", { ascending: false });

  const summaries: ConversationSummary[] = [];

  for (const conv of conversations ?? []) {
    const otherMember = (members ?? []).find(
      (m) => m.conversation_id === conv.id
    );
    const otherProfile = Array.isArray(otherMember?.profiles)
      ? otherMember.profiles[0]
      : (otherMember?.profiles as unknown as
          | { username: string | null; avatar_url: string | null }
          | undefined);

    const { data: lastMsg } = await supabase
      .from("messages")
      .select("id, message_type, content, transcript, sender_id, created_at")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: lastEmotion } = await supabase
      .from("emotion_predictions")
      .select("predicted_emotion, happy_probability, sad_probability, angry_probability, fear_probability, surprise_probability, neutral_probability")
      .eq("message_id", lastMsg?.id ?? "")
      .maybeSingle();

    summaries.push({
      id: conv.id,
      other: {
        id: otherMember?.user_id ?? "",
        username: otherProfile?.username ?? "Unknown",
        avatar_url: otherProfile?.avatar_url ?? null,
      },
      last_message: lastMsg
        ? {
            id: lastMsg.id,
            message_type: lastMsg.message_type,
            content: lastMsg.content,
            transcript: lastMsg.transcript,
            sender_id: lastMsg.sender_id,
            created_at: lastMsg.created_at,
          }
        : null,
      last_emotion: lastEmotion
        ? {
            emotion: lastEmotion.predicted_emotion,
            confidence: Math.max(
              lastEmotion.happy_probability,
              lastEmotion.sad_probability,
              lastEmotion.angry_probability,
              lastEmotion.fear_probability,
              lastEmotion.surprise_probability,
              lastEmotion.neutral_probability
            ),
          }
        : null,
      unread: 0,
    });
  }

  return summaries;
}
