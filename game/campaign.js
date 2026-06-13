/*
 * Tiny Swords — Island Defense
 * Campaign data: characters, acts, dialog, wave compositions, buildings.
 * Loaded before game.js; exposes window.CAMPAIGN.
 */
window.CAMPAIGN = {
  characters: {
    knight:   { name: 'The Knight',      img: 'assets/avatar_knight.png' },
    mara:     { name: 'Elder Mara',      img: 'assets/avatar_mara.png' },
    redmane:  { name: 'Captain Redmane', img: 'assets/avatar_redmane.png' },
    goldhelm: { name: 'Goldhelm',        img: 'assets/avatar_goldhelm.png' },
  },

  // Building coordinates are world pixels (1920x1216 map, island inside the water ring)
  acts: [
    {
      title: 'The Burning Village',
      tiles: 'tiles',
      faction: 'red',
      sheep: 4,
      intro: [
        { who: 'mara', text: 'They came at dawn. Captain Redmane took the King\'s Banner... and set our village ablaze.' },
        { who: 'mara', text: 'You are the last knight of Bluehaven. Take your sword and drive them out!' },
      ],
      outro: [
        { who: 'redmane', text: 'Hah! A lone knight? Keep the ashes, boy. The Banner sails east!' },
        { who: 'mara', text: 'Follow him across the isles. And remember — sheep are made of stew. Stew heals.' },
      ],
      buildings: [
        { type: 'house1', x: 520, y: 420, burning: true },
        { type: 'house2', x: 880, y: 330, burning: true },
        { type: 'house3', x: 1390, y: 450, burning: true },
      ],
      waves: [
        { warrior: 2 },
        { warrior: 3 },
      ],
    },
    {
      title: 'The Outpost Shore',
      tiles: 'tiles2',
      faction: 'red',
      sheep: 3,
      intro: [
        { who: 'mara', text: 'Their watchtowers guard this shore. Bring them down, or the arrows will never stop.' },
      ],
      outro: [
        { who: 'redmane', text: 'You broke two towers? I have a hundred more. Turn back, little knight!' },
      ],
      buildings: [
        { type: 'tower', faction: 'red', x: 560, y: 470, hp: 150 },
        { type: 'tower', faction: 'red', x: 1400, y: 830, hp: 150 },
      ],
      waves: [
        { warrior: 2, archer: 1 },
        { warrior: 2, archer: 2 },
        { warrior: 1, archer: 1, lancer: 1 },
      ],
    },
    {
      title: 'The Goblin Marsh',
      tiles: 'tiles3',
      faction: 'goblin',
      sheep: 3,
      intro: [
        { who: 'mara', text: 'Before the woods lies the Goblin Marsh. Wild little things — loyal to no banner, only to Redmane\'s gold.' },
        { who: 'mara', text: 'They throw dynamite, knight. And some of them ARE dynamite. Watch the barrels.' },
      ],
      outro: [
        { who: 'redmane', text: 'Even the goblins?! What do I PAY them for... The Purple Woods will finish you, knight.' },
      ],
      buildings: [
        { type: 'wood_tower', x: 700, y: 380, hp: 140 },
        { type: 'wood_tower', x: 1250, y: 820, hp: 140 },
        { type: 'goblin_house', x: 460, y: 800, hp: 120 },
        { type: 'goblin_house', x: 1450, y: 430, hp: 120 },
      ],
      waves: [
        { torch: 3 },
        { torch: 2, tnt: 2 },
        { torch: 3, tnt: 2, barrel: 2 },
      ],
    },
    {
      title: 'The Purple Woods',
      tiles: 'tiles4',
      faction: 'purple',
      sheep: 1,
      intro: [
        { who: 'goldhelm', text: 'Psst! Over here. Goldhelm, the King\'s last guard — at your service.' },
        { who: 'goldhelm', text: 'The Purple clan rules this forest. Even their monks fight. And mind your wounds — few sheep graze here.' },
      ],
      outro: [
        { who: 'goldhelm', text: 'The Banner is close. Past the Black Fort. I would join you, but... someone must guard this bush.' },
      ],
      buildings: [],
      waves: [
        { warrior: 2, archer: 1 },
        { warrior: 2, archer: 1, monk: 1 },
        { warrior: 3, archer: 2, lancer: 1, monk: 1 },
      ],
    },
    {
      title: 'The Black Fort',
      tiles: 'tiles5',
      faction: 'black',
      sheep: 2,
      intro: [
        { who: 'mara', text: 'The Black Fort. Their barracks forge soldiers faster than you can cut them down.' },
        { who: 'mara', text: 'Destroy the source, knight. Then the tide will turn.' },
      ],
      outro: [
        { who: 'redmane', text: 'ENOUGH! Come to my castle then, knight. I\'ll hang your shield above my throne!' },
      ],
      buildings: [
        { type: 'barracks', faction: 'black', x: 560, y: 470, hp: 220 },
        { type: 'barracks', faction: 'black', x: 1390, y: 860, hp: 220 },
        { type: 'tower', faction: 'black', x: 980, y: 350, hp: 180 },
      ],
      waves: [
        { warrior: 2, lancer: 1 },
        { warrior: 2, archer: 2, monk: 1 },
        { warrior: 3, lancer: 2, monk: 1 },
      ],
    },
    {
      title: 'The Stolen Banner',
      tiles: 'tiles2',
      faction: 'red',
      sheep: 2,
      intro: [
        { who: 'goldhelm', text: 'This is it. Redmane hides behind his castle walls, and the Banner with him.' },
        { who: 'goldhelm', text: 'Tear the castle down. Take back what is ours!' },
      ],
      outro: [
        { who: 'redmane', text: 'Impossible... defeated... by a BLUEBERRY?!' },
        { who: 'mara', text: 'The Banner is home, and Bluehaven will rise again. Rest now, knight — you\'ve earned your stew.' },
      ],
      buildings: [
        { type: 'castle', faction: 'red', x: 960, y: 440, hp: 800 },
        { type: 'tower', faction: 'red', x: 470, y: 730, hp: 150 },
        { type: 'tower', faction: 'red', x: 1460, y: 730, hp: 150 },
      ],
      waves: [
        { warrior: 3, archer: 2 },
        { lancer: 2, monk: 2, archer: 2 },
        { boss: 1, warrior: 2, torch: 2 },
      ],
    },
  ],
};
