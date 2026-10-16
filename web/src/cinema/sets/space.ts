// The way into the Party Galaxy: the vortex inside the screen, the sky full of planets, and
// Fizz's floating game-board station.
import type { SetDef } from './types';
import { INK, FONT, lin, rad, stars, planet, rng, star5, sparkleStar, cloud, elements, comets, balloons } from './kit';
import { orb } from './world';

/* ---------------- Inside the screen: a candy-coloured vortex ---------------- */
export function vortex(): SetDef {
  const cx = 500, cy = 430;
  const defs = rad('vx-core', [[0, '#fffbe8'], [0.25, '#ffd36e', 0.8], [1, '#7B61FF', 0]]);
  let rings = '';
  const cols = ['#ff9fcf', '#7fe6c9', '#ffd36e', '#8fc8ff', '#c9b6ff'];
  for (let i = 0; i < 9; i++) {
    const r = 80 + i * 90;
    rings += `<g class="${i % 2 ? 'spin-9r' : 'spin-6'}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${cols[i % 5]}" stroke-width="${18 + i * 4}" stroke-dasharray="${60 + i * 20} ${40 + i * 14}" opacity="${0.75 - i * 0.05}"/></g>`;
  }
  let arms = '';
  for (let k = 0; k < 5; k++) {
    let d = '';
    for (let t = 0; t <= 60; t++) {
      const a = (t / 60) * Math.PI * 3 + (k * Math.PI * 2) / 5;
      const r = 20 + t * 13;
      d += `${t ? 'L' : 'M'}${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)} `;
    }
    arms += `<path d="${d}" stroke="#fff" stroke-width="10" fill="none" opacity=".25" stroke-linecap="round"/>`;
  }
  const bg = `<rect x="-300" y="-300" width="1600" height="1600" fill="#2a1a6e"/>` + stars(90, 31, -200, 1200, -200, 1200)
    + rings + `<g class="spin-6">${arms}</g>` + `<circle cx="${cx}" cy="${cy}" r="260" fill="url(#vx-core)"/>`;
  return { id: 'vortex', w: 1000, h: 1000, ground: 700, top: -280, bottom: 1280, bg: '#2a1a6e', defs, layers: [{ p: 0.2, svg: bg }] };
}

/* ---------------- Falling slowly through a sky full of planets ---------------- */
export function sky(): SetDef {
  const W = 1200, H = 3000;
  const defs = lin('sky-grad', [[0, '#0b0a2e'], [0.35, '#2a1f6e'], [0.7, '#6b4fbf'], [0.92, '#ff9fcf'], [1, '#ffd1e8']])
    + rad('sky-neb1', [[0, '#ff9fcf', 0.45], [1, '#ff9fcf', 0]]) + rad('sky-neb2', [[0, '#8fc8ff', 0.4], [1, '#8fc8ff', 0]])
    + rad('sky-cglow', [[0, '#ffd1e8', 0.75], [0.55, '#ff9fcf', 0.3], [1, '#ff9fcf', 0]]);
  const far = `<rect x="-400" y="-400" width="${W + 800}" height="${H + 800}" fill="url(#sky-grad)"/>` + stars(220, 5, -300, W + 300, -300, 2300)
    + comets(6, 14, -300, W + 300, -200, 2000) + `<ellipse cx="300" cy="700" rx="420" ry="200" fill="url(#sky-neb1)"/><ellipse cx="900" cy="1500" rx="460" ry="220" fill="url(#sky-neb2)"/><ellipse cx="400" cy="2100" rx="500" ry="240" fill="url(#sky-neb1)"/>`;
  const mid = planet(230, 380, 70, '#cfe8ff', '#3f6fb0', true, 'sky-p1') + planet(980, 820, 110, '#c8f0a8', '#4f9a3c', false, 'sky-p2')
    + planet(260, 1380, 60, '#ffe0b0', '#c9873c', false, 'sky-p3') + planet(940, 1850, 95, '#e1d6ff', '#6b3fa0', true, 'sky-p4')
    + planet(160, 2200, 45, '#bfe9ff', '#2f6fb3', false, 'sky-p5');
  const r = rng(77);
  let near = '';
  for (let i = 0; i < 14; i++) {
    const x = r() * W, y = 300 + r() * 2200;
    near += sparkleStar(Math.round(x), Math.round(y), 10 + r() * 14, i % 2 ? '#fff' : '#ffd36e', 'tw');
  }
  // The candy planet's surface at the bottom
  // The Candy Nebula far below: a whole planet with its glow and clouds, so it can be seen properly.
  near += `<circle cx="600" cy="2560" r="440" fill="url(#sky-cglow)"/>` + `<g transform="translate(600 2560)">${orb('candy', 230, '#ffe3f1', '#ff7ab8', 'sky-cn')}</g>`;
  near += cloud(150, 2700, 1.3, '#fff0f8', 'drift slow') + cloud(860, 2470, 1.1, '#ffe6f3', 'drift') + cloud(40, 2380, 0.9, '#fff0f8', 'drift') + cloud(940, 2760, 1.2, '#ffe6f3', 'drift slow');
  return {
    id: 'sky', w: W, h: H, ground: 2900, top: -300, bottom: 3200, bg: '#0b0a2e', defs,
    layers: [{ p: 0.15, svg: far }, { p: 0.45, svg: mid }, { p: 1, svg: near }],
  };
}

