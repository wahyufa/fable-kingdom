# Cloud Save Setup (per-wallet)

Adventure progress syncs to Supabase for signed-in players — same kingdom on
any device. localStorage stays the source of truth for gameplay; the cloud row
is a mirror synced **last-write-wins** using the `savedAt` timestamp stamped
into every save. Everything is fire-and-forget: playing offline, logged out,
or against an unmigrated database just skips the sync silently.

Depends on wallet sign-in ([wallet-auth-setup.md](./wallet-auth-setup.md)) —
no session, no sync.

## How it works

1. Every `saveAdventure()` stamps `savedAt` and debounce-pushes the whole save
   JSON (2.5 s) to `public.characters`, upserted on the `user_id` primary key.
2. At boot with a session (and right after connecting a wallet), the client
   pulls the cloud row and compares stamps:
   - cloud newer **and** not currently on the isles → local save is replaced
     (you played elsewhere more recently);
   - local newer → it's pushed up.
3. RLS makes rows owner-only — a player can never read or write another
   wallet's kingdom.

## Migration (SQL editor, run once)

```sql
create table if not exists public.characters (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.characters enable row level security;

create policy "own select" on public.characters
  for select using (auth.uid() = user_id);
create policy "own insert" on public.characters
  for insert with check (auth.uid() = user_id);
create policy "own update" on public.characters
  for update using (auth.uid() = user_id);

-- Keep updated_at honest on upserts
create or replace function public.touch_characters()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists characters_touch on public.characters;
create trigger characters_touch
  before update on public.characters
  for each row execute function public.touch_characters();
```

## Verify

1. Sign in, play (chop one tree), wait ~3 s. In the SQL editor:
   `select user_id, data->>'savedAt', updated_at from public.characters;`
   — your row appears and updates as you play.
2. Open the game in a different browser, sign in with the same wallet from
   the start screen **before** pressing PLAY → your kingdom (gold, skins,
   buildings) is there.

## Limits (v1, by design)

- Last-write-wins, no merging: two devices played offline simultaneously keep
  whichever kingdom saved last. Fine at this scale; revisit if it ever hurts.
- The cloud copy trusts the client (same as the local save). Server-side
  validation stays a prerequisite for anything $FADOM-valued — see the
  fair-play item in docs/tasks.md.
- Sync applies at the start screen, not mid-session — an active isle is by
  definition the freshest state and just pushes.
