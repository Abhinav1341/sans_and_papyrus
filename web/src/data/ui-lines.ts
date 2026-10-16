// Every sentence the menus can read aloud. Kept in one place so tools/voices records them all.
import { COLLECTIBLES } from '@/story/collectibles';

export const HERO_NAMES = ['Aarav', 'Anaya', 'Kabir', 'Diya', 'Ishaan', 'Riya', 'Arjun', 'Zara', 'Vihaan', 'Saanvi', 'Reyansh', 'Myra'] as const;

export const UI_LINES = {
  builderIntro: 'Make your Captain! Pick a name, then tap the colours you like.',
  builderEdit: 'Change your look. Tap the colours you like.',
  voicePreview: 'Okay, crew. Let’s go!',
  homeIntro: 'Welcome back, Captain! Tap Play to carry on the story.',
  mapIntro: 'This is the Party Galaxy. Eight worlds in a ring. Tap a glowing chapter to play.',
  profileIntro: 'This is your Captain page. Tap a power or a treasure to hear about it.',
  lockedItem: 'Keep playing the story to find this one!',
  comingSoon: 'World two is coming soon!',
} as const;

/** Fizz cheers the name a child picks. */
export const captainCall = (name: string) => `Captain ${name}!`;

/** What the storyteller says about a power or treasure. */
export const collectibleLine = (id: string) => {
  const c = COLLECTIBLES[id];
  return c ? `${c.name}. ${c.desc}` : '';
};

/** What Fizz announces when a reward appears in the story. */
export const rewardLine = (id: string) => {
  const c = COLLECTIBLES[id];
  return c ? `${c.kind === 'power' ? 'New power' : 'New treasure'}! ${c.name}!` : '';
};
