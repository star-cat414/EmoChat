-- ============================================================
-- EmoChat — Supabase schema (PostgreSQL)
-- Run this in the Supabase SQL Editor (or via migrations).
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES (1:1 with auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile on new user signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep updated_at fresh.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- CONVERSATIONS + MEMBERS
-- ============================================================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'direct',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (conversation_id, user_id)
);

create index if not exists conversation_members_user_idx on public.conversation_members (user_id);
create index if not exists conversation_members_conversation_idx on public.conversation_members (conversation_id);

-- ============================================================
-- MESSAGES
-- ============================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  message_type text not null default 'text' check (message_type in ('text', 'voice')),
  content text,
  audio_url text,
  transcript text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

-- ============================================================
-- EMOTION PREDICTIONS
-- ============================================================
create table if not exists public.emotion_predictions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.messages (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete cascade,
  predicted_emotion text not null check (predicted_emotion in ('happy','sad','angry','fear','surprise','neutral')),
  happy_probability numeric not null default 0,
  sad_probability numeric not null default 0,
  angry_probability numeric not null default 0,
  fear_probability numeric not null default 0,
  surprise_probability numeric not null default 0,
  neutral_probability numeric not null default 0,
  language text,
  model_name text,
  model_version text,
  created_at timestamptz not null default now()
);

create index if not exists emotion_predictions_user_idx on public.emotion_predictions (user_id);
create index if not exists emotion_predictions_conversation_idx on public.emotion_predictions (conversation_id);
create index if not exists emotion_predictions_message_idx on public.emotion_predictions (message_id);

-- ============================================================
-- VOICE CALLS
-- ============================================================
create table if not exists public.voice_calls (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations (id) on delete cascade,
  caller_id uuid not null references auth.users (id) on delete cascade,
  receiver_id uuid not null references auth.users (id) on delete cascade,
  started_at timestamptz,
  ended_at timestamptz,
  status text not null default 'ringing' check (status in ('ringing','active','ended','declined','missed','failed'))
);

