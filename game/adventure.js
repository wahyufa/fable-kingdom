/*
 * Fable Kingdom — Adventure mode data.
 * Tuning for the peaceful open-world gathering mode lives here, away from the
 * engine (same data/engine split as campaign.js). Node kinds reference decor
 * kinds in game.js (tree / goldstone) plus the roaming sheep.
 */
window.ADVENTURE = {
  // --- Open world: an archipelago of islands linked by wooden bridges ---
  // Tile grid for adventure only; combat modes keep their own small island.
  world: {
    mapW: 64,
    mapH: 44,
    spawn: { tx: 14, ty: 31 },   // Meadowhome, near the central bridge
    // Islands are rectangles in tile coords (inclusive). `palette` selects one
    // of the five tileset colours so each region reads differently. Per-island
    // resource counts give each region a Kintara-style speciality.
    islands: [
      { name: 'Meadowhome',  palette: 'tiles',  x0: 3,  y0: 22, x1: 27, y1: 40, trees: 6,  gold: 2,  sheep: 4, props: 10 },
      { name: 'Pinehollow',  palette: 'tiles2', x0: 3,  y0: 3,  x1: 27, y1: 19, trees: 16, gold: 1,  sheep: 1, props: 8 },
      { name: 'Gold Hills',  palette: 'tiles5', x0: 30, y0: 20, x1: 58, y1: 40, trees: 3,  gold: 12, sheep: 1, props: 10 },
      { name: 'North Grove', palette: 'tiles3', x0: 30, y0: 3,  x1: 58, y1: 17, trees: 8,  gold: 4,  sheep: 3, props: 8 },
    ],
    // Bridges span the water gaps; tiles listed become walkable. dir picks the
    // sprite (h = horizontal deck, v = vertical deck).
    bridges: [
      { dir: 'v', x0: 12, x1: 13, y0: 20, y1: 21 },  // Pinehollow  <-> Meadowhome
      { dir: 'v', x0: 44, x1: 45, y0: 18, y1: 19 },  // North Grove <-> Gold Hills
      { dir: 'h', x0: 28, x1: 29, y0: 31, y1: 32 },  // Meadowhome  <-> Gold Hills
    ],
    // Decorative landmark buildings (non-combat — see BUILDING_DEFS hostile:false).
    // tx/ty are tile coords.
    buildings: [
      { type: 'monastery', tx: 18, ty: 26 },   // Meadowhome, near spawn
      { type: 'house1',     tx: 8,  ty: 34 },  // Meadowhome
      { type: 'house2',     tx: 22, ty: 36 },  // Meadowhome
      { type: 'archery',    tx: 46, ty: 28 },  // Gold Hills
      { type: 'house3',     tx: 6,  ty: 10 },  // Pinehollow
      { type: 'house2',     tx: 44, ty: 8 },   // North Grove
      // v2 Knight buildings (color randomized per instance) — extra landmark variety
      { type: 'v2_castle',  tx: 36, ty: 32 },  // Gold Hills — a keep on the hill
      { type: 'v2_house',   tx: 20, ty: 6 },   // Pinehollow — a second cabin
      { type: 'v2_tower',   tx: 36, ty: 10 },  // North Grove — forest watchtower
    ],
    // Friendly NPCs (Yellow faction, idle only — see SHEETS yellow_*_idle).
    // Talk range reuses the harvest-interact radius; lines picked at random per talk.
    npcs: [
      { id: 'wren', sprite: 'yellow_pawn', name: 'Elder Wren', avatar: 'assets/avatar_npc1.png', tx: 20, ty: 28, lines: [
        'The Monastery keeps our records — and our prayers.',
        'New to Bluehaven\'s isles? Chop, mine, and tend the flock — the ledger tracks it all.',
        'Cross the bridges when you\'re ready. Every isle has its own bounty.',
      ], quest: { res: 'wood', amount: 15, rewardGold: 40, rewardXpSkill: 'woodcutting', rewardXp: 50,
        askText: 'The Monastery roof needs mending. Bring me 15 wood and I\'ll see you paid fairly.',
        doneText: 'Just what the roof needed. My thanks, truly.' } },
      { id: 'elin', sprite: 'yellow_archer', name: 'Scout Elin', avatar: 'assets/avatar_npc2.png', tx: 44, ty: 26, lines: [
        'Gold Hills has the richest veins on the isles — mine well.',
        'Keep an eye on the tide. The lowlands flood when the moon\'s full... or so the miners say.',
        'Check your ledger — the daily bounty rewards gold handsomely.',
      ], quest: { res: 'gold', amount: 10, rewardGold: 30, rewardXpSkill: 'mining', rewardXp: 50,
        askText: 'Short on coin for supplies. Spare 10 gold from your haul and I\'ll make it worth your while.',
        doneText: 'That covers it. You\'ve a good eye for ore, I\'d wager.' } },
      { id: 'osric', sprite: 'yellow_monk', name: 'Brother Osric', avatar: 'assets/avatar_npc3.png', tx: 8, ty: 12, lines: [
        'The pines remember every axe that\'s touched them.',
        'Woodcutting grows the arm and the patience alike.',
        'Rest here a while. The grove asks nothing of you but quiet.',
      ], quest: { res: 'meat', amount: 8, rewardGold: 35, rewardXpSkill: 'husbandry', rewardXp: 50,
        askText: 'A quiet meal steadies the mind. Bring 8 meat and share it with the grove.',
        doneText: 'The grove thanks you, even if it can\'t say so itself.' } },
      { id: 'fenn', sprite: 'yellow_warrior', name: 'Ranger Fenn', avatar: 'assets/avatar_npc4.png', tx: 46, ty: 10, lines: [
        'North Grove\'s quiet — mind the tree line after dusk, even here.',
        'Sheep wander far when they\'re happy. That\'s a good sign.',
        'Bridges hold as long as the pilings do. Cross with a steady step.',
      ], quest: { res: 'wood', amount: 12, rewardGold: 35, rewardXpSkill: 'woodcutting', rewardXp: 50,
        askText: 'Need to shore up the bridge pilings. 12 wood should do it.',
        doneText: 'Solid stock. The bridge will hold another season.' } },
      // Stationed at the 3 new v2 Knight landmarks
      { id: 'doran', sprite: 'yellow_warrior', name: 'Captain Doran', avatar: 'assets/avatar_npc5.png', tx: 38, ty: 34, lines: [
        'This keep watches over Gold Hills — nobody digs without us knowing.',
        'The old knights built solid. This castle\'s outlasted three roofs on my own house.',
        'Quiet duty, mostly. The hills keep to themselves.',
      ], quest: { res: 'gold', amount: 15, rewardGold: 45, rewardXpSkill: 'mining', rewardXp: 60,
        askText: 'The garrison needs provisioning. 15 gold and I\'ll square you with the quartermaster.',
        doneText: 'Counted and accepted. The keep remembers a fair trade.' } },
      { id: 'isla', sprite: 'yellow_archer', name: 'Watcher Isla', avatar: 'assets/avatar_npc6.png', tx: 34, ty: 12, lines: [
        'From this tower I can see clear to the coast on a good day.',
        'North Grove looks peaceful from up here. Looks can lie.',
        'Climb up sometime — the view is worth the ladder.',
      ], quest: { res: 'meat', amount: 6, rewardGold: 30, rewardXpSkill: 'husbandry', rewardXp: 50,
        askText: 'Long watches make for a hungry lookout. 6 meat would go a long way.',
        doneText: 'Now that\'s a proper watch-shift meal. Much obliged.' } },
      { id: 'tam', sprite: 'yellow_pawn', name: 'Old Tam', avatar: 'assets/avatar_npc7.png', tx: 22, ty: 8, lines: [
        'Built this cabin myself, board by board. Pinehollow\'s good to a patient builder.',
        'You look like you could use a rest. Sit a while, if you like.',
        'Nothing wrong with a quiet corner of the isles. Not everyone needs a castle.',
      ], quest: { res: 'wood', amount: 10, rewardGold: 30, rewardXpSkill: 'woodcutting', rewardXp: 50,
        askText: 'Patching the porch. 10 wood and I\'ll finally finish the job.',
        doneText: 'That\'ll do it. Come sit on the porch once it\'s done.' } },
      // --- Role NPCs: the isles are the hub, these are its doorways ---
      // (role NPCs skip the quest/flavor dialog — see talkToNpc in game.js)
      { id: 'brack', sprite: 'yellow_warrior', name: 'Sergeant Brack', avatar: 'assets/avatar_npc8.png',
        tx: 48, ty: 30, role: 'survival',
        gateTitle: 'The Trial Grounds',
        gateText: 'Endless waves on the old battle isle — no mercy, no second chances, glory for the boldest. Your kingdom\'s stores stay safe at home. Ready to test your mettle?',
        gateConfirm: 'FIGHT',
        lines: ['The trial waits for no one. Speak up when you\'re ready.'] },
      { id: 'rosalind', sprite: 'yellow_monk', name: 'Herald Rosalind', avatar: 'assets/avatar_npc9.png',
        tx: 16, ty: 26, role: 'story',
        gateTitle: 'The Stolen Banner',
        gateText: 'Captain Redmane sails with the King\'s Banner and the whole tale is waiting to be told — six acts across the isles, from first landing to his castle gate. Shall I begin?',
        gateConfirm: 'BEGIN THE TALE',
        lines: ['Every kingdom is a story. Ours just needs someone to finish it.'] },
      { id: 'marla', sprite: 'yellow_pawn', name: 'Merchant Marla', avatar: 'assets/avatar_npc10.png',
        tx: 15, ty: 33, role: 'shop',
        lines: ['Finest cloth on the isles, dyed and stitched by my own hand.'] },
    ],
  },
  // Harvest nodes: swings per node, yield + skill XP per swing, respawn (seconds)
  nodes: {
    tree:      { hits: 3, yield: 'wood', respawn: 45, skill: 'woodcutting', xp: 6 },
    goldstone: { hits: 4, yield: 'gold', respawn: 60, skill: 'mining', xp: 6 },
    sheep:     { amount: 2, skill: 'husbandry', xp: 10 },   // meat per sheep
  },
  // Which carried tool works each target
  tools: { tree: 'axe', goldstone: 'pickaxe', sheep: 'knife' },
  // Interact swing length (seconds) per tool — matched to sheet frame counts
  interactDur: { axe: 0.6, pickaxe: 0.6, knife: 0.4 },
  hotbar: ['axe', 'pickaxe', 'knife'],   // slots on keys 1-3
  skills: {
    woodcutting: { label: 'WOODCUTTING' },
    mining:      { label: 'MINING' },
    husbandry:   { label: 'HUSBANDRY' },
  },
  // XP to clear level N is base * growth^(N-1); levels cap out at `cap`
  xpCurve: { base: 60, growth: 1.4, cap: 20 },
  // Per level above 1: faster swings (to a max) + chance of a bonus drop
  perks: { swingHaste: 0.03, swingHasteMax: 0.4, bonusYield: 0.02 },
  // Daily quests: three per UTC day, targets rolled from the date seed so
  // every player gets the same goals. Finishing pays gold + skill XP.
  daily: {
    goals: {
      wood: { min: 12, max: 24, label: 'CHOP WOOD',   skill: 'woodcutting' },
      gold: { min: 8,  max: 16, label: 'MINE GOLD',   skill: 'mining' },
      meat: { min: 4,  max: 10, label: 'GATHER MEAT', skill: 'husbandry' },
    },
    goldRewardRate: { wood: 1.5, gold: 1, meat: 2 },  // reward gold per target unit
    xpReward: 80,                                     // bonus XP in the matching skill
  },
  // Cosmetic-only Pawn skins — gold sink, zero effect on stats/speed/yield.
  // 'blue' is the default, always owned, and uses the un-prefixed base sheets.
  cosmetics: {
    skins: [
      { id: 'blue',   name: 'KNIGHT BLUE',  cost: 0 },
      { id: 'red',    name: 'EMBER RED',    cost: 150 },
      { id: 'purple', name: 'TWILIGHT',     cost: 150 },
      { id: 'black',  name: 'SHADOWED',     cost: 250 },
      // Knight's Crest exclusive: not buyable — unlocked by holding $FADOM
      // (crest comes from the server, see verify-holdings). Hidden entirely
      // while the token feature is unconfigured.
      { id: 'gold',   name: 'GILDED',       cost: 0, crest: true },
    ],
  },
  // Small flat chance of a bonus "lucky find" on any harvest — on top of (not
  // instead of) the per-skill-level bonusYield chance already in `perks`.
  luckyFind: { chance: 0.04, minGold: 5, maxGold: 15 },
  // Player-built structures (v1). Plots are fixed spots in Meadowhome; any
  // option can go on any plot. Construction runs on real time (buildSecs) so
  // there's a reason to come back — finished buildings persist in the save.
  building: {
    plots: [
      { id: 'plot_a', tx: 7,  ty: 27 },   // Meadowhome NW clearing
      { id: 'plot_b', tx: 11, ty: 37 },   // south, between the two houses
      { id: 'plot_c', tx: 24, ty: 27 },   // east, on the way to Gold Hills
    ],
    // Costs scale steeply — the KEEP is the long-term gold sink.
    options: [
      { type: 'v2_house',  name: 'COTTAGE',    wood: 30,  gold: 40,  buildSecs: 90 },
      { type: 'v2_tower',  name: 'WATCHTOWER', wood: 60,  gold: 90,  buildSecs: 240 },
      { type: 'v2_castle', name: 'KEEP',       wood: 140, gold: 220, buildSecs: 600 },
    ],
  },
  // Combat pays the kingdom: Survival banks spoils per completed wave, Story
  // acts each pay a one-time gold bounty (replays never pay twice).
  spoils: {
    survivalGoldPerWave: 3,
    survivalWoodPerWave: 2,
    actBountyGold: 30,
    campaignBountyGold: 120,   // one-time, on finishing all six acts
  },
  // Free spin every UTC day; paid spin costs gold. Prize weights are relative
  // (bigger weight = more common). Amounts are per-resource ranges.
  spinner: {
    freeCooldownHours: 24,
    paidCostGold: 40,
    prizes: [
      { res: 'wood', min: 5, max: 15, weight: 30 },
      { res: 'gold', min: 3, max: 10, weight: 25 },
      { res: 'meat', min: 3, max: 10, weight: 25 },
      { res: 'gold', min: 20, max: 40, weight: 8 },   // rare-ish mid prize
      { res: 'wood', min: 30, max: 50, weight: 8 },
      { res: 'gold', min: 80, max: 120, weight: 4 },  // jackpot
    ],
  },
};
