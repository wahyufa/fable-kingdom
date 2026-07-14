/*
 * Tiny Swords — Island Defense
 * Story campaign + endless survival built on the Tiny Swords free asset pack.
 * Vanilla JS + Canvas. Campaign data lives in campaign.js (window.CAMPAIGN).
 */
(() => {
  'use strict';

  // ---------- Constants ----------
  const TILE = 64;
  // World size is mutable: combat modes use the small 30x19 island; Adventure
  // swaps in a much larger archipelago (see setWorldSize / buildAdventureWorld).
  let MAP_W = 30;               // tiles
  let MAP_H = 19;               // tiles
  let W = MAP_W * TILE;         // world width  (px)
  let H = MAP_H * TILE;         // world height (px)
  const VIEW_H = 768;           // logical viewport height; width follows the window aspect
  // Combat island occupies the tiles inside the one-tile water ring (30x19 only)
  const ISLE = { x0: 1, y0: 1, x1: 28, y1: 17 };
  // Pixel bounds units may walk in on the combat island (margin inside grass)
  const BOUNDS = {
    x0: ISLE.x0 * TILE + 20,
    y0: ISLE.y0 * TILE + 20,
    x1: (ISLE.x1 + 1) * TILE - 20,
    y1: (ISLE.y1 + 1) * TILE - 20,
  };

  // Adventure-only tile grids (walkable land + bridges, region per tile)
  let landGrid = null, bridgeGrid = null, regionGrid = null, minimapCanvas = null;

  function setWorldSize(tw, th) {
    if (tw === MAP_W && th === MAP_H) return;
    MAP_W = tw; MAP_H = th; W = MAP_W * TILE; H = MAP_H * TILE;
    waterLayer = null; // cached water layer must be rebuilt at the new size
  }

  const FACTIONS = ['red', 'purple', 'black'];
  const COSMETIC_COLORS = ['blue', 'purple', 'red', 'yellow']; // shared by goblins/wood towers and v2 Knight buildings
  const ACTS = window.CAMPAIGN.acts;
  const CHARS = window.CAMPAIGN.characters;
  const ADV = window.ADVENTURE;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Camera follows the player around the larger world
  const cam = { x: 0, y: 0 };

  function updateCamera(dt, snap) {
    const tx = clamp(player.x - canvas.width / 2, 0, W - canvas.width);
    const ty = clamp(player.y - canvas.height / 2, 0, H - canvas.height);
    if (snap) {
      cam.x = tx;
      cam.y = ty;
    } else {
      const k = Math.min(1, dt * 6);
      cam.x += (tx - cam.x) * k;
      cam.y += (ty - cam.y) * k;
    }
  }

  // ---------- Asset loading ----------
  // frameW/frameH describe one animation frame; frame count is derived from image width
  const SHEETS = {
    tiles:        { src: 'assets/tiles.png' },
    tiles2:       { src: 'assets/tiles2.png' },
    tiles3:       { src: 'assets/tiles3.png' },
    tiles4:       { src: 'assets/tiles4.png' },
    tiles5:       { src: 'assets/tiles5.png' },
    water:        { src: 'assets/water.png' },
    foam:         { src: 'assets/foam.png', frameW: 192, frameH: 192 },
    shadow:       { src: 'assets/shadow.png' },
    blue_idle:    { src: 'assets/blue_idle.png', frameW: 192, frameH: 192 },
    blue_run:     { src: 'assets/blue_run.png', frameW: 192, frameH: 192 },
    blue_attack:  { src: 'assets/blue_attack.png', frameW: 192, frameH: 192 },
    arrow:        { src: 'assets/arrow.png' },
    tree:         { src: 'assets/tree.png', frameW: 192, frameH: 256 },
    tree2:        { src: 'assets/tree2.png', frameW: 192, frameH: 256 },
    tree3:        { src: 'assets/tree3.png', frameW: 192, frameH: 192 },
    tree4:        { src: 'assets/tree4.png', frameW: 192, frameH: 192 },
    bush:         { src: 'assets/bush.png', frameW: 128, frameH: 128 },
    goldstone:    { src: 'assets/goldstone.png' },
    goldstone2:   { src: 'assets/goldstone2.png' },
    goldstone3:   { src: 'assets/goldstone3.png' },
    goldstone4:   { src: 'assets/goldstone4.png' },
    goldstone5:   { src: 'assets/goldstone5.png' },
    goldstone6:   { src: 'assets/goldstone6.png' },
    rock1:        { src: 'assets/rock1.png' },
    rock2:        { src: 'assets/rock2.png' },
    rock3:        { src: 'assets/rock3.png' },
    rock4:        { src: 'assets/rock4.png' },
    waterrock:    { src: 'assets/waterrock.png', frameW: 64, frameH: 64 },
    meat:         { src: 'assets/meat.png' },
    gold:         { src: 'assets/gold.png' },
    sheep_idle:   { src: 'assets/sheep_idle.png', frameW: 128, frameH: 128 },
    sheep_move:   { src: 'assets/sheep_move.png', frameW: 128, frameH: 128 },
    explosion:    { src: 'assets/explosion.png', frameW: 192, frameH: 192 },
    dust:         { src: 'assets/dust.png', frameW: 64, frameH: 64 },
    fire:         { src: 'assets/fire.png', frameW: 64, frameH: 64 },
    cloud1:       { src: 'assets/cloud1.png' },
    cloud2:       { src: 'assets/cloud2.png' },
    cloud3:       { src: 'assets/cloud3.png' },
    cloud4:       { src: 'assets/cloud4.png' },
    cloud5:       { src: 'assets/cloud5.png' },
    cloud6:       { src: 'assets/cloud6.png' },
    cloud7:       { src: 'assets/cloud7.png' },
    cloud8:       { src: 'assets/cloud8.png' },
    house_blue1:  { src: 'assets/house_blue1.png' },
    house_blue2:  { src: 'assets/house_blue2.png' },
    house_blue3:  { src: 'assets/house_blue3.png' },
    tower_red:    { src: 'assets/tower_red.png' },
    tower_black:  { src: 'assets/tower_black.png' },
    barracks_black: { src: 'assets/barracks_black.png' },
    castle_red:   { src: 'assets/castle_red.png' },
    // --- Tiny Swords v2 additions (multi-row sheets declare row + frames) ---
    // Goblin troop/tower sheets are registered per-color just below (COSMETIC_COLORS loop)
    dynamite:     { src: 'assets/dynamite.png', frameW: 64, frameH: 64 },
    dead:         { src: 'assets/dead.png', frameW: 128, frameH: 128, row: 0, frames: 7 },
    wood_tower_destroyed: { src: 'assets/wood_tower_destroyed.png' },
    goblin_house: { src: 'assets/goblin_house.png' },
    goblin_house_destroyed: { src: 'assets/goblin_house_destroyed.png' },
    // --- Adventure mode: Pawn worker, harvestable scenery, wood pickups ---
    pawn_idle: { src: 'assets/pawn_idle.png', frameW: 192, frameH: 192 },
    pawn_run:  { src: 'assets/pawn_run.png', frameW: 192, frameH: 192 },
    stump:     { src: 'assets/stump.png' },
    stump2:    { src: 'assets/stump2.png' },
    stump3:    { src: 'assets/stump3.png' },
    stump4:    { src: 'assets/stump4.png' },
    wood:      { src: 'assets/wood.png' },
    tool_axe:     { src: 'assets/tool_axe.png' },
    tool_pickaxe: { src: 'assets/tool_pickaxe.png' },
    tool_knife:   { src: 'assets/tool_knife.png' },
    bridge_h:     { src: 'assets/bridge_h.png' },
    bridge_v:     { src: 'assets/bridge_v.png' },
    // Decorative landmark buildings
    monastery: { src: 'assets/monastery.png' },
    archery:   { src: 'assets/archery.png' },
    // v2 Knight buildings (color variants registered just below, COSMETIC_COLORS loop)
    // Friendly NPCs (Yellow faction, stationary — idle sheet only)
    yellow_warrior_idle: { src: 'assets/yellow_warrior_idle.png', frameW: 192, frameH: 192 },
    yellow_pawn_idle:    { src: 'assets/yellow_pawn_idle.png', frameW: 192, frameH: 192 },
    yellow_archer_idle:  { src: 'assets/yellow_archer_idle.png', frameW: 192, frameH: 192 },
    yellow_monk_idle:    { src: 'assets/yellow_monk_idle.png', frameW: 192, frameH: 192 },
  };
  // Small ground props from the v2 Deco set
  for (let i = 1; i <= 18; i++) {
    const id = String(i).padStart(2, '0');
    SHEETS[`deco_${id}`] = { src: `assets/deco_${id}.png` };
  }
  // Pawn tool variants share one naming scheme (idle/run carry + work swing).
  // Cosmetic skins reuse the same scheme with a color prefix (blue = default,
  // un-prefixed, always owned — see ADV.cosmetics.skins).
  const PAWN_SKINS = ['red', 'purple', 'black', 'gold'];   // gold = crest-gated GILDED
  for (const t of ['axe', 'pickaxe', 'knife']) {
    SHEETS[`pawn_idle_${t}`]     = { src: `assets/pawn_idle_${t}.png`, frameW: 192, frameH: 192 };
    SHEETS[`pawn_run_${t}`]      = { src: `assets/pawn_run_${t}.png`, frameW: 192, frameH: 192 };
    SHEETS[`pawn_interact_${t}`] = { src: `assets/pawn_interact_${t}.png`, frameW: 192, frameH: 192 };
    for (const s of PAWN_SKINS) {
      SHEETS[`${s}_pawn_idle_${t}`]     = { src: `assets/${s}_pawn_idle_${t}.png`, frameW: 192, frameH: 192 };
      SHEETS[`${s}_pawn_run_${t}`]      = { src: `assets/${s}_pawn_run_${t}.png`, frameW: 192, frameH: 192 };
      SHEETS[`${s}_pawn_interact_${t}`] = { src: `assets/${s}_pawn_interact_${t}.png`, frameW: 192, frameH: 192 };
    }
  }
  // Unit sheets exist for every enemy faction with a uniform naming scheme
  for (const f of FACTIONS) {
    SHEETS[`${f}_warrior_idle`]   = { src: `assets/${f}_warrior_idle.png`, frameW: 192, frameH: 192 };
    SHEETS[`${f}_warrior_run`]    = { src: `assets/${f}_warrior_run.png`, frameW: 192, frameH: 192 };
    SHEETS[`${f}_warrior_attack`]  = { src: `assets/${f}_warrior_attack.png`, frameW: 192, frameH: 192 };
    SHEETS[`${f}_warrior_attack2`] = { src: `assets/${f}_warrior_attack2.png`, frameW: 192, frameH: 192 };
    SHEETS[`${f}_warrior_guard`]   = { src: `assets/${f}_warrior_guard.png`, frameW: 192, frameH: 192 };
    SHEETS[`${f}_archer_idle`]    = { src: `assets/${f}_archer_idle.png`, frameW: 192, frameH: 192 };
    SHEETS[`${f}_archer_run`]     = { src: `assets/${f}_archer_run.png`, frameW: 192, frameH: 192 };
    SHEETS[`${f}_archer_shoot`]   = { src: `assets/${f}_archer_shoot.png`, frameW: 192, frameH: 192 };
    SHEETS[`${f}_lancer_idle`]    = { src: `assets/${f}_lancer_idle.png`, frameW: 320, frameH: 320 };
    SHEETS[`${f}_lancer_run`]     = { src: `assets/${f}_lancer_run.png`, frameW: 320, frameH: 320 };
    for (const dir of ['r', 'u', 'd', 'ur', 'dr']) {
      SHEETS[`${f}_lancer_atk_${dir}`] = { src: `assets/${f}_lancer_atk_${dir}.png`, frameW: 320, frameH: 320 };
      SHEETS[`${f}_lancer_def_${dir}`] = { src: `assets/${f}_lancer_def_${dir}.png`, frameW: 320, frameH: 320 };
    }
    SHEETS[`${f}_monk_idle`]    = { src: `assets/${f}_monk_idle.png`, frameW: 192, frameH: 192 };
    SHEETS[`${f}_monk_run`]     = { src: `assets/${f}_monk_run.png`, frameW: 192, frameH: 192 };
    SHEETS[`${f}_monk_heal`]    = { src: `assets/${f}_monk_heal.png`, frameW: 192, frameH: 192 };
    SHEETS[`${f}_monk_heal_fx`] = { src: `assets/${f}_monk_heal_fx.png`, frameW: 192, frameH: 192 };
  }
  // Goblins/Wood Towers come in 4 cosmetic colors — one is picked per spawn
  for (const c of COSMETIC_COLORS) {
    SHEETS[`goblin_torch_idle_${c}`]  = { src: `assets/goblin_torch_${c}.png`, frameW: 192, frameH: 192, row: 0, frames: 7 };
    SHEETS[`goblin_torch_run_${c}`]   = { src: `assets/goblin_torch_${c}.png`, frameW: 192, frameH: 192, row: 1, frames: 6 };
    SHEETS[`goblin_torch_atk_r_${c}`] = { src: `assets/goblin_torch_${c}.png`, frameW: 192, frameH: 192, row: 2, frames: 6 };
    SHEETS[`goblin_torch_atk_d_${c}`] = { src: `assets/goblin_torch_${c}.png`, frameW: 192, frameH: 192, row: 3, frames: 6 };
    SHEETS[`goblin_torch_atk_u_${c}`] = { src: `assets/goblin_torch_${c}.png`, frameW: 192, frameH: 192, row: 4, frames: 6 };
    SHEETS[`goblin_tnt_idle_${c}`]    = { src: `assets/goblin_tnt_${c}.png`, frameW: 192, frameH: 192, row: 0, frames: 6 };
    SHEETS[`goblin_tnt_run_${c}`]     = { src: `assets/goblin_tnt_${c}.png`, frameW: 192, frameH: 192, row: 1, frames: 6 };
    SHEETS[`goblin_tnt_throw_${c}`]   = { src: `assets/goblin_tnt_${c}.png`, frameW: 192, frameH: 192, row: 2, frames: 7 };
    SHEETS[`goblin_barrel_idle_${c}`] = { src: `assets/goblin_barrel_${c}.png`, frameW: 128, frameH: 128, row: 1, frames: 6 };
    SHEETS[`goblin_barrel_run_${c}`]  = { src: `assets/goblin_barrel_${c}.png`, frameW: 128, frameH: 128, row: 3, frames: 6 };
    SHEETS[`goblin_barrel_fuse_${c}`] = { src: `assets/goblin_barrel_${c}.png`, frameW: 128, frameH: 128, row: 5, frames: 3 };
    SHEETS[`wood_tower_${c}`]         = { src: `assets/wood_tower_${c}.png`, frameW: 256, frameH: 192 };
    SHEETS[`v2_castle_${c}`] = { src: `assets/v2_castle_${c}.png` };
    SHEETS[`v2_house_${c}`]  = { src: `assets/v2_house_${c}.png` };
    SHEETS[`v2_tower_${c}`]  = { src: `assets/v2_tower_${c}.png` };
  }
  // Scaffold stage for player-built structures (same canvas size as the
  // finished sprites, so they share each type's anchorY unchanged)
  for (const t of ['v2_castle', 'v2_house', 'v2_tower']) {
    SHEETS[`${t}_construction`] = { src: `assets/${t}_construction.png` };
  }

  const img = {};
  let assetsReady = false;

  function loadAssets() {
    const jobs = Object.entries(SHEETS).map(([key, meta]) => new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => {
        img[key] = im;
        // Frame count from sheet width unless declared (multi-row sheets declare it)
        if (meta.frameW && !meta.frames) meta.frames = Math.floor(im.width / meta.frameW);
        resolve();
      };
      im.onerror = () => reject(new Error('Failed to load ' + meta.src));
      im.src = meta.src;
    }));
    return Promise.all(jobs);
  }

  // ---------- Buildings ----------
  const BUILDING_DEFS = {
    house1:   { sheet: 'house_blue1', hostile: false, r: 42, anchorY: 186 },
    house2:   { sheet: 'house_blue2', hostile: false, r: 42, anchorY: 186 },
    house3:   { sheet: 'house_blue3', hostile: false, r: 42, anchorY: 186 },
    tower:    { hostile: true, r: 45, anchorY: 246, shoots: true, score: 40 },
    barracks: { sheet: 'barracks_black', hostile: true, r: 70, anchorY: 246, spawns: 'warrior', spawnEvery: 9, score: 60 },
    castle:   { sheet: 'castle_red', hostile: true, r: 105, anchorY: 246, spawns: 'mixed', spawnEvery: 6.5, score: 150 },
    // Goblin structures leave a destroyed ruin behind instead of vanishing
    // (sheet omitted — buildingSheet() picks the color variant per instance)
    wood_tower:   { animFps: 6, hostile: true, r: 60, anchorY: 182, lobs: true, score: 50, ruin: 'wood_tower_destroyed' },
    goblin_house: { sheet: 'goblin_house', hostile: true, r: 45, anchorY: 182, spawns: 'torch', spawnEvery: 8, score: 50, ruin: 'goblin_house_destroyed' },
    // Adventure landmarks — decorative only (no hp/spawns logic runs on non-hostile types)
    monastery: { sheet: 'monastery', hostile: false, r: 58, anchorY: 306 },
    archery:   { sheet: 'archery', hostile: false, r: 54, anchorY: 242 },
    // v2 Knight buildings — same footprint as their v1 counterparts (house
    // matches house1-3's 128x192 exactly); sheet omitted, color per instance
    v2_castle: { hostile: false, r: 100, anchorY: 242 },
    v2_house:  { hostile: false, r: 42, anchorY: 186 },
    v2_tower:  { hostile: false, r: 48, anchorY: 242 },
  };

  const V2_BUILDING_TYPES = ['v2_castle', 'v2_house', 'v2_tower'];

  function buildingSheet(b) {
    const def = BUILDING_DEFS[b.type];
    if (b.construction) return `${b.type}_construction`; // player build in progress
    if (b.type === 'tower') return `tower_${b.faction}`;
    if (b.type === 'wood_tower') return `wood_tower_${b.faction}`;
    if (V2_BUILDING_TYPES.includes(b.type)) return `${b.type}_${b.faction}`;
    return def.sheet;
  }

  // Collider circle sits a bit above the base anchor
  const buildingCenter = (b) => ({ x: b.x, y: b.y - 50 });

  // ---------- Input ----------
  const keys = {};
  let attackQueued = false;
  let mouseX = W / 2;
  let attackTowardMouse = false;

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyM') {
      audioSettings.muted = !audioSettings.muted;
      syncAudio();
    }
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (state.mode === 'ledger') { toggleLedger(); return; }
      if (state.mode === 'spinner') { toggleSpinner(); return; }
      if (state.mode === 'build') { closeBuildMenu(); return; }
      if (state.mode === 'gate') { closeGate(); return; }
      if (state.mode === 'shop') { closeShop(); return; }
      if (state.mode === 'playing' || state.mode === 'paused') togglePause();
      return;
    }
    // Adventure: I toggles the kingdom ledger, O the spinner wheel, 1-3 the tool
    if (state.adventure && e.code === 'KeyI' && (state.mode === 'playing' || state.mode === 'ledger')) {
      toggleLedger();
      return;
    }
    if (state.adventure && e.code === 'KeyO' && (state.mode === 'playing' || state.mode === 'spinner')) {
      toggleSpinner();
      return;
    }
    if (state.adventure && state.mode === 'playing' && /^Digit[123]$/.test(e.code)) {
      player.tool = ADV.hotbar[Number(e.code.slice(5)) - 1];
    }
    if (e.code === 'Space' || e.code === 'Enter') {
      if (state.mode === 'dialog') {
        advanceDialog();
        e.preventDefault();
        return;
      }
    }
    keys[e.code] = true;
    if (e.code === 'Space') {
      attackQueued = true;
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });

  canvas.addEventListener('mousedown', (e) => {
    if (state.mode !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * (canvas.width / rect.width) + cam.x;
    attackQueued = true;
    attackTowardMouse = true;
  });

  // ---------- Touch controls (mobile) ----------
  // Virtual joystick feeds the same movement vector as WASD; the big action
  // button mirrors Space (tap = act/talk, hold = keep working). ?touch=1
  // forces the UI on desktop for testing.
  const IS_TOUCH = navigator.maxTouchPoints > 0 || 'ontouchstart' in window ||
    new URLSearchParams(location.search).has('touch');
  const touchVec = { x: 0, y: 0 };

  // Ledger/wheel shortcuts only make sense on the isles — the mode starters
  // call this to show/hide them (no-op cheap enough to run unconditionally)
  function setTouchAdventureButtons(on) {
    for (const id of ['touch-ledger', 'touch-wheel']) {
      document.getElementById(id).classList.toggle('hidden', !on);
    }
  }

  function initTouchUI() {
    if (!IS_TOUCH) return;
    document.getElementById('touch-ui').classList.remove('hidden');

    const joy = document.getElementById('joystick');
    const stick = document.getElementById('joystick-stick');
    let joyId = null; // track "our" finger so a second touch can't steal the stick

    function setStick(x, y) {
      stick.style.transform = `translate(${x * 34}px, ${y * 34}px)`;
    }
    function handleJoy(t) {
      const r = joy.getBoundingClientRect();
      let dx = (t.clientX - (r.left + r.width / 2)) / (r.width / 2);
      let dy = (t.clientY - (r.top + r.height / 2)) / (r.height / 2);
      const len = Math.hypot(dx, dy);
      if (len > 1) { dx /= len; dy /= len; }
      if (len < 0.22) { dx = 0; dy = 0; } // dead zone
      touchVec.x = dx;
      touchVec.y = dy;
      setStick(dx, dy);
    }
    joy.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (joyId !== null) return;
      joyId = e.changedTouches[0].identifier;
      initAudio();
      handleJoy(e.changedTouches[0]);
    }, { passive: false });
    joy.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) if (t.identifier === joyId) handleJoy(t);
    }, { passive: false });
    const endJoy = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier !== joyId) continue;
        joyId = null;
        touchVec.x = 0;
        touchVec.y = 0;
        setStick(0, 0);
      }
    };
    joy.addEventListener('touchend', endJoy);
    joy.addEventListener('touchcancel', endJoy);

    const act = document.getElementById('touch-act');
    act.addEventListener('touchstart', (e) => {
      e.preventDefault();
      initAudio();
      if (state.mode === 'dialog') { advanceDialog(); return; }
      keys.Space = true; // hold-to-keep-working reads this, same as the key
      attackQueued = true;
    }, { passive: false });
    const endAct = (e) => { e.preventDefault(); keys.Space = false; };
    act.addEventListener('touchend', endAct, { passive: false });
    act.addEventListener('touchcancel', endAct, { passive: false });

    document.getElementById('touch-pause').addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (state.mode === 'playing' || state.mode === 'paused') togglePause();
    }, { passive: false });
    document.getElementById('touch-ledger').addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (state.adventure && (state.mode === 'playing' || state.mode === 'ledger')) toggleLedger();
    }, { passive: false });
    document.getElementById('touch-wheel').addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (state.adventure && (state.mode === 'playing' || state.mode === 'spinner')) toggleSpinner();
    }, { passive: false });

    // Tapping the canvas hotbar swaps tools; preventDefault also swallows the
    // synthetic mousedown, so stray taps never queue an attack on touch
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (!state.adventure || state.mode !== 'playing') return;
      const rect = canvas.getBoundingClientRect();
      const t = e.changedTouches[0];
      const cx = (t.clientX - rect.left) * (canvas.width / rect.width);
      const cy = (t.clientY - rect.top) * (canvas.height / rect.height);
      // Mirror the hotbar geometry in renderAdventureUI
      const slot = 56, gap = 10;
      const totalW = ADV.hotbar.length * slot + (ADV.hotbar.length - 1) * gap;
      const hx = (canvas.width - totalW) / 2;
      const hy = canvas.height - slot - 16;
      if (cy < hy - 6 || cy > hy + slot + 6) return;
      ADV.hotbar.forEach((tool, i) => {
        const x = hx + i * (slot + gap);
        if (cx >= x - 3 && cx <= x + slot + 3) player.tool = tool;
      });
    }, { passive: false });
  }
  initTouchUI();

  // ---------- Audio (synthesized SFX + looping BGM) ----------
  const audio = { ctx: null };

  // Music / SFX toggles live in the pause menu; M is a master mute on top
  const AUDIO_KEY = 'fableKingdomAudio';
  const audioSettings = Object.assign(
    { music: true, sfx: true, muted: false },
    JSON.parse(localStorage.getItem(AUDIO_KEY) || '{}')
  );

  const sfxOn = () => audioSettings.sfx && !audioSettings.muted;

  // BGM is optional: if the track fails to load, the game stays silent.
  // One Audio element whose .src swaps per mode — fades out, swaps, fades
  // back in, rather than a hard cut. 'default' covers Story + menus.
  const BGM_TRACKS = {
    default: 'assets/audio/bgm.mp3',
    adventure: 'assets/audio/bgm_adventure.mp3',
    survival: 'assets/audio/bgm_survival.mp3',
  };
  const BGM_VOLUME = 0.35;
  let bgm = new Audio(BGM_TRACKS.default);
  bgm.loop = true;
  bgm.volume = BGM_VOLUME;
  bgm.onerror = () => { bgm = null; };
  let bgmTrack = 'default';
  let bgmFadeTimer = null;

  function fadeBgmTo(vol, ms, onDone) {
    if (!bgm) { onDone && onDone(); return; }
    clearInterval(bgmFadeTimer);
    const steps = Math.max(1, Math.round(ms / 40));
    const start = bgm.volume;
    const step = (vol - start) / steps;
    let i = 0;
    bgmFadeTimer = setInterval(() => {
      i++;
      if (bgm) bgm.volume = Math.min(1, Math.max(0, start + step * i));
      if (i >= steps) {
        clearInterval(bgmFadeTimer);
        if (bgm) bgm.volume = vol;
        onDone && onDone();
      }
    }, 40);
  }

  // Switches the looping track for the mode being entered. No-ops if
  // already on that track or if bgm failed to load entirely.
  function setBgmTrack(key) {
    if (!bgm || bgmTrack === key) return;
    bgmTrack = key;
    const wasPaused = bgm.paused;
    fadeBgmTo(0, 300, () => {
      if (!bgm) return;
      bgm.pause();
      bgm.src = BGM_TRACKS[key] || BGM_TRACKS.default;
      bgm.currentTime = 0;
      if (!wasPaused) bgm.play().catch(() => {});
      fadeBgmTo(BGM_VOLUME, 500);
    });
  }

  function syncAudio() {
    localStorage.setItem(AUDIO_KEY, JSON.stringify(audioSettings));
    if (bgm) bgm.muted = audioSettings.muted || !audioSettings.music;
    for (const [id, key] of [['opt-music', 'music'], ['opt-sfx', 'sfx'], ['opt-mute', 'muted']]) {
      const el = document.getElementById(id);
      if (el) el.checked = key === 'muted' ? audioSettings.muted : audioSettings[key];
    }
  }

  function initAudio() {
    if (!audio.ctx) audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    // Browsers only allow playback after a user gesture; this runs on button clicks
    if (bgm && bgm.paused) {
      syncAudio();
      bgm.play().catch(() => {});
    }
  }

  // One-shot tone: type, start/end frequency, duration, volume
  function tone(type, f0, f1, dur, vol = 0.08, delay = 0) {
    if (!audio.ctx || !sfxOn()) return;
    const t0 = audio.ctx.currentTime + delay;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(audio.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  }

  const sfx = {
    swing: () => tone('sawtooth', 420, 120, 0.09, 0.05),
    hit:   () => tone('square', 220, 70, 0.1, 0.08),
    thud:  () => tone('square', 130, 60, 0.12, 0.09),
    hurt:  () => tone('square', 160, 50, 0.18, 0.1),
    boom:  () => { tone('square', 110, 35, 0.25, 0.1); tone('sawtooth', 70, 25, 0.3, 0.08); },
    coin:  () => { tone('square', 880, 880, 0.06, 0.05); tone('square', 1320, 1320, 0.09, 0.05, 0.06); },
    meat:  () => tone('sine', 440, 700, 0.12, 0.08),
    heal:  () => tone('sine', 520, 880, 0.25, 0.06),
    wave:  () => { tone('square', 330, 330, 0.1, 0.06); tone('square', 440, 440, 0.1, 0.06, 0.1); tone('square', 660, 660, 0.18, 0.06, 0.2); },
    pick:  () => tone('square', 660, 990, 0.08, 0.06),
    talk:  () => tone('square', 500, 620, 0.05, 0.04),
    fanfare: () => { [330, 440, 550, 660, 880].forEach((f, i) => tone('square', f, f, 0.15, 0.06, i * 0.12)); },
  };

  // ---------- Helpers ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function drawFrame(sheet, frame, x, y, flip, scale = 1, anchorX, anchorY) {
    const meta = SHEETS[sheet];
    const fw = meta.frameW, fh = meta.frameH;
    const sy = (meta.row || 0) * fh;
    const ax = anchorX !== undefined ? anchorX : fw / 2;
    const ay = anchorY !== undefined ? anchorY : fh / 2;
    ctx.save();
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(img[sheet], frame * fw, sy, fw, fh, -ax * scale, -ay * scale, fw * scale, fh * scale);
    ctx.restore();
  }

  function drawShadow(x, y, scale = 1) {
    ctx.drawImage(img.shadow, x - 96 * scale, y - 96 * scale, 192 * scale, 192 * scale);
  }

  function animFrame(sheet, t, fps = 8) {
    return Math.floor(t * fps) % SHEETS[sheet].frames;
  }

  // ---------- Static map layers (pre-rendered per act) ----------
  let waterLayer, grassLayer;

  function buildMapLayers(tileset) {
    if (!waterLayer) {
      waterLayer = document.createElement('canvas');
      waterLayer.width = W; waterLayer.height = H;
      const wc = waterLayer.getContext('2d');
      for (let ty = 0; ty < MAP_H; ty++) {
        for (let tx = 0; tx < MAP_W; tx++) {
          wc.drawImage(img.water, tx * TILE, ty * TILE);
        }
      }
    }
    grassLayer = document.createElement('canvas');
    grassLayer.width = W; grassLayer.height = H;
    const gc = grassLayer.getContext('2d');
    for (let ty = ISLE.y0; ty <= ISLE.y1; ty++) {
      for (let tx = ISLE.x0; tx <= ISLE.x1; tx++) {
        // Pick edge/corner/center tile from the 3x3 grass block in the tileset
        const col = tx === ISLE.x0 ? 0 : tx === ISLE.x1 ? 2 : 1;
        const row = ty === ISLE.y0 ? 0 : ty === ISLE.y1 ? 2 : 1;
        gc.drawImage(img[tileset], col * TILE, row * TILE, TILE, TILE, tx * TILE, ty * TILE, TILE, TILE);
      }
    }
  }

  // Border tiles that get animated foam beneath them
  const foamTiles = [];
  function buildFoamList() {
    for (let ty = ISLE.y0; ty <= ISLE.y1; ty++) {
      for (let tx = ISLE.x0; tx <= ISLE.x1; tx++) {
        if (tx === ISLE.x0 || tx === ISLE.x1 || ty === ISLE.y0 || ty === ISLE.y1) {
          foamTiles.push({ x: tx * TILE, y: ty * TILE });
        }
      }
    }
  }

  // ---------- Adventure open world (archipelago + bridges) ----------
  const gridIdx = (tx, ty) => ty * MAP_W + tx;

  function tileWalkable(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H || !landGrid) return false;
    const i = gridIdx(tx, ty);
    return !!(landGrid[i] || bridgeGrid[i]);
  }
  const walkableAt = (px, py) => tileWalkable(Math.floor(px / TILE), Math.floor(py / TILE));

  function regionAt(px, py) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H || !regionGrid) return 255;
    return regionGrid[gridIdx(tx, ty)];
  }

  const MM_SCALE = 2;
  // Minimap tint per island index, matched to the region palettes
  const ISLAND_TINTS = ['#6fae4b', '#3f7d54', '#c9a23f', '#79a96a'];

  function buildMinimap() {
    minimapCanvas = document.createElement('canvas');
    minimapCanvas.width = MAP_W * MM_SCALE;
    minimapCanvas.height = MAP_H * MM_SCALE;
    const mc = minimapCanvas.getContext('2d');
    mc.fillStyle = '#2f7d86';
    mc.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        const i = gridIdx(tx, ty);
        if (landGrid[i]) mc.fillStyle = ISLAND_TINTS[regionGrid[i]] || '#6fae4b';
        else if (bridgeGrid[i]) mc.fillStyle = '#8a5a2b';
        else continue;
        mc.fillRect(tx * MM_SCALE, ty * MM_SCALE, MM_SCALE, MM_SCALE);
      }
    }
  }

  function buildAdventureWorld() {
    const w = ADV.world;
    setWorldSize(w.mapW, w.mapH);
    const N = MAP_W * MAP_H;
    landGrid = new Uint8Array(N);
    bridgeGrid = new Uint8Array(N);
    regionGrid = new Uint8Array(N).fill(255);

    // Water fills the whole world (rebuilt because setWorldSize cleared the cache)
    waterLayer = document.createElement('canvas');
    waterLayer.width = W; waterLayer.height = H;
    const wc = waterLayer.getContext('2d');
    for (let ty = 0; ty < MAP_H; ty++)
      for (let tx = 0; tx < MAP_W; tx++)
        wc.drawImage(img.water, tx * TILE, ty * TILE);

    // Each island painted with its own palette using the 3x3 edge/corner block
    grassLayer = document.createElement('canvas');
    grassLayer.width = W; grassLayer.height = H;
    const gc = grassLayer.getContext('2d');
    w.islands.forEach((isle, ri) => {
      for (let ty = isle.y0; ty <= isle.y1; ty++) {
        for (let tx = isle.x0; tx <= isle.x1; tx++) {
          landGrid[gridIdx(tx, ty)] = 1;
          regionGrid[gridIdx(tx, ty)] = ri;
          const col = tx === isle.x0 ? 0 : tx === isle.x1 ? 2 : 1;
          const row = ty === isle.y0 ? 0 : ty === isle.y1 ? 2 : 1;
          gc.drawImage(img[isle.palette], col * TILE, row * TILE, TILE, TILE, tx * TILE, ty * TILE, TILE, TILE);
        }
      }
    });

    // Bridges: mark walkable and bake the deck sprite over the gap (lapping onto land)
    for (const b of w.bridges) {
      for (let ty = b.y0; ty <= b.y1; ty++)
        for (let tx = b.x0; tx <= b.x1; tx++)
          bridgeGrid[gridIdx(tx, ty)] = 1;
      const px = b.x0 * TILE, py = b.y0 * TILE;
      const bw = (b.x1 - b.x0 + 1) * TILE, bh = (b.y1 - b.y0 + 1) * TILE;
      if (b.dir === 'h') gc.drawImage(img.bridge_h, px - 32, py, bw + 64, bh);
      else               gc.drawImage(img.bridge_v, px, py - 32, bw, bh + 64);
    }

    // Foam sits on each island's own outer rim tiles (same approach as the
    // combat islands' buildFoamList — waves lapping the beach edge itself,
    // not tiles out in the water).
    foamTiles.length = 0;
    for (const isle of w.islands) {
      for (let ty = isle.y0; ty <= isle.y1; ty++) {
        for (let tx = isle.x0; tx <= isle.x1; tx++) {
          if (tx === isle.x0 || tx === isle.x1 || ty === isle.y0 || ty === isle.y1) {
            foamTiles.push({ x: tx * TILE, y: ty * TILE });
          }
        }
      }
    }

    buildMinimap();
  }

  // Random walkable pixel inside an island, inset one tile from the coast
  function randLandInIsland(isle) {
    for (let i = 0; i < 30; i++) {
      const tx = randInt(isle.x0 + 1, isle.x1 - 1);
      const ty = randInt(isle.y0 + 1, isle.y1 - 1);
      if (tileWalkable(tx, ty)) return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
    }
    return { x: (isle.x0 + 1) * TILE + TILE / 2, y: (isle.y0 + 1) * TILE + TILE / 2 };
  }

  function makeAdventureDecors() {
    const list = [];
    const spawn = { x: ADV.world.spawn.tx * TILE, y: ADV.world.spawn.ty * TILE };
    for (const isle of ADV.world.islands) {
      const kinds = [
        ['tree', isle.trees], ['goldstone', isle.gold],
        ['bush', Math.round(isle.props * 0.4)], ['rock', Math.round(isle.props * 0.2)],
        ['smalldeco', isle.props],
      ];
      for (const [kind, n] of kinds) {
        for (let k = 0; k < n; k++) {
          let p, tries = 0;
          do { p = randLandInIsland(isle); tries++; }
          while (tries < 20 && (
            dist(p, spawn) < 140 ||
            list.some(d => dist(p, d) < 92) ||
            buildings.some(b => dist(p, buildingCenter(b)) < BUILDING_DEFS[b.type].r + 90) ||
            // Keep empty build plots clear — a KEEP is 320px wide once raised
            (plotList || []).some(pl => dist(p, pl) < 170)
          ));
          const variant = randInt(1, VARIANT_COUNT[kind] || 2);
          const d = { kind, x: p.x, y: p.y, animT: rand(0, 2), variant };
          const node = ADV.nodes[kind];
          if (node) { d.hits = node.hits; d.harvested = false; d.respawnT = 0; d.flashT = 0; }
          if (kind === 'tree') d.stumpVariant = randInt(1, 4);
          list.push(d);
        }
      }
      scatterWaterRocks(list, isle, 3);
    }
    return list;
  }

  function makeAdventureSheep() {
    // Weight the spawn island by its sheep count so flocks cluster by region
    const pool = [];
    ADV.world.islands.forEach((isle) => { for (let i = 0; i < isle.sheep; i++) pool.push(isle); });
    const isle = pool.length ? pickRandom(pool) : ADV.world.islands[0];
    const p = randLandInIsland(isle);
    return {
      x: p.x, y: p.y, vx: 0, vy: 0, moving: false,
      thinkT: rand(0.5, 2), animT: rand(0, 2), flip: false, dead: false,
    };
  }

  // ---------- Game state ----------
  const state = {
    mode: 'start',          // start | playing | upgrade | dialog | gameover | victory
    campaign: null,         // null = survival, else { act, wave }
    adventure: null,        // null = combat modes, else { wood, gold, meat, introT }
    dialog: null,           // { scenes, i, onDone }
    time: 0,
    score: 0,
    wave: 0,                // survival wave counter
    waveState: 'intermission', // intermission | spawning | active | siege
    waveTimer: 0,
    spawnQueue: [],
    spawnTimer: 0,
    shakeT: 0,
    sheepTimer: 0,
    sheepCap: 4,
    actSnapshot: null,      // player stats at act start, for retries
  };

  let player, enemies, arrows, bombs, corpses, pickups, effects, sheepList, decors, buildings, clouds, npcList, plotList;

  // Named so the Survival upgrade caps below can stay relative to these
  // instead of duplicating magic numbers that could drift out of sync.
  const BASE_SPEED = 230, BASE_DMG = 35, BASE_MAX_HP = 100, BASE_ATK_DUR = 4 / 12;

  function defaultPlayer() {
    return {
      x: W / 2, y: H / 2 + 100,
      hp: BASE_MAX_HP, maxHp: BASE_MAX_HP,
      speed: BASE_SPEED,
      dmg: BASE_DMG,
      atkDur: BASE_ATK_DUR, // attack animation length; upgrades shorten it
      flip: false,
      state: 'idle',        // idle | run | attack
      animT: 0,
      attackT: 0,
      didHit: false,
      hurtT: 0,             // invulnerability window
      tool: 'axe',          // adventure: carried tool (axe | pickaxe | knife)
      target: null,         // adventure: node/sheep being worked
      interactDur: 0,       // adventure: current work-swing length
    };
  }

  function resetWorld() {
    enemies = [];
    arrows = [];
    bombs = [];
    corpses = [];
    pickups = [];
    effects = [];
    sheepList = [];
    buildings = [];
    npcList = [];
    plotList = [];
    state.shakeT = 0;
    state.sheepTimer = 0;
    state.spawnQueue = [];
    attackQueued = false;
  }

  function makeSheep() {
    let p;
    do {
      p = { x: rand(BOUNDS.x0 + 100, BOUNDS.x1 - 100), y: rand(BOUNDS.y0 + 100, BOUNDS.y1 - 100) };
    } while (
      buildings.some(b => dist(p, buildingCenter(b)) < BUILDING_DEFS[b.type].r + 60) ||
      (decors || []).some(d => DECOR_SOLIDS[d.kind] && dist(p, d) < DECOR_SOLIDS[d.kind].r + 50)
    );
    return {
      x: p.x, y: p.y,
      vx: 0, vy: 0,
      moving: false,
      thinkT: rand(0.5, 2),
      animT: rand(0, 2),
      flip: false,
      dead: false,
    };
  }

  // Scenery scattered across the island, away from buildings, the battlefield
  // center, and the player's starting spot (trees/rocks/gold are solid)
  function makeDecors(treeCount, goldstoneCount = 3) {
    const list = [];
    const center = { x: W / 2, y: H / 2 };
    const playerStart = { x: W / 2, y: H - 220 };
    const kinds = [
      ['tree', treeCount], ['bush', 8], ['goldstone', goldstoneCount], ['rock', 5], ['smalldeco', 12],
    ];
    for (const [kind, n] of kinds) {
      for (let i = 0; i < n; i++) {
        let p, tries = 0;
        do {
          p = { x: rand(BOUNDS.x0 + 30, BOUNDS.x1 - 30), y: rand(BOUNDS.y0 + 30, BOUNDS.y1 - 30) };
          tries++;
        } while (tries < 30 && (
          dist(p, center) < 380 ||
          dist(p, playerStart) < 200 ||
          buildings.some(b => dist(p, buildingCenter(b)) < BUILDING_DEFS[b.type].r + 90) ||
          list.some(d => dist(p, d) < 100)
        ));
        const variant = randInt(1, VARIANT_COUNT[kind] || 2);
        list.push({ kind, x: p.x, y: p.y, animT: rand(0, 2), variant });
      }
    }
    scatterWaterRocks(list, ISLE, 5);
    return list;
  }

  function makeBuildings(defs) {
    return (defs || []).map(d => ({
      type: d.type,
      // wood_tower/v2 buildings use "faction" as a cosmetic color pick, not a knight faction
      faction: d.faction || ((d.type === 'wood_tower' || V2_BUILDING_TYPES.includes(d.type)) ? pickRandom(COSMETIC_COLORS) : 'red'),
      x: d.x, y: d.y,
      hp: d.hp || 0,
      maxHp: d.hp || 0,
      burning: !!d.burning,
      flashT: 0,
      shootT: rand(1, 2.5),
      spawnT: rand(3, 5),
    }));
  }

  const hostileBuildings = () => buildings.filter(b => BUILDING_DEFS[b.type].hostile);

  // ---------- Mode starts ----------
  function startSurvival() {
    state.campaign = null;
    state.adventure = null;
    setWorldSize(30, 19);          // reset from any prior adventure world
    player = defaultPlayer();
    resetWorld();
    buildMapLayers('tiles');
    decors = makeDecors(11);
    state.sheepCap = 4;
    for (let i = 0; i < 4; i++) sheepList.push(makeSheep());
    state.score = 0;
    state.wave = 0;
    state.waveState = 'intermission';
    state.waveTimer = 2;
    state.mode = 'playing';
    setTouchAdventureButtons(false);
    leaveIsles();
    setBgmTrack('survival');
    updateCamera(0, true);
    runStartedAt = Date.now();
    track('run_start', { mode: 'survival' });
  }

  // Adventure: peaceful gathering mode — no waves, no damage. Resources persist
  // locally for now (per-wallet cloud saves land in a later stage).
  const ADV_SAVE_KEY = 'fableKingdomAdventure';
  const utcToday = () => new Date().toISOString().slice(0, 10);

  // Deterministic dailies: every player gets the same three goals for a UTC day
  function rollDailies(prev) {
    const date = utcToday();
    if (prev && prev.date === date && Array.isArray(prev.quests)) return prev;
    let seed = 0;
    for (const ch of date) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const rng = () => { // mulberry32
      seed = (seed + 0x6D2B79F5) >>> 0;
      let t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const quests = Object.entries(ADV.daily.goals).map(([res, g]) => ({
      res,
      target: g.min + Math.floor(rng() * (g.max - g.min + 1)),
      progress: 0,
      claimed: false,
    }));
    return { date, quests };
  }

  function loadAdventureSave() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(ADV_SAVE_KEY)) || {}; } catch {}
    const skills = {};
    for (const id of Object.keys(ADV.skills)) skills[id] = (s.skills && s.skills[id]) || 0;
    const cosmetics = {
      owned: (s.cosmetics && s.cosmetics.owned) || ['blue'],
      equipped: (s.cosmetics && s.cosmetics.equipped) || 'blue',
    };
    // GILDED is crest-gated — without a verified holder session it reverts
    if (cosmetics.equipped === 'gold' && !(session && session.user.crest)) {
      cosmetics.equipped = 'blue';
    }
    return {
      wood: s.wood || 0, gold: s.gold || 0, meat: s.meat || 0,
      skills,                       // total XP per skill; level derives from the curve
      daily: rollDailies(s.daily),  // re-rolls when the UTC date changed
      notices: [],                  // transient HUD banners (level-ups, quest claims)
      cosmetics,
      npcQuests: s.npcQuests || {},        // npc id -> true once turned in (one-time only)
      spinnerLastFree: s.spinnerLastFree || 0, // ms timestamp of the last free spin
      plots: s.plots || {},                // plot id -> { type, color, startAt, finishAt, done }
      storyBounties: s.storyBounties || {},// 'act0'..'act5','campaign' -> true once paid
      gatesSeen: s.gatesSeen || {},        // role npc id -> true once talked to ("!" marker)
      introT: 7,
    };
  }

  function saveAdventure() {
    const a = state.adventure;
    localStorage.setItem(ADV_SAVE_KEY, JSON.stringify({
      wood: a.wood, gold: a.gold, meat: a.meat, skills: a.skills, daily: a.daily,
      cosmetics: a.cosmetics, npcQuests: a.npcQuests, spinnerLastFree: a.spinnerLastFree,
      plots: a.plots, storyBounties: a.storyBounties, gatesSeen: a.gatesSeen,
      savedAt: Date.now(),   // last-write-wins stamp for the cloud mirror
    }));
    queueCloudPush();
  }

  // Combat runs bank their earnings straight into the save — state.adventure
  // is null while fighting, so these go through localStorage directly.
  function bankSpoils(gold, wood) {
    if (!gold && !wood) return;
    let s = {};
    try { s = JSON.parse(localStorage.getItem(ADV_SAVE_KEY)) || {}; } catch {}
    s.gold = (s.gold || 0) + gold;
    s.wood = (s.wood || 0) + wood;
    localStorage.setItem(ADV_SAVE_KEY, JSON.stringify(s));
  }

  // One-time story bounty; returns the gold paid (0 when already claimed)
  function grantStoryBounty(key, gold) {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(ADV_SAVE_KEY)) || {}; } catch {}
    s.storyBounties = s.storyBounties || {};
    if (s.storyBounties[key]) return 0;
    s.storyBounties[key] = true;
    s.gold = (s.gold || 0) + gold;
    localStorage.setItem(ADV_SAVE_KEY, JSON.stringify(s));
    return gold;
  }

  // Total XP → level, plus progress into the next one (for the ledger bars)
  function skillLevel(xp) {
    const { base, growth, cap } = ADV.xpCurve;
    let lvl = 1, need = base, rest = xp;
    while (lvl < cap && rest >= need) { rest -= need; need = Math.round(need * growth); lvl++; }
    return { lvl, into: rest, need: lvl >= cap ? 0 : need };
  }

  const skillBonusChance = (skillId) =>
    (skillLevel(state.adventure.skills[skillId]).lvl - 1) * ADV.perks.bonusYield;

  function grantXp(skillId, amount) {
    const a = state.adventure;
    const before = skillLevel(a.skills[skillId]).lvl;
    a.skills[skillId] += amount;
    const after = skillLevel(a.skills[skillId]).lvl;
    if (after > before) {
      advNotice(`${ADV.skills[skillId].label} LEVEL ${after}!`);
      sfx.fanfare();
    }
    saveAdventure();
  }

  function advNotice(text) {
    state.adventure.notices.push({ text, t: 0 });
  }

  function questProgress(res) {
    const a = state.adventure;
    a.daily = rollDailies(a.daily); // the UTC day can tick over mid-session
    for (const q of a.daily.quests) {
      if (q.res !== res || q.claimed) continue;
      q.progress++;
      if (q.progress >= q.target) {
        q.claimed = true;
        const g = ADV.daily.goals[q.res];
        const reward = Math.floor(q.target * ADV.daily.goldRewardRate[q.res]);
        a.gold += reward;
        advNotice(`DAILY DONE: ${g.label} — +${reward} GOLD`);
        sfx.fanfare();
        grantXp(g.skill, ADV.daily.xpReward);
      }
    }
  }

  function startAdventure() {
    state.campaign = null;
    state.adventure = loadAdventureSave();
    player = defaultPlayer();
    resetWorld();
    buildAdventureWorld();                 // sizes the world + builds land/bridge grids
    // Buildings first so decor/sheep scatter can steer clear of their footprints
    buildings = makeBuildings(ADV.world.buildings.map(b => ({
      type: b.type, x: b.tx * TILE + TILE / 2, y: b.ty * TILE + TILE / 2,
    })));
    // Build plots: occupied ones join the buildings list (collision + y-sort
    // for free); empty ones stay markers until the player starts a build.
    plotList = ADV.building.plots.map(pl => ({
      ...pl, x: pl.tx * TILE + TILE / 2, y: pl.ty * TILE + TILE / 2,
    }));
    for (const pl of plotList) {
      const rec = state.adventure.plots[pl.id];
      if (!rec) continue;
      spawnPlotBuilding(pl);
      if (!rec.done && Date.now() >= rec.finishAt) {
        rec.done = true;
        advNotice(`${buildOptionName(rec.type)} FINISHED WHILE YOU WERE AWAY!`);
        saveAdventure();
      }
    }
    npcList = ADV.world.npcs.map(n => ({
      ...n, x: n.tx * TILE + TILE / 2, y: n.ty * TILE + TILE / 2,
      animT: rand(0, 2), flip: Math.random() < 0.5,
    }));
    decors = makeAdventureDecors();        // nodes already flagged with hits/respawn
    const totalSheep = ADV.world.islands.reduce((s, i) => s + i.sheep, 0);
    state.sheepCap = totalSheep;
    for (let i = 0; i < totalSheep; i++) sheepList.push(makeAdventureSheep());
    player.x = ADV.world.spawn.tx * TILE + TILE / 2;
    player.y = ADV.world.spawn.ty * TILE + TILE / 2;
    state.adventure.region = regionAt(player.x, player.y);
    state.adventure.regionName = ADV.world.islands[state.adventure.region]?.name || '';
    state.adventure.regionT = 2.6;         // greet the spawn region
    // Re-scatter clouds across the larger world for even coverage
    clouds = [];
    for (let i = 0; i < 10; i++) {
      clouds.push({ sheet: pickRandom(CLOUD_SHEETS), x: rand(-300, W), y: rand(0, H - 250), spd: rand(5, 13) });
    }
    state.score = 0;
    state.mode = 'playing';
    setTouchAdventureButtons(true);
    joinIsles();
    setBgmTrack('adventure');
    updateCamera(0, true);
    runStartedAt = Date.now();
    // events.mode only allows survival/campaign; log the run without one until the DB migrates
    track('run_start');
  }

  function startCampaign() {
    state.adventure = null;
    setWorldSize(30, 19);          // reset from any prior adventure world
    state.campaign = { act: 0, wave: 0 };
    player = defaultPlayer();
    state.score = 0;
    setTouchAdventureButtons(false);
    leaveIsles();
    setBgmTrack('default');
    loadAct(0);
    runStartedAt = Date.now();
    track('run_start', { mode: 'campaign' });
  }

  function loadAct(i) {
    const act = ACTS[i];
    state.campaign.act = i;
    state.campaign.wave = 0;
    resetWorld();
    buildMapLayers(act.tiles);
    buildings = makeBuildings(act.buildings);
    decors = makeDecors(act.tiles === 'tiles3' ? 18 : 11);
    state.sheepCap = act.sheep;
    for (let s = 0; s < act.sheep; s++) sheepList.push(makeSheep());
    player.x = W / 2;
    player.y = H - 220;
    player.hp = player.maxHp;
    player.state = 'idle';
    updateCamera(0, true);
    state.actSnapshot = {
      dmg: player.dmg, maxHp: player.maxHp, speed: player.speed,
      atkDur: player.atkDur, score: state.score,
    };
    state.waveState = 'intermission';
    state.waveTimer = 2.5;
    beginDialog(act.intro, () => { state.mode = 'playing'; });
  }

  function retryAct() {
    const s = state.actSnapshot;
    player = defaultPlayer();
    player.dmg = s.dmg; player.maxHp = s.maxHp; player.hp = s.maxHp;
    player.speed = s.speed; player.atkDur = s.atkDur;
    state.score = s.score;
    loadAct(state.campaign.act);
  }

  function showBanner(eyebrow, title, sub, durMs, onDone) {
    const screen = document.getElementById('act-banner');
    screen.querySelector('.banner-eyebrow').textContent = eyebrow;
    screen.querySelector('.banner-title').textContent = title;
    screen.querySelector('.banner-sub').textContent = sub || '';
    // Restart CSS animations by toggling the wrap (re-flow forces a replay)
    screen.classList.add('hidden');
    void screen.offsetWidth;
    screen.classList.remove('hidden');
    setTimeout(() => {
      screen.classList.add('hidden');
      onDone && onDone();
    }, durMs);
  }

  function completeAct() {
    const c = state.campaign;
    state.score += 100;
    state.mode = 'transition';
    sfx.fanfare();
    // First clear of an act pays a one-time bounty into the kingdom stores
    const bounty = grantStoryBounty(`act${c.act}`, ADV.spoils.actBountyGold);
    const sub = `Score: ${state.score}` + (bounty ? ` · +${bounty} GOLD SENT HOME` : '');
    // 1) Victory beat for the act that just ended
    showBanner(`ACT ${c.act + 1} COMPLETE`, ACTS[c.act].title, sub, 2400, () => {
      // 2) Outro dialog, then either the next-act banner or final victory
      beginDialog(ACTS[c.act].outro, () => {
        if (c.act + 1 < ACTS.length) {
          const next = ACTS[c.act + 1];
          state.mode = 'transition';
          sfx.fanfare();
          showBanner(`ACT ${c.act + 2}`, next.title, 'Press on...', 2400, () => loadAct(c.act + 1));
        } else {
          victory();
        }
      });
    });
  }

  const HISCORE_KEY = 'tinySwordsHighScore';

  function saveBest() {
    const best = Number(localStorage.getItem(HISCORE_KEY) || 0);
    const isBest = state.score > best;
    if (isBest) localStorage.setItem(HISCORE_KEY, String(state.score));
    return isBest ? 'NEW BEST!' : `Best: ${Math.max(best, state.score)}`;
  }

  function victory() {
    state.mode = 'victory';
    document.getElementById('victory-stats').textContent = `Final score: ${state.score}`;
    document.getElementById('victory-best').textContent = saveBest();
    const bounty = grantStoryBounty('campaign', ADV.spoils.campaignBountyGold);
    document.getElementById('victory-spoils').textContent =
      bounty ? `THE KINGDOM CELEBRATES: +${bounty} GOLD` : '';
    submittedThisRun = false;
    prepareSubmitRow('menu-btn');
    track('run_end', {
      mode: 'campaign', score: state.score, wave: state.campaign.act + 1,
      duration_s: Math.round((Date.now() - runStartedAt) / 1000),
    });
    navigateTo('victory-screen');
  }

  function gameOver() {
    state.mode = 'gameover';
    // Reset the heading — the pause-exit path retitles it "Run Ended", and
    // returning via the isles no longer forces a page reload in between
    document.querySelector('#gameover-screen h1').textContent = 'Defeated!';
    document.getElementById('final-stats').textContent = state.campaign
      ? `Act ${state.campaign.act + 1}: ${ACTS[state.campaign.act].title} — Score ${state.score}`
      : `Wave ${state.wave} — Score ${state.score}`;
    document.getElementById('best-line').textContent = saveBest();
    // Survival banks war spoils for the kingdom; story pays per-act bounties
    // in completeAct() instead, so a story defeat sends nothing home
    let spoilsText = '';
    if (!state.campaign) {
      const waves = Math.max(0, state.waveState === 'intermission' ? state.wave : state.wave - 1);
      const g = waves * ADV.spoils.survivalGoldPerWave;
      const w = waves * ADV.spoils.survivalWoodPerWave;
      bankSpoils(g, w);
      if (g || w) spoilsText = `SPOILS SENT HOME: +${g} GOLD · +${w} WOOD`;
    }
    document.getElementById('spoils-line').textContent = spoilsText;
    document.getElementById('restart-btn').textContent = state.campaign ? 'RETRY ACT' : 'PLAY AGAIN';
    submittedThisRun = false;
    prepareSubmitRow('restart-btn');
    track('run_end', {
      mode: state.campaign ? 'campaign' : 'survival',
      score: state.score,
      wave: state.campaign ? state.campaign.act + 1 : state.wave,
      duration_s: Math.round((Date.now() - runStartedAt) / 1000),
    });
    navigateTo('gameover-screen');
  }

  // ---------- Dialog ----------
  function beginDialog(scenes, onDone) {
    if (!scenes || scenes.length === 0) { onDone(); return; }
    state.dialog = { scenes, i: 0, onDone };
    state.mode = 'dialog';
    renderDialogLine();
    document.getElementById('dialog-screen').classList.remove('hidden');
  }

  function renderDialogLine() {
    const { scenes, i } = state.dialog;
    // Campaign scenes reference a CHARS key; NPC talk passes {name,img} inline
    const raw = scenes[i].who;
    const who = typeof raw === 'string' ? CHARS[raw] : raw;
    document.getElementById('dlg-avatar').src = who.img;
    document.getElementById('dlg-name').textContent = who.name;
    document.getElementById('dlg-text').textContent = scenes[i].text;
    sfx.talk();
  }

  function advanceDialog() {
    const d = state.dialog;
    if (!d) return;
    d.i++;
    if (d.i < d.scenes.length) {
      renderDialogLine();
    } else {
      state.dialog = null;
      attackQueued = false;
      document.getElementById('dialog-screen').classList.add('hidden');
      d.onDone();
    }
  }

  // ---------- Waves ----------
  function survivalFaction() {
    return state.wave <= 3 ? 'red' : state.wave <= 6 ? 'purple' : 'black';
  }

  function currentWaveLabel() {
    const c = state.campaign;
    return c ? `WAVE ${c.wave}/${ACTS[c.act].waves.length}` : `WAVE ${state.wave}`;
  }

  function startNextWave() {
    const c = state.campaign;
    state.spawnQueue = [];
    if (c) {
      const spec = ACTS[c.act].waves[c.wave];
      c.wave++;
      for (const [type, n] of Object.entries(spec)) {
        for (let i = 0; i < n; i++) state.spawnQueue.push(type);
      }
    } else {
      state.wave++;
      const w = state.wave;
      const counts = {
        warrior: Math.min(1 + w, 8),
        archer: Math.min(Math.max(0, w - 1), 6),
        lancer: w >= 3 ? Math.min(Math.floor((w - 1) / 2), 4) : 0,
        monk: w >= 4 ? Math.min(Math.floor(w / 3), 3) : 0,
        // Goblins crash the party from wave 4
        torch: w >= 4 ? Math.min(w - 3, 4) : 0,
        tnt: w >= 5 ? Math.min(w - 4, 3) : 0,
        barrel: w >= 6 ? Math.min(Math.floor((w - 4) / 2), 2) : 0,
      };
      for (const [type, n] of Object.entries(counts)) {
        for (let i = 0; i < n; i++) state.spawnQueue.push(type);
      }
    }
    state.spawnQueue.sort(() => Math.random() - 0.5);
    state.waveState = 'spawning';
    state.spawnTimer = 0;
    sfx.wave();
  }

  function spawnPoint() {
    // Random spot on the island's edge ring, away from solid buildings
    for (let tries = 0; tries < 20; tries++) {
      const side = randInt(0, 3);
      let x, y;
      if (side === 0) { x = rand(BOUNDS.x0, BOUNDS.x1); y = BOUNDS.y0 + 20; }
      else if (side === 1) { x = rand(BOUNDS.x0, BOUNDS.x1); y = BOUNDS.y1 - 20; }
      else if (side === 2) { x = BOUNDS.x0 + 20; y = rand(BOUNDS.y0, BOUNDS.y1); }
      else { x = BOUNDS.x1 - 20; y = rand(BOUNDS.y0, BOUNDS.y1); }
      const p = { x, y };
      if (!buildings.some(b => dist(p, buildingCenter(b)) < BUILDING_DEFS[b.type].r + 30)) return p;
    }
    return { x: BOUNDS.x0 + 20, y: BOUNDS.y0 + 20 };
  }

  function spawnEnemy(type, at, factionOverride) {
    const p = at || spawnPoint();
    const faction = factionOverride ||
      (state.campaign ? ACTS[state.campaign.act].faction : survivalFaction());
    const wave = state.campaign ? state.campaign.wave : state.wave;
    const e = {
      type,
      faction,
      x: p.x, y: p.y,
      flip: false,
      scale: 1,
      state: 'idle',       // idle | run | attack/shoot/heal
      animT: 0,
      flashT: 0,
      actionT: 0,          // current attack/shoot/heal animation time
      didAct: false,
      cooldown: rand(0.3, 1),
    };
    if (type === 'warrior') {
      e.hp = 70;
      e.speed = Math.min(85 + wave * 6, 150);
      e.dmg = 12;
      // Cosmetic variety only: which idle pose this instance uses, and which
      // attack swing it favors — no effect on timing, damage, or hitboxes
      e.idleVariant = Math.random() < 0.5 ? 'idle' : 'guard';
      e.atkVariant = Math.random() < 0.5 ? '' : '2';
    } else if (type === 'archer') {
      e.hp = 40;
      e.speed = 85;
      e.dmg = 10;
    } else if (type === 'lancer') {
      e.hp = 110;
      e.speed = 72;
      e.dmg = 18;
      e.atkSheet = `${faction}_lancer_atk_r`;
      e.atkFlip = false;
    } else if (type === 'boss') {
      e.hp = 700;
      e.speed = 95;
      e.dmg = 25;
      e.scale = 1.45;
    } else if (type === 'torch') {
      e.hp = 50;
      e.speed = 135;
      e.dmg = 10;
      e.gColor = pickRandom(COSMETIC_COLORS);
      e.atkSheet = `goblin_torch_atk_r_${e.gColor}`;
      e.atkFlip = false;
    } else if (type === 'tnt') {
      e.hp = 45;
      e.speed = 85;
      e.dmg = 14;
      e.gColor = pickRandom(COSMETIC_COLORS);
    } else if (type === 'barrel') {
      e.hp = 60;
      e.speed = 115;
      e.dmg = 30;
      e.gColor = pickRandom(COSMETIC_COLORS);
    } else { // monk
      e.hp = 50;
      e.speed = 95;
      e.dmg = 0;
      e.healTarget = null;
    }
    e.maxHp = e.hp;
    enemies.push(e);
    addEffect('dust', p.x, p.y, 1.6);
  }

  // ---------- Effects & pickups ----------
  function addEffect(sheet, x, y, scale = 1, fps) {
    effects.push({ sheet, x, y, scale, t: 0, fps: fps || (sheet === 'explosion' ? 16 : 14) });
  }

  function dropItem(type, x, y) {
    pickups.push({ type, x, y, t: 0 });
  }

  function dropLoot(e) {
    const goldChance = (e.type === 'lancer' || e.type === 'monk' || e.type === 'boss') ? 1 : 0.5;
    if (Math.random() < goldChance) dropItem('gold', e.x + rand(-15, 15), e.y + rand(-15, 15));
    if (Math.random() < 0.25) dropItem('meat', e.x + rand(-15, 15), e.y + rand(-15, 15));
  }

  // ---------- Combat ----------
  const ENEMY_ATTACK_DUR = 4 / 10;
  const SHOOT_DUR = 8 / 10;
  const SHOOT_RELEASE_AT = 5 / 10;
  const LANCER_ATTACK_DUR = 3 / 8;
  const HEAL_DUR = 11 / 12;
  const HEAL_AT = 6 / 12;
  const TORCH_ATTACK_DUR = 6 / 12;
  const THROW_DUR = 7 / 10;
  const THROW_RELEASE_AT = 4 / 10;
  const FUSE_DUR = 0.45;

  function playerAttackHits() {
    const reach = { x: player.x + (player.flip ? -55 : 55), y: player.y };
    let killedSomething = false;
    let hitSomething = false;

    for (const e of enemies) {
      if (dist(reach, e) < 80 * e.scale) {
        e.hp -= player.dmg;
        e.flashT = 0.12;
        hitSomething = true;
        // Knockback away from player (heavy units barely budge)
        const kb = e.type === 'lancer' ? 10 : e.type === 'boss' ? 4 : 26;
        const d = Math.max(dist(player, e), 1);
        e.x += (e.x - player.x) / d * kb;
        e.y += (e.y - player.y) / d * kb;
        if (e.hp <= 0) killedSomething = true;
      }
    }
    for (const b of hostileBuildings()) {
      const def = BUILDING_DEFS[b.type];
      if (dist(reach, buildingCenter(b)) < def.r + 55) {
        b.hp -= player.dmg;
        b.flashT = 0.12;
        hitSomething = true;
        sfx.thud();
      }
    }
    for (const s of sheepList) {
      if (!s.dead && dist(reach, s) < 70) {
        s.dead = true;
        hitSomething = true;
        addEffect('dust', s.x, s.y, 1.4);
        dropItem('meat', s.x, s.y);
      }
    }
    if (hitSomething) sfx.hit();
    if (killedSomething) state.shakeT = 0.15;
  }

  function hurtPlayer(dmg) {
    if (player.hurtT > 0) return;
    player.hp -= dmg;
    player.hurtT = 0.6;
    state.shakeT = 0.25;
    sfx.hurt();
    if (player.hp <= 0) {
      player.hp = 0;
      addEffect('explosion', player.x, player.y, 1);
      sfx.boom();
      gameOver();
    }
  }

  // ---------- Update ----------
  function update(dt) {
    if (state.adventure) {
      // No combat systems in adventure — just the pawn, the flock, and the isles
      const a = state.adventure;
      updatePlayer(dt);
      updateSheep(dt);
      updatePickups(dt);
      updateEffects(dt);
      updateNodes(dt);
      updatePlots();
      sendPresencePos();
      updateGhosts(dt);
      for (const n of npcList) n.animT += dt;
      // Announce a new region when the pawn crosses onto a different island
      const reg = regionAt(player.x, player.y + 22);
      if (reg !== 255 && reg !== a.region) {
        a.region = reg;
        a.regionName = ADV.world.islands[reg].name;
        a.regionT = 2.6;
      }
      if (a.regionT > 0) a.regionT -= dt;
      if (a.introT > 0) a.introT -= dt;
      const notes = a.notices;
      for (let i = notes.length - 1; i >= 0; i--) {
        notes[i].t += dt;
        if (notes[i].t > 2.8) notes.splice(i, 1);
      }
      if (state.shakeT > 0) state.shakeT -= dt;
      return;
    }
    updatePlayer(dt);
    updateEnemies(dt);
    updateBuildings(dt);
    updateArrows(dt);
    updateBombs(dt);
    updateSheep(dt);
    updatePickups(dt);
    updateEffects(dt);
    updateWaves(dt);

    for (let i = corpses.length - 1; i >= 0; i--) {
      corpses[i].t += dt;
      if (corpses[i].t > 9) corpses.splice(i, 1);
    }

    if (state.shakeT > 0) state.shakeT -= dt;
  }

  // Solid scenery: collider offset from the decor anchor and radius (bushes stay walkable)
  const DECOR_SOLIDS = {
    tree:      { cy: -18, r: 34 },
    rock:      { cy: -16, r: 26 },
    goldstone: { cy: -30, r: 46 },
  };

  // How many art variants exist per decor kind (picked randomly at placement)
  const VARIANT_COUNT = { tree: 4, rock: 4, goldstone: 6, smalldeco: 15 };
  const CLOUD_SHEETS = ['cloud1', 'cloud2', 'cloud3', 'cloud4', 'cloud5', 'cloud6', 'cloud7', 'cloud8'];
  // Tree variants differ in frame height (3/4 are shorter trees) so the trunk
  // still anchors to the ground correctly; sheet name is 'tree' for variant 1.
  const TREE_VARIANTS = {
    1: { sheet: 'tree',  anchorY: 225 },
    2: { sheet: 'tree2', anchorY: 225 },
    3: { sheet: 'tree3', anchorY: 169 },
    4: { sheet: 'tree4', anchorY: 169 },
  };

  // Purely decorative rocks poking out of the water just outside a land rect
  // (island or the combat ISLE) — non-solid, never collided against.
  function scatterWaterRocks(list, rect, count) {
    for (let i = 0; i < count; i++) {
      const side = randInt(0, 3);
      let x, y;
      if (side === 0)      { x = rand(rect.x0 * TILE, (rect.x1 + 1) * TILE); y = rect.y0 * TILE - rand(20, 55); }
      else if (side === 1) { x = rand(rect.x0 * TILE, (rect.x1 + 1) * TILE); y = (rect.y1 + 1) * TILE + rand(20, 55); }
      else if (side === 2) { x = rect.x0 * TILE - rand(20, 55); y = rand(rect.y0 * TILE, (rect.y1 + 1) * TILE); }
      else                 { x = (rect.x1 + 1) * TILE + rand(20, 55); y = rand(rect.y0 * TILE, (rect.y1 + 1) * TILE); }
      list.push({ kind: 'waterrock', x, y, animT: rand(0, 2), variant: 1 });
    }
  }

  // Push an entity out of solid colliders (buildings and solid scenery)
  function pushOutOfSolids(ent) {
    for (const b of buildings) {
      const c = buildingCenter(b);
      const r = BUILDING_DEFS[b.type].r + 18;
      const d = dist(ent, c);
      if (d > 0 && d < r) {
        ent.x = c.x + (ent.x - c.x) / d * r;
        ent.y = c.y + (ent.y - c.y) / d * r;
      }
    }
    for (const dec of decors) {
      const s = DECOR_SOLIDS[dec.kind];
      if (!s || dec.harvested) continue; // harvested nodes are walkable until they regrow
      const c = { x: dec.x, y: dec.y + s.cy };
      const d = dist(ent, c);
      if (d > 0 && d < s.r) {
        ent.x = c.x + (ent.x - c.x) / d * s.r;
        ent.y = c.y + (ent.y - c.y) / d * s.r;
      }
    }
  }

  // ---------- Adventure harvesting ----------
  const nodeCenter = (d) => ({ x: d.x, y: d.y + (DECOR_SOLIDS[d.kind] ? DECOR_SOLIDS[d.kind].cy : 0) });

  // Nearest workable thing in reach: a live sheep or an unharvested tree/goldstone
  function findHarvestTarget() {
    let best = null, bestD = Infinity;
    for (const d of decors) {
      if (!ADV.nodes[d.kind] || d.harvested) continue;
      const dd = dist(player, nodeCenter(d));
      const range = (DECOR_SOLIDS[d.kind] ? DECOR_SOLIDS[d.kind].r : 0) + 55;
      if (dd < range && dd < bestD) { best = d; bestD = dd; }
    }
    for (const s of sheepList) {
      if (s.dead) continue;
      const dd = dist(player, s);
      if (dd < 75 && dd < bestD) { best = s; bestD = dd; }
    }
    return best;
  }

  // Nearest friendly NPC in talk range (checked before harvesting on Space)
  function findNpcTarget() {
    let best = null, bestD = Infinity;
    for (const n of npcList) {
      const dd = dist(player, n);
      if (dd < 70 && dd < bestD) { best = n; bestD = dd; }
    }
    return best;
  }

  function talkToNpc(npc) {
    player.flip = npc.x < player.x;
    // Role NPCs are the hub's doorways: the merchant opens her shop, the
    // gatekeepers offer a combat mode behind a confirm panel. First talk
    // clears the "!" discovery marker for good.
    if (npc.role) {
      if (!state.adventure.gatesSeen[npc.id]) {
        state.adventure.gatesSeen[npc.id] = true;
        saveAdventure();
      }
      if (npc.role === 'shop') openShop();
      else openGate(npc);
      return;
    }
    const who = { name: npc.name, img: npc.avatar };
    const a = state.adventure;
    const q = npc.quest;
    let text;
    if (q && a.npcQuests[npc.id]) {
      // Already turned in — quest line never shows again, just flavor
      text = pickRandom(npc.lines);
    } else if (q && a[q.res] >= q.amount) {
      // Player can complete it right now — auto turn-in on this talk
      a[q.res] -= q.amount;
      a.npcQuests[npc.id] = true;
      a.gold += q.rewardGold;
      grantXp(q.rewardXpSkill, q.rewardXp);
      advNotice(`${npc.name.toUpperCase()}: QUEST DONE — +${q.rewardGold} GOLD`);
      sfx.fanfare();
      saveAdventure();
      text = q.doneText;
    } else if (q) {
      text = `${q.askText} (${a[q.res]}/${q.amount} ${q.res})`;
    } else {
      text = pickRandom(npc.lines);
    }
    beginDialog([{ who, text }], () => { state.mode = 'playing'; });
  }

  function startHarvest() {
    const t = findHarvestTarget();
    if (!t) return;
    const p = player;
    p.tool = t.kind ? ADV.tools[t.kind] : ADV.tools.sheep;
    p.target = t;
    p.flip = t.x < p.x;
    p.state = 'interact';
    p.attackT = 0;
    p.didHit = false;
    // Higher skill = faster swings, up to the haste cap
    const skill = t.kind ? ADV.nodes[t.kind].skill : ADV.nodes.sheep.skill;
    const lvl = skillLevel(state.adventure.skills[skill]).lvl;
    const haste = Math.min((lvl - 1) * ADV.perks.swingHaste, ADV.perks.swingHasteMax);
    p.interactDur = ADV.interactDur[p.tool] * (1 - haste);
    p.animT = 0;
    sfx.swing();
  }

  // Small flat chance of a bonus gold "lucky find" on any harvest, independent
  // of the per-skill-level bonusYield roll — pure variable-reward flavor.
  function tryLuckyFind(x, y) {
    if (Math.random() >= ADV.luckyFind.chance) return;
    const amt = randInt(ADV.luckyFind.minGold, ADV.luckyFind.maxGold);
    for (let i = 0; i < amt; i += Math.ceil(amt / 3)) dropItem('gold', x + rand(-24, 24), y + rand(-10, 20));
    advNotice(`LUCKY FIND! +${amt} GOLD`);
    sfx.fanfare();
  }

  function applyHarvestHit(t) {
    if (!t) return;
    if (!t.kind) {
      // Sheep: one knife hit, whole yield at once (it may have wandered off)
      if (t.dead || dist(player, t) > 110) return;
      t.dead = true;
      addEffect('dust', t.x, t.y, 1.4);
      const flock = ADV.nodes.sheep;
      const bonusMeat = Math.random() < skillBonusChance(flock.skill) ? 1 : 0;
      for (let i = 0; i < flock.amount + bonusMeat; i++) {
        dropItem('meat', t.x + rand(-22, 22), t.y + rand(-14, 14));
      }
      grantXp(flock.skill, flock.xp);
      tryLuckyFind(t.x, t.y);
      sfx.hit();
      return;
    }
    if (t.harvested) return;
    const node = ADV.nodes[t.kind];
    const drops = 1 + (Math.random() < skillBonusChance(node.skill) ? 1 : 0);
    for (let i = 0; i < drops; i++) {
      dropItem(node.yield, t.x + rand(-30, 30), t.y + rand(6, 26));
    }
    grantXp(node.skill, node.xp);
    t.flashT = 0.12;
    t.hits--;
    sfx.thud();
    addEffect('dust', t.x, t.y - 20, 1.1);
    if (t.hits <= 0) {
      t.harvested = true;
      t.respawnT = node.respawn;
      addEffect('dust', t.x, t.y - 30, 1.8);
      state.shakeT = 0.12;
      tryLuckyFind(t.x, t.y - 10);
    }
  }

  function updateNodes(dt) {
    for (const d of decors) {
      if (d.flashT > 0) d.flashT -= dt;
      if (!d.harvested) continue;
      if (dist(player, d) < 90) continue; // never regrow on top of the player
      d.respawnT -= dt;
      if (d.respawnT <= 0) {
        d.harvested = false;
        d.hits = ADV.nodes[d.kind].hits;
        addEffect('dust', d.x, d.y - 20, 1.6);
      }
    }
  }

  function updatePlayer(dt) {
    const p = player;
    if (p.hurtT > 0) p.hurtT -= dt;

    // Adventure: work swing in progress
    if (p.state === 'interact') {
      p.attackT += dt;
      if (!p.didHit && p.attackT >= p.interactDur / 2) {
        p.didHit = true;
        applyHarvestHit(p.target);
      }
      if (p.attackT < p.interactDur) {
        attackQueued = false; // ignore mashing mid-swing
        return;
      }
      p.state = 'idle';
      p.target = null;
      if (keys.Space) attackQueued = true; // hold Space to keep working
    }

    if (p.state === 'attack') {
      p.attackT += dt;
      if (!p.didHit && p.attackT >= p.atkDur / 2) {
        p.didHit = true;
        playerAttackHits();
      }
      if (p.attackT >= p.atkDur) p.state = 'idle';
      attackQueued = false; // ignore mashing mid-swing
      return;
    }

    // Movement (keyboard + virtual joystick feed the same vector)
    let dx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + touchVec.x;
    let dy = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0) + touchVec.y;
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      const mvx = dx / len * p.speed * dt, mvy = dy / len * p.speed * dt;
      if (state.adventure) {
        // Feet must stay on land or a bridge; test each axis so you slide along coasts
        const foot = 22;
        if (walkableAt(p.x + mvx, p.y + foot)) p.x = clamp(p.x + mvx, 0, W);
        if (walkableAt(p.x, p.y + mvy + foot)) p.y = clamp(p.y + mvy, 0, H);
      } else {
        p.x = clamp(p.x + mvx, BOUNDS.x0, BOUNDS.x1);
        p.y = clamp(p.y + mvy, BOUNDS.y0, BOUNDS.y1);
      }
      if (dx) p.flip = dx < 0;
      p.state = 'run';
    } else {
      p.state = 'idle';
    }
    pushOutOfSolids(p);

    // Attack (combat modes) / work a nearby node (adventure)
    if (attackQueued) {
      attackQueued = false;
      if (state.adventure) {
        attackTowardMouse = false;
        const npc = findNpcTarget();
        const plot = npc ? null : findPlotTarget();
        if (npc) talkToNpc(npc);
        else if (plot) openBuildMenu(plot);
        else startHarvest(); // no workable target in reach = no swing
      } else {
        if (attackTowardMouse) {
          p.flip = mouseX < p.x;
          attackTowardMouse = false;
        }
        p.state = 'attack';
        p.attackT = 0;
        p.didHit = false;
        p.animT = 0;
        sfx.swing();
      }
    }

    p.animT += dt;
  }

  function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.flashT > 0) e.flashT -= dt;

      if (e.hp <= 0) {
        addEffect('explosion', e.x, e.y, e.scale > 1 ? 1.4 : (e.type === 'lancer' || e.type === 'barrel') ? 1.2 : 0.9);
        state.score += { warrior: 15, archer: 20, lancer: 30, monk: 25, boss: 150, torch: 15, tnt: 20, barrel: 25 }[e.type];
        if (!e.noCorpse) corpses.push({ x: e.x, y: e.y + 10, t: 0 });
        if (e.type === 'barrel' && dist(e, player) < 100) hurtPlayer(e.dmg); // barrels go out with a bang
        dropLoot(e);
        sfx.boom();
        if (e.type === 'boss') state.shakeT = 0.5;
        enemies.splice(i, 1);
        continue;
      }

      const d = dist(e, player);
      e.cooldown -= dt;
      e.animT += dt;

      if (e.type === 'warrior' || e.type === 'boss') {
        const reach = e.type === 'boss' ? 85 : 60;
        if (e.state === 'attack') {
          e.actionT += dt;
          if (!e.didAct && e.actionT >= ENEMY_ATTACK_DUR / 2) {
            e.didAct = true;
            if (d < reach + 25) hurtPlayer(e.dmg);
          }
          if (e.actionT >= ENEMY_ATTACK_DUR) {
            e.state = 'idle';
            e.cooldown = e.type === 'boss' ? 1.1 : 0.9;
          }
        } else if (d < reach && e.cooldown <= 0) {
          e.state = 'attack';
          e.actionT = 0;
          e.didAct = false;
          e.flip = player.x < e.x;
        } else if (d > reach - 10) {
          moveToward(e, player, e.speed, dt);
          e.state = 'run';
        } else {
          e.state = 'idle';
        }
      } else if (e.type === 'archer') {
        if (e.state === 'shoot') {
          e.actionT += dt;
          if (!e.didAct && e.actionT >= SHOOT_RELEASE_AT) {
            e.didAct = true;
            fireArrow(e.x, e.y - 20, e.dmg);
          }
          if (e.actionT >= SHOOT_DUR) {
            e.state = 'idle';
            e.cooldown = 1.6;
          }
        } else if (d < 180) {
          moveAway(e, player, e.speed, dt);
          e.state = 'run';
        } else if (d > 400) {
          moveToward(e, player, e.speed, dt);
          e.state = 'run';
        } else if (e.cooldown <= 0) {
          e.state = 'shoot';
          e.actionT = 0;
          e.didAct = false;
          e.flip = player.x < e.x;
        } else {
          e.state = 'idle';
          e.flip = player.x < e.x;
        }
      } else if (e.type === 'lancer') {
        if (e.state === 'attack') {
          e.actionT += dt;
          if (!e.didAct && e.actionT >= LANCER_ATTACK_DUR / 2) {
            e.didAct = true;
            // Lance hits a spot ahead of the lancer, along the thrust direction
            const tip = {
              x: e.x + Math.cos(e.atkAngle) * 90,
              y: e.y + Math.sin(e.atkAngle) * 90,
            };
            if (dist(tip, player) < 55 || d < 60) hurtPlayer(e.dmg);
          }
          if (e.actionT >= LANCER_ATTACK_DUR) {
            e.state = 'idle';
            e.cooldown = 1.4;
          }
        } else if (d < 95 && e.cooldown <= 0) {
          startLancerAttack(e);
        } else if (d > 85) {
          moveToward(e, player, e.speed, dt);
          e.state = 'run';
        } else {
          e.state = 'idle';
          e.flip = player.x < e.x;
        }
      } else if (e.type === 'torch') {
        if (e.state === 'attack') {
          e.actionT += dt;
          if (!e.didAct && e.actionT >= TORCH_ATTACK_DUR / 2) {
            e.didAct = true;
            if (d < 85) hurtPlayer(e.dmg);
          }
          if (e.actionT >= TORCH_ATTACK_DUR) {
            e.state = 'idle';
            e.cooldown = 0.8;
          }
        } else if (d < 60 && e.cooldown <= 0) {
          startTorchAttack(e);
        } else if (d > 50) {
          moveToward(e, player, e.speed, dt);
          e.state = 'run';
        } else {
          e.state = 'idle';
        }
      } else if (e.type === 'tnt') {
        if (e.state === 'throw') {
          e.actionT += dt;
          if (!e.didAct && e.actionT >= THROW_RELEASE_AT) {
            e.didAct = true;
            fireDynamite({ x: e.x, y: e.y - 20 }, { x: player.x, y: player.y }, e.dmg);
          }
          if (e.actionT >= THROW_DUR) {
            e.state = 'idle';
            e.cooldown = 2.2;
          }
        } else if (d < 200) {
          moveAway(e, player, e.speed, dt);
          e.state = 'run';
        } else if (d > 430) {
          moveToward(e, player, e.speed, dt);
          e.state = 'run';
        } else if (e.cooldown <= 0) {
          e.state = 'throw';
          e.actionT = 0;
          e.didAct = false;
          e.flip = player.x < e.x;
        } else {
          e.state = 'idle';
          e.flip = player.x < e.x;
        }
      } else if (e.type === 'barrel') {
        if (e.state === 'fuse') {
          e.actionT += dt;
          if (e.actionT >= FUSE_DUR) {
            e.noCorpse = true;
            e.hp = 0; // death handling renders the blast and deals the AoE damage
          }
        } else if (d < 60) {
          e.state = 'fuse';
          e.actionT = 0;
          sfx.swing(); // fuse hiss
        } else {
          moveToward(e, player, e.speed, dt);
          e.state = 'run';
        }
      } else { // monk: avoids the player, channels heals into wounded allies
        if (e.state === 'heal') {
          e.actionT += dt;
          if (!e.didAct && e.actionT >= HEAL_AT) {
            e.didAct = true;
            const t = e.healTarget;
            if (t && t.hp > 0 && dist(e, t) < 220) {
              t.hp = Math.min(t.maxHp, t.hp + 25);
              addEffect(`${e.faction}_monk_heal_fx`, t.x, t.y, 1, 12);
              sfx.heal();
            }
          }
          if (e.actionT >= HEAL_DUR) {
            e.state = 'idle';
            e.cooldown = 2.5;
          }
        } else {
          // Most wounded ally in range
          let target = null;
          for (const o of enemies) {
            if (o === e || o.hp <= 0 || o.hp >= o.maxHp) continue;
            if (dist(e, o) < 200 && (!target || o.hp / o.maxHp < target.hp / target.maxHp)) target = o;
          }
          if (target && e.cooldown <= 0) {
            e.state = 'heal';
            e.actionT = 0;
            e.didAct = false;
            e.healTarget = target;
            e.flip = target.x < e.x;
          } else if (d < 260) {
            moveAway(e, player, e.speed, dt);
            e.state = 'run';
          } else {
            // Drift toward the nearest ally so heals stay in range
            let ally = null, allyD = Infinity;
            for (const o of enemies) {
              if (o === e) continue;
              const dd = dist(e, o);
              if (dd < allyD) { ally = o; allyD = dd; }
            }
            if (ally && allyD > 130) {
              moveToward(e, ally, e.speed, dt);
              e.state = 'run';
            } else {
              e.state = 'idle';
              e.flip = player.x < e.x;
            }
          }
        }
      }

      // Gentle separation so enemies don't stack on one spot
      for (const o of enemies) {
        if (o === e) continue;
        const dd = dist(e, o);
        if (dd > 0 && dd < 40) {
          e.x += (e.x - o.x) / dd * 30 * dt;
          e.y += (e.y - o.y) / dd * 30 * dt;
        }
      }
      pushOutOfSolids(e);
      e.x = clamp(e.x, BOUNDS.x0, BOUNDS.x1);
      e.y = clamp(e.y, BOUNDS.y0, BOUNDS.y1);
    }
  }

  function updateBuildings(dt) {
    for (let i = buildings.length - 1; i >= 0; i--) {
      const b = buildings[i];
      const def = BUILDING_DEFS[b.type];
      if (b.flashT > 0) b.flashT -= dt;
      if (!def.hostile) continue;

      if (b.hp <= 0) {
        addEffect('explosion', b.x, b.y - 60, 1.3);
        addEffect('explosion', b.x + rand(-40, 40), b.y - 100, 1);
        addEffect('dust', b.x, b.y - 20, 2.2);
        state.score += def.score;
        dropItem('gold', b.x - 25, b.y + 20);
        dropItem('gold', b.x + 25, b.y + 20);
        sfx.boom();
        state.shakeT = 0.35;
        // Goblin structures leave a walkable ruin behind
        if (def.ruin) decors.push({ kind: 'ruin', sheet: def.ruin, x: b.x, y: b.y, animT: 0, variant: 1 });
        buildings.splice(i, 1);
        continue;
      }

      if (def.shoots) {
        b.shootT -= dt;
        if (b.shootT <= 0 && dist(buildingCenter(b), player) < 480) {
          fireArrow(b.x, b.y - 180, 10);
          b.shootT = 2.8;
        }
      }
      if (def.lobs) {
        b.shootT -= dt;
        if (b.shootT <= 0 && dist(buildingCenter(b), player) < 440) {
          fireDynamite({ x: b.x, y: b.y - 140 }, { x: player.x, y: player.y }, 14);
          b.shootT = 3.2;
        }
      }
      if (def.spawns) {
        b.spawnT -= dt;
        if (b.spawnT <= 0 && enemies.length < 10) {
          const type = def.spawns === 'mixed'
            ? pickRandom(['warrior', 'warrior', 'archer', 'lancer'])
            : def.spawns;
          spawnEnemy(type, { x: b.x + rand(-70, 70), y: b.y + rand(15, 45) }, b.faction);
          b.spawnT = def.spawnEvery;
        }
      }
    }
  }

  // Buckets an angle (degrees, 0=right/+90=down) into one of the 5 directional
  // sheet suffixes shared by lancer attack/defence art, plus whether to flip.
  // Shared by startLancerAttack (thrust direction) and the lancer idle pose.
  function angleBucket(deg) {
    const a = Math.abs(deg);
    if (a <= 22.5)    return { dir: 'r',  flip: false };
    if (a >= 157.5)   return { dir: 'r',  flip: true };
    if (deg > 112.5)  return { dir: 'dr', flip: true };
    if (deg > 67.5)   return { dir: 'd',  flip: false };
    if (deg > 22.5)   return { dir: 'dr', flip: false };
    if (deg < -112.5) return { dir: 'ur', flip: true };
    if (deg < -67.5)  return { dir: 'u',  flip: false };
    return { dir: 'ur', flip: false };
  }

  function startLancerAttack(e) {
    e.state = 'attack';
    e.actionT = 0;
    e.didAct = false;
    e.atkAngle = Math.atan2(player.y - e.y, player.x - e.x);
    const { dir, flip } = angleBucket(e.atkAngle * 180 / Math.PI);
    e.atkSheet = `${e.faction}_lancer_atk_${dir}`;
    e.atkFlip = flip;
    e.flip = e.atkFlip;
  }

  function startTorchAttack(e) {
    e.state = 'attack';
    e.actionT = 0;
    e.didAct = false;
    const deg = Math.atan2(player.y - e.y, player.x - e.x) * 180 / Math.PI;
    if (deg > 45 && deg < 135) {
      e.atkSheet = `goblin_torch_atk_d_${e.gColor}`;
      e.atkFlip = false;
    } else if (deg < -45 && deg > -135) {
      e.atkSheet = `goblin_torch_atk_u_${e.gColor}`;
      e.atkFlip = false;
    } else {
      e.atkSheet = `goblin_torch_atk_r_${e.gColor}`;
      e.atkFlip = Math.abs(deg) > 90;
    }
    e.flip = e.atkFlip;
  }

  function moveToward(e, target, speed, dt) {
    const d = Math.max(dist(e, target), 1);
    e.x += (target.x - e.x) / d * speed * dt;
    e.y += (target.y - e.y) / d * speed * dt;
    e.flip = target.x < e.x;
  }

  function moveAway(e, target, speed, dt) {
    const d = Math.max(dist(e, target), 1);
    e.x += (e.x - target.x) / d * speed * dt;
    e.y += (e.y - target.y) / d * speed * dt;
    e.flip = target.x < e.x;
  }

  function fireArrow(x, y, dmg) {
    const from = { x, y };
    const d = Math.max(dist(from, player), 1);
    const speed = 320;
    arrows.push({
      x, y,
      vx: (player.x - x) / d * speed,
      vy: (player.y - y) / d * speed,
      dmg,
    });
  }

  // Lobbed dynamite (TNT goblins and goblin wood towers)
  function fireDynamite(from, to, dmg) {
    const d = dist(from, to);
    bombs.push({
      x0: from.x, y0: from.y, x1: to.x, y1: to.y,
      x: from.x, y: from.y,
      t: 0,
      dur: clamp(d / 300, 0.55, 1.1),
      dmg,
    });
  }

  function updateBombs(dt) {
    for (let i = bombs.length - 1; i >= 0; i--) {
      const b = bombs[i];
      b.t += dt;
      const k = Math.min(b.t / b.dur, 1);
      b.x = b.x0 + (b.x1 - b.x0) * k;
      b.y = b.y0 + (b.y1 - b.y0) * k - Math.sin(Math.PI * k) * 90; // lob arc
      if (k >= 1) {
        addEffect('explosion', b.x1, b.y1, 1.05);
        if (dist({ x: b.x1, y: b.y1 }, player) < 85) hurtPlayer(b.dmg);
        sfx.boom();
        bombs.splice(i, 1);
      }
    }
  }

  function updateArrows(dt) {
    for (let i = arrows.length - 1; i >= 0; i--) {
      const a = arrows[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      if (dist(a, player) < 32) {
        hurtPlayer(a.dmg);
        arrows.splice(i, 1);
      } else if (a.x < 0 || a.x > W || a.y < 0 || a.y > H) {
        arrows.splice(i, 1);
      }
    }
  }

  function updateSheep(dt) {
    // Keep meat available: respawn sheep slowly up to the act's cap
    state.sheepTimer += dt;
    if (state.sheepTimer > 20 && sheepList.filter(s => !s.dead).length < state.sheepCap) {
      state.sheepTimer = 0;
      const s = state.adventure ? makeAdventureSheep() : makeSheep();
      sheepList.push(s);
      addEffect('dust', s.x, s.y, 1.4);
    }

    for (const s of sheepList) {
      if (s.dead) continue;
      s.animT += dt;
      s.thinkT -= dt;
      if (s.thinkT <= 0) {
        s.moving = Math.random() < 0.5;
        s.thinkT = rand(1, 3);
        if (s.moving) {
          const ang = rand(0, Math.PI * 2);
          s.vx = Math.cos(ang) * 40;
          s.vy = Math.sin(ang) * 40;
          s.flip = s.vx < 0;
        }
      }
      if (s.moving) {
        if (state.adventure) {
          // Bounce off water edges so sheep wander their island without drowning
          const nx = s.x + s.vx * dt, ny = s.y + s.vy * dt;
          if (walkableAt(nx, s.y + 12)) s.x = nx; else s.vx = -s.vx;
          if (walkableAt(s.x, ny + 12)) s.y = ny; else s.vy = -s.vy;
          s.flip = s.vx < 0;
        } else {
          s.x = clamp(s.x + s.vx * dt, BOUNDS.x0 + 40, BOUNDS.x1 - 40);
          s.y = clamp(s.y + s.vy * dt, BOUNDS.y0 + 40, BOUNDS.y1 - 40);
        }
        pushOutOfSolids(s);
      }
    }
  }

  function updatePickups(dt) {
    for (let i = pickups.length - 1; i >= 0; i--) {
      const m = pickups[i];
      m.t += dt;
      if (dist(m, player) < 45) {
        if (state.adventure) {
          // Resources feed the kingdom stores instead of score/heal
          state.adventure[m.type]++;
          questProgress(m.type);
          saveAdventure();
          (m.type === 'gold' ? sfx.coin : m.type === 'meat' ? sfx.meat : sfx.pick)();
        } else if (m.type === 'meat') {
          player.hp = Math.min(player.maxHp, player.hp + 25);
          state.score += 5;
          sfx.meat();
        } else {
          state.score += 10;
          sfx.coin();
        }
        pickups.splice(i, 1);
      }
    }
  }

  function updateEffects(dt) {
    for (let i = effects.length - 1; i >= 0; i--) {
      const fx = effects[i];
      fx.t += dt;
      if (fx.t * fx.fps >= SHEETS[fx.sheet].frames) effects.splice(i, 1);
    }
  }

  function updateWaves(dt) {
    if (state.waveState === 'intermission') {
      state.waveTimer -= dt;
      if (state.waveTimer <= 0) startNextWave();
    } else if (state.waveState === 'spawning') {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0 && state.spawnQueue.length > 0) {
        spawnEnemy(state.spawnQueue.shift());
        state.spawnTimer = 0.4;
      }
      if (state.spawnQueue.length === 0) state.waveState = 'active';
    } else if (state.waveState === 'active') {
      if (enemies.length === 0) {
        const c = state.campaign;
        if (c && c.wave >= ACTS[c.act].waves.length) {
          // Last wave of the act done — siege any remaining buildings, or finish
          if (hostileBuildings().length > 0) {
            state.waveState = 'siege';
          } else {
            completeAct();
          }
        } else {
          state.score += 50;
          state.waveState = 'intermission';
          state.waveTimer = 3.5;
          sfx.wave();
          offerUpgrades();
        }
      }
    } else if (state.waveState === 'siege') {
      if (hostileBuildings().length === 0 && enemies.length === 0) completeAct();
    }
  }

  // ---------- Pause ----------
  function playerStatsText() {
    // Show "base +delta" when upgrades raise a stat above its starting value.
    // Base values match defaultPlayer() so any upgrade picks become visible.
    const fmt = (cur, base, decimals = 0, unit = '') => {
      const c = decimals ? Number(cur.toFixed(decimals)) : Math.round(cur);
      const delta = Number((c - base).toFixed(decimals));
      const f = (n) => decimals > 0 ? n.toFixed(decimals) : String(n);
      return delta > 0
        ? `${f(base)}${unit} <span class="stat-up">+${f(delta)}${unit}</span>`
        : `${f(c)}${unit}`;
    };
    return [
      ['MAX HP',       fmt(player.maxHp, 100)],
      ['DAMAGE',       fmt(player.dmg, 35)],
      ['MOVE SPEED',   fmt(player.speed, 230)],
      ['ATTACK SPEED', fmt(1 / player.atkDur, 3.0, 1, '/s')],
    ];
  }

  function togglePause() {
    const screen = document.getElementById('pause-screen');
    if (state.mode === 'playing') {
      state.mode = 'paused';
      const grid = document.getElementById('pause-stats');
      const a = state.adventure;
      const rows = a
        ? [['WOOD', String(a.wood)], ['GOLD', String(a.gold)], ['MEAT', String(a.meat)]]
        : playerStatsText();
      // playerStatsText() returns trusted HTML (it builds the .stat-up span itself)
      grid.innerHTML = rows
        .map(([k, v]) => `<span class="stat-key">${k}</span><span class="stat-val">${v}</span>`)
        .join('');
      screen.classList.remove('hidden');
    } else if (state.mode === 'paused') {
      state.mode = 'playing';
      attackQueued = false;
      screen.classList.add('hidden');
    }
  }

  // ---------- Adventure ledger (key I): stores, skills, dailies ----------
  // All values are our own trusted numbers/labels, so innerHTML is safe here.
  function renderLedger() {
    const a = state.adventure;
    document.getElementById('ledger-stores').innerHTML =
      [['wood', 'WOOD'], ['gold', 'GOLD'], ['meat', 'MEAT']]
        .map(([res, label]) =>
          `<div class="ledger-row"><img src="assets/${res}.png" alt="" />` +
          `<span class="ledger-label">${label}</span><span class="ledger-val">${a[res]}</span></div>`)
        .join('');
    document.getElementById('ledger-skills').innerHTML =
      Object.entries(ADV.skills).map(([id, s]) => {
        const { lvl, into, need } = skillLevel(a.skills[id]);
        const pct = need ? Math.round((into / need) * 100) : 100;
        return `<div class="ledger-row"><span class="ledger-label">${s.label}</span>` +
          `<span class="ledger-val">LV ${lvl}</span></div>` +
          `<div class="skill-bar"><div class="skill-fill" style="width:${pct}%"></div></div>`;
      }).join('');
    document.getElementById('ledger-date').textContent = `RESETS AT UTC MIDNIGHT · ${a.daily.date}`;
    document.getElementById('ledger-quests').innerHTML =
      a.daily.quests.map((q) => {
        const g = ADV.daily.goals[q.res];
        const reward = Math.floor(q.target * ADV.daily.goldRewardRate[q.res]);
        const status = q.claimed ? 'DONE &#10003;' : `${q.progress}/${q.target}`;
        return `<div class="ledger-row quest-row${q.claimed ? ' quest-done' : ''}">` +
          `<span class="ledger-label">${g.label} ${q.target}</span>` +
          `<span class="ledger-val">${status}</span></div>` +
          `<p class="quest-reward">+${reward} GOLD · +${ADV.daily.xpReward} XP</p>`;
      }).join('');
  }

  // Merchant Marla's shop screen — opened by talking to her in the world
  // (the skin stock used to live in the ledger; same rows, same delegation)
  function renderShop() {
    const a = state.adventure;
    document.getElementById('ledger-shop').innerHTML =
      ADV.cosmetics.skins.map((skin) => {
        if (skin.crest && !tokenEnabled) return ''; // hidden until $FADOM is configured
        const owned = a.cosmetics.owned.includes(skin.id);
        const equipped = a.cosmetics.equipped === skin.id;
        let action;
        if (equipped) {
          action = '<span class="ledger-val">EQUIPPED</span>';
        } else if (skin.crest) {
          // Not for sale — proof of holding is the price
          action = (session && session.user.crest)
            ? `<button class="btn btn-tiny" data-equip-skin="${skin.id}">EQUIP</button>`
            : '<span class="ledger-val crest-lock">&#9819; HOLDERS ONLY</span>';
        } else if (owned) {
          action = `<button class="btn btn-tiny" data-equip-skin="${skin.id}">EQUIP</button>`;
        } else {
          action = `<button class="btn btn-tiny" data-buy-skin="${skin.id}"${a.gold < skin.cost ? ' disabled' : ''}>BUY ${skin.cost}g</button>`;
        }
        return `<div class="ledger-row"><span class="ledger-label">${skin.name}</span>${action}</div>`;
      }).join('');
    document.getElementById('shop-funds').textContent = `YOUR GOLD: ${a.gold}`;
  }

  // Event delegation: one listener handles every BUY/EQUIP button, including
  // ones added by future re-renders (innerHTML swaps the nodes each time).
  function handleShopClick(e) {
    const buyId = e.target.dataset.buySkin;
    const equipId = e.target.dataset.equipSkin;
    const a = state.adventure;
    if (buyId) {
      const skin = ADV.cosmetics.skins.find(s => s.id === buyId);
      if (!skin || a.gold < skin.cost || a.cosmetics.owned.includes(buyId)) return;
      a.gold -= skin.cost;
      a.cosmetics.owned.push(buyId);
      a.cosmetics.equipped = buyId;
      sfx.coin();
      saveAdventure();
      renderShop();
    } else if (equipId) {
      const skin = ADV.cosmetics.skins.find(s => s.id === equipId);
      if (skin && skin.crest && !(session && session.user.crest)) return;
      a.cosmetics.equipped = equipId;
      sfx.pick();
      saveAdventure();
      renderShop();
    }
  }

  function toggleLedger() {
    const screen = document.getElementById('ledger-screen');
    if (state.mode === 'playing') {
      state.adventure.daily = rollDailies(state.adventure.daily); // UTC day may have flipped
      state.mode = 'ledger';
      renderLedger();
      screen.classList.remove('hidden');
    } else if (state.mode === 'ledger') {
      state.mode = 'playing';
      attackQueued = false;
      screen.classList.add('hidden');
    }
  }

  // ---------- Spinner wheel (key O): free daily spin + paid spin ----------
  function spinnerFreeReady() {
    return Date.now() - state.adventure.spinnerLastFree >= ADV.spinner.freeCooldownHours * 3600 * 1000;
  }

  // Weighted random pick: each prize's `weight` is its share of the total
  function pickSpinnerPrize() {
    const prizes = ADV.spinner.prizes;
    const total = prizes.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * total;
    for (const p of prizes) {
      if (r < p.weight) return p;
      r -= p.weight;
    }
    return prizes[prizes.length - 1];
  }

  // Refreshes button labels/availability only — never touches wheel-result,
  // so it's safe to call right after a spin reveals its prize text.
  function renderSpinner() {
    const a = state.adventure;
    const ready = spinnerFreeReady();
    const freeBtn = document.getElementById('wheel-free-btn');
    freeBtn.disabled = !ready;
    if (ready) {
      freeBtn.textContent = 'FREE SPIN';
    } else {
      const ms = ADV.spinner.freeCooldownHours * 3600 * 1000 - (Date.now() - a.spinnerLastFree);
      const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
      freeBtn.textContent = `NEXT FREE ${h}H ${m}M`;
    }
    document.getElementById('wheel-paid-cost').textContent = ADV.spinner.paidCostGold;
    document.getElementById('wheel-paid-btn').disabled = a.gold < ADV.spinner.paidCostGold;
  }

  function toggleSpinner() {
    const screen = document.getElementById('spinner-screen');
    if (state.mode === 'playing') {
      state.mode = 'spinner';
      document.getElementById('wheel-result').innerHTML = '&nbsp;'; // clear any stale result from last time
      renderSpinner();
      screen.classList.remove('hidden');
    } else if (state.mode === 'spinner') {
      state.mode = 'playing';
      attackQueued = false;
      screen.classList.add('hidden');
    }
  }

  function spinWheel(free) {
    const a = state.adventure;
    if (free && !spinnerFreeReady()) return;
    if (!free && a.gold < ADV.spinner.paidCostGold) return;
    document.getElementById('wheel-free-btn').disabled = true;
    document.getElementById('wheel-paid-btn').disabled = true;
    document.getElementById('wheel-result').textContent = 'SPINNING...';
    if (free) a.spinnerLastFree = Date.now();
    else a.gold -= ADV.spinner.paidCostGold;
    saveAdventure();

    const prize = pickSpinnerPrize();
    const disc = document.getElementById('wheel-disc');
    // The wheel spin is decorative flourish only — the prize was already
    // picked above by weight, not by where the disc visually stops.
    const prevAngle = parseFloat(disc.dataset.angle || '0');
    const nextAngle = prevAngle + 1440 + rand(0, 360);
    disc.dataset.angle = nextAngle;
    disc.style.transform = `rotate(${nextAngle}deg)`;
    sfx.wave();

    setTimeout(() => {
      const amt = randInt(prize.min, prize.max);
      a[prize.res] += amt;
      for (let i = 0; i < amt; i++) questProgress(prize.res);
      saveAdventure();
      document.getElementById('wheel-result').textContent = `+${amt} ${prize.res.toUpperCase()}!`;
      sfx.coin();
      renderSpinner();
    }, 2200);
  }

  // ---------- Player building (adventure plots) ----------
  let activePlot = null;   // plot whose build menu is open

  const buildOptionName = (type) =>
    (ADV.building.options.find(o => o.type === type) || { name: 'BUILDING' }).name;

  // Nearest empty plot in interact range (occupied plots are just buildings)
  function findPlotTarget() {
    let best = null, bestD = Infinity;
    for (const pl of plotList) {
      if (state.adventure.plots[pl.id]) continue;
      const dd = dist(player, pl);
      if (dd < 85 && dd < bestD) { best = pl; bestD = dd; }
    }
    return best;
  }

  // Push a saved plot's structure into the buildings list so collision,
  // y-sorting, and drawing all come for free. Scaffold vs finished is just
  // a sheet swap keyed off `construction`.
  function spawnPlotBuilding(pl) {
    const rec = state.adventure.plots[pl.id];
    const b = makeBuildings([{ type: rec.type, faction: rec.color, x: pl.x, y: pl.y }])[0];
    b.plotId = pl.id;
    b.construction = Date.now() < rec.finishAt;
    buildings.push(b);
    return b;
  }

  // Real-time completion check (runs in the adventure update loop)
  function updatePlots() {
    const a = state.adventure;
    for (const b of buildings) {
      if (!b.construction || !b.plotId) continue;
      const rec = a.plots[b.plotId];
      if (!rec || Date.now() < rec.finishAt) continue;
      b.construction = false;
      rec.done = true;
      saveAdventure();
      addEffect('dust', b.x, b.y - 40, 2);
      state.shakeT = 0.15;
      advNotice(`${buildOptionName(b.type)} COMPLETE!`);
      sfx.fanfare();
    }
  }

  function renderBuildMenu() {
    const a = state.adventure;
    document.getElementById('build-options').innerHTML = ADV.building.options.map((o) => {
      const afford = a.wood >= o.wood && a.gold >= o.gold;
      // Whole minutes read as MIN; anything else (e.g. 90s) stays in seconds
      const time = o.buildSecs >= 60 && o.buildSecs % 60 === 0
        ? `${o.buildSecs / 60} MIN` : `${o.buildSecs} SEC`;
      return `<button class="btn upgrade-btn" data-build-type="${o.type}"${afford ? '' : ' disabled'}>` +
        `<span class="up-name">${o.name}</span>` +
        `<span class="up-desc">${o.wood} WOOD + ${o.gold} GOLD<br>BUILDS IN ${time}</span></button>`;
    }).join('');
    document.getElementById('build-funds').textContent = `STORES: ${a.wood} WOOD · ${a.gold} GOLD`;
  }

  function openBuildMenu(pl) {
    activePlot = pl;
    player.flip = pl.x < player.x;
    state.mode = 'build';
    renderBuildMenu();
    document.getElementById('build-screen').classList.remove('hidden');
  }

  function closeBuildMenu() {
    activePlot = null;
    state.mode = 'playing';
    attackQueued = false;
    document.getElementById('build-screen').classList.add('hidden');
  }

  function chooseBuild(type) {
    const a = state.adventure;
    const opt = ADV.building.options.find(o => o.type === type);
    if (!opt || !activePlot || a.plots[activePlot.id]) return;
    if (a.wood < opt.wood || a.gold < opt.gold) return;
    a.wood -= opt.wood;
    a.gold -= opt.gold;
    const skin = a.cosmetics.equipped;
    const now = Date.now();
    a.plots[activePlot.id] = {
      type,
      // Colors follow the equipped pawn skin; SHADOWED has no matching
      // building sheet so it falls back to the default blue.
      color: COSMETIC_COLORS.includes(skin) ? skin : 'blue',
      startAt: now,
      finishAt: now + opt.buildSecs * 1000,
      done: false,
    };
    saveAdventure();
    spawnPlotBuilding(activePlot);
    advNotice(`CONSTRUCTION STARTED: ${opt.name}`);
    sfx.thud();
    closeBuildMenu();
  }

  // Event delegation — clicks land on the inner name/desc spans, so resolve
  // up to the option button first.
  function handleBuildClick(e) {
    const btn = e.target.closest('[data-build-type]');
    if (!btn || btn.disabled) return;
    chooseBuild(btn.dataset.buildType);
  }

  // ---------- Mode gates + shop (Adventure is the hub world) ----------
  // Story and Survival are entered by talking to gatekeeper NPCs in the world;
  // the confirm panel keeps a mis-tap from yanking the player out of the isles.
  let activeGate = null;

  function openGate(npc) {
    activeGate = npc;
    state.mode = 'gate';
    document.getElementById('gate-avatar').src = npc.avatar;
    document.getElementById('gate-title').textContent = npc.gateTitle;
    document.getElementById('gate-name').textContent = npc.name.toUpperCase();
    document.getElementById('gate-text').textContent = npc.gateText;
    document.getElementById('gate-go').textContent = npc.gateConfirm;
    document.getElementById('gate-screen').classList.remove('hidden');
  }

  function closeGate() {
    activeGate = null;
    state.mode = 'playing';
    attackQueued = false;
    document.getElementById('gate-screen').classList.add('hidden');
  }

  function confirmGate() {
    if (!activeGate) return;
    const role = activeGate.role;
    activeGate = null;
    document.getElementById('gate-screen').classList.add('hidden');
    saveAdventure();   // stores are safe at home before the fighting starts
    if (role === 'survival') startSurvival();
    else startCampaign();
  }

  function openShop() {
    state.mode = 'shop';
    renderShop();
    document.getElementById('shop-screen').classList.remove('hidden');
  }

  function closeShop() {
    state.mode = 'playing';
    attackQueued = false;
    document.getElementById('shop-screen').classList.add('hidden');
  }

  // Every combat run now starts from the isles, so the end screens always
  // offer the way back. Fully rebuilds the adventure world from the save.
  function returnToIsles() {
    exitingFromPause = false;
    navigateTo(null);
    startAdventure();
  }

  // ---------- Upgrades ----------
  const UPGRADES = [
    { id: 'dmg',    name: 'Sharper Blade', desc: '+10 damage' },
    { id: 'hp',     name: 'Tougher Armor', desc: '+25 max HP' },
    { id: 'speed',  name: 'Swift Boots',   desc: '+12% move speed' },
    { id: 'atkspd', name: 'Quick Swing',   desc: '+20% attack speed' },
    { id: 'feast',  name: 'Feast',         desc: 'Heal to full' },
  ];

  // Every stat upgrade used to compound with no ceiling — a long Survival
  // run stacking Swift Boots made movement so fast it got HARDER to play
  // (overshooting dodges, no fine control), and stacked Quick Swing pushed
  // attack duration toward zero. Caps keep each stat meaningful for a
  // handful of picks, then flatten out instead of spiraling.
  const UPGRADE_CAPS = {
    speed: BASE_SPEED * 1.6,     // fast, but still controllable
    atkDur: BASE_ATK_DUR * 0.4,  // 2.5x attack speed ceiling
    dmg: 125,
    hp: 250,
  };

  function isUpgradeMaxed(id) {
    if (id === 'dmg') return player.dmg >= UPGRADE_CAPS.dmg;
    if (id === 'hp') return player.maxHp >= UPGRADE_CAPS.hp;
    if (id === 'speed') return player.speed >= UPGRADE_CAPS.speed;
    if (id === 'atkspd') return player.atkDur <= UPGRADE_CAPS.atkDur;
    return false; // feast has nothing to max out
  }

  function offerUpgrades() {
    // Skip maxed-out picks so a long run doesn't keep offering dead
    // choices; only pad them back in if too few live ones remain (applyUpgrade
    // clamps, so an already-maxed pick offered as a last resort is a
    // harmless no-op, not a broken button).
    const live = UPGRADES.filter(u => !isUpgradeMaxed(u.id)).sort(() => Math.random() - 0.5);
    const capped = UPGRADES.filter(u => isUpgradeMaxed(u.id)).sort(() => Math.random() - 0.5);
    const pool = [...live, ...capped].slice(0, 3);
    state.mode = 'upgrade';
    document.getElementById('upgrade-stats').innerHTML =
      playerStatsText().map(([k, v]) => `${k} ${v}`).join('  &middot;  ');
    pool.forEach((up, i) => {
      const maxed = isUpgradeMaxed(up.id);
      const btn = document.getElementById(`up-${i}`);
      btn.querySelector('.up-name').textContent = up.name + (maxed ? ' (MAX)' : '');
      btn.querySelector('.up-desc').textContent = maxed ? 'Already maxed' : up.desc;
      btn.dataset.upgradeId = up.id;
    });
    document.getElementById('upgrade-screen').classList.remove('hidden');
  }

  function applyUpgrade(id) {
    if (id === 'dmg') {
      player.dmg = Math.min(player.dmg + 10, UPGRADE_CAPS.dmg);
    } else if (id === 'hp') {
      const newMax = Math.min(player.maxHp + 25, UPGRADE_CAPS.hp);
      player.hp += newMax - player.maxHp; // grant only the actual delta
      player.maxHp = newMax;
    } else if (id === 'speed') {
      player.speed = Math.min(player.speed * 1.12, UPGRADE_CAPS.speed);
    } else if (id === 'atkspd') {
      player.atkDur = Math.max(player.atkDur * 0.8, UPGRADE_CAPS.atkDur);
    } else if (id === 'feast') {
      player.hp = player.maxHp;
    }
    sfx.pick();
    attackQueued = false;
    document.getElementById('upgrade-screen').classList.add('hidden');
    state.mode = 'playing';
  }

  // ---------- Render ----------
  function render() {
    ctx.save();
    const shakeX = state.shakeT > 0 ? rand(-5, 5) : 0;
    const shakeY = state.shakeT > 0 ? rand(-5, 5) : 0;
    ctx.translate(Math.round(-cam.x + shakeX), Math.round(-cam.y + shakeY));

    // Water, foam, grass
    ctx.drawImage(waterLayer, 0, 0);
    const foamFrame = animFrame('foam', state.time, 10);
    for (const f of foamTiles) {
      drawFrame('foam', foamFrame, f.x + TILE / 2, f.y + TILE / 2);
    }
    ctx.drawImage(grassLayer, 0, 0);

    // Flat ground props (bones, mushrooms, pumpkins...) always render under units
    for (const d of decors) {
      if (d.kind === 'smalldeco') drawDecor(d);
    }

    // Empty build plots sit flat on the ground, under everything that walks
    if (state.adventure) drawPlots();

    // Skull corpses lie flat on the ground; they fade out before despawning
    for (const c of corpses) {
      const frame = Math.min(Math.floor(c.t * 12), SHEETS.dead.frames - 1);
      ctx.globalAlpha = c.t > 6 ? Math.max(0, 1 - (c.t - 6) / 3) : 1;
      drawFrame('dead', frame, c.x, c.y);
    }
    ctx.globalAlpha = 1;

    // Pickups sit on the ground, under everything that walks
    for (const m of pickups) {
      const bob = Math.sin(m.t * 4) * 4;
      if (m.type === 'meat') {
        ctx.drawImage(img.meat, m.x - 32, m.y - 32 + bob);
      } else if (m.type === 'wood') {
        ctx.drawImage(img.wood, m.x - 28, m.y - 28 + bob, 56, 56);
      } else {
        ctx.drawImage(img.gold, m.x - 32, m.y - 32 + bob, 64, 64);
      }
    }

    // Y-sorted world objects (flat small props were already drawn on the ground)
    const drawList = [];
    for (const d of decors) {
      if (d.kind !== 'smalldeco') drawList.push({ y: d.y, draw: () => drawDecor(d) });
    }
    for (const b of buildings) drawList.push({ y: b.y, draw: () => drawBuilding(b) });
    for (const n of npcList) drawList.push({ y: n.y, draw: () => drawNpc(n) });
    if (state.adventure) {
      for (const g of ghosts.values()) drawList.push({ y: g.y, draw: () => drawGhost(g) });
    }
    for (const s of sheepList) if (!s.dead) drawList.push({ y: s.y, draw: () => drawSheep(s) });
    for (const e of enemies) drawList.push({ y: e.y, draw: () => drawEnemy(e) });
    if (state.mode !== 'gameover') drawList.push({ y: player.y, draw: drawPlayer });
    drawList.sort((a, b) => a.y - b.y);
    for (const item of drawList) item.draw();

    // Arrows fly above units
    for (const a of arrows) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(Math.atan2(a.vy, a.vx));
      ctx.drawImage(img.arrow, -32, -32);
      ctx.restore();
    }

    // Lobbed dynamite spins through the air
    for (const b of bombs) {
      drawFrame('dynamite', animFrame('dynamite', b.t, 14), b.x, b.y);
    }

    // Effects on top
    for (const fx of effects) {
      const frame = Math.min(Math.floor(fx.t * fx.fps), SHEETS[fx.sheet].frames - 1);
      drawFrame(fx.sheet, frame, fx.x, fx.y, false, fx.scale);
    }

    // Drifting clouds above the world
    ctx.globalAlpha = 0.45;
    for (const c of clouds) {
      ctx.drawImage(img[c.sheet], c.x, c.y);
    }
    ctx.globalAlpha = 1;

    ctx.restore();
    renderUI();
  }

  function drawDecor(d) {
    if (d.kind === 'tree') {
      const tv = TREE_VARIANTS[d.variant] || TREE_VARIANTS[1];
      if (d.harvested) {
        const sv = d.stumpVariant && d.stumpVariant > 1 ? `stump${d.stumpVariant}` : 'stump';
        ctx.drawImage(img[sv], d.x - 96, d.y - 225);
        return;
      }
      if (d.flashT > 0) ctx.filter = 'brightness(2.2)';
      drawFrame(tv.sheet, animFrame(tv.sheet, state.time + d.animT, 8), d.x, d.y, false, 1, 96, tv.anchorY);
      ctx.filter = 'none';
    } else if (d.kind === 'bush') {
      drawFrame('bush', animFrame('bush', state.time + d.animT, 6), d.x, d.y, false, 1, 64, 95);
    } else if (d.kind === 'rock') {
      ctx.drawImage(img[`rock${d.variant}`], d.x - 32, d.y - 50);
    } else if (d.kind === 'waterrock') {
      drawFrame('waterrock', animFrame('waterrock', state.time + d.animT, 6), d.x, d.y);
    } else if (d.kind === 'smalldeco') {
      const im = img[`deco_${String(d.variant).padStart(2, '0')}`];
      ctx.drawImage(im, d.x - im.width / 2, d.y - im.height + 14);
    } else if (d.kind === 'ruin') {
      const im = img[d.sheet];
      ctx.drawImage(im, d.x - im.width / 2, d.y - 182);
    } else {
      if (d.harvested) return; // mined out — nothing to draw until it regrows
      const gv = d.variant && d.variant > 1 ? `goldstone${d.variant}` : 'goldstone';
      if (d.flashT > 0) ctx.filter = 'brightness(2.2)';
      ctx.drawImage(img[gv], d.x - 64, d.y - 95);
      ctx.filter = 'none';
    }
  }

  function drawBuilding(b) {
    const def = BUILDING_DEFS[b.type];
    const sheet = buildingSheet(b);
    if (b.flashT > 0) ctx.filter = 'brightness(2.2)';
    if (def.animFps) {
      drawFrame(sheet, animFrame(sheet, state.time, def.animFps), b.x, b.y, false, 1, SHEETS[sheet].frameW / 2, def.anchorY);
    } else {
      const im = img[sheet];
      ctx.drawImage(im, b.x - im.width / 2, b.y - def.anchorY);
    }
    ctx.filter = 'none';

    if (b.burning) {
      const t = state.time;
      drawFrame('fire', animFrame('fire', t, 10), b.x - 24, b.y - 120, false, 1.8);
      drawFrame('fire', animFrame('fire', t + 0.6, 10), b.x + 22, b.y - 90, false, 1.4);
    }

    // Player builds: progress bar over the scaffold until the timer runs out
    if (b.construction && state.adventure) {
      const rec = state.adventure.plots[b.plotId];
      if (rec) {
        const frac = clamp((Date.now() - rec.startAt) / Math.max(1, rec.finishAt - rec.startAt), 0, 1);
        const bw = 90, bh = 8;
        const bx = b.x - bw / 2, by = b.y - def.anchorY - 14;
        ctx.fillStyle = '#3a2731';
        ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
        ctx.fillStyle = '#f4e7d0';
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = '#6fae4b';
        ctx.fillRect(bx, by, bw * frac, bh);
      }
    }

    // HP bar once damaged
    if (def.hostile && b.hp < b.maxHp) {
      const bw = 90, bh = 8;
      const bx = b.x - bw / 2, by = b.y - def.anchorY - 14;
      ctx.fillStyle = '#3a2731';
      ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
      ctx.fillStyle = '#f4e7d0';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = '#e04a3f';
      ctx.fillRect(bx, by, bw * (b.hp / b.maxHp), bh);
    }
  }

  function drawSheep(s) {
    drawShadow(s.x, s.y + 16, 0.48);
    const sheet = s.moving ? 'sheep_move' : 'sheep_idle';
    drawFrame(sheet, animFrame(sheet, s.animT, 8), s.x, s.y, s.flip);
  }

  // Empty build plots: a staked-out patch of cleared ground (procedural —
  // the pack has no sign sprite). Occupied plots draw as real buildings.
  function drawPlots() {
    for (const pl of plotList) {
      if (state.adventure.plots[pl.id]) continue;
      // cleared-earth patch
      ctx.fillStyle = 'rgba(58, 39, 49, 0.18)';
      ctx.beginPath();
      ctx.ellipse(pl.x, pl.y, 64, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      // staked rope outline, gently pulsing so it reads as interactive
      const pulse = 0.55 + Math.sin(state.time * 2.6) * 0.15;
      ctx.strokeStyle = `rgba(244, 231, 208, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 7]);
      ctx.strokeRect(pl.x - 56, pl.y - 26, 112, 52);
      ctx.setLineDash([]);
      ctx.fillStyle = '#8a5a3b';
      for (const [sx, sy] of [[-56, -26], [56, -26], [-56, 26], [56, 26]]) {
        ctx.fillRect(pl.x + sx - 3, pl.y + sy - 12, 6, 14);
      }
      if (state.mode === 'playing' && dist(player, pl) < 85) {
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#3a2731';
        ctx.fillText('SPACE - BUILD', pl.x + 1, pl.y - 45 + 1);
        ctx.fillStyle = '#f4e7d0';
        ctx.fillText('SPACE - BUILD', pl.x, pl.y - 45);
      }
    }
  }

  function drawNpc(n) {
    drawShadow(n.x, n.y + 30, 0.62);
    const sheet = `${n.sprite}_idle`;
    drawFrame(sheet, animFrame(sheet, n.animT, 6), n.x, n.y, n.flip);
    // Undiscovered doorway NPCs bob a "!" so new players can find the modes
    // that used to sit on the main menu
    if (n.role && state.adventure && !state.adventure.gatesSeen[n.id]) {
      const bob = Math.sin(state.time * 4) * 5;
      ctx.font = '22px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#3a2731';
      ctx.fillText('!', n.x + 2, n.y - 108 + bob + 2);
      ctx.fillStyle = '#f2b23a';
      ctx.fillText('!', n.x, n.y - 108 + bob);
    }
    if (state.mode === 'playing' && dist(player, n) < 70) {
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#3a2731';
      ctx.fillText('SPACE - TALK', n.x + 1, n.y - 95 + 1);
      ctx.fillStyle = '#f4e7d0';
      ctx.fillText('SPACE - TALK', n.x, n.y - 95);
    }
  }

  function drawPlayer() {
    const p = player;
    drawShadow(p.x, p.y + 30, 0.62);
    if (state.adventure) {
      // The worker Pawn always carries the last tool used; equipped cosmetic
      // skin prefixes the sheet name (blue = default = no prefix)
      const t = `_${p.tool}`;
      const skin = state.adventure.cosmetics.equipped;
      const prefix = skin === 'blue' ? '' : `${skin}_`;
      if (p.state === 'interact') {
        const sheet = `${prefix}pawn_interact${t}`;
        const n = SHEETS[sheet].frames;
        const frame = Math.min(Math.floor(p.attackT / p.interactDur * n), n - 1);
        drawFrame(sheet, frame, p.x, p.y, p.flip);
      } else if (p.state === 'run') {
        drawFrame(`${prefix}pawn_run${t}`, animFrame(`${prefix}pawn_run${t}`, p.animT, 10), p.x, p.y, p.flip);
      } else {
        drawFrame(`${prefix}pawn_idle${t}`, animFrame(`${prefix}pawn_idle${t}`, p.animT, 8), p.x, p.y, p.flip);
      }
      return;
    }
    // Blink while invulnerable
    if (p.hurtT > 0 && Math.floor(p.hurtT * 12) % 2 === 0) ctx.globalAlpha = 0.4;
    if (p.state === 'attack') {
      const n = SHEETS.blue_attack.frames;
      const frame = Math.min(Math.floor(p.attackT / p.atkDur * n), n - 1);
      drawFrame('blue_attack', frame, p.x, p.y, p.flip);
    } else if (p.state === 'run') {
      drawFrame('blue_run', animFrame('blue_run', p.animT, 10), p.x, p.y, p.flip);
    } else {
      drawFrame('blue_idle', animFrame('blue_idle', p.animT, 8), p.x, p.y, p.flip);
    }
    ctx.globalAlpha = 1;
  }

  function drawEnemy(e) {
    // Shadow sits under the feet, sized to the unit's footprint
    if (e.type === 'lancer') drawShadow(e.x, e.y + 48, 0.8);
    else if (e.type === 'boss') drawShadow(e.x, e.y + 44, 0.95);
    else if (e.type === 'barrel') drawShadow(e.x, e.y + 24, 0.55);
    else drawShadow(e.x, e.y + 30, 0.62);
    if (e.flashT > 0) ctx.filter = 'brightness(2.2)';
    const F = e.faction;
    const sc = e.scale;

    if (e.type === 'warrior' || e.type === 'boss') {
      if (e.state === 'attack') {
        const atkSheet = `${F}_warrior_attack${e.atkVariant || ''}`;
        const frame = Math.min(Math.floor(e.actionT * 10), SHEETS[atkSheet].frames - 1);
        drawFrame(atkSheet, frame, e.x, e.y, e.flip, sc);
      } else if (e.state === 'run') {
        drawFrame(`${F}_warrior_run`, animFrame(`${F}_warrior_run`, e.animT, 10), e.x, e.y, e.flip, sc);
      } else {
        const idleSheet = `${F}_warrior_${e.idleVariant || 'idle'}`;
        drawFrame(idleSheet, animFrame(idleSheet, e.animT, 8), e.x, e.y, e.flip, sc);
      }
    } else if (e.type === 'archer') {
      if (e.state === 'shoot') {
        const frame = Math.min(Math.floor(e.actionT * 10), SHEETS[`${F}_archer_shoot`].frames - 1);
        drawFrame(`${F}_archer_shoot`, frame, e.x, e.y, e.flip);
      } else if (e.state === 'run') {
        drawFrame(`${F}_archer_run`, animFrame(`${F}_archer_run`, e.animT, 10), e.x, e.y, e.flip);
      } else {
        drawFrame(`${F}_archer_idle`, animFrame(`${F}_archer_idle`, e.animT, 8), e.x, e.y, e.flip);
      }
    } else if (e.type === 'lancer') {
      if (e.state === 'attack') {
        const frame = Math.min(Math.floor(e.actionT * 8), SHEETS[e.atkSheet].frames - 1);
        drawFrame(e.atkSheet, frame, e.x, e.y, e.atkFlip);
      } else if (e.state === 'run') {
        drawFrame(`${F}_lancer_run`, animFrame(`${F}_lancer_run`, e.animT, 10), e.x, e.y, e.flip);
      } else {
        // Idle lancers hold a directional guard pose facing the player
        const deg = Math.atan2(player.y - e.y, player.x - e.x) * 180 / Math.PI;
        const { dir, flip } = angleBucket(deg);
        const defSheet = `${F}_lancer_def_${dir}`;
        drawFrame(defSheet, animFrame(defSheet, e.animT, 8), e.x, e.y, flip);
      }
    } else if (e.type === 'torch') {
      const run = `goblin_torch_run_${e.gColor}`, idle = `goblin_torch_idle_${e.gColor}`;
      if (e.state === 'attack') {
        const frame = Math.min(Math.floor(e.actionT * 12), SHEETS[e.atkSheet].frames - 1);
        drawFrame(e.atkSheet, frame, e.x, e.y, e.atkFlip);
      } else if (e.state === 'run') {
        drawFrame(run, animFrame(run, e.animT, 10), e.x, e.y, e.flip);
      } else {
        drawFrame(idle, animFrame(idle, e.animT, 8), e.x, e.y, e.flip);
      }
    } else if (e.type === 'tnt') {
      const throwS = `goblin_tnt_throw_${e.gColor}`, run = `goblin_tnt_run_${e.gColor}`, idle = `goblin_tnt_idle_${e.gColor}`;
      if (e.state === 'throw') {
        const frame = Math.min(Math.floor(e.actionT * 10), SHEETS[throwS].frames - 1);
        drawFrame(throwS, frame, e.x, e.y, e.flip);
      } else if (e.state === 'run') {
        drawFrame(run, animFrame(run, e.animT, 10), e.x, e.y, e.flip);
      } else {
        drawFrame(idle, animFrame(idle, e.animT, 8), e.x, e.y, e.flip);
      }
    } else if (e.type === 'barrel') {
      const fuse = `goblin_barrel_fuse_${e.gColor}`, run = `goblin_barrel_run_${e.gColor}`, idle = `goblin_barrel_idle_${e.gColor}`;
      if (e.state === 'fuse') {
        const frame = Math.min(Math.floor(e.actionT / FUSE_DUR * 3), 2);
        drawFrame(fuse, frame, e.x, e.y, e.flip, 1.2);
      } else if (e.state === 'run') {
        drawFrame(run, animFrame(run, e.animT, 10), e.x, e.y, e.flip, 1.2);
      } else {
        drawFrame(idle, animFrame(idle, e.animT, 8), e.x, e.y, e.flip, 1.2);
      }
    } else { // monk
      if (e.state === 'heal') {
        const frame = Math.min(Math.floor(e.actionT * 12), SHEETS[`${F}_monk_heal`].frames - 1);
        drawFrame(`${F}_monk_heal`, frame, e.x, e.y, e.flip);
      } else if (e.state === 'run') {
        drawFrame(`${F}_monk_run`, animFrame(`${F}_monk_run`, e.animT, 10), e.x, e.y, e.flip);
      } else {
        drawFrame(`${F}_monk_idle`, animFrame(`${F}_monk_idle`, e.animT, 8), e.x, e.y, e.flip);
      }
    }
    ctx.filter = 'none';
  }

  function renderUI() {
    if (state.adventure) {
      renderAdventureUI();
      return;
    }
    const fontBig = '22px "Press Start 2P", monospace';
    const fontSmall = '14px "Press Start 2P", monospace';
    const fontTiny = '10px "Press Start 2P", monospace';

    // HP bar (top-left)
    const bx = 24, by = 22, bw = 280, bh = 30;
    ctx.fillStyle = '#3a2731';
    roundRect(bx - 4, by - 4, bw + 8, bh + 8, 8);
    ctx.fill();
    ctx.fillStyle = '#f4e7d0';
    roundRect(bx, by, bw, bh, 5);
    ctx.fill();
    const hpRatio = player.hp / player.maxHp;
    if (hpRatio > 0) {
      ctx.fillStyle = hpRatio > 0.35 ? '#e04a3f' : '#b8302a';
      roundRect(bx + 3, by + 3, (bw - 6) * hpRatio, bh - 6, 4);
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.font = fontSmall;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('HP', bx + 10, by + bh / 2 + 1);

    // Wave + score (top-right, cream with dark drop shadow)
    const c = state.campaign;
    const vw = canvas.width;
    const lines = [];
    if (c) lines.push(`ACT ${c.act + 1}/${ACTS.length}`);
    lines.push(currentWaveLabel());
    lines.push(`SCORE ${state.score}`);
    ctx.textAlign = 'right';
    ctx.font = fontSmall;
    lines.forEach((line, i) => {
      ctx.fillStyle = '#3a2731';
      ctx.fillText(line, vw - 24, 40 + i * 28);
      ctx.fillStyle = '#f4e7d0';
      ctx.fillText(line, vw - 26, 38 + i * 28);
    });

    // Center announcements
    if (state.mode === 'playing' || state.mode === 'upgrade') {
      ctx.textAlign = 'center';
      if (state.waveState === 'intermission') {
        if (c) {
          ctx.font = fontBig;
          announce(`ACT ${c.act + 1} — ${ACTS[c.act].title.toUpperCase()}`, 105, fontBig);
          announce(`WAVE ${c.wave + 1}/${ACTS[c.act].waves.length} INCOMING...`, 140, fontTiny);
        } else {
          announce(`WAVE ${state.wave + 1} INCOMING...`, 110, fontBig);
        }
      } else if (state.waveState === 'siege') {
        announce('DESTROY THE ENEMY BUILDINGS!', 110, fontBig);
      }
    }
  }

  // Adventure HUD: no HP bar or waves — stores, dailies, hotbar, notices
  function renderAdventureUI() {
    const a = state.adventure;
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.textBaseline = 'middle';
    // Item sprites carry transparent padding, so draw them generously sized
    [['wood', a.wood], ['gold', a.gold], ['meat', a.meat]].forEach(([key, val], i) => {
      const y = 40 + i * 52;
      ctx.drawImage(img[key], canvas.width - 74, y - 26, 52, 52);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#3a2731';
      ctx.fillText(String(val), canvas.width - 76, y + 2);
      ctx.fillStyle = '#f4e7d0';
      ctx.fillText(String(val), canvas.width - 78, y);
    });

    // Daily quest tally + ledger hint under the stores
    const done = a.daily.quests.filter(q => q.claimed).length;
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'right';
    [[`DAILIES ${done}/${a.daily.quests.length}`, 196], ['I — LEDGER', 222], ['O — WHEEL', 248]].forEach(([text, y]) => {
      ctx.fillStyle = '#3a2731';
      ctx.fillText(text, canvas.width - 24, y + 2);
      ctx.fillStyle = '#f4e7d0';
      ctx.fillText(text, canvas.width - 26, y);
    });

    // Hotbar (keys 1-3): the carried tool is highlighted
    const slot = 56, gap = 10;
    const totalW = ADV.hotbar.length * slot + (ADV.hotbar.length - 1) * gap;
    const hx = (canvas.width - totalW) / 2;
    const hy = canvas.height - slot - 16;
    ADV.hotbar.forEach((tool, i) => {
      const x = hx + i * (slot + gap);
      ctx.fillStyle = '#3a2731';
      roundRect(x - 3, hy - 3, slot + 6, slot + 6, 10);
      ctx.fill();
      ctx.fillStyle = player.tool === tool ? '#f3b340' : '#f4e7d0';
      roundRect(x, hy, slot, slot, 7);
      ctx.fill();
      ctx.drawImage(img[`tool_${tool}`], x + 2, hy + 2, slot - 4, slot - 4);
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#3a2731';
      ctx.fillText(String(i + 1), x + 6, hy + 11);
    });

    // Transient notices (level-ups, finished dailies) fade out at the end
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    a.notices.forEach((n, i) => {
      ctx.globalAlpha = n.t > 2.2 ? Math.max(0, 1 - (n.t - 2.2) / 0.6) : 1;
      announce(n.text, 184 + i * 30, '12px "Press Start 2P", monospace');
    });
    ctx.globalAlpha = 1;

    // Minimap: static islands/bridges + live player & node dots. Bottom-left
    // normally; top-left on touch devices, where the joystick owns that corner
    if (minimapCanvas) {
      const mmW = 168, mmH = mmW * (MAP_H / MAP_W);
      const mmx = 20, mmy = IS_TOUCH ? 20 : canvas.height - mmH - 20;
      ctx.fillStyle = '#3a2731';
      roundRect(mmx - 5, mmy - 5, mmW + 10, mmH + 10, 8);
      ctx.fill();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(minimapCanvas, mmx, mmy, mmW, mmH);
      const sx = mmW / W, sy = mmH / H;
      for (const d of decors) {
        if (d.harvested) continue;
        if (d.kind === 'tree') ctx.fillStyle = '#1f5f3a';
        else if (d.kind === 'goldstone') ctx.fillStyle = '#ffd657';
        else continue;
        ctx.fillRect(mmx + d.x * sx - 1, mmy + d.y * sy - 1, 2, 2);
      }
      ctx.fillStyle = '#fff';
      ctx.fillRect(mmx + player.x * sx - 2, mmy + player.y * sy - 2, 4, 4);
      ctx.fillStyle = '#3a2731';
      ctx.fillRect(mmx + player.x * sx - 1, mmy + player.y * sy - 1, 2, 2);
    }

    // Region banner when crossing onto a new island (fades in then out)
    if (a.regionT > 0) {
      ctx.globalAlpha = a.regionT > 2.1 ? (2.6 - a.regionT) / 0.5 : Math.min(1, a.regionT / 0.6);
      ctx.textAlign = 'center';
      announce(a.regionName.toUpperCase(), 78, '24px "Press Start 2P", monospace');
      ctx.globalAlpha = 1;
    }

    if (a.introT > 0) {
      ctx.textAlign = 'center';
      announce('EXPLORE THE ISLES', 112, '20px "Press Start 2P", monospace');
      announce('CROSS BRIDGES BETWEEN REGIONS — HOLD SPACE TO WORK', 146, '10px "Press Start 2P", monospace');
    }
  }

  function announce(text, y, font) {
    ctx.font = font;
    ctx.fillStyle = '#3a2731';
    ctx.fillText(text, canvas.width / 2 + 3, y + 3);
    ctx.fillStyle = '#f4e7d0';
    ctx.fillText(text, canvas.width / 2, y);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---------- Main loop ----------
  let lastT = 0;
  function loop(ts) {
    const dt = Math.min((ts - lastT) / 1000, 0.05);
    lastT = ts;
    fitCanvas(); // self-corrects if the window had no size at startup
    if (assetsReady) {
      state.time += dt;
      for (const cl of clouds) {
        cl.x += cl.spd * dt;
        if (cl.x > W + 100) cl.x = -600;
      }
      if (state.mode === 'playing') update(dt);
      updateCamera(dt);
      render();
    }
    requestAnimationFrame(loop);
  }

  // ---------- Resize ----------
  // The canvas height is fixed at VIEW_H; its width follows the window's aspect
  // ratio so the game fills the screen with no side bars.
  let lastFitKey = '';
  function fitCanvas() {
    const iw = window.innerWidth, ih = window.innerHeight;
    if (iw <= 0 || ih <= 0) return;
    const key = `${iw}x${ih}`;
    if (key === lastFitKey) return;
    lastFitKey = key;
    const targetW = clamp(Math.round(VIEW_H * iw / ih / 2) * 2, 800, W);
    if (canvas.width !== targetW || canvas.height !== VIEW_H) {
      canvas.width = targetW;
      canvas.height = VIEW_H;
      ctx.imageSmoothingEnabled = false; // resizing resets context state
    }
    const scale = Math.min(iw / canvas.width, ih / canvas.height);
    canvas.style.width = `${Math.floor(canvas.width * scale)}px`;
    canvas.style.height = `${Math.floor(canvas.height * scale)}px`;
  }
  window.addEventListener('resize', () => { lastFitKey = ''; fitCanvas(); });

  // ---------- Leaderboard (Supabase REST — optional, no account needed) ----------
  // Players stay anonymous: a random local id groups their submissions, and the
  // only thing they ever type is a display name. No config = feature hidden.
  const LB_CFG = window.FK_CONFIG || {};
  const lbEnabled = !!(LB_CFG.supabaseUrl && LB_CFG.supabaseAnonKey);
  // Crest features stay dark until the $FADOM contract address is configured
  const tokenEnabled = !!(lbEnabled && LB_CFG.token && LB_CFG.token.address);
  const NAME_KEY = 'fableKingdomName';
  const PLAYER_ID_KEY = 'fableKingdomPlayerId';
  let submittedThisRun = false;

  function lbPlayerId() {
    let id = localStorage.getItem(PLAYER_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(PLAYER_ID_KEY, id);
    }
    return id;
  }

  function lbHeaders() {
    return {
      apikey: LB_CFG.supabaseAnonKey,
      Authorization: `Bearer ${LB_CFG.supabaseAnonKey}`,
      'Content-Type': 'application/json',
    };
  }

  async function lbFetchTop(mode) {
    // `crest` only exists after the token migration runs — request it only
    // when the feature is on so an unmigrated DB keeps working untouched
    const cols = tokenEnabled ? 'name,score,wave,player_id,crest' : 'name,score,wave,player_id';
    const url = `${LB_CFG.supabaseUrl}/rest/v1/scores` +
      `?mode=eq.${mode}&select=${cols}&order=score.desc&limit=100`;
    const res = await fetch(url, { headers: lbHeaders() });
    if (!res.ok) throw new Error(`leaderboard fetch failed (${res.status})`);
    const rows = await res.json();
    // Keep each player's best entry only
    const seen = new Set();
    const top = [];
    for (const r of rows) {
      if (seen.has(r.player_id)) continue;
      seen.add(r.player_id);
      top.push(r);
      if (top.length >= 10) break;
    }
    return top;
  }

  async function lbSubmit(mode, score, wave, name) {
    const token = await freshAccessToken();
    if (!token) throw new Error('not logged in');
    const res = await fetch(`${LB_CFG.supabaseUrl}/rest/v1/scores`, {
      method: 'POST',
      headers: { ...lbHeaders(), Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mode, score, wave, name, player_id: session.user.id }),
    });
    if (!res.ok) throw new Error(`submit failed (${res.status})`);
  }

  // ---------- Auth (EVM wallet on Robinhood Chain via Edge Function) ----------
  // Playing never needs an account; submitting to the leaderboard does.
  // The Edge Function verifies a signed message and issues a Supabase JWT.
  const SESSION_KEY = 'fableKingdomSession';
  let session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');

  function setSession(data) {
    session = data ? {
      access_token: data.access_token,
      expires_at: data.expires_at || Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: data.user.id,
        email: data.user.email,
        wallet: data.user.user_metadata?.wallet_address || '',
        name: data.user.user_metadata?.display_name || '',
        crest: !!data.user.user_metadata?.crest,
      },
    } : null;
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
    updateAuthUI();
  }

  // Wallet sessions have no refresh token — the player re-signs when expired.
  // freshAccessToken() returns null in that case so submit/login UI can prompt.
  async function freshAccessToken() {
    if (!session) return null;
    if (Date.now() / 1000 < session.expires_at - 60) return session.access_token;
    setSession(null);
    return null;
  }

  function shortWallet(w) {
    return w ? `${w.slice(0, 6)}…${w.slice(-4)}` : '';   // 0x1234…abcd
  }

  function updateAuthUI() {
    if (!lbEnabled) return;
    const line = document.getElementById('account-line');
    const btn = document.getElementById('auth-btn');
    if (session) {
      const label = session.user.name || shortWallet(session.user.wallet);
      const crest = session.user.crest ? '♛ ' : '';   // ♛ for $FADOM holders
      line.textContent = `CONNECTED: ${crest}${label.toUpperCase()}`;
      btn.textContent = 'DISCONNECT';
    } else {
      line.textContent = '';
      btn.textContent = 'CONNECT WALLET';
    }
    // Refresh the submit row if an end screen is currently showing it
    if (lastSubmitAnchor && (state.mode === 'gameover' || state.mode === 'victory')) {
      prepareSubmitRow(lastSubmitAnchor);
    }
  }

  function authStatus(msg, ok = false) {
    const el = document.getElementById('auth-status');
    el.textContent = msg;
    el.style.color = ok ? '#3a7d44' : '#a33b2e';
  }

  // Any EIP-1193 wallet works (MetaMask, Rabby, Coinbase Wallet, ...) — when
  // several are installed, prefer MetaMask from the multi-provider list.
  function detectWalletProvider() {
    const eth = window.ethereum;
    if (!eth) return null;
    if (Array.isArray(eth.providers)) {
      return eth.providers.find((p) => p.isMetaMask) || eth.providers[0];
    }
    return eth;
  }

  // Offer to switch (or first add) Robinhood Chain in the player's wallet.
  // Declining is fine — personal_sign proves the address on any chain, so
  // this is branding/UX, never a gate.
  async function ensureRobinhoodChain(provider) {
    const chain = LB_CFG.chain;
    if (!chain) return;
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chain.chainId }],
      });
    } catch (err) {
      if (err?.code !== 4902) return; // declined or already pending — move on
      try {
        await provider.request({ method: 'wallet_addEthereumChain', params: [chain] });
      } catch {}
    }
  }

  async function connectWallet() {
    const provider = detectWalletProvider();
    if (!provider) {
      authStatus('NO WALLET FOUND. INSTALL METAMASK, RABBY OR COINBASE WALLET.');
      return;
    }
    const displayName = document.getElementById('auth-name').value;
    const btn = document.getElementById('connect-btn');
    btn.disabled = true;
    btn.textContent = 'CONNECTING...';
    authStatus('OPEN YOUR WALLET TO APPROVE', true);

    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      const wallet = String(accounts[0]).toLowerCase();
      await ensureRobinhoodChain(provider);
      const message = `Sign in to HoodHaven\nWallet: ${wallet}\nIssued at: ${new Date().toISOString()}`;

      authStatus('SIGN THE MESSAGE TO VERIFY', true);
      // personal_sign returns a 65-byte 0x-hex signature
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, wallet],
      });

      authStatus('VERIFYING...', true);
      const res = await fetch(`${LB_CFG.supabaseUrl}/functions/v1/evm-auth`, {
        method: 'POST',
        headers: { apikey: LB_CFG.supabaseAnonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, message, signature, displayName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `auth failed (${res.status})`);

      setSession(data);
      checkCrest();     // async holdings check; UI updates when it lands
      syncCloudSave();  // pull a fresher kingdom from another device, or push ours
      sfx.pick();
      navigateTo(authReturnTo);
    } catch (err) {
      const msg = err?.message || String(err);
      authStatus(msg.toUpperCase().slice(0, 80));
    } finally {
      btn.disabled = false;
      btn.textContent = 'CONNECT WALLET';
    }
  }

  async function disconnectWallet() {
    // EIP-1193 has no disconnect — dropping the session is the whole logout
    setSession(null);
  }

  // Ask the server to re-check $FADOM holdings for the signed-in wallet and
  // stamp the crest on the account. Fire-and-forget: the crest is cosmetic,
  // so any failure just leaves the last known state.
  async function checkCrest() {
    if (!tokenEnabled || !session) return;
    try {
      const res = await fetch(`${LB_CFG.supabaseUrl}/functions/v1/verify-holdings`, {
        method: 'POST',
        headers: {
          apikey: LB_CFG.supabaseAnonKey,
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!session) return; // disconnected while the check was in flight
      session.user.crest = !!data.crest;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      updateAuthUI();
      // Losing the crest un-equips GILDED (kept if simply offline/unverified)
      const a = state.adventure;
      if (a && !session.user.crest && a.cosmetics.equipped === 'gold') {
        a.cosmetics.equipped = 'blue';
        saveAdventure();
      }
    } catch {}
  }

  // ---------- Cloud save (per-wallet, Supabase `characters` table) ----------
  // localStorage stays the source of truth; the cloud row is a mirror synced
  // last-write-wins via the savedAt stamp inside the save itself. Everything
  // is fire-and-forget: offline play (or an unmigrated DB) just skips silently.
  // Table + RLS setup: docs/cloud-save-setup.md
  let cloudPushTimer = null;

  function queueCloudPush() {
    if (!lbEnabled || !session) return;
    clearTimeout(cloudPushTimer);
    cloudPushTimer = setTimeout(pushCloudSave, 2500); // saves burst during play
  }

  async function pushCloudSave() {
    try {
      const token = await freshAccessToken();
      if (!token) return;
      const raw = localStorage.getItem(ADV_SAVE_KEY);
      if (!raw) return;
      await fetch(`${LB_CFG.supabaseUrl}/rest/v1/characters`, {
        method: 'POST',
        headers: {
          ...lbHeaders(),
          Authorization: `Bearer ${token}`,
          Prefer: 'resolution=merge-duplicates', // upsert on the user_id PK
        },
        body: JSON.stringify({ user_id: session.user.id, data: JSON.parse(raw) }),
      });
    } catch {}
  }

  async function syncCloudSave() {
    if (!lbEnabled || !session) return;
    try {
      const token = await freshAccessToken();
      if (!token) return;
      const res = await fetch(
        `${LB_CFG.supabaseUrl}/rest/v1/characters?user_id=eq.${session.user.id}&select=data`,
        { headers: { ...lbHeaders(), Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) return;
      const rows = await res.json();
      const cloud = rows[0] && rows[0].data;
      let local = null;
      try { local = JSON.parse(localStorage.getItem(ADV_SAVE_KEY)); } catch {}
      const cloudAt = (cloud && cloud.savedAt) || 0;
      const localAt = (local && local.savedAt) || 0;
      if (cloud && cloudAt > localAt && !state.adventure) {
        // Played elsewhere more recently — adopt the cloud kingdom. Never
        // mid-session: an active isle is by definition the freshest state.
        localStorage.setItem(ADV_SAVE_KEY, JSON.stringify(cloud));
      } else if (local && localAt > cloudAt) {
        pushCloudSave();
      }
    } catch {}
  }

  // ---------- Online presence: ghosts of other players on the isles ----------
  // Players currently roaming the isles see each other as translucent pawns
  // with name labels — no collision, no interaction, position is broadcast
  // via Supabase Realtime (presence = roster, broadcast 'pos' = movement).
  // Position spoofing is possible and harmless: ghosts are purely cosmetic.
  let sbClient = null;
  let islesChannel = null;
  const ghosts = new Map(); // playerId -> { x, y, tx, ty, name, skin, tool, ... }
  let lastPosSent = 0, lastSentX = 0, lastSentY = 0;

  const presenceReady = () => lbEnabled && typeof window.supabase !== 'undefined';

  const ghostName = () =>
    (session && session.user.name ? session.user.name : 'TRAVELER').toUpperCase().slice(0, 14);

  function joinIsles() {
    if (!presenceReady() || islesChannel) return;
    if (!sbClient) {
      // Realtime only — the game mints its own JWTs, so GoTrue stays off
      sbClient = window.supabase.createClient(LB_CFG.supabaseUrl, LB_CFG.supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    const me = lbPlayerId();
    islesChannel = sbClient.channel('isles', {
      config: { presence: { key: me }, broadcast: { self: false } },
    });
    islesChannel
      .on('presence', { event: 'leave' }, ({ key }) => { ghosts.delete(key); })
      .on('broadcast', { event: 'pos' }, ({ payload }) => {
        if (!payload || payload.id === me) return;
        let g = ghosts.get(payload.id);
        if (!g) {
          g = { x: payload.x, y: payload.y, animT: rand(0, 2) };
          ghosts.set(payload.id, g);
        }
        g.tx = payload.x;
        g.ty = payload.y;
        g.flip = !!payload.flip;
        g.tool = payload.tool || 'axe';
        g.skin = payload.skin || 'blue';
        g.name = payload.name || 'TRAVELER';
        g.lastSeen = Date.now();
      })
      .subscribe((status) => {
        // Track a tiny roster entry so leaves fire; positions go via broadcast
        if (status === 'SUBSCRIBED') islesChannel.track({ name: ghostName() });
      });
  }

  function leaveIsles() {
    if (!islesChannel) return;
    try { sbClient.removeChannel(islesChannel); } catch {}
    islesChannel = null;
    ghosts.clear();
  }

  // Called every adventure frame; throttles itself (150 ms while moving,
  // 2 s idle heartbeat so newcomers see standing players quickly)
  function sendPresencePos() {
    if (!islesChannel || !state.adventure) return;
    const now = Date.now();
    if (now - lastPosSent < 150) return;
    const moved = Math.abs(player.x - lastSentX) > 2 || Math.abs(player.y - lastSentY) > 2;
    if (!moved && now - lastPosSent < 2000) return;
    lastPosSent = now;
    lastSentX = player.x;
    lastSentY = player.y;
    islesChannel.send({
      type: 'broadcast',
      event: 'pos',
      payload: {
        id: lbPlayerId(),
        x: Math.round(player.x), y: Math.round(player.y),
        flip: player.flip, tool: player.tool,
        skin: state.adventure.cosmetics.equipped,
        name: ghostName(),
      },
    });
  }

  function updateGhosts(dt) {
    const now = Date.now();
    for (const [id, g] of ghosts) {
      if (now - (g.lastSeen || 0) > 10000) { ghosts.delete(id); continue; }
      const dx = (g.tx ?? g.x) - g.x, dy = (g.ty ?? g.y) - g.y;
      const d = Math.hypot(dx, dy);
      g.moving = d > 3;
      if (d > 400) { g.x = g.tx; g.y = g.ty; } // teleport (bridge, respawn) — snap
      else if (d > 0.5) {
        const k = Math.min(1, dt * 10);        // smooth toward the reported spot
        g.x += dx * k;
        g.y += dy * k;
      }
      g.animT += dt;
    }
  }

  function drawGhost(g) {
    const prefix = g.skin && g.skin !== 'blue' ? `${g.skin}_` : '';
    const sheet = `${prefix}pawn_${g.moving ? 'run' : 'idle'}_${g.tool || 'axe'}`;
    if (!SHEETS[sheet]) return;
    ctx.globalAlpha = 0.8;
    drawShadow(g.x, g.y + 30, 0.62);
    drawFrame(sheet, animFrame(sheet, g.animT, g.moving ? 10 : 6), g.x, g.y, g.flip);
    ctx.globalAlpha = 1;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3a2731';
    ctx.fillText(g.name, g.x + 1, g.y - 78 + 1);
    ctx.fillStyle = '#cfe8ff';
    ctx.fillText(g.name, g.x, g.y - 78);
  }

  // ---------- Analytics (fire-and-forget event log) ----------
  let runStartedAt = 0;

  function track(event, props = {}) {
    if (!lbEnabled) return;
    fetch(`${LB_CFG.supabaseUrl}/rest/v1/events`, {
      method: 'POST',
      headers: lbHeaders(),
      body: JSON.stringify({
        device_id: lbPlayerId(),
        user_id: session ? session.user.id : null,
        event,
        ...props,
      }),
    }).catch(() => {});
  }

  let lbMode = 'survival';

  async function lbShow(mode) {
    lbMode = mode;
    document.getElementById('lb-tab-survival').classList.toggle('active', mode === 'survival');
    document.getElementById('lb-tab-campaign').classList.toggle('active', mode === 'campaign');
    const list = document.getElementById('lb-list');
    list.innerHTML = '<span class="lb-status">LOADING...</span>';
    document.getElementById('lb-screen').classList.remove('hidden');
    try {
      const rows = await lbFetchTop(mode);
      if (rows.length === 0) {
        list.innerHTML = '<span class="lb-status">NO SCORES YET.<br>BE THE FIRST!</span>';
        return;
      }
      const label = mode === 'survival' ? 'W' : 'ACT';
      list.innerHTML = rows.map((r, i) =>
        `<li><span class="lb-rank">#${i + 1}</span>` +
        `<span class="lb-name">${r.crest ? '<span class="lb-crest" title="TOKEN HOLDER">&#9819;</span>' : ''}${escapeHtml(r.name)}</span>` +
        `<span class="lb-score">${r.score} · ${label}${r.wave ?? '?'}</span></li>`
      ).join('');
    } catch (err) {
      list.innerHTML = '<span class="lb-status">COULD NOT LOAD.<br>TRY AGAIN LATER.</span>';
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  }

  // Move the single submit row into whichever end-screen panel is showing.
  // Logged out: a login prompt replaces the name + submit controls.
  let lastSubmitAnchor = null;

  function prepareSubmitRow(targetButtonId) {
    if (!lbEnabled) return;
    lastSubmitAnchor = targetButtonId;
    if (!submittedThisRun) {
      const btn = document.getElementById('submit-btn');
      btn.disabled = false;
      btn.textContent = 'SUBMIT SCORE';
    }
    const row = document.getElementById('submit-row');
    const input = document.getElementById('player-name');
    const loginBtn = document.getElementById('submit-login-btn');
    // Default to the wallet's display name, falling back to last typed name
    input.value = input.value || (session && session.user.name) || localStorage.getItem(NAME_KEY) || '';
    input.disabled = submittedThisRun;
    input.classList.toggle('hidden', !session);
    document.getElementById('submit-btn').classList.toggle('hidden', !session);
    loginBtn.classList.toggle('hidden', !!session);
    const anchor = document.getElementById(targetButtonId);
    anchor.parentNode.insertBefore(row, anchor);
    row.classList.remove('hidden');
  }

  async function handleSubmit() {
    if (submittedThisRun) return;
    const input = document.getElementById('player-name');
    const btn = document.getElementById('submit-btn');
    const name = input.value.trim().toUpperCase().slice(0, 16);
    if (name.length < 2) {
      input.focus();
      return;
    }
    localStorage.setItem(NAME_KEY, name);
    const mode = state.campaign ? 'campaign' : 'survival';
    const wave = state.campaign ? state.campaign.act + 1 : state.wave;
    btn.disabled = true;
    btn.textContent = 'SENDING...';
    try {
      await lbSubmit(mode, state.score, wave, name);
      submittedThisRun = true;
      input.disabled = true;
      btn.textContent = 'SUBMITTED!';
      sfx.coin();
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'RETRY SUBMIT';
    }
  }

  // Browser autoplay rules require a user gesture before audio can start.
  // Trigger initAudio() on the very first interaction anywhere on the page so
  // music kicks in as soon as the player clicks anything on the start screen.
  const startMusicOnce = () => {
    initAudio();
    document.removeEventListener('pointerdown', startMusicOnce);
    document.removeEventListener('keydown', startMusicOnce);
  };
  document.addEventListener('pointerdown', startMusicOnce);
  document.addEventListener('keydown', startMusicOnce);

  // Modal navigation: only one menu overlay is visible at a time. Closing any
  // submenu lands the player back on the previous screen — never stacked.
  // End-of-run screens (gameover / victory) are included so LOGIN TO SUBMIT
  // can replace them cleanly instead of stacking the auth modal on top.
  const MENU_OVERLAYS = [
    'start-screen', 'lb-screen', 'auth-screen',
    'gameover-screen', 'victory-screen', 'pause-screen',
  ];
  let authReturnTo = 'start-screen'; // where auth-close / successful login lands
  function navigateTo(overlayId) {
    for (const id of MENU_OVERLAYS) {
      document.getElementById(id).classList.toggle('hidden', id !== overlayId);
    }
  }

  if (lbEnabled) {
    document.getElementById('lb-btn').classList.remove('hidden');
    document.getElementById('auth-btn').classList.remove('hidden');
    document.getElementById('lb-btn').addEventListener('click', () => {
      navigateTo('lb-screen');
      lbShow(lbMode);
    });
    document.getElementById('lb-tab-survival').addEventListener('click', () => lbShow('survival'));
    document.getElementById('lb-tab-campaign').addEventListener('click', () => lbShow('campaign'));
    document.getElementById('lb-close').addEventListener('click', () => navigateTo('start-screen'));
    document.getElementById('submit-btn').addEventListener('click', handleSubmit);

    // Auth wiring (wallet)
    document.getElementById('auth-btn').addEventListener('click', () => {
      if (session) {
        disconnectWallet();
      } else {
        authStatus('');
        document.getElementById('auth-name').value = '';
        authReturnTo = 'start-screen';
        navigateTo('auth-screen');
      }
    });
    document.getElementById('submit-login-btn').addEventListener('click', () => {
      authStatus('');
      document.getElementById('auth-name').value = '';
      // Remember the end-screen so we go back to it after login / close
      authReturnTo = state.mode === 'victory' ? 'victory-screen' : 'gameover-screen';
      navigateTo('auth-screen');
    });
    document.getElementById('auth-close').addEventListener('click', () => navigateTo(authReturnTo));
    document.getElementById('connect-btn').addEventListener('click', connectWallet);

    // Keystrokes in form fields must not move the knight or trigger hotkeys
    for (const id of ['player-name', 'auth-name']) {
      document.getElementById(id).addEventListener('keydown', (e) => e.stopPropagation());
    }

    updateAuthUI();
    if (session) {
      checkCrest();      // holdings may have changed since last visit
      syncCloudSave();   // adopt a fresher save from another device
    }
    track('session_start');
  }

  // ---------- UI wiring ----------
  // PLAY drops straight into the isles — Story and Survival are entered
  // in-world through their gatekeeper NPCs, not from a menu.
  document.getElementById('play-btn').addEventListener('click', () => {
    initAudio();
    navigateTo(null); // hide every menu overlay
    startAdventure();
  });
  // When player exits a Survival run with a real score, offer to submit it
  // before quitting. Reuses the gameover panel for consistency.
  let exitingFromPause = false;

  function exitToMenu() {
    // Story scores are cumulative + only meaningful after completing the campaign,
    // and a scoreless Survival run has nothing worth saving — both just reload.
    if (state.campaign || state.score === 0) {
      location.reload();
      return;
    }
    exitingFromPause = true;
    state.mode = 'gameover';
    document.querySelector('#gameover-screen h1').textContent = 'Run Ended';
    document.getElementById('final-stats').textContent =
      `Wave ${state.wave} — Score ${state.score}`;
    document.getElementById('best-line').textContent = saveBest();
    // Quitting keeps the spoils too — otherwise dying would pay better
    const waves = Math.max(0, state.waveState === 'intermission' ? state.wave : state.wave - 1);
    const g = waves * ADV.spoils.survivalGoldPerWave;
    const w = waves * ADV.spoils.survivalWoodPerWave;
    bankSpoils(g, w);
    document.getElementById('spoils-line').textContent =
      (g || w) ? `SPOILS SENT HOME: +${g} GOLD · +${w} WOOD` : '';
    document.getElementById('restart-btn').textContent = 'EXIT TO MENU';
    submittedThisRun = false;
    prepareSubmitRow('restart-btn');
    track('run_end', {
      mode: 'survival', score: state.score, wave: state.wave,
      duration_s: Math.round((Date.now() - runStartedAt) / 1000),
    });
    navigateTo('gameover-screen');
  }

  document.getElementById('restart-btn').addEventListener('click', () => {
    if (exitingFromPause) { location.reload(); return; }
    document.getElementById('gameover-screen').classList.add('hidden');
    initAudio();
    if (state.campaign) retryAct();
    else startSurvival();
  });
  document.getElementById('menu-btn').addEventListener('click', returnToIsles);
  document.getElementById('isles-btn').addEventListener('click', returnToIsles);
  document.getElementById('gate-go').addEventListener('click', confirmGate);
  document.getElementById('gate-cancel').addEventListener('click', closeGate);
  document.getElementById('shop-close').addEventListener('click', closeShop);
  document.getElementById('resume-btn').addEventListener('click', togglePause);
  document.getElementById('exit-btn').addEventListener('click', exitToMenu);
  document.getElementById('ledger-close').addEventListener('click', toggleLedger);
  document.getElementById('ledger-shop').addEventListener('click', handleShopClick);
  document.getElementById('wheel-free-btn').addEventListener('click', () => spinWheel(true));
  document.getElementById('wheel-paid-btn').addEventListener('click', () => spinWheel(false));
  document.getElementById('wheel-close').addEventListener('click', toggleSpinner);
  document.getElementById('build-options').addEventListener('click', handleBuildClick);
  document.getElementById('build-close').addEventListener('click', closeBuildMenu);

  // Audio toggles in the pause menu
  document.getElementById('opt-music').addEventListener('change', (e) => {
    audioSettings.music = e.target.checked;
    syncAudio();
  });
  document.getElementById('opt-sfx').addEventListener('change', (e) => {
    audioSettings.sfx = e.target.checked;
    syncAudio();
  });
  document.getElementById('opt-mute').addEventListener('change', (e) => {
    audioSettings.muted = e.target.checked;
    syncAudio();
  });
  syncAudio();
  document.getElementById('dialog-box').addEventListener('click', advanceDialog);
  for (let i = 0; i < 3; i++) {
    document.getElementById(`up-${i}`).addEventListener('click', (e) => {
      applyUpgrade(e.currentTarget.dataset.upgradeId);
    });
  }

  // Show best score on the start screen
  const startBest = Number(localStorage.getItem(HISCORE_KEY) || 0);
  if (startBest > 0) {
    document.getElementById('start-best').textContent = `Best: ${startBest}`;
  }

  // Console debug hook (e.g. __ts.spawn('lancer'), __ts.winWave()).
  // Gated behind ?debug=1 so public players can't open DevTools and cheat scores.
  if (new URLSearchParams(location.search).has('debug')) {
    window.__ts = {
      spawn: (t) => spawnEnemy(t),
      winWave() {
        for (const e of enemies) e.hp = 0;
        for (const b of hostileBuildings()) b.hp = 0;
      },
      state,
      // Adventure helpers for console testing
      goto(x, y) { player.x = x; player.y = y; updateCamera(0, true); },
      give(res, n = 1) {
        if (state.adventure) { state.adventure[res] += n; saveAdventure(); }
      },
      xp(skillId, n = 100) {
        if (state.adventure) grantXp(skillId, n);
      },
      tpIsland(name) {
        const isle = ADV.world.islands.find(i => i.name.toLowerCase().startsWith(String(name).toLowerCase()));
        if (isle) this.goto((isle.x0 + isle.x1) / 2 * TILE, (isle.y0 + isle.y1) / 2 * TILE);
      },
      resetSpinnerCooldown() {
        if (state.adventure) { state.adventure.spinnerLastFree = 0; saveAdventure(); }
      },
      finishBuilds() {
        if (!state.adventure) return;
        for (const id of Object.keys(state.adventure.plots)) {
          state.adventure.plots[id].finishAt = Date.now();
        }
        saveAdventure();
      },
      syncCloud: syncCloudSave,
      pushCloud: pushCloudSave,
      presence: () => ({ joined: !!islesChannel, ghosts: ghosts.size }),
      applyUpgrade,       // console testing of the Survival upgrade caps
      isUpgradeMaxed,
      upgradeCaps: UPGRADE_CAPS,
    };
    Object.defineProperty(window.__ts, 'ghosts', { get: () => ghosts });
    Object.defineProperty(window.__ts, 'player', { get: () => player });
    Object.defineProperty(window.__ts, 'enemies', { get: () => enemies });
    Object.defineProperty(window.__ts, 'buildings', { get: () => buildings });
    Object.defineProperty(window.__ts, 'decors', { get: () => decors });
    Object.defineProperty(window.__ts, 'sheep', { get: () => sheepList });
    Object.defineProperty(window.__ts, 'npcs', { get: () => npcList });
    Object.defineProperty(window.__ts, 'cam', { get: () => cam });
    Object.defineProperty(window.__ts, 'bgm', { get: () => bgm });
    Object.defineProperty(window.__ts, 'bgmTrack', { get: () => bgmTrack });
  }

  // ---------- Boot ----------
  loadAssets().then(() => {
    buildFoamList();
    clouds = [];
    for (let i = 0; i < 6; i++) {
      clouds.push({
        sheet: pickRandom(CLOUD_SHEETS),
        x: rand(-300, W),
        y: rand(0, H - 250),
        spd: rand(5, 13),
      });
    }
    // Idle island as the menu backdrop
    state.campaign = null;
    player = defaultPlayer();
    resetWorld();
    buildMapLayers('tiles');
    decors = makeDecors(11);
    for (let i = 0; i < 4; i++) sheepList.push(makeSheep());
    assetsReady = true;
  }).catch((err) => {
    document.body.insertAdjacentHTML('beforeend',
      `<p style="position:absolute;top:10px;left:10px;color:#fff;font-family:monospace">${err.message}</p>`);
  });
  requestAnimationFrame(loop);
})();
