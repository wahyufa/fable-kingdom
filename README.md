# Fable Kingdom

> A story-driven pixel action game playable in your browser.
> Live at **https://fable-kingdom.pages.dev**

Built on the Tiny Swords free asset pack by Pixel Frog. Vanilla HTML/CSS/JS — no build step, no framework.

## Repo layout

| Folder | What's in it |
| --- | --- |
| [`game/`](game/) | Game source — landing page, game canvas, audio, art. Deployed as-is to Cloudflare Pages. |
| [`supabase/functions/solana-auth/`](supabase/functions/solana-auth/) | Edge Function for Solana wallet sign-in (verifies signature, mints Supabase JWT). |

Detailed engineering notes, deploy guides, and the running task log live in [`docs/`](docs/).

## Modes

- **Story** — 6-act campaign chasing Captain Redmane across the isles.
- **Survival** — endless waves of Red, Goblin, Purple, and Black factions.

## Controls

- `WASD` / arrow keys — move
- `Space` / click — attack
- `ESC` / `P` — pause
- `M` — mute all

## Deploy

Production is on Cloudflare Pages, root directory `game/`, no build step. Pushes to `main` redeploy automatically.

Supabase Edge Function deploys via the Supabase dashboard or `supabase functions deploy solana-auth --no-verify-jwt` (see [docs/wallet-auth-setup.md](docs/wallet-auth-setup.md)).

## Credits

Art: [Tiny Swords by Pixel Frog](https://pixelfrog-assets.itch.io/tiny-swords) (CC0).
