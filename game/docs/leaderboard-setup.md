# Leaderboard + Analytics Setup (Supabase)

The game works fully offline without this. Filling in `config.js` unlocks:

- **Online leaderboard** — anyone can *view* it, but only **registered accounts**
  (email + password) can submit scores. Playing never requires an account.
- **Analytics** — anonymous event log (sessions, runs, scores) for every player,
  account or not.

## 1. Create the project

1. Sign up / log in at [supabase.com](https://supabase.com) (free tier is enough).
2. **New project** → pick any name (e.g. `fable-kingdom`) and region near your players.

## 2. Auth settings

The game uses plain email + password sign-up. For instant registration (no
confirmation email step):

**Authentication → Sign In / Providers → Email** → turn **off** "Confirm email".

(If you leave it on, registration still works — players just have to click the
confirmation link before logging in. The game shows them a message for this.)

## 3. Create tables and policies

Open **SQL Editor**, paste, and run:

```sql
-- Leaderboard: public to read, account required to submit
create table public.scores (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 16),
  mode text not null check (mode in ('survival', 'campaign')),
  score int not null check (score >= 0 and score <= 1000000),
  wave int check (wave >= 0 and wave <= 1000),
  player_id uuid not null
);

alter table public.scores enable row level security;

create policy "public read" on public.scores
  for select using (true);

create policy "authenticated insert own" on public.scores
  for insert to authenticated
  with check (auth.uid() = player_id);

create index scores_mode_score_idx on public.scores (mode, score desc);

-- Analytics: anonymous append-only event log (not readable from the client)
create table public.events (
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

create policy "public insert" on public.events
  for insert with check (true);
-- intentionally NO select policy: events are only visible in the dashboard

create index events_event_created_idx on public.events (event, created_at);
```

> Already ran the older (account-less) version of this SQL? Drop the old insert
> policy first: `drop policy "public insert" on public.scores;` then run the
> `create policy "authenticated insert own" ...` statement above.

## 4. Wire the game to it

**Project Settings → API** → copy two values into [`config.js`](../config.js):

```js
window.FK_CONFIG = {
  supabaseUrl: 'https://YOUR-PROJECT-REF.supabase.co',
  supabaseAnonKey: 'eyJ...your anon public key...',
};
```

The anon key is designed to be public — the RLS policies above are what limit
what it can do.

## 5. Verify

Reload `play.html`:

- LEADERBOARD and LOGIN buttons appear on the start screen.
- Register an account, finish a run → name + SUBMIT SCORE appears.
- Logged out, finish a run → a LOGIN TO SUBMIT button appears instead.
- Dashboard → Table Editor → `events` should show `session_start` rows.

## Reading your analytics

Run these in the SQL Editor anytime:

```sql
-- Registered users
select count(*) from auth.users;

-- Unique players (devices) all-time
select count(distinct device_id) from public.events;

-- Daily active players, last 14 days
select created_at::date as day, count(distinct device_id) as players
from public.events
where created_at > now() - interval '14 days'
group by 1 order by 1 desc;

-- Runs per mode + average score/wave/duration
select mode, count(*) as runs,
       round(avg(score)) as avg_score,
       round(avg(wave), 1) as avg_wave,
       round(avg(duration_s)) as avg_seconds
from public.events
where event = 'run_end'
group by mode;

-- Conversion: devices that registered an account
select count(distinct device_id) filter (where user_id is not null) as with_account,
       count(distinct device_id) as total
from public.events;
```

## Notes & limits

- **This is still a casual leaderboard.** Accounts raise the effort bar and give
  you a ban handle (delete the user), but score values still come from the
  player's browser. Money/token rewards need deterministic replay validation
  first (see roadmap in tasks.md).
- Analytics inserts are also client-side and technically spoofable — fine for
  product insight, not for billing-grade metrics.
- The leaderboard shows each player's best run only (dedup by account).
- Free tier limits (500 MB DB, 50k monthly active auth users) are far beyond
  what this needs.
