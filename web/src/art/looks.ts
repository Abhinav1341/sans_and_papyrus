// Character looks: palettes for the Captain builder and the fixed looks of the crew.
// Indian skin tones and names; diverse bodies (Meera is big, Bunty is small); Meera wears
// glasses and Kiki wears a hearing aid, shown as everyday details and never mentioned as labels.

export const SKINS = ['#f6d3b3', '#eab98f', '#d9a27a', '#c98e62', '#a8714a', '#7d4f30'] as const;
export const HAIR_COLORS = ['#1c1530', '#4a2c1a', '#7a4a24', '#c9873c', '#6b3fa0', '#2f6fb3'] as const;
export const EYE_COLORS = ['#5a3a1e', '#2e6a4f', '#3f5fa8', '#7a3fa0'] as const;
export const OUTFITS = ['#ff8f7e', '#7fe6c9', '#ffd36e', '#8fc8ff', '#c9b6ff', '#ff9fcf'] as const;
export const HAIR_STYLES = ['short', 'spiky', 'bob', 'ponytail', 'braid', 'curly', 'bun', 'long'] as const;

export type HairStyle = (typeof HAIR_STYLES)[number] | 'messy';
export type Extra = 'hoodie' | 'glasses' | 'starclip' | 'sweater' | 'scarf' | 'cap' | 'none';
export type Build = 'regular' | 'big' | 'small';

/** What the player chooses for their Captain. */
export interface Look {
  skin: string;
  hair: HairStyle;
  hairColor: string;
  eyes: string;
  outfit: string;
}

/** A full look used by the drawing code (crew members and the Captain). */
export interface FullLook extends Look {
  extra: Extra;
  build: Build;
  pants: string;
  shoes: string;
  hearingAid?: boolean;
  shorts?: boolean;
  captain?: boolean;
  cape?: boolean;
}

export type CrewId = 'ro' | 'meera' | 'kiki' | 'bunty';

export const CREW: Record<CrewId, FullLook & { name: string }> = {
  ro: { name: 'Ro', skin: '#c98e62', hair: 'spiky', hairColor: '#1c1530', eyes: '#5a3a1e', outfit: '#ff8f7e', extra: 'hoodie', build: 'regular', pants: '#34427e', shoes: '#f4f1ff', shorts: true },
  meera: { name: 'Meera', skin: '#e2b48a', hair: 'braid', hairColor: '#2b1a12', eyes: '#3b2a1a', outfit: '#5ccfae', extra: 'glasses', build: 'big', pants: '#2c3e6b', shoes: '#ffd36e' },
  kiki: { name: 'Kiki', skin: '#f0c49c', hair: 'ponytail', hairColor: '#3a1f10', eyes: '#2e6a4f', outfit: '#ffd33d', extra: 'starclip', build: 'regular', pants: '#6b4fbf', shoes: '#ff9fcf', shorts: true, hearingAid: true },
  bunty: { name: 'Bunty', skin: '#c98e62', hair: 'messy', hairColor: '#1c1530', eyes: '#5a3a1e', outfit: '#ffb38a', extra: 'cap', build: 'small', pants: '#4a7bd8', shoes: '#f4f1ff', shorts: true },
};

export const CREW_IDS: CrewId[] = ['ro', 'meera', 'kiki', 'bunty'];

/** The Captain's full look from the player's choices. */
export function captainLook(look: Look, opts: { cape?: boolean } = {}): FullLook {
  return { ...look, extra: 'none', build: 'regular', pants: '#2c2c54', shoes: '#f4f1ff', captain: true, cape: !!opts.cape };
}

export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt)));
  const r = c((n >> 16) & 255), g = c((n >> 8) & 255), b = c(n & 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
