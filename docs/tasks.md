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
- [x] BGM replaced with a licensed Suno track ('Moonlit Cobblestone Trail') — copyright liability resolved (v17)

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

### GitHub + CI/CD (v16)
- [x] Whitelist .gitignore — original asset packs (Buildings/, Units/, assetsv2/, music/, etc) excluded; only game/ + supabase/ + docs tracked
- [x] Initial commit pushed to https://github.com/wahyufa/fable-kingdom
- [x] Cloudflare Pages connected to GitHub repo (root directory: game/, no build step)
- [x] Auto-deploy verified end-to-end: push → CF picks up commit SHA → live in <25 seconds
- [x] CI smoke test: marker added, deployed, removed, redeployed — full loop works

### Workspace move + Kintara competitor research (v18)
- [x] Competitor research: kintara.gg docs — browser isometric MMO on Solana ($KINS-gated), realms + portals, gathering + skills XP, daily quests, player marketplace (gold↔$KINS, 95% seller / 5% treasury), spinner wheel (free daily + paid spin: 50% burn / 50% treasury), world chat/friends. Token model = access + sinks; daily trading stays in soft currency (gold)
- [x] Asset audit vs Kintara feature set: Pawn Interact anims (Axe/Pickaxe/Hammer/Knife) + carry variants + resource sprites cover gathering/building/butchering; UI pack covers inventory/quest/shop panels. Gaps listed in backlog below
- [x] Project moved to `D:\claude\Fable Kingdom\` — old nested asset-pack folder kept as untouched backup
- [x] Tidied layout: asset packs → `asset-packs/`, landing/music/video/clips-final/marketing → `media/`; `dist/` dropped (deploy artifact, rebuilt on deploy); `.gitignore` paths updated; launch config renamed to `fable-kingdom`; root `CLAUDE.md` added (local-only)
- [x] Verified from new location: git history + remote intact (only .gitignore modified, uncommitted), game serves and runs (start screen → mode picker via agent-browser)

### ADVENTURE mode stage (a): map + Pawn + gathering (v19)
- [x] Third mode card on the picker (green, between SURVIVAL and the HOMESTEAD teaser) → `startAdventure()`
- [x] Pawn avatar with full tool anims: 11 sheets copied/renamed (`pawn_idle/run[_tool]`, `pawn_interact_{axe,pickaxe,knife}`) + `stump.png` + `wood.png`; registered in SHEETS (192×192, count auto-derived)
- [x] `adventure.js` (`window.ADVENTURE`) holds mode tuning — same data/engine split as campaign.js
- [x] Harvest loop: trees (3 swings → wood, stump remains, respawn 45s), gold stones (4 swings → gold, vanish, respawn 60s), sheep (knife → 2 meat, existing flock respawn). Auto-tool per target, hold-Space auto-repeat, hit flash + dust, harvested nodes lose collision, never regrow on top of the player
- [x] Pickups in adventure feed resource stores (not score/heal); wood pickup sprite added
- [x] Adventure HUD: wood/gold/meat tallies (top-right), no HP bar/waves; 7s onboarding hint; pause shows stores instead of combat stats
- [x] Persistence: `fableKingdomAdventure` in localStorage, saved on every pickup (cloud save lands in stage c)
- [x] Debug helpers behind `?debug=1`: `__ts.goto(x,y)`, `__ts.give(res,n)`, `__ts.sheep`
- [x] Analytics: `run_start` logged without a mode (events.mode CHECK only allows survival/campaign — extend in the stage-c migration)
- [x] Verified via agent-browser: full chop/mine/butcher loops (3 wood, 4 gold, 2 meat collected), auto-tool switch, stump render, respawn timers, persistence across reloads, SURVIVAL regression (waves + enemies + knight intact), no console errors

### ADVENTURE stage (b): skills, dailies, hotbar, ledger (v20)
- [x] Skills XP: Woodcutting/Mining/Husbandry — XP per swing (nodes declare skill+xp in adventure.js), geometric level curve (60 base, ×1.4, cap 20)
- [x] Level perks: −3%/level swing time (cap −40%) + 2%/level bonus-drop chance — applied in startHarvest/applyHarvestHit
- [x] Daily quests: 3 per UTC day, targets rolled from a date-seeded mulberry32 (same goals for everyone); progress counts on pickup; auto-claim pays gold + 80 skill XP; survives day-flips mid-session
- [x] Hotbar (keys 1-3): canvas-drawn bottom-center, tool icons (Tool_02/03/04 → tool_axe/knife/pickaxe.png), carried tool highlighted; harvest still auto-switches tools
- [x] Kingdom Ledger (key I / ESC): DOM overlay — stores with icons, skills with LV + XP progress bars, dailies with progress/DONE + reward lines
- [x] Transient HUD notices (level-ups, quest claims) with fade-out; DAILIES n/3 + ledger hint under the stores
- [x] Save shape v2: + skills XP totals + daily state (old stage-a saves migrate via default-fill)
- [x] Debug: `__ts.xp(skill, n)`
- [x] Verified via agent-browser: XP per swing (3 chops = 18 XP), quest progress on pickup (3/18), auto-claim at target (+15 gold, stacked notices, DAILIES 1/3), level-up notice (WOODCUTTING LEVEL 2!), ledger panel renders all sections, tool keys switch carry sprite, persistence across reloads (res + XP + claimed state), survival regression clean, no console errors

### ADVENTURE open world: archipelago + bridges (v21)
- [x] World size made mutable (`let MAP_W/MAP_H/W/H` + `setWorldSize`): combat modes stay on the 30x19 island, Adventure swaps in a 64x44 archipelago; combat entry points reset size defensively
- [x] Tile grids for Adventure (`landGrid`/`bridgeGrid`/`regionGrid`); `buildAdventureWorld` paints 4 islands with distinct palettes (Meadowhome/Pinehollow/North Grove/Gold Hills), bakes 3 bridge decks over the gaps, computes coastal foam
- [x] Bridge art extracted from assetsv2 Bridge_All atlas → `bridge_h.png` / `bridge_v.png`
- [x] Walkability collision replaces the box clamp: player + sheep move per-axis and are blocked by water (slide along coasts); harvest nodes/props/sheep placed per-island with region-specific densities (pine=trees, gold hills=gold, etc.)
- [x] Region-name banner on crossing onto a new island; minimap (bottom-left) with static island/bridge tints + live player & resource dots
- [x] Debug: `__ts.tpIsland(name)`
- [x] Verified via agent-browser: spawn on Meadowhome, cross both vertical + horizontal bridges (region flips Meadowhome→Gold Hills→North Grove with banners), water blocks movement at coast (stops at px 3775 vs world W 4096), 4 palettes distinct, minimap tracks player; Survival + Story regression clean (small island renders, waves/dialog work), no console errors
- [!] Optional polish: Gold Hills uses the teal `tiles5` palette (distinct but not literally golden) — swap to `tiles4` if a warmer look is wanted

### ADVENTURE world enrichment: landmarks, NPCs (v22) — highground REVERTED, see v23
- [x] Decorative landmark buildings (non-combat, reuses `hostile:false` path — no HP bar, no spawn/shoot logic runs): Monastery + 2 houses in Meadowhome near spawn, Archery in Gold Hills, House3 in Pinehollow, House2 in North Grove. Decor/sheep scatter avoids building footprints (same avoidance pattern combat already used)
- [x] 4 friendly NPCs (unused Yellow faction, idle-only, stationary): Elder Wren (pawn, Meadowhome), Scout Elin (archer, Gold Hills), Brother Osric (monk, Pinehollow), Ranger Fenn (warrior, North Grove) — each with 3 flavor/hint lines picked at random per talk
- [x] Talk reuses the existing story-dialog UI: `renderDialogLine` generalized to accept either a CHARS key (campaign) or an inline `{name,img}` object (NPCs), zero new UI. Space near an NPC talks (checked before harvest-target so it takes priority); floating "SPACE - TALK" prompt over an NPC's head when in range
- [x] Verified via agent-browser: Meadowhome village (Monastery + Elder Wren) renders correctly, NPC talk prompt appears in range and dialog opens with correct name/avatar/line, dialog close restores `playing` mode; Survival + Story regression clean, no console errors
- [x] This pass also shipped a highground/plateau + full island cliff-wrap system — **reverted in v23**, see below for why

### Highground/cliff-wall attempt: shipped, then reverted (v23)
- User feedback: the plateau (south-wall-only, then reworked to wrap all 4 sides + wrap all 4 islands as cliff-walled "floating" landmasses matching Tiny Swords' cover art) looked bad in practice ("kecewa" — disappointed) despite passing every functional/collision check. The correct foam reference was the existing Survival/Story combat islands, not a new cliff-base foam system
- [x] Full revert executed: removed `blockGrid`, `tileIsTerrain`, `wrapCliffWalls`, `drawWallSide`, `bridgeGapsForIsland`, `bakePlateau`, the `wall_south/north/west/east.png` + `tilemap_flat`/`tilemap_elevation` SHEETS entries, and `ADV.world.plateaus` (adventure.js) entirely
- [x] Foam algorithm restored to match combat mode exactly: per-island rim tiles get the foam overlay directly (`buildFoamList`'s approach), not a water-side/cliff-base placement
- [x] Kept (unaffected by the revert, not part of the complaint): all 6 landmark buildings, all 4 NPCs + dialog, bridges, per-island palettes/region banners/minimap
- [x] Verified via agent-browser: world loads with no console errors, coastlines are flat with foam on the rim (matches Survival/Story visually), Gold Hills is flat with Archery + Scout Elin still standing correctly, Survival + Story regression clean
- Lesson: brightness/collision correctness ≠ looking good — a technically-correct implementation of a big visual feature still needs an early "does this actually look right" gut-check (e.g. a rough screenshot pass) before going full scope (4 islands + 2 plateaus) on one interpretation of reference art
- Orphaned on disk (SHEETS entries removed, files not deleted): `game/assets/tilemap_flat.png`, `tilemap_elevation.png`, `wall_south/north/west/east.png` — harmless clutter, delete if desired

## Backlog (ideas, not started)
### Decoration variety + UI sprite attempt (v24)
- [x] Decoration variety (asset-audit item #4): tree (4 variants, incl. 2 shorter deciduous ones with their own anchorY), goldstone (6), rock (4), stump (4, assigned per-tree at placement so it stays stable across respawns), cloud (8) — all picked randomly at placement via a shared `VARIANT_COUNT` lookup; new `waterrock` decor kind (animated) scattered just outside island/ISLE coastlines in both Adventure and combat maps
- [x] Verified via agent-browser: tree/goldstone/rock variety visible in-world, chopped-tree stump renders a variant, water rocks visible in the sea, Survival regression clean, no console errors
- User then asked to try #1 (swap buttons/dialog/HP bar to real sprite assets instead of flat CSS) — implemented buttons (`.btn`/`.btn-red` via CSS `border-image`, verified good in a screenshot) and was implementing the dialog-box paper texture when the **user stopped it mid-work**: "hentikan mengganti button dengan asset dari folder" — reverted `.btn`/`.btn-primary`/`.btn-red`/`.dialog-box` back to flat CSS colors, verified via screenshot. Buttons/panels/HP bar stay flat CSS going forward unless asked again
- Orphaned on disk (unused, not deleted): `game/assets/ui_btn_blue/_press/_red/_press/_hover/_disable.png`, `ui_bar_base/_fill.png`, `ui_paper.png`

### Goblin color variants + v2 Knight landmark buildings (v25)
- [x] Asset-audit item #3: goblins were single-color despite the pack shipping Blue/Purple/Red/Yellow variants for Torch/TNT/Barrel/Wood_Tower. Renamed the `GOBLIN_COLORS` constant to `COSMETIC_COLORS` (now shared with v2 buildings below) and looped it to register 4 color-suffixed sheets for every existing goblin/wood_tower animation (`goblin_torch_idle_${c}` etc.), replacing the old single hardcoded sheets entirely
- [x] `spawnEnemy` assigns `e.gColor` (random) for torch/tnt/barrel; `startTorchAttack` and `drawEnemy` read the suffix off `e.gColor` instead of a fixed name. `makeBuildings` assigns a random color to `wood_tower` instances that don't specify one; `buildingSheet()` resolves it to `wood_tower_${b.faction}` (mirrors the existing `tower_${faction}` pattern)
- [x] Asset-audit item #2: the v2 "Knights" faction (Castle/House/Tower, Blue/Purple/Red/Yellow, `assetsv2/Factions/Knights/Buildings/`) was completely unused. Added 3 new non-hostile `BUILDING_DEFS` types (`v2_castle`, `v2_house` — same 128x192 footprint as house1-3, `v2_tower`), color-resolved the same way as wood_tower via a small `V2_BUILDING_TYPES` list in `buildingSheet()`. Did NOT add v2's combat units (Archer/Pawn/Warrior) as new enemies — that changes combat balance and the v2 set has no Lancer/Monk equivalent, so it needs an explicit decision, not a silent add
- [x] 3 new landmarks placed on the islands that had the least variety: v2_castle (Gold Hills), v2_tower (North Grove), v2_house (Pinehollow) — colors randomized per instance, so they'll differ across reloads
- [x] Verified via agent-browser: force-spawned all 4 torch-goblin colors side by side (color difference is subtle but real — armor/cloth tint, not a full recolor — confirmed via close-up screenshot), all 4 wood_tower colors rendered distinctly and clearly, TNT/Barrel both receive `gColor` without error, all 3 v2 landmarks render correctly in Adventure with no broken images; Survival + Story regression clean, no console errors

### Combat animation variety + 3 more NPCs (v26)
- [x] Asset-audit item #5: `Warrior_Attack2`, `Warrior_Guard`, and all 5 `Lancer_*_Defence` directional poses were unused across all 3 combat factions (red/purple/black). Copied + registered all of them (`${f}_warrior_attack2`, `${f}_warrior_guard`, `${f}_lancer_def_{r,u,d,ur,dr}`)
- [x] Kept scope to cosmetic-only swaps, no new state-machine states (avoids touching damage/timing, the highest-risk part of any combat change): `e.idleVariant` (idle|guard) and `e.atkVariant` ('' or '2') are each rolled once per warrior at spawn and read by `drawEnemy` — same behavior, different sprite. Boss reuses the warrior draw branch but never gets these fields, so it's unaffected (falls back to the base sheets)
- [x] Lancer defence poses used more deliberately: extracted the direction-bucketing logic already in `startLancerAttack` into a shared `angleBucket(deg)` helper, then reused it for the **idle** state too — idle lancers now hold a directional guard pose facing the player (recomputed every frame) instead of one generic idle. Purely visual; detection/attack range unchanged
- [x] Asset-audit item #6: added 3 more NPCs (3 of the then-17 unused Human Avatar portraits) stationed at the 3 new v2 landmarks — Captain Doran (yellow_warrior, Gold Hills castle), Watcher Isla (yellow_archer, North Grove tower), Old Tam (yellow_pawn, Pinehollow house). Sprite types repeat from the original 4 NPCs (only 4 Yellow unit types exist) but portrait+name+location+lines differ
- [x] Verified via agent-browser: idle variant assignment confirmed data-side and rendered (3 idle/1 guard sample) with no broken images, forced attack2 sheet resolves and renders without error, 3 idle lancers facing the player show a raised directional guard stance distinct from plain idle, all 7 NPCs load, Captain Doran's talk prompt + dialog (portrait/name/line) verified end-to-end; Survival + Story regression clean, no console errors

### Gold sink, lucky finds, NPC quests, spinner wheel (v27)
- [x] **Cosmetic shop** (gold sink, item #1): 3 Pawn skins (Ember Red/Twilight Purple/Shadowed Black, 150-250 gold) alongside the free default Knight Blue — reuses the Red/Purple/Black Pawn tool-variant sprites (27 files copied, same rig as the player's Blue Pawn, zero stat effect). New 3rd Ledger column (`ledger-panel-wide`) with BUY/EQUIP buttons wired via one delegated click handler; `state.adventure.cosmetics.{owned,equipped}` persists; `drawPlayer` prefixes the sheet name with the equipped skin (blue = no prefix = current behavior unchanged)
- [x] **Lucky find** (variable reward, item #2): flat 4% chance of +5-15 bonus gold when a node fully depletes or a sheep is butchered, independent of the existing per-level `bonusYield` roll — reuses `advNotice`/`sfx.fanfare`, no new UI
- [x] **NPC quests** (item #5): all 7 NPCs now have one one-time turn-in quest (varied resource + amount) in addition to their flavor lines. Talking auto-completes it the moment the player has enough (consumes the resource, pays gold + skill XP, shows `doneText`) — no separate accept/turn-in step, mirrors the daily quests' auto-progress simplicity. `state.adventure.npcQuests[id]` marks it done forever after
- [x] **Spinner wheel** (item #3, key `O`): new overlay with a CSS conic-gradient wheel (6 segments) + pointer. Free spin every UTC 24h (`spinnerLastFree` timestamp) or a paid spin (40 gold). Prize is picked by weight *before* the spin starts — the disc's multi-turn rotation is decorative flourish only, not a landing-position mechanic (kept deliberately simple to avoid another visual-precision risk after the highground lesson). Winnings also feed `questProgress`, so a lucky spin can complete a daily quest
- [x] Bug caught during verification (not shipped): `renderSpinner()` was clearing `#wheel-result` back to blank immediately after the prize text was set, because it was called both on open *and* at the end of every spin. Fixed by moving the "clear stale result" responsibility to `toggleSpinner()` (only clears on open), so `renderSpinner()` now only ever touches button state
- [x] Verified via agent-browser end-to-end: bought + equipped Ember Red (gold deducted, player sprite visibly red in-world, persists across reload), free spin awarded +12 wood and started the 24h cooldown countdown, paid spin deducted exactly 40 gold, forced-`Math.random` test confirmed the lucky-find notice path, Elder Wren's quest showed live progress (13/15 wood) then auto-completed on the next talk once topped up (gold+XP+level-up notices all fired, dialog showed `doneText`, quest never reappears after — confirmed with a 3rd talk), all state survives a full reload; Survival + Story regression clean, no console errors

