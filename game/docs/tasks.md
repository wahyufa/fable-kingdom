# Tasks — Fable Kingdom: The Stolen Banner

## Done

### Core (v1)
- [x] Audit asset pack and map sprite-sheet frame sizes
- [x] Island map: water + animated foam border + 9-slice grass tiles (pre-rendered layers)
- [x] Player: Blue Warrior — movement, aimed attacks, invulnerability window
- [x] Enemies: Warrior (melee), Archer (kite + shoot), Lancer (8-dir thrusts), Monk (heals allies)
- [x] Wave system, upgrade picker (5 card types), meat/gold pickups, sheep
- [x] FX: explosions, dust, hit flash, screen shake; synthesized WebAudio SFX (M mutes)
- [x] HUD, persistent high score (localStorage)

### Story campaign (v2)
- [x] 5-act campaign "The Stolen Banner" with data in campaign.js (acts, waves, buildings, dialog)
- [x] Dialog system: paper box + Human Avatar portraits, Space/click to advance
- [x] 4 characters: The Knight, Elder Mara, Captain Redmane, Goldhelm
- [x] Per-act islands using tilemap colors 1–5 with generated scenery (trees/bushes/rocks/gold)
- [x] All 3 enemy factions (Red, Purple, Black) via uniform sheet naming
- [x] Buildings: burning Blue houses (fire FX), Towers (shoot arrows), Barracks (spawn warriors), Castle (spawns mixed, 800 HP) — attackable with HP bars, solid colliders
- [x] Siege phase: act ends only when waves are cleared AND hostile buildings destroyed
- [x] Boss: Captain Redmane (giant warrior, 700 HP) in Act 5
- [x] Act retry on death (keeps upgrades from act start); survival unchanged as second mode
- [x] Victory screen + drifting clouds ambience
- [x] Survival mode factions now shift with waves: Red → Purple (4+) → Black (7+)
- [x] Verified end-to-end in browser: all 5 acts, dialogs, siege, boss, victory, survival regression

### Fullscreen, bigger world, collision (v3)
- [x] Canvas resolution follows the window aspect ratio — no more unused side bars
- [x] World enlarged 1280x768 → 1920x1216 (30x19 tiles) with a smooth camera that follows the player and clamps at world edges
- [x] Campaign building positions rescaled for the larger island; denser scenery
- [x] Solid colliders for trees, rocks, and gold stones (bushes stay walkable) — applies to player, enemies, and sheep; spawn/placement logic avoids them
- [x] Verified: aspect-fit canvas, camera follow + edge clamp, tree push-out collision

### Tiny Swords v2 assets + landing page (v4)
- [x] Multi-row sprite-sheet support in the engine (row + frames metadata)
- [x] Goblin enemies: Torch (fast melee, directional fire swings), TNT (lobs dynamite with AoE), Barrel (kamikaze — fuse + blast)
- [x] Dynamite projectile system (arc lob) shared by TNT goblins and goblin Wood Towers
- [x] New Act 3 "The Goblin Marsh" — campaign is now 6 acts; goblins also raid Survival from wave 4
- [x] Goblin buildings: Wood Tower (lobs dynamite, animated) and Goblin House (spawns torches) — destroyed versions remain as walkable ruins
- [x] Skull corpses (v2 Dead sheet) on unit deaths, fade after ~9s
- [x] 15 small ground props from the v2 Deco set scattered per island
- [x] Landing page (index.html + landing.css): hero art, feature cards, story section, PLAY GAME → play.html (game moved from index.html)
- [x] Verified: landing → game flow, Goblin Marsh fight, dynamite lobs, ruins, corpses, barrels

### Branding & polish (v5)
- [x] Renamed the game to "Fable Kingdom" (title screen, landing page, page titles, README)
- [x] Character shadows shrunk and anchored to the feet (per-unit size: sheep/barrel small, lancer/boss larger) — previously a 78px blob centered on the torso
- [x] Landing page re-themed to match the in-game UI: water-tile backdrop, cream panels with chunky wood borders, pixel-font headings with gold shadow, game-style blue/red buttons

