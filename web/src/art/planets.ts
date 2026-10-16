// World planets for the story map, the logo and the home screen.
export type WorldKind = 'prologue' | 'candy' | 'magic' | 'space' | 'dino' | 'ocean' | 'noir' | 'pirate' | 'glitch';

const PAL: Record<WorldKind, [string, string, boolean]> = {
  prologue: ['#cfe8ff', '#5b3fd1', true],
  candy: ['#ffd1e8', '#ff7ab8', false],
  magic: ['#e1d6ff', '#6b3fa0', false],
  space: ['#cfe8ff', '#3f6fb0', true],
  dino: ['#c8f0a8', '#4f9a3c', false],
  ocean: ['#bfe9ff', '#2f6fb3', false],
  noir: ['#e0e0e0', '#555555', false],
  pirate: ['#ffe0b0', '#c9873c', true],
  glitch: ['#ffd36e', '#ff7ab8', true],
};

export function planet(x: number, y: number, r: number, a: string, b: string, ring: boolean, id: string): string {
  return `<defs><radialGradient id="${id}" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`
    + (ring ? `<ellipse cx="${x}" cy="${y}" rx="${r * 1.8}" ry="${r * 0.45}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="${r * 0.12}"/>` : '')
    + `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id})"/>`
    + (ring ? `<path d="M${x - r * 1.8} ${y} A${r * 1.8} ${r * 0.45} 0 0 0 ${x + r * 1.8} ${y}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="${r * 0.12}"/>` : '');
}

/** The inner markup (no <svg>) of a world planet in a 100x100 box. */
export function worldPlanetInner(kind: WorldKind, locked: boolean, uid: string): string {
  const [a, b, ring] = PAL[kind];
  const lock = locked ? '<circle cx="50" cy="50" r="30" fill="#0b0820" opacity=".55"/><path d="M42 50 L42 44 A8 8 0 0 1 58 44 L58 50" stroke="#fff" stroke-width="4" fill="none"/><rect x="38" y="50" width="24" height="18" rx="4" fill="#fff"/>' : '';
  return planet(50, 50, 30, a, b, ring, `wp-${uid}`) + lock;
}

export function worldPlanetSVG(kind: WorldKind, locked: boolean, uid: string): string {
  return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">${worldPlanetInner(kind, locked, uid)}</svg>`;
}

export function logoPlanetSVG(): string {
  return `<svg viewBox="0 0 210 150" aria-hidden="true" focusable="false">
    <defs><radialGradient id="logo-pl" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ffd1e8"/><stop offset="1" stop-color="#7B61FF"/></radialGradient></defs>
    <ellipse cx="105" cy="92" rx="98" ry="22" fill="none" stroke="#ffd36e" stroke-width="5" opacity=".9"/>
    <circle cx="105" cy="78" r="46" fill="url(#logo-pl)"/>
    <path d="M7 92 A98 22 0 0 0 203 92" fill="none" stroke="#ffd36e" stroke-width="5"/>
    <circle class="tw" cx="22" cy="24" r="3" fill="#fff"/><circle class="tw" cx="190" cy="34" r="2.5" fill="#fff" style="animation-delay:1s"/><circle class="tw" cx="170" cy="130" r="2" fill="#fff" style="animation-delay:2s"/>
    <path class="bob" d="M40 40 l3 7 7 1 -5 5 1 7 -6 -4 -6 4 1 -7 -5 -5 7 -1z" fill="#7fe6c9"/>
  </svg>`;
}