-- ============================================================
-- VOICE EMOTION PREDICTIONS (during calls)
-- ============================================================
create table if not exists public.voice_emotion_predictions (
  id uuid primary key default gen_random_uuid(),
  call_id uuid references public.voice_calls (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  transcript text,
  predicted_emotion text not null check (predicted_emotion in ('happy','sad','angry','fear','surprise','neutral')),
  happy_probability numeric not null default 0,
  sad_probability numeric not null default 0,
  angry_probability numeric not null default 0,
  fear_probability numeric not null default 0,
  surprise_probability numeric not null default 0,
  neutral_probability numeric not null default 0,
  timestamp timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.emotion_predictions enable row level security;
alter table public.voice_calls enable row level security;
alter table public.voice_emotion_predictions enable row level security;

-- Helper: is a user a member of a conversation?
create or replace function public.is_conversation_member(uid uuid, cid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = cid and user_id = uid
  );
$$;

-- ---------- PROFILES ----------
-- Users can read all profiles (needed for search + chat).
create policy "profiles_select" on public.profiles
  for select using (true);

-- Users can update their own profile.
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------- CONVERSATIONS ----------
create policy "conversations_read_member" on public.conversations
  for select using (public.is_conversation_member(auth.uid(), id));

create policy "conversations_insert" on public.conversations
  for insert with check (auth.uid() is not null);

create policy "conversations_update_member" on public.conversations
  for update using (public.is_conversation_member(auth.uid(), id));

-- ---------- CONVERSATION MEMBERS ----------
create policy "members_read_own" on public.conversation_members
  for select using (user_id = auth.uid() or public.is_conversation_member(auth.uid(), conversation_id));

create policy "members_insert" on public.conversation_members
  for insert with check (
    -- A user may add themselves to a conversation, or add someone when they are
    -- already a member. (See create_direct_conversation for the atomic path.)
    user_id = auth.uid()
    or public.is_conversation_member(auth.uid(), conversation_id)
  );

-- ============================================================
-- RPC: ATOMICALLY CREATE A DIRECT CONVERSATION (no duplicates)
-- Avoids RLS insert-order issues when adding both members at once.
-- ============================================================
create or replace function public.create_direct_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  existing uuid;
  new_conv uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  -- Reject self-conversations.
  if me = other_user_id then
    raise exception 'Cannot start a conversation with yourself';
  end if;

  -- Find an existing direct conversation between the two users.
  select m1.conversation_id into existing
  from public.conversation_members m1
  join public.conversation_members m2 on m2.conversation_id = m1.conversation_id
  join public.conversations c on c.id = m1.conversation_id
  where c.type = 'direct'
    and m1.user_id = me
    and m2.user_id = other_user_id
  limit 1;

  if existing is not null then
    return existing;
  end if;

  -- Create a new direct conversation.
  insert into public.conversations (type) values ('direct') returning id into new_conv;
  insert into public.conversation_members (conversation_id, user_id) values
    (new_conv, me),
    (new_conv, other_user_id);

  return new_conv;
end;
$$;

grant execute on function public.create_direct_conversation(uuid) to authenticated;

-- ---------- MESSAGES ----------
-- Users can read messages in conversations they belong to.
create policy "messages_read_member" on public.messages
  for select using (public.is_conversation_member(auth.uid(), conversation_id));

-- Users can insert messages into conversations they belong to.
create policy "messages_insert_member" on public.messages
  for insert with check (
    public.is_conversation_member(auth.uid(), conversation_id)
    and sender_id = auth.uid()
  );

-- Sender can update their own message (e.g. add transcript after voice STT).
create policy "messages_update_own" on public.messages
  for update using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

-- ---------- EMOTION PREDICTIONS ----------
-- Readable if the reader is a member of the conversation (so both users see insights).
create policy "emotions_read_member" on public.emotion_predictions
  for select using (
    conversation_id is null or public.is_conversation_member(auth.uid(), conversation_id)
  );

-- Insertable by a member of the conversation (frontend inserts after analysis).
create policy "emotions_insert_member" on public.emotion_predictions
  for insert with check (
    user_id = auth.uid()
    and (conversation_id is null or public.is_conversation_member(auth.uid(), conversation_id))
  );

-- ---------- VOICE CALLS ----------
create policy "calls_read_participant" on public.voice_calls
  for select using (caller_id = auth.uid() or receiver_id = auth.uid());

create policy "calls_insert" on public.voice_calls
  for insert with check (caller_id = auth.uid());

create policy "calls_update_participant" on public.voice_calls
  for update using (caller_id = auth.uid() or receiver_id = auth.uid());

-- ---------- VOICE EMOTION PREDICTIONS ----------
create policy "voice_emotions_read_participant" on public.voice_emotion_predictions
  for select using (user_id = auth.uid());

create policy "voice_emotions_insert" on public.voice_emotion_predictions
  for insert with check (user_id = auth.uid());

-- ============================================================
-- STORAGE
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('voice-messages', 'voice-messages', true)
on conflict (id) do nothing;

-- Avatar upload: user can only manage files in their own folder.
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Voice messages: participants of conversations can upload/read.
create policy "voice_public_read" on storage.objects
  for select using (bucket_id = 'voice-messages');

create policy "voice_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'voice-messages'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- REALTIME (Supabase Realtime)
-- ============================================================
-- Enable Realtime for messages belonging to conversations.
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversation_members;
alter publication supabase_realtime add table public.emotion_predictions;
alter publication supabase_realtime add table public.voice_calls;
alter publication supabase_realtime add table public.voice_emotion_predictions;

-- ============================================================
-- AUTO-UPDATED_AT for conversations / messages
-- Note: guard against duplicate trigger names if re-run.
-- ============================================================
drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute procedure public.set_updated_at();

drop trigger if exists messages_set_updated_at on public.messages;
create trigger messages_set_updated_at
  before update on public.messages
  for each row execute procedure public.set_updated_at();
