// Hand-maintained Supabase database types for EmoChat.
// When you connect your real Supabase project you can regenerate these with:
//   supabase gen types typescript --project-id <ref> --schema public > lib/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type EmotionLabel =
  | "happy"
  | "sad"
  | "angry"
  | "fear"
  | "surprise"
  | "neutral";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          bio?: string | null;
        };
        Update: {
          username?: string;
          avatar_url?: string | null;
          bio?: string | null;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: { type?: string };
        Update: { updated_at?: string };
        Relationships: [];
      };
      conversation_members: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          conversation_id: string;
          user_id: string;
        };
        Update: {};
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          message_type: "text" | "voice";
          content: string | null;
          audio_url: string | null;
          transcript: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          conversation_id: string;
          sender_id: string;
          message_type?: "text" | "voice";
          content?: string | null;
          audio_url?: string | null;
          transcript?: string | null;
        };
        Update: {
          transcript?: string | null;
          content?: string | null;
        };
        Relationships: [];
      };
      emotion_predictions: {
        Row: {
          id: string;
          message_id: string | null;
          user_id: string;
          conversation_id: string | null;
          predicted_emotion: EmotionLabel;
          happy_probability: number;
          sad_probability: number;
          angry_probability: number;
          fear_probability: number;
          surprise_probability: number;
          neutral_probability: number;
          language: string | null;
          model_name: string | null;
          model_version: string | null;
          created_at: string;
        };
        Insert: {
          message_id?: string | null;
          user_id: string;
          conversation_id?: string | null;
          predicted_emotion: EmotionLabel;
          happy_probability: number;
          sad_probability: number;
          angry_probability: number;
          fear_probability: number;
          surprise_probability: number;
          neutral_probability: number;
          language?: string | null;
          model_name?: string | null;
          model_version?: string | null;
        };
        Update: {};
        Relationships: [];
      };
      voice_calls: {
        Row: {
          id: string;
          conversation_id: string;
          caller_id: string;
          receiver_id: string;
          started_at: string | null;
          ended_at: string | null;
          status: string;
        };
        Insert: {
          conversation_id: string;
          caller_id: string;
          receiver_id: string;
          started_at?: string | null;
          ended_at?: string | null;
          status: string;
        };
        Update: {
          started_at?: string | null;
          ended_at?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      voice_emotion_predictions: {
        Row: {
          id: string;
          call_id: string | null;
          user_id: string;
          transcript: string | null;
          predicted_emotion: EmotionLabel;
          happy_probability: number;
          sad_probability: number;
          angry_probability: number;
          fear_probability: number;
          surprise_probability: number;
          neutral_probability: number;
          timestamp: string;
        };
        Insert: {
          call_id: string | null;
          user_id: string;
          transcript?: string | null;
          predicted_emotion: EmotionLabel;
          happy_probability: number;
          sad_probability: number;
          angry_probability: number;
          fear_probability: number;
          surprise_probability: number;
          neutral_probability: number;
        };
        Update: {};
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      create_direct_conversation: {
        Args: { other_user_id: string };
        Returns: string;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
}
