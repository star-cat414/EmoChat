-- ============================================================
-- Fix chat-list showing "Unknown" usernames/avatars.
--
-- conversation_members.user_id and messages.sender_id referenced auth.users,
-- so PostgREST could not embed public.profiles from those tables (the embed
-- `profiles:user_id(...)` in the frontend silently returned null -> "Unknown").
-- This adds foreign keys to public.profiles so the embed resolves.
-- The original FK to auth.users is kept (profiles is 1:1 with auth.users).
-- ============================================================

-- Backfill any missing profiles so the FK below can be created safely
-- (e.g. users created before the signup trigger existed).
insert into public.profiles (id, username)
select u.id, 'user_' || substr(u.id::text, 1, 8)
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- Allow embedding profiles from conversation_members.
alter table public.conversation_members
  drop constraint if exists conversation_members_user_id_profiles_fkey;
alter table public.conversation_members
  add constraint conversation_members_user_id_profiles_fkey
    foreign key (user_id) references public.profiles (id)
    on delete cascade;

-- Allow embedding the sender profile from messages.
alter table public.messages
  drop constraint if exists messages_sender_id_profiles_fkey;
alter table public.messages
  add constraint messages_sender_id_profiles_fkey
    foreign key (sender_id) references public.profiles (id)
    on delete cascade;