### Player building v1 — ADVENTURE stage (d) complete (v28)
- [x] **Build plots**: 3 fixed plots in Meadowhome (`ADV.building.plots`, tiles 7/27 · 11/37 · 24/27 — picked clear of existing buildings, NPCs, spawn, and bridge mouths). Empty plots render as a procedural staked-out patch (cleared-earth ellipse + pulsing dashed rope + 4 corner stakes — the pack has no sign sprite) with a floating `SPACE - BUILD` hint; decor scatter now avoids empty plots by 170px so trees can't block a future KEEP footprint
- [x] **Build menu**: Space at an empty plot opens `#build-screen` (reuses the upgrade-card layout + new `.upgrade-btn:disabled` muted state). 3 options — COTTAGE (30w+40g, 90s), WATCHTOWER (60w+90g, 4min), KEEP (140w+220g, 10min) — any option on any plot; unaffordable options stay visible but disabled; live STORES line; Escape/CANCEL closes
- [x] **Construction on real time**: buying deducts wood+gold immediately and swaps in the pack's `*_Construction.png` scaffold (identical canvas size to the finished sprites — measured first, so each type's existing `anchorY` needed zero changes) with a green progress bar. Completion (checked each frame in the adventure update) flips one `construction` flag — fanfare + dust + `COMPLETE!` notice. Finished while the tab was closed → `FINISHED WHILE YOU WERE AWAY!` notice on next load (`rec.done` tracks whether completion was announced)
- [x] **Architecture**: occupied plots are pushed straight into the existing `buildings` array (`spawnPlotBuilding`), so collision, y-sorting, drawing, and decor avoidance all come for free; scaffold vs finished is a single sheet-name override in `buildingSheet()`. Building color follows the equipped pawn skin (SHADOWED falls back to blue — no black building sheets exist). Save shape: `plots: { plotId: { type, color, startAt, finishAt, done } }`; debug helper `__ts.finishBuilds()` fast-forwards timers
- [x] Verified via agent-browser end-to-end: empty-plot markers + hint render, menu opens with all 3 disabled at 0 resources then all enabled after `give()`, COTTAGE purchase deducted exactly 30w+40g via a click on the inner `.up-name` span (proves the `closest()` delegation), scaffold + progress bar rendered at the right anchor, `finishBuilds()` → `COTTAGE COMPLETE!` + finished house, full reload kept both buildings and fired the away-completion notice for a backdated WATCHTOWER, red-skin KEEP built red (`v2_castle_red`), duration labels read 90 SEC / 4 MIN / 10 MIN; Survival + Story regression clean, no console errors

