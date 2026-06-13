/*
 * Tiny Swords — Island Defense
 * Story campaign + endless survival built on the Tiny Swords free asset pack.
 * Vanilla JS + Canvas. Campaign data lives in campaign.js (window.CAMPAIGN).
 */
(() => {
  'use strict';

  // ---------- Constants ----------
  const TILE = 64;
  const MAP_W = 30;             // tiles
  const MAP_H = 19;             // tiles
  const W = MAP_W * TILE;       // world width: 1920
  const H = MAP_H * TILE;       // world height: 1216
  const VIEW_H = 768;           // logical viewport height; width follows the window aspect
  // Island occupies the tiles inside the one-tile water ring
  const ISLE = { x0: 1, y0: 1, x1: MAP_W - 2, y1: MAP_H - 2 };
  // Pixel bounds units may walk in (small margin inside the grass)
  const BOUNDS = {
    x0: ISLE.x0 * TILE + 20,
    y0: ISLE.y0 * TILE + 20,
    x1: (ISLE.x1 + 1) * TILE - 20,
    y1: (ISLE.y1 + 1) * TILE - 20,
  };

  const FACTIONS = ['red', 'purple', 'black'];
  const ACTS = window.CAMPAIGN.acts;
  const CHARS = window.CAMPAIGN.characters;

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
    bush:         { src: 'assets/bush.png', frameW: 128, frameH: 128 },
    goldstone:    { src: 'assets/goldstone.png' },
    rock1:        { src: 'assets/rock1.png' },
    rock2:        { src: 'assets/rock2.png' },
    meat:         { src: 'assets/meat.png' },
    gold:         { src: 'assets/gold.png' },
    sheep_idle:   { src: 'assets/sheep_idle.png', frameW: 128, frameH: 128 },
    sheep_move:   { src: 'assets/sheep_move.png', frameW: 128, frameH: 128 },
    explosion:    { src: 'assets/explosion.png', frameW: 192, frameH: 192 },
    dust:         { src: 'assets/dust.png', frameW: 64, frameH: 64 },
    fire:         { src: 'assets/fire.png', frameW: 64, frameH: 64 },
    cloud1:       { src: 'assets/cloud1.png' },
    cloud2:       { src: 'assets/cloud2.png' },
    house_blue1:  { src: 'assets/house_blue1.png' },
    house_blue2:  { src: 'assets/house_blue2.png' },
    house_blue3:  { src: 'assets/house_blue3.png' },
    tower_red:    { src: 'assets/tower_red.png' },
    tower_black:  { src: 'assets/tower_black.png' },
    barracks_black: { src: 'assets/barracks_black.png' },
    castle_red:   { src: 'assets/castle_red.png' },
    // --- Tiny Swords v2 additions (multi-row sheets declare row + frames) ---
    goblin_torch_idle:  { src: 'assets/goblin_torch.png', frameW: 192, frameH: 192, row: 0, frames: 7 },
    goblin_torch_run:   { src: 'assets/goblin_torch.png', frameW: 192, frameH: 192, row: 1, frames: 6 },
    goblin_torch_atk_r: { src: 'assets/goblin_torch.png', frameW: 192, frameH: 192, row: 2, frames: 6 },
    goblin_torch_atk_d: { src: 'assets/goblin_torch.png', frameW: 192, frameH: 192, row: 3, frames: 6 },
    goblin_torch_atk_u: { src: 'assets/goblin_torch.png', frameW: 192, frameH: 192, row: 4, frames: 6 },
    goblin_tnt_idle:    { src: 'assets/goblin_tnt.png', frameW: 192, frameH: 192, row: 0, frames: 6 },
    goblin_tnt_run:     { src: 'assets/goblin_tnt.png', frameW: 192, frameH: 192, row: 1, frames: 6 },
    goblin_tnt_throw:   { src: 'assets/goblin_tnt.png', frameW: 192, frameH: 192, row: 2, frames: 7 },
    goblin_barrel_idle: { src: 'assets/goblin_barrel.png', frameW: 128, frameH: 128, row: 1, frames: 6 },
    goblin_barrel_run:  { src: 'assets/goblin_barrel.png', frameW: 128, frameH: 128, row: 3, frames: 6 },
    goblin_barrel_fuse: { src: 'assets/goblin_barrel.png', frameW: 128, frameH: 128, row: 5, frames: 3 },
    dynamite:     { src: 'assets/dynamite.png', frameW: 64, frameH: 64 },
    dead:         { src: 'assets/dead.png', frameW: 128, frameH: 128, row: 0, frames: 7 },
    wood_tower:   { src: 'assets/wood_tower.png', frameW: 256, frameH: 192 },
    wood_tower_destroyed: { src: 'assets/wood_tower_destroyed.png' },
    goblin_house: { src: 'assets/goblin_house.png' },
    goblin_house_destroyed: { src: 'assets/goblin_house_destroyed.png' },
  };
  // Small ground props from the v2 Deco set
  for (let i = 1; i <= 18; i++) {
    const id = String(i).padStart(2, '0');
    SHEETS[`deco_${id}`] = { src: `assets/deco_${id}.png` };
  }
  // Unit sheets exist for every enemy faction with a uniform naming scheme
  for (const f of FACTIONS) {
    SHEETS[`${f}_warrior_idle`]   = { src: `assets/${f}_warrior_idle.png`, frameW: 192, frameH: 192 };
    SHEETS[`${f}_warrior_run`]    = { src: `assets/${f}_warrior_run.png`, frameW: 192, frameH: 192 };
    SHEETS[`${f}_warrior_attack`] = { src: `assets/${f}_warrior_attack.png`, frameW: 192, frameH: 192 };
    SHEETS[`${f}_archer_idle`]    = { src: `assets/${f}_archer_idle.png`, frameW: 192, frameH: 192 };
    SHEETS[`${f}_archer_run`]     = { src: `assets/${f}_archer_run.png`, frameW: 192, frameH: 192 };
    SHEETS[`${f}_archer_shoot`]   = { src: `assets/${f}_archer_shoot.png`, frameW: 192, frameH: 192 };
    SHEETS[`${f}_lancer_idle`]    = { src: `assets/${f}_lancer_idle.png`, frameW: 320, frameH: 320 };
    SHEETS[`${f}_lancer_run`]     = { src: `assets/${f}_lancer_run.png`, frameW: 320, frameH: 320 };
    for (const dir of ['r', 'u', 'd', 'ur', 'dr']) {
      SHEETS[`${f}_lancer_atk_${dir}`] = { src: `assets/${f}_lancer_atk_${dir}.png`, frameW: 320, frameH: 320 };
    }
    SHEETS[`${f}_monk_idle`]    = { src: `assets/${f}_monk_idle.png`, frameW: 192, frameH: 192 };
    SHEETS[`${f}_monk_run`]     = { src: `assets/${f}_monk_run.png`, frameW: 192, frameH: 192 };
    SHEETS[`${f}_monk_heal`]    = { src: `assets/${f}_monk_heal.png`, frameW: 192, frameH: 192 };
    SHEETS[`${f}_monk_heal_fx`] = { src: `assets/${f}_monk_heal_fx.png`, frameW: 192, frameH: 192 };
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
    wood_tower:   { sheet: 'wood_tower', animFps: 6, hostile: true, r: 60, anchorY: 182, lobs: true, score: 50, ruin: 'wood_tower_destroyed' },
    goblin_house: { sheet: 'goblin_house', hostile: true, r: 45, anchorY: 182, spawns: 'torch', spawnEvery: 8, score: 50, ruin: 'goblin_house_destroyed' },
  };

  function buildingSheet(b) {
    const def = BUILDING_DEFS[b.type];
    return b.type === 'tower' ? `tower_${b.faction}` : def.sheet;
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
      if (state.mode === 'playing' || state.mode === 'paused') togglePause();
      return;
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

  // ---------- Audio (synthesized SFX + looping BGM) ----------
  const audio = { ctx: null };

  // Music / SFX toggles live in the pause menu; M is a master mute on top
  const AUDIO_KEY = 'fableKingdomAudio';
  const audioSettings = Object.assign(
    { music: true, sfx: true, muted: false },
    JSON.parse(localStorage.getItem(AUDIO_KEY) || '{}')
  );

  const sfxOn = () => audioSettings.sfx && !audioSettings.muted;

  // BGM is optional: if assets/audio/bgm.mp3 is missing, the game stays silent
  let bgm = new Audio('assets/audio/bgm.mp3');
  bgm.loop = true;
  bgm.volume = 0.35;
  bgm.onerror = () => { bgm = null; };

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

  // ---------- Game state ----------
  const state = {
    mode: 'start',          // start | playing | upgrade | dialog | gameover | victory
    campaign: null,         // null = survival, else { act, wave }
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

  let player, enemies, arrows, bombs, corpses, pickups, effects, sheepList, decors, buildings, clouds;

  function defaultPlayer() {
    return {
      x: W / 2, y: H / 2 + 100,
      hp: 100, maxHp: 100,
      speed: 230,
      dmg: 35,
      atkDur: 4 / 12,       // attack animation length; upgrades shorten it
      flip: false,
      state: 'idle',        // idle | run | attack
      animT: 0,
      attackT: 0,
      didHit: false,
      hurtT: 0,             // invulnerability window
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
  function makeDecors(treeCount) {
    const list = [];
    const center = { x: W / 2, y: H / 2 };
    const playerStart = { x: W / 2, y: H - 220 };
    const kinds = [
      ['tree', treeCount], ['bush', 8], ['goldstone', 3], ['rock', 5], ['smalldeco', 12],
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
        // smalldeco picks one of the 15 small v2 ground props
        const variant = kind === 'smalldeco' ? randInt(1, 15) : randInt(1, 2);
        list.push({ kind, x: p.x, y: p.y, animT: rand(0, 2), variant });
      }
    }
    return list;
  }

  function makeBuildings(defs) {
    return (defs || []).map(d => ({
      type: d.type,
      faction: d.faction || 'red',
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
    updateCamera(0, true);
    runStartedAt = Date.now();
    track('run_start', { mode: 'survival' });
  }

  function startCampaign() {
    state.campaign = { act: 0, wave: 0 };
    player = defaultPlayer();
    state.score = 0;
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
    // 1) Victory beat for the act that just ended
    showBanner(`ACT ${c.act + 1} COMPLETE`, ACTS[c.act].title, `Score: ${state.score}`, 2400, () => {
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
    document.getElementById('final-stats').textContent = state.campaign
      ? `Act ${state.campaign.act + 1}: ${ACTS[state.campaign.act].title} — Score ${state.score}`
      : `Wave ${state.wave} — Score ${state.score}`;
    document.getElementById('best-line').textContent = saveBest();
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
    const who = CHARS[scenes[i].who];
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
      e.atkSheet = 'goblin_torch_atk_r';
      e.atkFlip = false;
    } else if (type === 'tnt') {
      e.hp = 45;
      e.speed = 85;
      e.dmg = 14;
    } else if (type === 'barrel') {
      e.hp = 60;
      e.speed = 115;
      e.dmg = 30;
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
      if (!s) continue;
      const c = { x: dec.x, y: dec.y + s.cy };
      const d = dist(ent, c);
      if (d > 0 && d < s.r) {
        ent.x = c.x + (ent.x - c.x) / d * s.r;
        ent.y = c.y + (ent.y - c.y) / d * s.r;
      }
    }
  }

  function updatePlayer(dt) {
    const p = player;
    if (p.hurtT > 0) p.hurtT -= dt;

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

    // Movement
    let dx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
    let dy = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      p.x = clamp(p.x + dx / len * p.speed * dt, BOUNDS.x0, BOUNDS.x1);
      p.y = clamp(p.y + dy / len * p.speed * dt, BOUNDS.y0, BOUNDS.y1);
      if (dx) p.flip = dx < 0;
      p.state = 'run';
    } else {
      p.state = 'idle';
    }
    pushOutOfSolids(p);

    // Attack
    if (attackQueued) {
      attackQueued = false;
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

  function startLancerAttack(e) {
    e.state = 'attack';
    e.actionT = 0;
    e.didAct = false;
    e.atkAngle = Math.atan2(player.y - e.y, player.x - e.x);
    // Pick the directional sheet nearest the thrust angle; flip covers the left side
    const deg = e.atkAngle * 180 / Math.PI; // -180..180, 0 = right, +90 = down
    const a = Math.abs(deg);
    const F = e.faction;
    if (a <= 22.5)       { e.atkSheet = `${F}_lancer_atk_r`;  e.atkFlip = false; }
    else if (a >= 157.5) { e.atkSheet = `${F}_lancer_atk_r`;  e.atkFlip = true; }
    else if (deg > 112.5)  { e.atkSheet = `${F}_lancer_atk_dr`; e.atkFlip = true; }
    else if (deg > 67.5)   { e.atkSheet = `${F}_lancer_atk_d`;  e.atkFlip = false; }
    else if (deg > 22.5)   { e.atkSheet = `${F}_lancer_atk_dr`; e.atkFlip = false; }
    else if (deg < -112.5) { e.atkSheet = `${F}_lancer_atk_ur`; e.atkFlip = true; }
    else if (deg < -67.5)  { e.atkSheet = `${F}_lancer_atk_u`;  e.atkFlip = false; }
    else                   { e.atkSheet = `${F}_lancer_atk_ur`; e.atkFlip = false; }
    e.flip = e.atkFlip;
  }

  function startTorchAttack(e) {
    e.state = 'attack';
    e.actionT = 0;
    e.didAct = false;
    const deg = Math.atan2(player.y - e.y, player.x - e.x) * 180 / Math.PI;
    if (deg > 45 && deg < 135) {
      e.atkSheet = 'goblin_torch_atk_d';
      e.atkFlip = false;
    } else if (deg < -45 && deg > -135) {
      e.atkSheet = 'goblin_torch_atk_u';
      e.atkFlip = false;
    } else {
      e.atkSheet = 'goblin_torch_atk_r';
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
      const s = makeSheep();
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
        s.x = clamp(s.x + s.vx * dt, BOUNDS.x0 + 40, BOUNDS.x1 - 40);
        s.y = clamp(s.y + s.vy * dt, BOUNDS.y0 + 40, BOUNDS.y1 - 40);
        pushOutOfSolids(s);
      }
    }
  }

  function updatePickups(dt) {
    for (let i = pickups.length - 1; i >= 0; i--) {
      const m = pickups[i];
      m.t += dt;
      if (dist(m, player) < 45) {
        if (m.type === 'meat') {
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
      // playerStatsText() returns trusted HTML (it builds the .stat-up span itself)
      grid.innerHTML = playerStatsText()
        .map(([k, v]) => `<span class="stat-key">${k}</span><span class="stat-val">${v}</span>`)
        .join('');
      screen.classList.remove('hidden');
    } else if (state.mode === 'paused') {
      state.mode = 'playing';
      attackQueued = false;
      screen.classList.add('hidden');
    }
  }

  // ---------- Upgrades ----------
  const UPGRADES = [
    { id: 'dmg',    name: 'Sharper Blade', desc: '+10 damage' },
    { id: 'hp',     name: 'Tougher Armor', desc: '+25 max HP' },
    { id: 'speed',  name: 'Swift Boots',   desc: '+12% move speed' },
    { id: 'atkspd', name: 'Quick Swing',   desc: '+20% attack speed' },
    { id: 'feast',  name: 'Feast',         desc: 'Heal to full' },
  ];

  function offerUpgrades() {
    const pool = [...UPGRADES].sort(() => Math.random() - 0.5).slice(0, 3);
    state.mode = 'upgrade';
    document.getElementById('upgrade-stats').innerHTML =
      playerStatsText().map(([k, v]) => `${k} ${v}`).join('  &middot;  ');
    pool.forEach((up, i) => {
      const btn = document.getElementById(`up-${i}`);
      btn.querySelector('.up-name').textContent = up.name;
      btn.querySelector('.up-desc').textContent = up.desc;
      btn.dataset.upgradeId = up.id;
    });
    document.getElementById('upgrade-screen').classList.remove('hidden');
  }

  function applyUpgrade(id) {
    if (id === 'dmg') player.dmg += 10;
    else if (id === 'hp') { player.maxHp += 25; player.hp += 25; }
    else if (id === 'speed') player.speed *= 1.12;
    else if (id === 'atkspd') player.atkDur *= 0.8;
    else if (id === 'feast') player.hp = player.maxHp;
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
      drawFrame('tree', animFrame('tree', state.time + d.animT, 8), d.x, d.y, false, 1, 96, 225);
    } else if (d.kind === 'bush') {
      drawFrame('bush', animFrame('bush', state.time + d.animT, 6), d.x, d.y, false, 1, 64, 95);
    } else if (d.kind === 'rock') {
      ctx.drawImage(img[`rock${d.variant}`], d.x - 32, d.y - 50);
    } else if (d.kind === 'smalldeco') {
      const im = img[`deco_${String(d.variant).padStart(2, '0')}`];
      ctx.drawImage(im, d.x - im.width / 2, d.y - im.height + 14);
    } else if (d.kind === 'ruin') {
      const im = img[d.sheet];
      ctx.drawImage(im, d.x - im.width / 2, d.y - 182);
    } else {
      ctx.drawImage(img.goldstone, d.x - 64, d.y - 95);
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

  function drawPlayer() {
    const p = player;
    drawShadow(p.x, p.y + 30, 0.62);
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
        const frame = Math.min(Math.floor(e.actionT * 10), SHEETS[`${F}_warrior_attack`].frames - 1);
        drawFrame(`${F}_warrior_attack`, frame, e.x, e.y, e.flip, sc);
      } else if (e.state === 'run') {
        drawFrame(`${F}_warrior_run`, animFrame(`${F}_warrior_run`, e.animT, 10), e.x, e.y, e.flip, sc);
      } else {
        drawFrame(`${F}_warrior_idle`, animFrame(`${F}_warrior_idle`, e.animT, 8), e.x, e.y, e.flip, sc);
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
        drawFrame(`${F}_lancer_idle`, animFrame(`${F}_lancer_idle`, e.animT, 10), e.x, e.y, e.flip);
      }
    } else if (e.type === 'torch') {
      if (e.state === 'attack') {
        const frame = Math.min(Math.floor(e.actionT * 12), SHEETS[e.atkSheet].frames - 1);
        drawFrame(e.atkSheet, frame, e.x, e.y, e.atkFlip);
      } else if (e.state === 'run') {
        drawFrame('goblin_torch_run', animFrame('goblin_torch_run', e.animT, 10), e.x, e.y, e.flip);
      } else {
        drawFrame('goblin_torch_idle', animFrame('goblin_torch_idle', e.animT, 8), e.x, e.y, e.flip);
      }
    } else if (e.type === 'tnt') {
      if (e.state === 'throw') {
        const frame = Math.min(Math.floor(e.actionT * 10), SHEETS.goblin_tnt_throw.frames - 1);
        drawFrame('goblin_tnt_throw', frame, e.x, e.y, e.flip);
      } else if (e.state === 'run') {
        drawFrame('goblin_tnt_run', animFrame('goblin_tnt_run', e.animT, 10), e.x, e.y, e.flip);
      } else {
        drawFrame('goblin_tnt_idle', animFrame('goblin_tnt_idle', e.animT, 8), e.x, e.y, e.flip);
      }
    } else if (e.type === 'barrel') {
      if (e.state === 'fuse') {
        const frame = Math.min(Math.floor(e.actionT / FUSE_DUR * 3), 2);
        drawFrame('goblin_barrel_fuse', frame, e.x, e.y, e.flip, 1.2);
      } else if (e.state === 'run') {
        drawFrame('goblin_barrel_run', animFrame('goblin_barrel_run', e.animT, 10), e.x, e.y, e.flip, 1.2);
      } else {
        drawFrame('goblin_barrel_idle', animFrame('goblin_barrel_idle', e.animT, 8), e.x, e.y, e.flip, 1.2);
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
    const url = `${LB_CFG.supabaseUrl}/rest/v1/scores` +
      `?mode=eq.${mode}&select=name,score,wave,player_id&order=score.desc&limit=100`;
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

  // ---------- Auth (Solana wallet via Edge Function) ----------
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
    return w ? `${w.slice(0, 4)}…${w.slice(-4)}` : '';
  }

  function updateAuthUI() {
    if (!lbEnabled) return;
    const line = document.getElementById('account-line');
    const btn = document.getElementById('auth-btn');
    if (session) {
      const label = session.user.name || shortWallet(session.user.wallet);
      line.textContent = `CONNECTED: ${label.toUpperCase()}`;
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

  function detectWalletProvider() {
    if (window.phantom?.solana?.isPhantom) return window.phantom.solana;
    if (window.solana?.isPhantom) return window.solana;
    if (window.solflare?.isSolflare) return window.solflare;
    if (window.backpack?.solana) return window.backpack.solana;
    return null;
  }

  async function connectWallet() {
    const provider = detectWalletProvider();
    if (!provider) {
      authStatus('NO SOLANA WALLET FOUND. INSTALL PHANTOM, SOLFLARE OR BACKPACK.');
      return;
    }
    const displayName = document.getElementById('auth-name').value;
    const btn = document.getElementById('connect-btn');
    btn.disabled = true;
    btn.textContent = 'CONNECTING...';
    authStatus('OPEN YOUR WALLET TO APPROVE', true);

    try {
      const resp = await provider.connect();
      const wallet = (resp.publicKey || provider.publicKey).toString();
      const message = `Sign in to Fable Kingdom\nWallet: ${wallet}\nIssued at: ${new Date().toISOString()}`;
      const encoded = new TextEncoder().encode(message);

      authStatus('SIGN THE MESSAGE TO VERIFY', true);
      const signed = await provider.signMessage(encoded, 'utf8');
      const sigBytes = signed.signature || signed;
      let bin = '';
      for (const b of sigBytes) bin += String.fromCharCode(b);
      const signature = btoa(bin);

      authStatus('VERIFYING...', true);
      const res = await fetch(`${LB_CFG.supabaseUrl}/functions/v1/solana-auth`, {
        method: 'POST',
        headers: { apikey: LB_CFG.supabaseAnonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, message, signature, displayName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `auth failed (${res.status})`);

      setSession(data);
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
    setSession(null);
    try { await detectWalletProvider()?.disconnect?.(); } catch {}
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
        `<span class="lb-name">${escapeHtml(r.name)}</span>` +
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
    'start-screen', 'mode-screen', 'lb-screen', 'auth-screen',
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
    track('session_start');
  }

  // ---------- UI wiring ----------
  document.getElementById('play-btn').addEventListener('click', () => navigateTo('mode-screen'));
  document.getElementById('mode-back').addEventListener('click', () => navigateTo('start-screen'));

  document.getElementById('story-btn').addEventListener('click', () => {
    initAudio();
    navigateTo(null); // hide every menu overlay
    startCampaign();
  });
  document.getElementById('survival-btn').addEventListener('click', () => {
    initAudio();
    navigateTo(null);
    startSurvival();
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
  document.getElementById('menu-btn').addEventListener('click', () => location.reload());
  document.getElementById('resume-btn').addEventListener('click', togglePause);
  document.getElementById('exit-btn').addEventListener('click', exitToMenu);

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
    };
    Object.defineProperty(window.__ts, 'player', { get: () => player });
    Object.defineProperty(window.__ts, 'enemies', { get: () => enemies });
    Object.defineProperty(window.__ts, 'buildings', { get: () => buildings });
    Object.defineProperty(window.__ts, 'decors', { get: () => decors });
    Object.defineProperty(window.__ts, 'cam', { get: () => cam });
    Object.defineProperty(window.__ts, 'bgm', { get: () => bgm });
  }

  // ---------- Boot ----------
  loadAssets().then(() => {
    buildFoamList();
    clouds = [];
    for (let i = 0; i < 6; i++) {
      clouds.push({
        sheet: i % 2 ? 'cloud2' : 'cloud1',
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
