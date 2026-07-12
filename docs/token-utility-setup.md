# $FADOM Token Utility — Knight's Crest Setup

The Knight's Crest is the first token utility: hold enough $FADOM on
Robinhood Chain and the game shows a gold ♛ next to your name (start screen +
every leaderboard row) and unlocks the **GILDED** pawn skin — cosmetic only,
zero gameplay power, no token ever leaves the player's wallet.

Everything ships dark: with `token.address` empty in `game/config.js` the
game hides all crest UI and queries the database exactly as before. Flip it
on with the checklist below once $FADOM is live on Robinhood Chain.

## How it works

1. Player signs in with their EVM wallet ([wallet-auth-setup.md](./wallet-auth-setup.md)).
2. The client calls the `verify-holdings` Edge Function with the session JWT.
3. The function reads `balanceOf(wallet)` on the $FADOM contract via the
   public Robinhood Chain RPC (one read-only `eth_call`, no keys), compares
   against the threshold, and stamps `crest: true/false` into the user's
   auth metadata. Identity comes from the JWT — nobody can stamp or query
   someone else's wallet.
4. A `before insert` trigger on `public.scores` copies the crest flag from
   auth metadata onto each submitted score row — the client never sends it,
   so it can't be forged.
5. The client re-checks once per session load and after each wallet connect.
   Losing the crest un-equips the GILDED skin.

## Flip-on checklist (in order)

### 1. Deploy prerequisites

`evm-auth` must already be deployed (see wallet-auth-setup.md).

### 2. Set the function secrets

```bash
npx supabase secrets set FADOM_TOKEN_ADDRESS="0x…"        # $FADOM on Robinhood Chain
npx supabase secrets set FADOM_CREST_THRESHOLD="100000"   # whole tokens for the crest
npx supabase secrets set FADOM_DECIMALS="18"              # the token's decimals()
```

Optional: `FADOM_RPC_URL` to use an Alchemy endpoint instead of the public
rate-limited RPC (`https://rpc.mainnet.chain.robinhood.com`).

### 3. Deploy the function

```bash
npx supabase functions deploy verify-holdings --no-verify-jwt
```

### 4. Run the scores migration (SQL editor)

```sql
-- Crest flag on every score row, stamped server-side at insert time
alter table public.scores add column if not exists crest boolean not null default false;

create or replace function public.stamp_crest()
returns trigger
language plpgsql
security definer            -- needs to read auth.users from the trigger
set search_path = public
as $$
begin
  new.crest := coalesce(
    (select (u.raw_user_meta_data->>'crest')::boolean
     from auth.users u where u.id = new.player_id),
    false);
  return new;
end $$;

drop trigger if exists scores_stamp_crest on public.scores;
create trigger scores_stamp_crest
  before insert on public.scores
  for each row execute function public.stamp_crest();
```

### 5. Turn the client on

In `game/config.js` set:

```js
token: {
  address: '0x…',   // same contract as FADOM_TOKEN_ADDRESS
},
```

The client only uses this to decide whether to show crest UI — thresholds and
balances are always the server's call.

### 6. Verify

- Sign in with a wallet holding ≥ threshold → start screen shows
  `CONNECTED: ♛ NAME`, Marla's shop shows GILDED with EQUIP.
- Sign in with an empty wallet → GILDED shows `♛ HOLD $FADOM`, no crest.
- Submit a score with a crest account → the leaderboard row shows ♛.

## Design guardrails (why it's built this way)

- **One-way trust**: the chain is only ever *read*. No token transfers, no
  payouts — nothing for a cheater to farm.
- **Server stamps, client displays**: crest state lives in auth metadata and
  on score rows via trigger. Editing localStorage changes nothing visible to
  other players.
- **Cosmetic only**: the GILDED skin has zero effect on stats, yields, or
  combat — same rule as every other skin.

## What comes next (see docs/tasks.md backlog)

- Marla's Black Market: cosmetics purchasable *only* with $FADOM (requires
  server-side entitlements — ADVENTURE stage (c) cloud save first).
- Season prize pool: fixed $FADOM pool for top leaderboard spots — gated on
  server-side score validation, never per-action play-to-earn.