### Adventure is the hub world — Story/Survival/shop entered in-world (v29)
- [x] **Mode picker removed**: PLAY now drops straight into Adventure (`play-btn` → `startAdventure()`); the mode-screen HTML, its four card buttons, and its `MENU_OVERLAYS` entry are gone. HOMESTEAD teaser moved to a `.soon-line` on the start screen (SOON badge reused with a `position: static` override)
- [x] **Gatekeeper NPCs** (role NPCs, `npc.role` short-circuits `talkToNpc` before quest/flavor logic): Sergeant Brack (`yellow_warrior`, Gold Hills archery range, `role: 'survival'`) and Herald Rosalind (`yellow_monk`, beside the Meadowhome monastery, `role: 'story'`). Talking opens `#gate-screen` — avatar, title, speaker name, pitch text, mode-specific confirm label (FIGHT / BEGIN THE TALE) + NOT YET. Confirm saves the adventure then calls the existing `startSurvival()`/`startCampaign()` unchanged; Escape/cancel returns to playing
- [x] **Shop moved out of the ledger**: Merchant Marla (`yellow_pawn`, near spawn, `role: 'shop'`) opens `#shop-screen` — same `#ledger-shop` rows + delegation listener (element just lives in the new panel), plus a live YOUR GOLD line. Ledger back to two columns (`ledger-panel-wide` retired). 3 new avatars copied (pack 21/12/25 → `avatar_npc8/9/10`, chosen from the 16 still unused)
- [x] **The way back**: every combat run now starts from the isles, so the end screens always offer `returnToIsles()` (hide menu overlays + `startAdventure()`, which rebuilds the world from the save) — game over gained a BACK TO THE ISLES button beside PLAY AGAIN/RETRY ACT, victory's MAIN MENU became BACK TO THE ISLES. `gameOver()` now resets the panel h1 (the pause-exit "Run Ended" retitle used to be wiped by the forced reload that no longer happens), and `returnToIsles` clears `exitingFromPause`
- [x] Fixed in passing: `.gate-panel .subtitle` needed `margin-top: 0` — the shared `.subtitle` pulls itself under big h1s with a -16px top margin, which overlapped the speaker-name line on the gate panel (caught by screenshot during verification)
- [x] Verified via agent-browser end-to-end: PLAY lands in adventure directly (10 NPCs, 3 with roles), Marla's shop opens/renders/sells (Ember Red bought via the relocated delegation, funds line updates), ledger is 2 columns with no shop, Rosalind's panel shows correct copy and NOT YET/Escape both close it, BEGIN THE TALE starts act 0 dialog, FIGHT starts survival wave 1, forced defeat shows Defeated! + BACK TO THE ISLES which returns to adventure with gold/skin intact and no stray overlays, victory's button returns to the isles, normal NPC quest dialog (Wren) unaffected; no console errors

