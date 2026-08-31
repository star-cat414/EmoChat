-- ============================================================
-- Drop the voice-call feature (removed from the product).
-- Tables were never shipped with a frontend, this is a cleanup.
-- ============================================================

-- Remove from the realtime publication before dropping.
alter publication supabase_realtime drop table if exists public.voice_emotion_predictions;
alter publication supabase_realtime drop table if exists public.voice_calls;

-- Drop child first (FK depends on voice_calls).
drop table if exists public.voice_emotion_predictions;
drop table if exists public.voice_calls;