/* ---------------- The Party Galaxy station: a game board floating in space ---------------- */
export const WORLD_COLORS: [string, string, boolean][] = [
  ['#ffd1e8', '#ff7ab8', false], ['#e1d6ff', '#6b3fa0', false], ['#cfe8ff', '#3f6fb0', true], ['#c8f0a8', '#4f9a3c', false],
  ['#bfe9ff', '#2f6fb3', false], ['#e0e0e0', '#666666', false], ['#ffe0b0', '#c9873c', true], ['#ffd36e', '#ff7ab8', true],
];

/** Where the station's game board pivots when it tips. */
const BOARD_PIVOT = { x: 1200, y: 720 };

export function station(): SetDef {
  const W = 2400;
  const E = elements();
  const defs = lin('st-space', [[0, '#0b0820'], [1, '#2a1f6e']])
    + rad('st-neb', [[0, '#7B61FF', 0.5], [1, '#7B61FF', 0]])
    + lin('st-board', [[0, '#3b2f86'], [1, '#1d1745']])
    + lin('st-beam', [[0, '#fff8d8', 0.55], [1, '#fff8d8', 0]])
    + lin('st-curtain', [[0, '#7a4fd6'], [1, '#4b2f9a']], 1, 0);
  const far = `<rect x="-600" y="-400" width="${W + 1200}" height="1800" fill="url(#st-space)"/>` + stars(200, 9, -500, W + 500, -300, 900)
    + `<ellipse cx="600" cy="300" rx="600" ry="260" fill="url(#st-neb)"/><ellipse cx="1900" cy="380" rx="520" ry="220" fill="url(#st-neb)"/>` + comets(7, 3, -500, W + 500, -250, 500);
  // The ring of eight worlds in the sky (they light up during Fizz's song)
  let worlds = `<ellipse cx="${W / 2}" cy="190" rx="1000" ry="80" fill="none" stroke="#c9b6ff" stroke-opacity=".35" stroke-width="5" stroke-dasharray="10 14"/>`;
  WORLD_COLORS.forEach(([a, b, ring], i) => {
    const t = i / 7;
    const x = 300 + t * 1800, y = 200 - Math.sin(t * Math.PI) * 60;
    worlds += E.el(`w${i + 1}`, Math.round(x), Math.round(y), planet(0, 0, 44, a, b, ring, `st-w${i}`), { opacity: 0.45 });
  });
  // Far floating platforms
  const r = rng(13);
  let mid = '';
  for (let i = 0; i < 6; i++) {
    const x = 120 + i * 420 + r() * 80, y = 420 + r() * 80;
    mid += `<g opacity=".7"><ellipse cx="${x}" cy="${y}" rx="90" ry="22" fill="#4b3f9a"/><path d="M${x - 90} ${y} Q${x} ${y + 70} ${x + 90} ${y}" fill="#2a2163"/>${star5(x, y - 30, 16, ['#ffd36e', '#7fe6c9', '#ff9fcf'][i % 3], '#2a1838', 2)}</g>`;
  }
  // The board itself
  let main = `<path d="M-400 600 Q${W / 2} 560 ${W + 400} 600 L${W + 400} 1100 L-400 1100 Z" fill="url(#st-board)"/>`
    + `<path d="M-400 600 Q${W / 2} 560 ${W + 400} 600" stroke="#c9b6ff" stroke-width="8" fill="none"/>`;
  for (let x = -360; x < W + 400; x += 60) main += `<circle cx="${x}" cy="${600 - Math.sin(((x + 400) / (W + 800)) * Math.PI) * 38}" r="7" fill="${['#ffd36e', '#ff9fcf', '#7fe6c9', '#8fc8ff'][Math.abs(x / 60) % 4 | 0]}" class="tw" style="animation-delay:${((x + 400) % 7) * 0.3}s"/>`;
  const tileCols = ['#ff9fcf', '#7fe6c9', '#ffd36e', '#8fc8ff', '#c9b6ff'];
  for (let i = 0; i < 26; i++) {
    const x = -200 + i * 108, y = 700 + Math.sin(i * 0.7) * 26;
    main += `<path d="M${x - 46} ${y + 24} L${x - 36} ${y - 18} L${x + 46} ${y - 18} L${x + 52} ${y + 24} Z" fill="${tileCols[i % 5]}" stroke="${INK}" stroke-width="3" opacity=".95"/>`
      + (i % 5 === 2 ? star5(x + 4, y + 3, 12, '#fff', '#2a1838', 2) : '');
  }
  main += balloons(10, 21, -200, W + 200, 380, 560);
  // Fizz's stage, curtains, neon sign and spotlights
  const sx = 1200;
  main += `<g><ellipse cx="${sx}" cy="640" rx="260" ry="56" fill="#5a44d6" stroke="${INK}" stroke-width="5"/><ellipse cx="${sx}" cy="626" rx="250" ry="48" fill="#7B61FF"/>`
    + `<ellipse cx="${sx}" cy="626" rx="210" ry="36" fill="none" stroke="#ffd36e" stroke-width="6" stroke-dasharray="4 16"/></g>`
    + `<path d="M${sx - 330} 640 L${sx - 330} 170 Q${sx - 330} 120 ${sx - 270} 120 L${sx - 200} 120 Q${sx - 230} 360 ${sx - 280} 640 Z" fill="url(#st-curtain)" stroke="${INK}" stroke-width="4"/>`
    + `<path d="M${sx + 330} 640 L${sx + 330} 170 Q${sx + 330} 120 ${sx + 270} 120 L${sx + 200} 120 Q${sx + 230} 360 ${sx + 280} 640 Z" fill="url(#st-curtain)" stroke="${INK}" stroke-width="4"/>`
    + `<rect x="${sx - 340}" y="110" width="680" height="34" rx="12" fill="#ffd36e" stroke="${INK}" stroke-width="4"/>`
    + `<g><rect x="${sx - 200}" y="150" width="400" height="74" rx="20" fill="#120e2b" stroke="#ff9fcf" stroke-width="6"/><text x="${sx}" y="203" text-anchor="middle" font-size="44" fill="#ff9fcf" style="${FONT}" class="pulse">PARTY GALAXY</text></g>`;
  main += E.el('spotL', sx - 520, 140, `<path d="M0 0 L250 520 L120 540 Z" fill="url(#st-beam)"/><circle r="22" fill="#dfe6ee" stroke="${INK}" stroke-width="4"/>`, { rot: -6 })
    + E.el('spotR', sx + 520, 140, `<path d="M0 0 L-250 520 L-120 540 Z" fill="url(#st-beam)"/><circle r="22" fill="#dfe6ee" stroke="${INK}" stroke-width="4"/>`, { rot: 6 });
  // A giant die and a game piece on the board
  main += `<g transform="translate(260 640) rotate(-8)"><rect x="-60" y="-120" width="120" height="120" rx="18" fill="#fff" stroke="${INK}" stroke-width="5"/><circle cx="-28" cy="-88" r="10" fill="#7B61FF"/><circle cx="28" cy="-32" r="10" fill="#7B61FF"/><circle cx="0" cy="-60" r="10" fill="#7B61FF"/></g>`
    + `<g transform="translate(2120 650)"><path d="M-40 0 Q-46 -60 -18 -90 Q-36 -120 0 -140 Q36 -120 18 -90 Q46 -60 40 0 Z" fill="#7fe6c9" stroke="${INK}" stroke-width="5"/></g>`;

  const front = `<path d="M-500 920 Q${W / 2} 880 ${W + 500} 920 L${W + 500} 1100 L-500 1100 Z" fill="#120e2b"/>`;
  return {
    id: 'station', w: W, h: 1000, ground: 720, top: -300, bottom: 1100, bg: '#0b0820', defs,
    // The whole board is one piece pivoting at its middle, so it can tip like a slide at the end of the chapter.
    layers: [{ p: 0.08, svg: far }, { p: 0.3, svg: worlds }, { p: 0.6, svg: mid }, { p: 1, svg: E.el('board', BOARD_PIVOT.x, BOARD_PIVOT.y, `<g transform="translate(${-BOARD_PIVOT.x} ${-BOARD_PIVOT.y})">${main}</g>`) }, { p: 1.4, svg: front, front: true }],
    els: E.anchors,
  };
}