### UX & landing v2 (v6)
- [x] Landing rebuilt to the user's design: full-bleed valley hero, Fable Kingdom logo (SVG) centered, white-outline nav button, PLAY GAME as the primary CTA
- [x] Flat small props (bones, mushrooms, pumpkins) now render on the ground layer, always under units — no more props drawn over characters
- [x] Pause menu on ESC / P: player stats (max HP, damage, move/attack speed), hotkey reference, Resume + Exit to Menu
- [x] Current stats line shown on the upgrade picker so choices are informed

### Landing v3 (v7)
- [x] All sections full-bleed art (hero/forest/campfire) blended with soft dark gradients for smooth transitions
- [x] Nav fixed on scroll with backdrop blur (moved out of the hero stacking context so it stays on top)
- [x] Primary CTAs switched to black pills; feature cards text-only over the art
- [x] Press Start 2P applied to all landing text (body copy, cards, footer)

### Landing v4 (v8)
- [x] Nav: solid background removed; progressive backdrop blur (4px at top fading to 0 at the nav's bottom edge via masked layers)
- [x] Sections 2 & 3 now full viewport height like the hero, content vertically centered
- [x] Footer: solid black bar, 16px vertical padding, "built with" line removed, pixel-art X (Twitter) icon added (href placeholder x.com — fill in the real handle)

### Online leaderboard (v9)
- [x] Supabase-backed leaderboard via plain REST fetch (zero dependencies); config.js gates the feature — empty config = fully offline game, UI hidden
- [x] No accounts: anonymous localStorage player id + optional display name on submit (guest play untouched)
- [x] Leaderboard overlay with Survival/Campaign tabs, top-10 deduped per player, loading/empty/error states
- [x] Submit row on defeat & victory screens with retry on failure; name persisted locally
- [x] docs/leaderboard-setup.md: project setup, SQL schema + RLS policies, verification steps
- [x] Verified: hidden without config, graceful errors with unreachable config, submit flow on death

### Music & audio settings (v10)
- [x] Looping BGM from user-provided track, trimmed to a 3-min 2.4 MB loop with fades (ffmpeg) at assets/audio/bgm.mp3 — missing file = silent game, no errors
- [x] Pause-menu audio settings: MUSIC and SOUND FX checkboxes + MUTE ALL; M hotkey = master mute, synced with the checkbox
- [x] Settings persist in localStorage across sessions
- [x] Verified: BGM autoplays after PLAY click, toggles mute correctly, persistence works
- [!] Note: the BGM source is a ripped YouTube track — replace with a licensed/royalty-free file before public deploy

### Accounts + analytics (v11)
- [x] Leaderboard submit gated behind Supabase email+password auth (REST, no library)
- [x] Login/Register modal on the start screen; LOGIN / LOGOUT pill shows current account
- [x] Defeat & victory screens show "LOGIN TO SUBMIT" when not signed in (run-end UX unchanged for guests)
- [x] Session persisted in localStorage with automatic refresh-token rotation
- [x] Anonymous analytics event log (events table): session_start, run_start, run_end with mode/score/wave/duration
- [x] Real Supabase project wired in config.js; verified leaderboard read + signup endpoint live
- [x] docs/migration-v2.sql: idempotent migration to enforce account-required inserts and create events table
- [!] User TODO: paste docs/migration-v2.sql into Supabase SQL Editor (current scores table still allows anonymous insert/delete)

### Menu flow + stats polish (v12)
- [x] Start screen buttons stacked vertically: PLAY / LEADERBOARD / LOGIN
- [x] PLAY opens a mode picker: STORY (with description) vs SURVIVAL (with description)
- [x] Renamed "Campaign" → "Story" in player-facing labels (DB modes stay 'survival'/'campaign')
- [x] Modal navigation refactored — only one menu overlay visible at a time; LEADERBOARD and LOGIN replace the start menu instead of stacking on top of it
- [x] Pause stats now show "base +delta" with gold-highlighted delta (e.g. MAX HP 100 +25); same on the upgrade picker line
- [x] Verified end-to-end: nav between start/mode/leaderboard/auth, decimal preserved for attack speed, delta shown after picking an upgrade

### Polish + Solana wallet auth (v13)
- [x] Panel spacing: h1 → content gap bumped from 14px to 30px (subtitle uses negative margin to stay attached)
- [x] PLAY button distinguished: gold/orange (btn-primary) instead of blue
- [x] Music starts on first interaction anywhere on the page (start screen included) via a one-shot pointerdown/keydown listener
- [x] Cinematic act-transition banner: "ACT N COMPLETE" + act title + score with fade-in / pop-scale animation (0.7s) and 2.4s hold; pairs with a "next act" banner on intro
- [x] Solana wallet auth replaces email/password:
  - Edge Function `supabase/functions/solana-auth/index.ts` verifies signed message (Ed25519 via tweetnacl), upserts a Supabase user via admin API, and mints an HS256 JWT
  - Client detects Phantom / Solflare / Backpack, signs `"Sign in to Fable Kingdom
Wallet: ...
Issued at: ..."`, sends to Edge Function, stores session
  - Optional display name on connect (saved to user_metadata, prefilled on score submit)
  - docs/wallet-auth-setup.md: env vars, deploy command, smoke test, analytics queries
- [x] Verified UI: PLAY/LEADERBOARD/CONNECT WALLET stack on start, Connect Wallet modal with optional display name, cinematic banner on Act 1 → 2 transition, music auto-start
- [!] User TODO: deploy Edge Function (`supabase functions deploy solana-auth --no-verify-jwt`) and set `SUPABASE_JWT_SECRET` env var

### End-screen auth bugs (v14)
- [x] Added global `.hidden { display: none !important; }` — button/input `classList.toggle('hidden')` now actually hides them (previously the rule only covered .overlay)
- [x] Defeated/Victory screens included in navigateTo's MENU_OVERLAYS so LOGIN TO SUBMIT replaces them instead of stacking the auth modal on top
- [x] `authReturnTo` tracking: clicking LOGIN TO SUBMIT remembers the end-screen, and auth-close / successful login lands the player back on that exact screen
- [x] gameOver() and victory() now route through navigateTo() for consistency
- [x] Verified end-to-end: logged-out gameover shows only LOGIN TO SUBMIT, clicking it replaces Defeated cleanly, CLOSE returns to Defeated

### Production deploy (v15)
- [x] Live at https://fable-kingdom.pages.dev (Cloudflare Pages, free tier, auto HTTPS)
- [x] Cleaned dist/ build excludes docs/ and README.md (internal notes not exposed)
- [x] Debug hook `window.__ts` gated behind `?debug=1` query param — public players cannot cheat scores
- [x] Landing links updated from `play.html` to `/play` to skip Cloudflare's auto-redirect of .html
- [x] Favicon added (silences /favicon.ico 404)
- [x] Verified prod end-to-end: landing renders, /play loads canvas, Supabase config wired, debug hook absent

## Backlog (ideas, not started)
- [ ] Touch controls for mobile
- [ ] Deploy to Vercel/Netlify (static folder — drag-and-drop ready)
- [ ] Fill real Supabase credentials in config.js (docs/leaderboard-setup.md)
- [ ] Daily seeded challenge + deterministic replay validation (prerequisite for token rewards)
- [ ] Campaign progress save (continue from last act via localStorage)
- [ ] Use UI Ribbons/Banner assets for act titles and upgrade cards
- [ ] Background music (needs an external source — pack has no audio)
- [ ] Remaining unused assets: Pawn workers, Yellow faction, Warrior Guard/Attack2, Lancer defence anims, water rocks, rubber duck, cursors, wood table; v2: Gold Mine, Bridge, HappySheep, v2 tilemaps/elevation, barrel/TNT/torch color variants, deco 16-18
