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

export interface ChatOther {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface EmotionRow {
  message_id: string | null;
  predicted_emotion: string;
  happy_probability: number;
  sad_probability: number;
  angry_probability: number;
  fear_probability: number;
  surprise_probability: number;
  neutral_probability: number;
}
