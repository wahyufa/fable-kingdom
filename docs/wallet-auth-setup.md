# Wallet Auth Setup (Robinhood Chain / EVM)

Leaderboard submission is gated by **EVM wallet sign-in on Robinhood Chain**.
Playing the game never requires a wallet — only submitting a score does.
Players sign a short message with MetaMask/Rabby/Coinbase Wallet; a Supabase
Edge Function verifies the signature and mints a session JWT.

> **History:** the game originally used Solana sign-in (`solana-auth`
> function, kept in the repo for reference). It was replaced by `evm-auth`
> when the project moved to Robinhood Chain — an Arbitrum Orbit L2 with ETH
> gas, mainnet live since 2026-07-01 (chainId 4663 / `0x1237`, public RPC
> `https://rpc.mainnet.chain.robinhood.com`, explorer
> `https://robinhoodchain.blockscout.com`). Old Solana wallet accounts remain
> in Supabase but can no longer be signed into.

## Prerequisites

- The base leaderboard tables + RLS from
  [leaderboard-setup.md](./leaderboard-setup.md) (run that migration first).
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
  installed locally for deploying Edge Functions (`npx supabase` works too).

## 1. Set JWT secret env var

The Edge Function signs sessions with your project's JWT secret. Get it from
**Project Settings → API → JWT Settings → JWT Secret** and store it as a
function secret (already done if solana-auth was deployed before — the same
secret is shared):

```bash
npx supabase secrets set JWT_SECRET="paste the secret here"
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

## 2. Deploy the function

From the repo root:

```bash
npx supabase login                                      # one time, opens browser
npx supabase link --project-ref pzhupderkpmbufvcznqf    # one time
npx supabase functions deploy evm-auth --no-verify-jwt
```

`--no-verify-jwt` is required because this function is what *issues* the JWT —
there's no incoming caller token to verify against.

## 3. Verify it's live

```bash
curl -i https://YOUR-PROJECT-REF.supabase.co/functions/v1/evm-auth \
  -H "Content-Type: application/json" \
  -d '{}'
```

You should get `HTTP 400 {"error":"wallet, message, signature required"}`. Any
HTTP 404 means the function didn't deploy.

## 4. Try it in the browser

Open `play.html`. The start screen should show a **CONNECT WALLET** button.
Click it, optionally type a display name, hit CONNECT WALLET — the wallet asks
to connect, offers to add/switch to Robinhood Chain (declining is fine, the
signature is chain-agnostic), then signs a message. The start screen now shows
`CONNECTED: YOUR_NAME`.

Finish a run and SUBMIT SCORE works without any further prompts.

## How it works

1. Client builds a message:
   ```
   Sign in to HoodHaven
   Wallet: <0x address, lowercase>
   Issued at: <ISO timestamp>
   ```
2. The wallet signs it with `personal_sign` (EIP-191). Client POSTs
   `{wallet, message, signature, displayName}` to the Edge Function.
3. Function keccak-hashes the prefixed message, recovers the signer address
   with secp256k1 ecrecover (@noble/curves — no RPC call needed), checks it
   matches the claimed wallet, checks the message contains the wallet address
   and a fresh timestamp (±5 min), upserts a Supabase user with synthetic
   email `<0xwallet>@wallet.hoodhaven.app` and metadata
   `{ wallet_address, display_name }`, and returns a signed access token (1 h).
4. Client stores the token. PostgREST honors it via RLS so the existing
   "authenticated insert own" policy on `scores` works unchanged.
5. When the token expires, the client clears the session — the player just
   reconnects (one signature) to refresh.

## Limits

- Sessions don't auto-refresh; players reconnect once an hour. That's a small
  UX cost but means a stolen access token can't be silently extended.
- Display name is editable: reconnecting with a new value overwrites it.
- Each wallet address gets exactly one account (addresses are lowercased, so
  checksum-case variants of the same address share one account).
- The chain switch/add prompt is cosmetic for auth — signatures prove address
  ownership regardless of the wallet's active network.

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