### War spoils, gate markers, landing copy (v30)
- [x] **War spoils** (`ADV.spoils`): Survival banks +3 gold / +2 wood per completed wave into the adventure save on death AND on quit-from-pause (same formula in `gameOver()` and `exitToMenu()` — otherwise dying would pay better than quitting; `waveState === 'intermission'` counts the just-cleared wave correctly since `state.wave++` happens at spawn). Story acts each pay a one-time 30-gold bounty in `completeAct()` (shown in the act-complete banner sub) and finishing the campaign pays a one-time 120. `bankSpoils()`/`grantStoryBounty()` write through localStorage directly because `state.adventure` is null during combat; `storyBounties` added to the save shape (load + save). Green `.spoils` line on the gameover/victory panels
- [x] **Gate discovery markers**: bobbing gold `!` above role NPCs until first talk (`gatesSeen` in the save, set in `talkToNpc`, drawn in `drawNpc`) — replaces the discoverability the mode-picker menu used to provide
- [x] **Landing page cards rewritten** for the hub world: "A Kingdom of Your Own" (the isles) + Story/Survival cards that name their gatekeeper NPCs and mention spoils; replaces the stale menu-era copy
- [x] Verified via agent-browser: fresh save shows `!` on all 3 role NPCs and none on regular NPCs, first talk clears Marla's marker and it stays cleared after reload, dying at wave 5 showed "SPOILS SENT HOME: +12 GOLD · +8 WOOD" and the save went 0→12g/8w (carried into the world via BACK TO THE ISLES), act-1 completion paid +30 (gold 12→42, `storyBounties.act0` set) and a full replay of act 1 paid nothing (gold stayed 42), landing cards render the new copy; no console errors
### Wallet auth migrated Solana → Robinhood Chain (v31)
- [x] **Researched live chain params** (mainnet launched 2026-07-01, Arbitrum Orbit L2): chainId 4663/`0x1237`, public RPC `rpc.mainnet.chain.robinhood.com`, ETH gas, Blockscout explorer — stored as a `wallet_addEthereumChain`-shaped `chain` block in `config.js`
- [x] **Frontend** (`game.js` auth section): EIP-1193 provider detection (MetaMask preferred from multi-provider lists), `eth_requestAccounts` → optional switch/add Robinhood Chain (decline is non-fatal — `personal_sign` proves the address on any chain) → `personal_sign` → POST to `evm-auth`. Wallet lowercased; `shortWallet` now `0x1234…abcd`; auth-screen copy updated; `disconnectWallet` just drops the session (EIP-1193 has no disconnect)
- [x] **Backend**: new `supabase/functions/evm-auth/index.ts` mirroring solana-auth but verifying EIP-191 personal_sign via keccak256 + secp256k1 ecrecover (@noble/hashes + @noble/curves, no RPC needed); wallet format check `0x[40 hex]`; synthetic email `<0xwallet>@wallet.fablekingdom.app`. `solana-auth` kept in-repo for reference; old Solana accounts remain in Supabase but can't sign in
- [x] Verified: recover logic cross-checked in-browser against ethers.js (random wallet, `signMessage` → my exact noble recovery code → identical address); full connect flow E2E with a mocked EIP-1193 provider + stubbed backend — call order `eth_requestAccounts` → `wallet_switchEthereumChain` (4902) → `wallet_addEthereumChain` (got `0x1237 Robinhood Chain` from config) → `personal_sign`, POST hit `/functions/v1/evm-auth` with `{wallet, message, signature, displayName}`, session set and start screen showed CONNECTED
- [ ] **DEPLOY PENDING (user step, CLI not logged in)**: `npx supabase login` → `npx supabase link --project-ref pzhupderkpmbufvcznqf` → `npx supabase functions deploy evm-auth --no-verify-jwt` (JWT_SECRET already set from solana-auth). Until deployed, CONNECT WALLET returns 404 from the backend — see docs/wallet-auth-setup.md (rewritten for EVM)
- [ ] $FADOM token itself is still the Solana pump.fun mint shown on the site (`92x4…pump`) — if/when it redeploys on Robinhood Chain, update the CA chip on index/lore/roadmap pages (new CA must come from the team)

