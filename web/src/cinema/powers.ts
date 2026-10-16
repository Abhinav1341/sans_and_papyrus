// Power-up moments: a glowing aura behind a character and an anime power banner with its own icon.
// Glows fade in and out slowly (never a flash); calm mode keeps them still.

export type PowerIcon = 'toffee' | 'gumball' | 'shield' | 'sticky' | 'sprinkle';
export const POWER_ICONS: Record<PowerIcon, string> = {
  // A twisted toffee sweet, stretching.
  toffee: `<svg viewBox="0 0 64 64"><path d="M6 24 L18 32 L6 40 Z M58 24 L46 32 L58 40 Z" fill="#ffb38a" stroke="#2a1838" stroke-width="3" stroke-linejoin="round"/><ellipse cx="32" cy="32" rx="16" ry="12" fill="#e08a4a" stroke="#2a1838" stroke-width="3"/><path d="M22 28 Q32 22 42 28" stroke="#fff4c7" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
  // A gumball machine.
  gumball: `<svg viewBox="0 0 64 64"><circle cx="32" cy="24" r="17" fill="#e8f6ff" stroke="#2a1838" stroke-width="3"/><circle cx="26" cy="20" r="5" fill="#ff7ab8"/><circle cx="37" cy="18" r="5" fill="#7fe6c9"/><circle cx="34" cy="29" r="5" fill="#ffd36e"/><circle cx="24" cy="30" r="4" fill="#8fc8ff"/><path d="M20 40 H44 L41 58 H23 Z" fill="#ff5f6d" stroke="#2a1838" stroke-width="3"/><rect x="29" y="45" width="6" height="7" rx="2" fill="#2a1838"/></svg>`,
  // The round candy shield.
  shield: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="#ff9fcf" stroke="#2a1838" stroke-width="3"/><circle cx="32" cy="32" r="16" fill="#ffd1e8"/><path d="M32 32m-9 0a9 9 0 1 0 18 0a5.5 5.5 0 1 0 -11 0a2.5 2.5 0 1 0 5 0" stroke="#7fe6c9" stroke-width="4" fill="none"/><ellipse cx="24" cy="22" rx="6" ry="3" fill="#fff" opacity=".7" transform="rotate(-30 24 22)"/></svg>`,
  // A hand with sticky drips.
  sticky: `<svg viewBox="0 0 64 64"><path d="M18 40 V20 a4 4 0 0 1 8 0 V14 a4 4 0 0 1 8 0 V18 a4 4 0 0 1 8 0 V26 a4 4 0 0 1 8 0 V42 Q50 56 34 56 Q20 56 18 40 Z" fill="#ffb38a" stroke="#2a1838" stroke-width="3" stroke-linejoin="round"/><path d="M24 50 v8 M34 54 v6 M44 50 v5" stroke="#ffd36e" stroke-width="5" stroke-linecap="round"/><circle cx="24" cy="59" r="3" fill="#ffd36e"/></svg>`,
  // A little cloud raining rainbow sprinkles.
  sprinkle: `<svg viewBox="0 0 64 64"><path d="M14 30 a10 10 0 0 1 10 -12 a12 12 0 0 1 22 2 a9 9 0 0 1 4 18 H18 a8 8 0 0 1 -4 -8 Z" fill="#fff" stroke="#2a1838" stroke-width="3"/><g stroke-width="4" stroke-linecap="round"><path d="M22 44 l-2 6" stroke="#ff7ab8"/><path d="M30 46 l-2 6" stroke="#7fe6c9"/><path d="M38 44 l-2 6" stroke="#ffd36e"/><path d="M46 46 l-2 6" stroke="#8fc8ff"/><path d="M26 54 l-2 6" stroke="#c9b6ff"/><path d="M42 54 l-2 6" stroke="#ffb38a"/></g></svg>`,
};

/** The aura drawn behind a character (in their own colour), with light rising through it. */
export function auraMarkup(uid: string, color: string): string {
  let streaks = '';
  for (let i = 0; i < 7; i++) {
    const x = -70 + i * 23, h = 60 + ((i * 37) % 70);
    streaks += `<rect class="aura-streak" style="animation-delay:${(i * 0.37).toFixed(2)}s" x="${x}" y="${-120 - h}" width="${4 + (i % 2) * 3}" height="${h}" rx="3" fill="#fff" opacity=".7"/>`;
  }
  return `<defs><radialGradient id="${uid}" cx=".5" cy=".55" r=".5"><stop offset="0" stop-color="#fff8e0" stop-opacity=".9"/><stop offset=".45" stop-color="${color}" stop-opacity=".55"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs>`
    + `<ellipse cx="0" cy="-165" rx="130" ry="215" fill="url(#${uid})"/>`
    + `<ellipse cx="0" cy="-4" rx="110" ry="22" fill="none" stroke="${color}" stroke-width="6" opacity=".8" class="aura-ring"/>`
    + streaks;
}
