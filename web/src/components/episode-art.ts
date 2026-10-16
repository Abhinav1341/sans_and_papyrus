// The "episode poster" on the home screen: the world the next chapter happens in, drawn with the
// same planets as the story's galaxy scenes, under a starry sky. Pure SVG strings, deterministic.
import { orb, ORBS } from '@/cinema/sets/world';
import { stars, sparkleStar, cloud, planet } from '@/cinema/sets/kit';
import type { World } from '@/cinema/types';

const SKIES: Record<string, [string, string, string]> = {
  prologue: ['#160f3d', '#3b2a8c', '#7B61FF'],
  candy: ['#3a2a8a', '#9a7ae8', '#ffb7dc'],
};

export function episodePosterSVG(world: World, uid: string): string {
  const [top, mid, low] = SKIES[world.kind] ?? SKIES.prologue;
  const sky = `<defs><linearGradient id="${uid}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset=".6" stop-color="${mid}"/><stop offset="1" stop-color="${low}"/></linearGradient>`
    + `<radialGradient id="${uid}-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff4c7" stop-opacity=".55"/><stop offset="1" stop-color="#fff4c7" stop-opacity="0"/></radialGradient></defs>`
    + `<rect width="400" height="250" fill="url(#${uid}-sky)"/>` + stars(46, 3, 0, 400, 0, 170);
  let art = '';
  if (world.kind === 'candy') {
    const o = ORBS[0];
    art = `<circle cx="300" cy="146" r="120" fill="url(#${uid}-glow)"/><g transform="translate(296 150)">${orb(o.kind, 64, o.a, o.b, `${uid}-o`)}</g>`
      + cloud(30, 214, 1.1, '#fff0f8', 'drift slow') + cloud(160, 236, 0.9, '#ffe6f3', 'drift')
      + sparkleStar(70, 60, 9, '#fff', 'tw') + sparkleStar(220, 40, 7, '#ffd36e', 'tw');
  } else {
    // The prologue: the whole Party Galaxy, a ring of little worlds around the game board.
    const ring = ORBS.map((o, i) => {
      const a = (i / ORBS.length) * Math.PI * 2 + 0.3;
      const x = 270 + Math.cos(a) * 110, y = 120 + Math.sin(a) * 46;
      return planet(Math.round(x), Math.round(y), 13 + (i % 3) * 3, o.a, o.b, i % 3 === 2, `${uid}-r${i}`);
    }).join('');
    art = `<circle cx="270" cy="120" r="130" fill="url(#${uid}-glow)"/><ellipse cx="270" cy="120" rx="110" ry="46" fill="none" stroke="#c9b6ff" stroke-width="3" stroke-dasharray="4 10" opacity=".7"/>`
      + `<g><ellipse cx="270" cy="132" rx="44" ry="12" fill="#4b3fb0" stroke="#2a1838" stroke-width="3"/><path d="M226 132 Q270 150 314 132" fill="#2a1f6e"/><rect x="242" y="96" width="56" height="18" rx="5" fill="#120e2b" stroke="#ff9fcf" stroke-width="2"/><text x="270" y="109" text-anchor="middle" font-size="10" font-weight="800" fill="#ff9fcf" font-family="sans-serif">PARTY</text></g>` + ring
      + sparkleStar(60, 50, 9, '#fff', 'tw') + sparkleStar(120, 150, 6, '#ffd36e', 'tw');
  }
  return `<svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${sky}${art}</svg>`;
}
