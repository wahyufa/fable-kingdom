# HoodHaven — The Stolen Banner

A story-driven pixel action game built with the [Tiny Swords](https://pixelfrog-assets.itch.io/tiny-swords) free asset pack (v1 + v2) by Pixel Frog. Vanilla HTML/CSS/JS — no build step, no dependencies.

## Play

Serve the folder and open it — `index.html` is the landing page, the game itself is `play.html`:

```
npx serve game
```

## Modes

- **Campaign** — 6 acts. Captain Redmane stole the King's Banner and burned your village. Chase him across the isles — through the Goblin Marsh — topple his towers, barracks, and castle, and take the Banner back. Dialog scenes between acts; die and you retry the current act.
- **Survival** — endless waves of Red, Purple, and Black clans, with goblin raiders (torch, TNT, exploding barrels) joining from wave 4.

## Controls

- **WASD / Arrow keys** — move
- **Space / Left click** — attack (click also aims the swing)
- **Space / Click** — advance dialog
- **M** — mute sound

Meat heals 25 HP (sheep always drop it), gold is worth 10 points, and every cleared wave offers one of three stacking upgrades. Towers shoot, barracks and castles spawn troops — cut off the source. Best score is saved locally.

The game fills the whole window (the viewport adapts to your screen's aspect ratio) and the camera follows you across a 1920x1216 island. Trees, rocks, gold stones, and buildings are solid; bushes are not.

## Online leaderboard (optional)

The game ships with an optional Supabase-backed leaderboard — no player
accounts, just a display name on submit. Follow
[docs/leaderboard-setup.md](docs/leaderboard-setup.md) and fill in `config.js`.
With an empty config the game is fully offline and the leaderboard UI is hidden.

## Project layout

- `index.html` + `landing.css` — landing page with the PLAY GAME button
- `play.html` + `style.css` — the game page and its overlays
- `game.js` — engine: rendering, combat, AI, buildings, waves, dialog, audio
- `campaign.js` — story data: characters, acts, dialog lines, wave compositions, building placements
- `assets/` — sprites copied (renamed) from the Tiny Swords packs; `assets/landing/` holds the landing art

## Deploy

The `game/` folder is fully static. Drag-and-drop it into Vercel, Netlify, or Cloudflare Pages.

## Credits

Art: [Tiny Swords by Pixel Frog](https://pixelfrog-assets.itch.io/tiny-swords) (free pack, CC0).
