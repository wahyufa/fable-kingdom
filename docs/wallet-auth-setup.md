# Wallet Auth Setup (Solana)

Leaderboard submission is gated by **Solana wallet sign-in** (Sign In With Solana
pattern). Playing the game never requires a wallet — only submitting a score
does. Players sign a short message with Phantom/Solflare/Backpack; a Supabase
Edge Function verifies the signature and mints a session JWT.

## Prerequisites

- The base leaderboard tables + RLS from
  [leaderboard-setup.md](./leaderboard-setup.md) (run that migration first).
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
  installed locally for deploying Edge Functions.

## 1. Set JWT secret env var

The Edge Function signs sessions with your project's JWT secret. Get it from
**Project Settings → API → JWT Settings → JWT Secret** and store it as a
function secret:

```bash
supabase secrets set JWT_SECRET="paste the secret here"
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

## 2. Deploy the function

From the repo root:

```bash
supabase link --project-ref pzhupderkpmbufvcznqf   # one time
supabase functions deploy solana-auth --no-verify-jwt
```

`--no-verify-jwt` is required because this function is what *issues* the JWT —
there's no incoming caller token to verify against.

## 3. Verify it's live

```bash
curl -i https://YOUR-PROJECT-REF.supabase.co/functions/v1/solana-auth \
  -H "Content-Type: application/json" \
  -d '{}'
```

You should get `HTTP 400 {"error":"wallet, message, signature required"}`. Any
HTTP 404 means the function didn't deploy.

## 4. Try it in the browser

Open `play.html`. The start screen should show a **CONNECT WALLET** button.
Click it, optionally type a display name, hit CONNECT WALLET — your wallet
popup signs a message, the start screen now shows `CONNECTED: YOUR_NAME`.

Finish a run and SUBMIT SCORE works without any further prompts.

## How it works

1. Client builds a message:
   ```
   Sign in to Fable Kingdom
   Wallet: <publicKey>
   Issued at: <ISO timestamp>
   ```
2. The wallet signs it with Ed25519. Client POSTs `{wallet, message, signature,
   displayName}` to the Edge Function.
3. Function verifies the signature with tweetnacl, checks the message contains
   the wallet address and a fresh timestamp (±5 min), upserts a Supabase user
   with synthetic email `<wallet>@wallet.fablekingdom` and metadata
   `{ wallet_address, display_name }`, and returns a signed access token (1 h).
4. Client stores the token. PostgREST honors it via RLS so the existing
   "authenticated insert own" policy on `scores` works unchanged.
5. When the token expires, the client clears the session — the player just
   reconnects (one signature) to refresh.

## Limits

- Sessions don't auto-refresh; players reconnect once an hour. That's a small
  UX cost but means a stolen access token can't be silently extended.
- Display name is editable: reconnecting with a new value overwrites it.
- Each wallet address gets exactly one account.

## Reading analytics (with wallet identity)

In the SQL editor:

```sql
-- Unique wallets that submitted scores
select count(distinct player_id) as connected_wallets from public.scores;

-- Top wallets by best survival score
select s.name, s.score, u.raw_user_meta_data->>'wallet_address' as wallet
from public.scores s
join auth.users u on u.id = s.player_id
where s.mode = 'survival'
order by s.score desc limit 20;
```
