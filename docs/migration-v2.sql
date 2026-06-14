-- Fable Kingdom — migrate the leaderboard to "accounts required" + add analytics.
-- Paste this whole file into Supabase SQL Editor and click Run.
-- Safe to re-run: every CREATE uses IF NOT EXISTS, every DROP uses IF EXISTS.

-- 1. Wipe old policies on `scores` (the old version let anyone insert/delete).
drop policy if exists "public insert"        on public.scores;
drop policy if exists "public read"          on public.scores;
drop policy if exists "authenticated insert own" on public.scores;

alter table public.scores enable row level security;

create policy "public read" on public.scores
  for select using (true);

-- Only signed-in users may insert, and only with their own auth id.
create policy "authenticated insert own" on public.scores
  for insert to authenticated
  with check (auth.uid() = player_id);

-- 2. Anonymous event log for analytics.
create table if not exists public.events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  device_id uuid not null,
  user_id uuid,
  event text not null check (event in ('session_start', 'run_start', 'run_end')),
  mode text check (mode in ('survival', 'campaign')),
  score int,
  wave int,
  duration_s int
);

alter table public.events enable row level security;

drop policy if exists "public insert" on public.events;
create policy "public insert" on public.events
  for insert with check (true);
-- intentionally NO select policy: events are only visible to you via the dashboard.

create index if not exists events_event_created_idx on public.events (event, created_at);
create index if not exists scores_mode_score_idx    on public.scores (mode, score desc);

-- 3. (Optional) Auth → Sign In / Providers → Email → turn OFF "Confirm email"
--    so registration is instant. Leave it on if you want spam protection;
--    the game already handles the "check your email" case.
