-- LoreLearn Supabase Schema
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- profiles: extends auth.users (one-to-one, auto-created)
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- child_profiles: a parent can have many children
-- ============================================================
create table if not exists public.child_profiles (
  id uuid primary key default uuid_generate_v4(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  age integer not null check (age >= 1 and age <= 18),
  -- AvatarConfig, Interests, SensoryPreferences stored as JSONB
  -- (always read/written as a unit, no independent query need)
  avatar jsonb not null default '{}',
  interests jsonb not null default '{}',
  sensory_preferences jsonb not null default '{}',
  -- EmotionalGoals is a flat array of enum strings
  emotional_goals text[] not null default '{}',
  learning_topic text not null,
  learning_level text not null check (learning_level in ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists child_profiles_parent_id_idx on public.child_profiles(parent_id);

-- ============================================================
-- episodes: belongs to a child_profile
-- scenes and continuity_bible stored as JSONB — always fetched
-- as a complete unit, deeply nested, no per-scene query needs
-- ============================================================
create table if not exists public.episodes (
  id uuid primary key default uuid_generate_v4(),
  child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
  -- parent_id denormalized here so RLS policy avoids a join
  parent_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  learning_objective text not null,
  status text not null default 'planning'
    check (status in (
      'planning', 'generating_images', 'generating_video',
      'generating_voice', 'complete', 'error'
    )),
  scenes jsonb not null default '[]',
  continuity_bible jsonb not null default '{}',
  -- child_profile snapshot stored alongside episode for denormalized reads
  child_profile jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists episodes_parent_id_idx on public.episodes(parent_id);
create index if not exists episodes_child_profile_id_idx on public.episodes(child_profile_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.child_profiles enable row level security;
alter table public.episodes enable row level security;

-- profiles: users see only their own row
create policy "profiles_owner_access"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- child_profiles: parent sees only their children
create policy "child_profiles_parent_access"
  on public.child_profiles for all
  using (auth.uid() = parent_id)
  with check (auth.uid() = parent_id);

-- episodes: parent sees only their episodes
create policy "episodes_parent_access"
  on public.episodes for all
  using (auth.uid() = parent_id)
  with check (auth.uid() = parent_id);

-- ============================================================
-- Trigger: auto-create profile row when a user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Storage bucket for episode assets (images, audio)
-- Create this manually in Supabase Storage dashboard, or run:
-- ============================================================
-- insert into storage.buckets (id, name, public)
-- values ('episode-assets', 'episode-assets', false)
-- on conflict do nothing;
--
-- create policy "episode_assets_owner_upload"
--   on storage.objects for insert
--   with check (bucket_id = 'episode-assets' and auth.uid() is not null);
--
-- create policy "episode_assets_owner_read"
--   on storage.objects for select
--   using (bucket_id = 'episode-assets' and auth.uid() is not null);