### Knight's Crest — first $FADOM utility, ships dark (v32)
- [x] **Design principle locked**: token = status/access layer, never gameplay power, and while the save is client-side the token only flows IN (reads/sinks), never OUT (no play-to-earn) — full reasoning + roadmap (Crest → Black Market → season prize pool) in docs/token-utility-setup.md
- [x] **Holder flair**: `verify-holdings` Edge Function reads `balanceOf(wallet)` via public Robinhood Chain RPC (identity from the caller's JWT — can't stamp someone else's wallet), stamps `crest` into auth metadata; client shows ♛ on the start screen CONNECTED line and re-checks once per session + after connect
- [x] **Leaderboard crest**: `scores.crest` column stamped by a `before insert` security-definer trigger reading auth metadata (client never sends it, unforgeable); `lbFetchTop` requests the column only when the feature is on, rows render ♛ before the name
- [x] **GILDED skin** (Yellow pawn sheets → `gold_pawn_*`, 9 files, dims verified): not buyable — shop row shows `♛ HOLD $FADOM` until the session has the crest, then EQUIP; losing the crest un-equips it at load and on re-check. Known nuance: friendly NPCs also use the yellow palette, so GILDED players resemble villagers
- [x] **Dark by default**: `config.js token.address = ''` hides every crest feature and keeps DB queries identical to today — flip-on checklist (secrets → deploy fn → SQL migration → config) in docs/token-utility-setup.md
- [x] Verified: live RPC smoke test against `rpc.mainnet.chain.robinhood.com` (exact eth_call encoding answered, empty contract → balance 0 path), OFF state hides GILDED with zero console errors, ON state (dummy address + planted session) showed `CONNECTED: ♛ HOLDER`, GILDED equipped and rendered as the gold pawn in-world, crest revocation reverted the skin to blue and locked the row, stubbed leaderboard rendered ♛ on the holder row only, final boot with clean session + dark config is error-free
- [ ] Crest go-live blocked on: $FADOM deployed to Robinhood Chain (CA from team) + evm-auth/verify-holdings deploys + scores migration — checklist in docs/token-utility-setup.md

### Robinhood Chain UI theme toggle — built, then REVERTED (v33)
- [x] Built a full dark/neon-green RH theme (CSS-variable flip + pause-menu toggle + persistence), verified end-to-end — then **removed at the user's call after seeing it ("ternyata tema RH nya jelek")**. Full revert: theme block, text-role variables, toggle checkbox, `applyTheme`/`THEME_KEY`, and `authStatus` var() colors all gone; classic hexes restored verbatim; zero references left (grep-verified); classic start screen re-verified (`.start-hint` back to true `#9b7e63`)
- [x] Bonus fix from the revert: the variable refactor's `replace_all` had silently turned `--color-muted`/`--color-muted-strong` self-referential (cyclic var = invalid → muted text quietly inherited the dark panel color in classic). Restoring literals fixed it
- Lesson recorded: don't propose/apply UI reskins or theme changes without an explicit ask — same pattern as the earlier sprite-button `border-image` revert (v-early)

### Site docs page — the Player Handbook (v34)
- [x] New `game/docs.html` at `/docs`: 8 cream handbook cards (chunky wood-border card style matching the landing feature cards) — getting started + full key list (`.key` keycap style), the isles & gathering/skills, dailies/wheel/lucky finds/villager favors, building costs & times, Marla's skins & prices, the two combat gates with spoils/bounty numbers, leaderboard & wallet (Robinhood Chain; $FADOM perks pointed at the roadmap, not promised), good-to-know (browser save caveat, art credit)
- [x] Every number sourced from live data (`ADV.building.options`, `ADV.spoils`, `ADV.spinner`, skin prices, 6 act titles from campaign.js) so the docs can't drift from the game silently — reuses the roadmap hero + CTA patterns, `DOCS` nav link added on index/lore/roadmap/docs
- [x] New landing.css block: `.docs-main/.docs-wrap/.docs-card` (+ `.key` keycaps, `.docs-cols` two-column controls, mobile collapse at 700px) — additive only, no existing styles touched
- [x] Verified via agent-browser: hero + nav render, cards 02/03 (keycaps inline in prose) and 07/08 (links, gold bullets) all readable, clicking DOCS from the landing nav lands on `/docs` with all 8 cards present, no console errors
- Note: built through a temporary platform outage that blocked all write tools for a stretch — content was staged read-only and applied once tooling recovered

### Mobile overlay panels were clipped — responsive pass (v41)
- [x] **Root cause**: `style.css` had zero `@media` queries — every overlay panel was built desktop-first with hardcoded pixel widths (`.ledger-panel` 720px min-width, `.ledger-panel-wide` 980px, two 280px `.ledger-col`s side by side, 170px-min `.upgrade-btn`s in a row, etc). Touch controls (v36) made the game playable on phones, but nobody had audited the HTML overlay panels sitting on top of the canvas — on a ~390px viewport the ledger rendered wider than the screen with no way to scroll to the clipped edges (user-reported screenshot: title and right column cut off)
- [x] **Fix**: one `@media (max-width: 700px)` block — `.overlay` switches to `align-items: flex-start` + `overflow-y: auto` (so tall content scrolls instead of clipping top/bottom), `.panel` caps at 480px width with tighter padding and a smaller h1; `.ledger-cols` stacks vertically instead of two side-by-side columns; `.upgrade-btn` (shared by the wave-upgrade picker and the build menu) wraps via flexbox instead of forcing a fixed-width row; gate/shop/leaderboard/name-entry panels all get their min-widths released
- [x] Verified at a 390×844 viewport: ledger (title + stores + skills + dailies all stacked, fully visible), Marla's shop, the 3-option build menu (wraps 2+1), and the story gate confirm all render correctly with no clipping; re-checked at 1280×800 to confirm zero desktop regression (two-column ledger layout unchanged pixel-for-pixel); console clean in both

### Rebrand: Fable Kingdom → HoodHaven (v40)
- [x] **All player-visible branding renamed**: page titles + meta descriptions (index/lore/roadmap/docs/play), nav/hero logo `alt` text, in-game `<h1>` on the start screen (real text, not baked into art — updates instantly), hero tagline ("Where every sword tells a fable" → "A tiny medieval world you can call home" — the old line punned on "Fable," which no longer applies), roadmap body copy, docs handbook copy, the wallet sign-in message text ("Sign in to HoodHaven"), README titles (root + game/)
- [x] **Deliberately left unchanged** (two different reasons):
  - **localStorage keys** (`fableKingdomAdventure`, `fableKingdomSession`, `fableKingdomAudio`, `fableKingdomName`, `fableKingdomPlayerId`) — renaming these would silently wipe every existing player's save (gold, buildings, cosmetics, quests) on their next visit, since the browser looks up state by that exact key. Purely internal, invisible to players — not worth the risk for a branding pass.
  - **`solana-auth`'s** `@wallet.fablekingdom.app` email domain — deprecated function, not touched. **`evm-auth`'s** was updated to `@wallet.hoodhaven.app` since that function has never been deployed yet (zero live users to break).
  - Asset file paths (`logo.png`, `logo_white.png`, `favicon.png`) kept as-is on purpose — user is replacing the image contents directly, so keeping the same paths makes it a drop-in swap with no code changes needed.
- [ ] **Manual steps outside code** (flagged, not actioned): X handle still `@fablekingdom_`, Telegram still `t.me/fable_kingdom`, production domain still `fable-kingdom.pages.dev` (Cloudflare Pages project name) — all external accounts/settings only the user can rename. Current links were left pointing at the live accounts (better a working old link than a guessed broken one); update `index.html`/`lore.html`/`roadmap.html` social hrefs once new handles exist.
- [x] Verified across all 5 pages (index/play/lore/roadmap/docs): correct titles, tagline, roadmap body copy, HoodHaven wordmark renders via text on the start screen; no console errors; storage-key grep confirms zero touched

### Online presence — players see each other on the isles (v39)
- [x] **Ghost players via Supabase Realtime** (official supabase-js UMD pinned @2.45.0 from jsDelivr, GoTrue disabled — Realtime only, degrades to no-ghosts if the CDN fails): one `isles` channel, presence roster keyed by the anon device id, `pos` broadcasts throttled 150 ms moving / 2 s idle heartbeat carrying x/y/flip/tool/skin/name
- [x] **Rendering**: translucent (0.8) pawn sprites in the y-sorted draw list using the sender's equipped skin + tool sheets, name label overhead (display name signed-in, TRAVELER otherwise), lerp-smoothed movement with snap on >400px jumps, 10 s stale cull + instant removal on presence leave. No collision, no interaction — position spoofing is possible and purely cosmetic by design
- [x] Joined in `startAdventure`, left in both combat starters; docs handbook mentions the shared isles
- [x] Verified against LIVE Supabase Realtime (not mocked): a second in-page client joined the channel, its broadcasts spawned ghost "SIR TESTALOT" (red skin) rendered beside the player, our own movement produced 33 received broadcasts on the fake client (TRAVELER/blue payload), fake leave removed the ghost instantly, entering Survival via the gate left the channel; only console noise was the test's own duplicate-client warning (prod creates one client, GoTrue now disabled)

### $FADOM scrub + GitBook-style docs (v38)
- [x] **All player-facing CA/$FADOM removed** (token relaunching on Robinhood Chain): landing hero CA chip + its copy-to-clipboard script + footer CA lines on all pages, roadmap's "$FADOM" item reworded to ticker-neutral ("Token utility — relaunching on Robinhood Chain"), game strings "HOLD $FADOM"→"HOLDERS ONLY" and lb title→"TOKEN HOLDER"; dead `.hero-ca*`/`.ca-line` CSS deleted. Internal code comments keep the name (invisible; crest infra still ships dark). New CA goes in when the team has it
- [x] **Docs page redesigned GitBook-style** (user-approved deviation from the site theme): own `docs.css` — light reading theme, fixed 280px sidebar (logo, 8-section nav with IntersectionObserver scrollspy, back-to-site/lore/roadmap + PLAY), clean sans body with the pixel font only on the brand, `<kbd>` keycaps, bordered tables for tools/buildings/skins, GitBook-style hint callouts, mobile collapse at 900px; old `.docs-*` block removed from landing.css. Content updated: cloud save mentioned, token perks ticker-free
- [x] Verified: sidebar + scrollspy active state, tables/keycaps/callouts render, landing has no CA chip/footer line (`bodyHasCA: false`), no console errors on either page

### Cloud save — ADVENTURE stage (c) complete (v37)
- [x] **Per-wallet mirror**: every `saveAdventure()` stamps `savedAt` and debounce-pushes (2.5 s) the full save JSON to `public.characters` (upsert on the `user_id` PK via `Prefer: resolution=merge-duplicates`); at boot with a session and right after wallet connect, `syncCloudSave()` pulls and resolves **last-write-wins** — cloud newer + not mid-isle → local replaced; local newer → pushed. All fire-and-forget: logged out, offline, or unmigrated DB skips silently (localStorage stays the gameplay source of truth)
- [x] RLS owner-only table migration + verification steps in docs/cloud-save-setup.md (depends on evm-auth being deployed); `__ts.syncCloud`/`__ts.pushCloud` debug hooks for testing
- [x] Verified with a mocked backend: cloud-newer pull replaced the local save (gold 5→777, no push), local-newer sync pushed the right body (user_id + data), playing (give gold → save) fired exactly one debounced POST with the updated save + savedAt, and logged-out play produced zero cloud traffic; console clean
- Honest limits recorded in the setup doc: LWW no-merge, client-trusted data (fair-play validation still a $FADOM prerequisite), sync applies at the start screen only

### Mobile touch controls (v36)
- [x] **Virtual joystick** (bottom-left, HTML overlay at z-index 5 — every menu overlay at z-10 automatically covers/blocks it): touch-tracked by finger identifier so a second touch can't steal the stick, 0.22 dead zone, feeds `touchVec` straight into the same movement vector as WASD in `updatePlayer`
- [x] **Action button** (bottom-right ⚔): mirrors Space — tap = act/talk (advances dialog too), hold = keep working via `keys.Space`; system row up top: ☰ pause + I/O ledger/wheel shortcuts (I/O shown only on the isles, toggled by the three mode starters)
- [x] **Canvas hotbar taps** swap tools (geometry mirrored from `renderAdventureUI`); `preventDefault` on canvas touchstart also swallows the synthetic mousedown so stray taps never queue attacks; `touch-action: none` stops scroll/zoom gestures
- [x] Minimap moves to the top-left on touch devices (joystick owns the bottom-left corner — caught via screenshot)
- [x] Detection: real touch points or `?touch=1` for desktop testing; UI stays fully hidden otherwise (regression-verified)
- [x] Verified via agent-browser with synthesized TouchEvents: joystick hold moved the player and released cleanly, action button held beside a tree harvested wood, hotbar tap switched to pickaxe, pause/ledger buttons opened their screens; desktop (no flag) shows no touch UI; no console errors

### Homestead removed from all player-facing surfaces (v35)
- [x] Removed at the user's call: the SOON teaser on the game start screen (play.html + its `.soon-line` CSS), and the "Homestead — a cozy village builder" entry on the roadmap's Later column. Grep confirms zero `homestead`/`soon-line` references left under game/; start screen and roadmap re-verified in the browser, console clean. (The separate Fable Homestead repo is untouched — this only de-advertises it here.)

- [ ] ADVENTURE stage (c): per-wallet cloud save in Supabase (`characters` table, RLS owner-only) + events.mode migration for 'adventure' — **now also the gate for Marla's Black Market ($FADOM cosmetic purchases need server-side entitlements)**
- [ ] ADVENTURE stage (d) follow-ups (v2 ideas, not started): building perks (e.g. tower = wider lucky-find radius), more plots on other isles, hammer/build animation at the scaffold
- [ ] Hub follow-ups (v29 ideas, not started): visual flag/banner prop at each gate so they read from afar, dead mode-card CSS cleanup (kept in case the picker returns for Homestead), landing-page copy still describes menu-based modes
- [ ] Art gap list for Kintara-parity features (draw in Tiny Swords style): fishing rod anim frames for Pawn + fish items + bobber, cooking station (roast pit) + cooked food icons, potion bottles, wearable cosmetics (hats/capes/weapon skins), fountain/well town prop, mounts, more item icons for shop/marketplace
- [ ] Server-side validation (edge function checks / replay validation) required BEFORE any $FADOM-linked rewards — client-only economy is trivially cheatable
- [ ] Multiplayer/MMO decision (Phase 3): world chat + async marketplace possible on Supabase Realtime; true shared-world play needs an authoritative game server (Colyseus/Node WS on Fly/Railway, monthly cost) — only if Phase 1–2 shows traction
- [ ] Touch controls for mobile
- [ ] Deploy to Vercel/Netlify (static folder — drag-and-drop ready)
- [ ] Fill real Supabase credentials in config.js (docs/leaderboard-setup.md)
- [ ] Daily seeded challenge + deterministic replay validation (prerequisite for token rewards)
- [ ] Campaign progress save (continue from last act via localStorage)
- [ ] Use UI Ribbons/Banner assets for act titles and upgrade cards
- [ ] Background music (needs an external source — pack has no audio)
- [ ] Remaining unused assets: Pawn workers, Yellow faction, Warrior Guard/Attack2, Lancer defence anims, water rocks, rubber duck, cursors, wood table; v2: Gold Mine, Bridge, HappySheep, v2 tilemaps/elevation, barrel/TNT/torch color variants, deco 16-18
