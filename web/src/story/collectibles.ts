// Powers and treasures. Unlocked by reaching points in the story, never by task scores
// (choices never earn anything; rewards are predictable and always kept).
export interface Collectible { kind: 'power' | 'item'; world: string; name: string; desc: string }

export const COLLECTIBLES: Record<string, Collectible> = {
  'captains-call': { kind: 'power', world: 'prologue', name: "Captain's Call", desc: 'Call the whole crew together. Nobody gets left behind.' },
  'sprinkle-shower': { kind: 'power', world: 'candy', name: 'Sprinkle Shower', desc: 'Rainbow sprinkles fall from the sky. Everything they touch turns bouncy.' },
  'golden-token': { kind: 'item', world: 'prologue', name: 'Golden Token', desc: 'It popped up in your pocket. It fits the Party Galaxy machine.' },
  'captain-badge': { kind: 'item', world: 'prologue', name: 'Captain Badge', desc: 'You pressed START, so you lead the crew.' },
  'rule-card': { kind: 'item', world: 'prologue', name: "Fizz's Rule Card", desc: 'Eight worlds. Silly games. Win the Big Prize, and everyone goes on together.' },
  'candy-map': { kind: 'item', world: 'candy', name: 'Candy Nebula Map', desc: 'Jelly fields, a chocolate river, and Sugar Mountain.' },
  'jelly-boots': { kind: 'item', world: 'candy', name: 'Jelly Boots', desc: 'Extra bounce for every step.' },
  'wafer-paddle': { kind: 'item', world: 'candy', name: 'Wafer Paddle', desc: 'From the raft Bunty stuck back together.' },
  'lollipop-stick': { kind: 'item', world: 'candy', name: 'Lollipop Stick', desc: 'All that is left of the Giant Lollipop. Ro shared it with everyone.' },
};

/** Future Captain powers, shown as locked silhouettes on the profile. */
export const FUTURE_POWERS = [
  { world: 'magic', name: 'World 2 power' },
  { world: 'space', name: 'World 3 power' },
  { world: 'dino', name: 'World 4 power' },
];

export const CREW_BIOS: Record<string, string> = {
  ro: 'Loud, brave, and loves to win.',
  meera: 'The planner. Her plans work, until things get silly.',
  kiki: 'Presses every button. Even the ones that say DO NOT PRESS.',
  bunty: "Ro's little brother. Small, fast, and always smiling.",
  fizz: 'The host. A disco ball who loves to sing (not very well).',
};

export const CREW_NAMES: Record<string, string> = { ro: 'Ro', meera: 'Meera', kiki: 'Kiki', bunty: 'Bunty', fizz: 'Fizz' };
