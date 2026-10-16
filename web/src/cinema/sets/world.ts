// Wide views of the world itself, so the film can show where the story happens and not only who
// is in it: the Party Galaxy (eight themed worlds in a ring around Fizz's game board) and the
// Candy Nebula seen from the sky (fly down through the clouds, then tour the land).
import type { SetDef } from './types';
import { INK, FONT, lin, rad, stars, rng, cloud, lollipop, gumdrop, candyCane, jellyBean, hills, sparkleStar, star5, elements, birds, butterflies, bubbles, comets, balloons } from './kit';
import { GALAXY_X, GALAXY_Y, BOARD, VISTA } from './galaxy-layout';

const n1 = (v: number) => Math.round(v * 10) / 10;

/* ---------------- The eight worlds, each drawn as a planet with its own landmark ---------------- */
type OrbKind = 'candy' | 'magic' | 'space' | 'dino' | 'ocean' | 'noir' | 'pirate' | 'glitch';
export const ORBS: { kind: OrbKind; name: string; a: string; b: string }[] = [
  { kind: 'candy', name: 'CANDY NEBULA', a: '#ffe3f1', b: '#ff7ab8' },
  { kind: 'magic', name: 'WIZZLEWICK', a: '#efe6ff', b: '#6b3fa0' },
  { kind: 'space', name: 'STATION ZETA', a: '#d8ecff', b: '#3f6fb0' },
  { kind: 'dino', name: 'DINO VALLEY', a: '#dcf7c2', b: '#4f9a3c' },
  { kind: 'ocean', name: 'DEEP BLUE CITY', a: '#c8f1ff', b: '#2f6fb3' },
  { kind: 'noir', name: 'NOIR TOWN', a: '#dfe3f0', b: '#4a4f6a' },
  { kind: 'pirate', name: 'SKY PIRATES', a: '#fff0cf', b: '#d9873c' },
  { kind: 'glitch', name: 'GLITCH WORLD', a: '#fff1a8', b: '#ff7ab8' },
];

/** On the planet's surface at angle `deg` (0 = top), standing upright out of it. */
const onTop = (r: number, deg: number, inner: string) => `<g transform="rotate(${deg}) translate(0 ${-r + 6})">${inner}</g>`;

export function orb(kind: OrbKind, r: number, a: string, b: string, uid: string): string {
  const clip = `${uid}-c`;
  let defs = rad(`${uid}-g`, [[0, a], [1, b]], 0.35, 0.3, 0.85) + `<clipPath id="${clip}"><circle r="${r}"/></clipPath>`;
  let back = '', bands = '', top = '', front = '';
  const ring = (c1: string, c2: string, dash = '') => {
    const rx = n1(r * 1.75), ry = n1(r * 0.42), w = n1(r * 0.12);
    back += `<path d="M${-rx} 0 A${rx} ${ry} 0 0 1 ${rx} 0" fill="none" stroke="${c1}" stroke-width="${w}" opacity=".9"/>`;
    front += `<path d="M${-rx} 0 A${rx} ${ry} 0 0 0 ${rx} 0" fill="none" stroke="${c1}" stroke-width="${w}"/>`
      + (dash ? `<path d="M${-rx} 0 A${rx} ${ry} 0 0 0 ${rx} 0" fill="none" stroke="${c2}" stroke-width="${w}" stroke-dasharray="${dash}"/>` : '');
  };
  switch (kind) {
    case 'candy': {
      ring('#fff', '#ff7ab8', '18 18');
      bands = `<path d="M${-r} ${n1(r * 0.25)} Q${-r * 0.4} ${n1(r * 0.05)} 0 ${n1(r * 0.3)} T${r} ${n1(r * 0.2)} L${r} ${n1(r * 0.45)} Q${n1(r * 0.4)} ${n1(r * 0.55)} 0 ${n1(r * 0.48)} T${-r} ${n1(r * 0.5)} Z" fill="#8a5634" opacity=".85"/>`;
      const rr = rng(3);
      for (let i = 0; i < 26; i++) bands += `<rect x="${n1((rr() - 0.5) * r * 1.8)}" y="${n1((rr() - 0.7) * r * 1.4)}" width="5" height="13" rx="2" fill="${['#fff', '#7fe6c9', '#ffd36e', '#8fc8ff'][i % 4]}" transform="rotate(${Math.round(rr() * 180)})"/>`;
      top = onTop(r, -38, lollipop(0, 0, 18, 46, '#7fe6c9', '#fff', 'sway')) + onTop(r, 0, lollipop(0, 0, 26, 70, '#ffd36e', '#ff9fcf', 'sway slow'))
        + onTop(r, 34, lollipop(0, 0, 16, 40, '#8fc8ff', '#fff', 'sway')) + onTop(r, 62, candyCane(0, 0, 26)) + onTop(r, -64, gumdrop(0, 0, 16, '#c9b6ff'));
      break;
    }
    case 'magic': {
      bands = `<path d="M${-r} ${n1(-r * 0.1)} Q0 ${n1(-r * 0.4)} ${r} ${n1(-r * 0.05)}" stroke="#fff" stroke-width="6" fill="none" opacity=".3"/><path d="M${-r} ${n1(r * 0.35)} Q0 ${n1(r * 0.1)} ${r} ${n1(r * 0.4)}" stroke="#fff" stroke-width="5" fill="none" opacity=".25"/>`;
      const tower = (x: number, h: number, w: number, roof: string) => `<rect x="${x - w / 2}" y="${-h}" width="${w}" height="${h + 8}" fill="#e9e1ff" stroke="${INK}" stroke-width="3"/><path d="M${x - w / 2 - 6} ${-h} L${x} ${-h - w * 1.3} L${x + w / 2 + 6} ${-h} Z" fill="${roof}" stroke="${INK}" stroke-width="3"/><rect x="${x - 4}" y="${-h + 14}" width="8" height="12" rx="4" fill="#ffd36e"/><path d="M${x} ${-h - w * 1.3} v-16 l14 5 -14 5" fill="#ffd36e" stroke="${INK}" stroke-width="2"/>`;
      top = onTop(r, 0, `<g>${tower(-34, 50, 26, '#ff9fcf')}${tower(34, 46, 26, '#7fe6c9')}${tower(0, 78, 32, '#8f6bff')}<rect x="-40" y="-26" width="80" height="34" fill="#e9e1ff" stroke="${INK}" stroke-width="3"/><path d="M-10 8 v-16 a10 10 0 0 1 20 0 v16 z" fill="#6b3fa0"/></g>`);
      const gem = (x: number, y: number, s: number, c: string, d: number) => `<g transform="translate(${n1(x)} ${n1(y)})"><g class="bob" style="animation-delay:${d}s"><path d="M0 ${-s} L${s * 0.6} 0 L0 ${s} L${-s * 0.6} 0 Z" fill="${c}" stroke="${INK}" stroke-width="2.5"/><path d="M0 ${-s} L0 ${s}" stroke="#fff" stroke-width="1.5" opacity=".6"/></g></g>`;
      front = gem(-r * 1.25, -r * 0.4, 18, '#8fc8ff', 0) + gem(r * 1.2, -r * 0.6, 14, '#ff9fcf', 1.5) + gem(r * 1.3, r * 0.5, 16, '#7fe6c9', 3) + gem(-r * 1.15, r * 0.6, 12, '#ffd36e', 2)
        + sparkleStar(n1(-r * 0.9), n1(-r * 1.1), 10, '#fff', 'tw') + sparkleStar(n1(r * 0.8), n1(-r * 1.25), 8, '#ffd36e', 'tw');
      break;
    }
    case 'space': {
      ring('#cfe8ff', '#fff');
      for (const [x, y, cr] of [[-0.4, -0.3, 0.16], [0.35, 0.1, 0.12], [-0.1, 0.45, 0.1], [0.5, -0.45, 0.08]] as const) bands += `<circle cx="${n1(x * r)}" cy="${n1(y * r)}" r="${n1(cr * r)}" fill="#2a4f8a" opacity=".35"/><circle cx="${n1(x * r - 3)}" cy="${n1(y * r - 3)}" r="${n1(cr * r * 0.7)}" fill="#fff" opacity=".12"/>`;
      // A small space station circling the planet.
      front += `<g class="spin-slow" style="transform-origin:0 0;transform-box:view-box"><g transform="translate(${n1(r * 1.45)} ${n1(-r * 0.75)})"><rect x="-30" y="-6" width="18" height="12" fill="#8fc8ff" stroke="${INK}" stroke-width="2"/><rect x="12" y="-6" width="18" height="12" fill="#8fc8ff" stroke="${INK}" stroke-width="2"/><rect x="-12" y="-12" width="24" height="24" rx="6" fill="#f4f1ff" stroke="${INK}" stroke-width="3"/><circle r="5" fill="#ffd36e"/></g></g>`;
      top = onTop(r, 20, `<g class="bob"><path d="M0 -60 Q12 -44 12 -20 L12 0 L-12 0 L-12 -20 Q-12 -44 0 -60 Z" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cy="-30" r="6" fill="#8fc8ff" stroke="${INK}" stroke-width="2"/><path d="M-12 -8 L-22 6 L-12 2 Z M12 -8 L22 6 L12 2 Z" fill="#ff7ab8" stroke="${INK}" stroke-width="2"/></g>`);
      break;
    }
    case 'dino': {
      bands = `<path d="M${-r} ${n1(r * 0.3)} Q${n1(-r * 0.5)} ${n1(r * 0.1)} 0 ${n1(r * 0.3)} T${r} ${n1(r * 0.25)} L${r} ${r} L${-r} ${r} Z" fill="#3f7f30" opacity=".55"/><circle cx="${n1(-r * 0.45)}" cy="${n1(-r * 0.2)}" r="${n1(r * 0.18)}" fill="#3f7f30" opacity=".4"/>`;
      top = onTop(r, -8, `<path d="M-42 6 L-16 -54 L16 -54 L42 6 Z" fill="#9a6a44" stroke="${INK}" stroke-width="3"/><path d="M-16 -54 Q0 -44 16 -54 L10 -40 Q0 -34 -10 -40 Z" fill="#ff8f3e"/>`
        + `<g class="bob"><circle cx="-4" cy="-76" r="12" fill="#e8e0f0" opacity=".85"/><circle cx="10" cy="-94" r="15" fill="#e8e0f0" opacity=".75"/><circle cx="-2" cy="-118" r="18" fill="#e8e0f0" opacity=".6"/></g>`)
        + onTop(r, 38, `<path d="M0 4 Q-4 -30 2 -56" stroke="#8a5a34" stroke-width="7" fill="none" stroke-linecap="round"/><g transform="translate(2 -56)"><path d="M0 0 Q-24 -8 -34 6 M0 0 Q24 -10 34 4 M0 0 Q-10 -22 -24 -24 M0 0 Q12 -22 24 -22" stroke="#4f9a3c" stroke-width="9" fill="none" stroke-linecap="round"/></g>`)
        + onTop(r, -48, `<path d="M-18 6 Q-20 -14 -4 -16 Q4 -40 2 -64 Q2 -78 14 -78 Q24 -76 22 -66 Q14 -64 14 -54 Q16 -30 14 -14 Q30 -12 28 6 Z" fill="#7fbf6a" stroke="${INK}" stroke-width="3"/><circle cx="15" cy="-71" r="2.5" fill="${INK}"/>`);
      break;
    }
    case 'ocean': {
      for (let i = 0; i < 5; i++) {
        const y = n1(-r * 0.5 + i * r * 0.28);
        bands += `<path d="M${-r} ${y} q${n1(r / 6)} -10 ${n1(r / 3)} 0 t${n1(r / 3)} 0 t${n1(r / 3)} 0 t${n1(r / 3)} 0 t${n1(r / 3)} 0 t${n1(r / 3)} 0" stroke="#fff" stroke-width="4" fill="none" opacity="${n1(0.18 + i * 0.05)}"/>`;
      }
      const dome = (x: number, dr: number) => `<g transform="translate(${x} 0)"><rect x="${-dr * 0.5}" y="${-dr * 0.9}" width="${dr * 0.3}" height="${dr * 0.9}" fill="#8fc8ff"/><rect x="${dr * 0.1}" y="${-dr * 0.6}" width="${dr * 0.35}" height="${dr * 0.6}" fill="#7fe6c9"/><path d="M${-dr} 4 A${dr} ${dr} 0 0 1 ${dr} 4 Z" fill="#dff7ff" opacity=".45" stroke="#fff" stroke-width="3"/></g>`;
      top = onTop(r, -24, dome(0, 34)) + onTop(r, 18, dome(0, 26))
        + onTop(r, 50, `<path d="M0 6 Q-4 -18 -22 -30 Q-8 -30 0 -20 Q8 -30 22 -30 Q4 -18 0 6 Z" fill="#2f5fa0" stroke="${INK}" stroke-width="3"/>${bubbles(4, 9, -10, 10, -40, -30, '#dff7ff', 50)}`);
      break;
    }
    case 'noir': {
      bands = `<ellipse cx="0" cy="${n1(r * 0.35)}" rx="${r}" ry="${n1(r * 0.18)}" fill="#fff" opacity=".18"/><ellipse cx="0" cy="${n1(-r * 0.1)}" rx="${r}" ry="${n1(r * 0.1)}" fill="#fff" opacity=".1"/>`;
      let city = '';
      const rr = rng(66);
      for (let i = 0; i < 9; i++) {
        const x = -64 + i * 16, h = 20 + Math.round(rr() * 46);
        city += `<rect x="${x - 7}" y="${-h}" width="15" height="${h + 10}" fill="#30344c" stroke="${INK}" stroke-width="1.5"/>`;
        for (let k = 0; k < Math.floor(h / 14); k++) if (rr() > 0.35) city += `<rect x="${x - 3}" y="${-h + 6 + k * 14}" width="6" height="6" fill="#ffd36e" opacity=".9"/>`;
      }
      top = onTop(r, 0, city);
      front = `<g transform="translate(${n1(r * 1.15)} ${n1(-r * 0.95)})"><circle r="26" fill="#fff4c7"/><circle cx="12" cy="-8" r="24" fill="#16142e"/></g>`
        + `<g transform="translate(${n1(-r * 1.2)} ${n1(r * 0.2)})"><g class="bob"><circle r="16" fill="none" stroke="#c9b6ff" stroke-width="5"/><path d="M11 11 L26 26" stroke="#c9b6ff" stroke-width="7" stroke-linecap="round"/></g></g>`;
      break;
    }
    case 'pirate': {
      ring('#ffe0b0', '#fff');
      bands = `<circle cx="${n1(-r * 0.3)}" cy="${n1(r * 0.2)}" r="${n1(r * 0.25)}" fill="#7fbf6a" opacity=".5"/><circle cx="${n1(r * 0.4)}" cy="${n1(-r * 0.25)}" r="${n1(r * 0.15)}" fill="#7fbf6a" opacity=".45"/>`;
      top = onTop(r, 4, `<g class="bob"><path d="M-46 -6 L46 -6 L34 14 L-34 14 Z" fill="#9a6a44" stroke="${INK}" stroke-width="3"/><path d="M0 -6 V-70" stroke="${INK}" stroke-width="4"/><path d="M2 -66 Q30 -48 2 -24 Z" fill="#fff" stroke="${INK}" stroke-width="3"/><path d="M-2 -60 Q-26 -44 -2 -28 Z" fill="#fff" stroke="${INK}" stroke-width="3"/>${star5(14, -45, 7, '#ffd36e', '#c99a2e', 1.5)}<path d="M0 -70 l16 5 -16 5" fill="#ff7ab8"/><ellipse cx="0" cy="-104" rx="22" ry="26" fill="#ff9fcf" stroke="${INK}" stroke-width="3"/><path d="M-10 -80 L-2 -70 M10 -80 L2 -70" stroke="${INK}" stroke-width="2"/></g>`);
      const isle = (x: number, y: number, s: number, d: number) => `<g transform="translate(${n1(x)} ${n1(y)}) scale(${s})"><g class="bob" style="animation-delay:${d}s"><path d="M-30 0 Q0 -12 30 0 Q14 34 0 44 Q-14 34 -30 0 Z" fill="#c98e62" stroke="${INK}" stroke-width="3"/><path d="M-30 0 Q0 -14 30 0 Q0 8 -30 0 Z" fill="#7fbf6a"/><path d="M6 -4 Q4 -24 8 -36" stroke="#8a5a34" stroke-width="4" fill="none"/><path d="M8 -36 q-14 -2 -20 6 M8 -36 q14 -4 20 4" stroke="#4f9a3c" stroke-width="5" fill="none" stroke-linecap="round"/></g></g>`;
      front = isle(-r * 1.3, -r * 0.5, 1, 0) + isle(r * 1.35, -r * 0.1, 0.8, 2);
      break;
    }
    case 'glitch': {
      ring('#7fe6c9', '#fff', '8 10');
      const rr = rng(88);
      for (let i = 0; i < 26; i++) bands += `<rect x="${n1((rr() - 0.5) * r * 2)}" y="${n1((rr() - 0.5) * r * 2)}" width="${12 + Math.round(rr() * 18)}" height="${12 + Math.round(rr() * 18)}" fill="${['#7fe6c9', '#8fc8ff', '#fff', '#c9b6ff'][i % 4]}" opacity=".55"/>`;
      const px = (x: number, y: number, s: number, c: string, d: number) => `<g transform="translate(${n1(x)} ${n1(y)})"><g class="bob" style="animation-delay:${d}s"><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" fill="${c}" stroke="${INK}" stroke-width="3"/></g></g>`;
      top = onTop(r, -6, `<rect x="-24" y="-44" width="48" height="48" rx="6" fill="#ffd36e" stroke="${INK}" stroke-width="4"/><text x="0" y="-8" text-anchor="middle" font-size="38" fill="${INK}" style="${FONT}">?</text>`);
      front = px(-r * 1.2, -r * 0.7, 22, '#7fe6c9', 0) + px(r * 1.25, -r * 0.55, 18, '#ff9fcf', 1) + px(r * 1.1, r * 0.75, 14, '#8fc8ff', 2) + px(-r * 1.3, r * 0.45, 16, '#fff', 3);
      break;
    }
  }
  const shade = `<path d="M${n1(-r * 0.62)} ${n1(r * 0.55)} A${r} ${r} 0 0 0 ${n1(r * 0.85)} ${n1(r * 0.3)} A${n1(r * 1.15)} ${n1(r * 1.15)} 0 0 1 ${n1(-r * 0.62)} ${n1(r * 0.55)} Z" fill="#000" opacity=".12"/>`;
  const shine = `<ellipse cx="${n1(-r * 0.38)}" cy="${n1(-r * 0.45)}" rx="${n1(r * 0.24)}" ry="${n1(r * 0.12)}" fill="#fff" opacity=".45" transform="rotate(-35 ${n1(-r * 0.38)} ${n1(-r * 0.45)})"/>`;
  defs = `<defs>${defs}</defs>`;
  return defs + back + top + `<circle r="${r}" fill="url(#${uid}-g)" stroke="#fff" stroke-opacity=".5" stroke-width="4"/>`
    + `<g clip-path="url(#${clip})">${bands}${shade}</g>` + shine + front;
}

function label(text: string, y: number) {
  const w = text.length * 17 + 44;
  return `<g transform="translate(0 ${y})"><rect x="${-w / 2}" y="-24" width="${w}" height="46" rx="23" fill="#120e2b" fill-opacity=".72" stroke="#c9b6ff" stroke-width="3"/><text x="0" y="9" text-anchor="middle" font-size="28" fill="#fff" style="${FONT};letter-spacing:1px">${text}</text></g>`;
}

/* ---------------- The Party Galaxy: eight worlds in a ring around Fizz's game board ---------------- */
export function galaxy(): SetDef {
  const W = 3620, R = 120;
  const E = elements();
  const defs = lin('gx-space', [[0, '#05041a'], [0.5, '#16114a'], [1, '#2a1f6e']])
    + rad('gx-neb-p', [[0, '#ff7ab8', 0.42], [1, '#ff7ab8', 0]]) + rad('gx-neb-t', [[0, '#3fd6c0', 0.32], [1, '#3fd6c0', 0]]) + rad('gx-neb-v', [[0, '#8f6bff', 0.45], [1, '#8f6bff', 0]])
    + rad('gx-glow', [[0, '#fff4c7', 0.55], [1, '#fff4c7', 0]]) + lin('gx-board', [[0, '#4b3fb0'], [1, '#231a63']]) + lin('gx-beam', [[0, '#fff8d8', 0.5], [1, '#fff8d8', 0]]);
  const far = `<rect x="-900" y="-600" width="${W + 1800}" height="2200" fill="url(#gx-space)"/>` + stars(320, 51, -800, W + 800, -500, 1500);
  // Coloured nebula clouds and a far spiral galaxy, slowly turning.
  let neb = `<ellipse cx="500" cy="300" rx="700" ry="320" fill="url(#gx-neb-v)"/><ellipse cx="1500" cy="700" rx="760" ry="300" fill="url(#gx-neb-p)"/><ellipse cx="2500" cy="250" rx="720" ry="300" fill="url(#gx-neb-t)"/><ellipse cx="3300" cy="650" rx="700" ry="320" fill="url(#gx-neb-v)"/>`;
  let arms = '';
  for (let k = 0; k < 3; k++) {
    let d = '';
    for (let t = 0; t <= 30; t++) {
      const an = (t / 30) * Math.PI * 1.6 + (k * Math.PI * 2) / 3, rr = 6 + t * 3.4;
      d += `${t ? 'L' : 'M'}${n1(Math.cos(an) * rr)} ${n1(Math.sin(an) * rr * 0.55)} `;
    }
    arms += `<path d="${d}" stroke="#e1d6ff" stroke-width="7" fill="none" opacity=".35" stroke-linecap="round"/>`;
  }
  neb += `<g transform="translate(2100 120)"><g class="spin-slow">${arms}<circle r="12" fill="#fff4c7" opacity=".8"/></g></g>`
    + `<g transform="translate(900 820)"><g class="spin-slow">${arms}<circle r="10" fill="#fff4c7" opacity=".7"/></g></g>`;
  // Little moons, comets and fizzy bubbles between the worlds.
  let mid = comets(9, 5, -400, W + 200, -200, 700) + bubbles(16, 12, 200, W - 200, 150, 900, '#c9b6ff', 120);
  const rm = rng(23);
  for (let i = 0; i < 12; i++) {
    const x = n1(-200 + rm() * (W + 400)), y = n1(-100 + rm() * 1000), rr = n1(8 + rm() * 16);
    mid += `<circle cx="${x}" cy="${y}" r="${rr}" fill="${['#c9b6ff', '#8fc8ff', '#ffd1e8', '#fff4c7'][i % 4]}" opacity=".55"/>`;
  }
  // The ring path that joins the worlds, with little lights running along it.
  let main = '';
  let ringPath = `M${GALAXY_X[0] - 300} ${GALAXY_Y[0] + 80}`;
  ringPath += ` C${GALAXY_X[0] - 150} ${GALAXY_Y[0]} ${GALAXY_X[0] - 100} ${GALAXY_Y[0]} ${GALAXY_X[0]} ${GALAXY_Y[0]}`;
  for (let i = 1; i < GALAXY_X.length; i++) {
    const x0 = GALAXY_X[i - 1], y0 = GALAXY_Y[i - 1], x1 = GALAXY_X[i], y1 = GALAXY_Y[i], h = (x1 - x0) / 2;
    ringPath += ` C${x0 + h} ${y0} ${x1 - h} ${y1} ${x1} ${y1}`;
  }
  ringPath += ` C${GALAXY_X[7] + 100} ${GALAXY_Y[7]} ${GALAXY_X[7] + 150} ${GALAXY_Y[7] - 80} ${GALAXY_X[7] + 320} ${GALAXY_Y[7] - 60}`;
  main += `<path d="${ringPath}" stroke="#c9b6ff" stroke-width="16" fill="none" opacity=".18" stroke-linecap="round"/><path d="${ringPath}" stroke="#fff" stroke-width="5" fill="none" opacity=".55" stroke-dasharray="4 22" stroke-linecap="round"/>`;
  ORBS.forEach((o, i) => {
    const x = GALAXY_X[i], y = GALAXY_Y[i];
    main += `<circle cx="${x}" cy="${y}" r="${R * 1.9}" fill="url(#gx-glow)" class="pulse" style="animation-delay:${i * 0.3}s"/>`;
    main += E.el(`g${i + 1}`, x, y, orb(o.kind, R, o.a, o.b, `gx${i}`));
    main += `<g transform="translate(${x} ${y})">${label(o.name, R + 66)}</g>`;
  });
  // Fizz's game board, floating in the middle of the ring.
  const tiles = ['#ff9fcf', '#7fe6c9', '#ffd36e', '#8fc8ff', '#c9b6ff'];
  let board = `<path d="M-220 0 Q0 -40 220 0 L170 70 Q0 96 -170 70 Z" fill="url(#gx-board)" stroke="${INK}" stroke-width="5"/><path d="M-220 0 Q0 -40 220 0" stroke="#c9b6ff" stroke-width="6" fill="none"/>`;
  for (let i = 0; i < 9; i++) {
    const x = -176 + i * 44, y = -14 + Math.abs(i - 4) * 3;
    board += `<path d="M${x - 18} ${y + 12} L${x - 14} ${y - 8} L${x + 18} ${y - 8} L${x + 20} ${y + 12} Z" fill="${tiles[i % 5]}" stroke="${INK}" stroke-width="2"/>`;
  }
  board += `<path d="M-120 -200 L-60 -10 L-120 -10 Z" fill="url(#gx-beam)" transform="rotate(-8 -120 -200)"/><path d="M120 -200 L60 -10 L120 -10 Z" fill="url(#gx-beam)" transform="rotate(8 120 -200)"/>`
    + `<g><rect x="-128" y="-148" width="256" height="52" rx="16" fill="#120e2b" stroke="#ff9fcf" stroke-width="5"/><text x="0" y="-111" text-anchor="middle" font-size="30" fill="#ff9fcf" style="${FONT}" class="pulse">PARTY GALAXY</text></g>`
    + `<path d="M-30 0 Q-30 -40 0 -46 Q30 -40 30 0 Z" fill="#7B61FF" stroke="${INK}" stroke-width="3"/>`;
  main += `<circle cx="${BOARD.x}" cy="${BOARD.y - 30}" r="300" fill="url(#gx-glow)" class="pulse"/>`;
  main += E.el('board', BOARD.x, BOARD.y, `<g class="bob">${board}</g>`);
  main += balloons(8, 31, BOARD.x - 320, BOARD.x + 320, BOARD.y - 80, BOARD.y + 40);
  // Foreground: big soft sparkles and space rocks that sweep past quickly when the camera pans.
  let front = '';
  const rf = rng(97);
  for (let i = 0; i < 16; i++) {
    const x = n1(-900 + i * 380 + rf() * 120), top = i % 2 === 0, y = top ? n1(-420 + rf() * 120) : n1(1160 + rf() * 140);
    front += i % 3 === 0
      ? `<g transform="translate(${x} ${y})"><path d="M-60 -10 Q-40 -50 10 -44 Q60 -30 56 10 Q40 50 -10 46 Q-58 34 -60 -10 Z" fill="#3b2f86" stroke="${INK}" stroke-width="5"/><circle cx="-14" cy="-8" r="10" fill="#2a1f6e"/><circle cx="20" cy="14" r="7" fill="#2a1f6e"/></g>`
      : sparkleStar(x, y, n1(26 + rf() * 30), i % 2 ? '#fff6d8' : '#ffd1e8', 'tw');
  }
  return {
    id: 'galaxy', w: W, h: 1000, ground: BOARD.y - 30, top: -300, bottom: 1250, bg: '#05041a', defs,
    layers: [{ p: 0.04, svg: far }, { p: 0.15, svg: neb }, { p: 0.45, svg: mid }, { p: 1, svg: main }, { p: 1.7, svg: front, front: true }],
    els: E.anchors,
    scale: () => 0.7,
  };
}

/* ---------------- The Candy Nebula from the sky: fly down through clouds, then tour the land ---------------- */
export function vista(): SetDef {
  const W = 3600, H = 2000;
  const E = elements();
  const defs = lin('vs-sky', [[0, '#3a2a8a'], [0.2, '#5a3fc0'], [0.367, '#9a7ae8'], [0.5, '#d9a8f0'], [0.583, '#ffc6e4'], [0.65, '#ffe2c4'], [0.733, '#fff1d8'], [1, '#fff1d8']])
    + rad('vs-sun', [[0, '#fff8d8', 0.95], [0.4, '#ffe9a8', 0.5], [1, '#ffe9a8', 0]]) + lin('vs-jelly', [[0, '#c6f7e4'], [0.4, '#8fe8c6'], [1, '#4fbf9a']])
    + lin('vs-far', [[0, '#ffd1e8'], [1, '#f2b6d8']]) + lin('vs-choc', [[0, '#9a6040'], [1, '#5a3420']]) + lin('vs-ice', [[0, '#ffffff'], [1, '#f2e6ff']], 1, 0)
    + rad('vs-glow', [[0, '#fff4c7', 0.95], [0.45, '#ffe9a8', 0.45], [1, '#ffe9a8', 0]]) + rad('vs-floss', [[0, '#fff0f8'], [1, '#ffb7dc']], 0.4, 0.35, 0.7) + lin('vs-pud', [[0, '#ffc6dd'], [1, '#ff8fbf']]);
  // Sky (its colour slides from high violet to a warm horizon as the camera comes down).
  const sky = `<rect x="-900" y="-600" width="${W + 1800}" height="3000" fill="url(#vs-sky)"/><circle cx="2500" cy="1160" r="260" fill="url(#vs-sun)"/>`;
  // Stars high up and the other worlds of the Party Galaxy, faint in the sky.
  const space = stars(140, 61, 300, 3300, -200, 520) + comets(4, 8, 800, 2600, -100, 400)
    + `<g opacity=".85" transform="translate(1980 770)"><circle r="64" fill="#b79cf0"/><path d="M-34 -50 l0 -26 l10 -12 l10 12 l0 26 M-8 -50 l0 -40 l12 -16 l12 16 l0 40 M22 -50 l0 -22 l9 -10 l9 10 l0 22" fill="#e9e1ff" stroke="#6b3fa0" stroke-width="3"/></g>`
    + `<g opacity=".8" transform="translate(1450 840)"><ellipse rx="80" ry="18" fill="none" stroke="#fff" stroke-width="6" opacity=".6"/><circle r="42" fill="#9cc4f0"/></g>`;
  // Cloud banks: high puffs to fall through, low banks resting on the horizon.
  let clouds = '';
  for (let i = 0; i < 9; i++) clouds += cloud(600 + i * 280, 300 + (i % 3) * 170, 1.6 + (i % 2) * 0.6, i % 2 ? '#fff0f8' : '#ffe6f3', 'drift slow');
  for (let i = 0; i < 12; i++) clouds += cloud(300 + i * 230, 1020 + (i % 2) * 24, 1.3, '#fff4fa', 'drift');
  // Far hills on the horizon with tiny lollipop trees.
  let far = `<path d="M-600 1150 Q200 1030 900 1110 T2200 1080 T3600 1120 L3600 1500 L-600 1500 Z" fill="url(#vs-far)" stroke="#e8a8cc" stroke-width="4"/>`
    + `<path d="M-600 1190 Q500 1120 1300 1170 T2900 1160 L3600 1170 L3600 1500 L-600 1500 Z" fill="#f7c4e0"/>`;
  for (let i = 0; i < 22; i++) far += lollipop(200 + i * 150, 1176 - (i % 3) * 8, 9 + (i % 3) * 3, 26, ['#ff9fcf', '#ffd36e', '#7fe6c9', '#c9b6ff'][i % 4], '#fff');

  // Sugar Mountain stands far away on the horizon. It is drawn first, so the land hides its foot.
  const [px, py] = VISTA.peak;
  let main = `<path d="M2520 1330 L${px - 80} ${py + 46} Q${px} ${py - 4} ${px + 80} ${py + 46} L3800 1330 Z" fill="url(#vs-ice)" stroke="#d8b8e8" stroke-width="6"/>`
    + `<path d="M2760 1190 Q2900 1240 3020 1170 T3290 1180 T3520 1220" stroke="#ffb7dc" stroke-width="16" fill="none" stroke-linecap="round" opacity=".8"/>`
    + `<path d="M2960 1080 Q3060 1120 3150 1070 T3340 1085" stroke="#8fc8ff" stroke-width="13" fill="none" stroke-linecap="round" opacity=".7"/>`
    + `<path d="M2860 1290 L3230 1210 L2990 1130 L3190 1050 L${px} ${py + 34}" stroke="#ffe8f4" stroke-width="10" fill="none" stroke-dasharray="10 12" opacity=".9"/>`
    + candyCane(2800, 1262, 40) + candyCane(3480, 1252, 36, true);
  main += E.el('peak', px, py, `<circle cy="-60" r="220" fill="url(#vs-glow)" class="pulse"/><g class="spin-slow">${raysBurst(150, 12)}</g>${lollipop(0, 4, 42, 70, '#ff9fcf', '#ffd36e')}`);
  // The land: rolling jelly with shiny streaks.
  main += hills(-600, W + 600, 1290, 18, 240, 71, 'url(#vs-jelly)', 2300, INK);
  const rj = rng(5);
  for (let i = 0; i < 40; i++) {
    const x = Math.round(-200 + rj() * (W + 400)), y = Math.round(1350 + rj() * 650), s = 0.5 + (y - 1300) / 900;
    main += `<path d="M${x} ${y} q${n1(18 * s)} ${n1(-8 * s)} ${n1(36 * s)} 0" stroke="#fff" stroke-width="${n1(3 + s * 2)}" fill="none" opacity=".45" stroke-linecap="round"/>`;
  }
  // The chocolate river: narrow near the horizon, wide close by, from the waterfall cave.
  const river = 'M1140 1330 C1260 1380 1360 1420 1300 1480 C1220 1560 1060 1580 1140 1680 C1220 1780 1560 1800 1500 1900 C1460 1980 1300 2040 1320 2200';
  main += `<path d="${river}" stroke="#4a2a18" stroke-width="150" fill="none" stroke-linecap="round" opacity=".25"/>`
    + `<path d="${river}" stroke="url(#vs-choc)" stroke-width="40" fill="none" stroke-linecap="round"/>`
    + `<path d="M1300 1480 C1220 1560 1060 1580 1140 1680 C1220 1780 1560 1800 1500 1900 C1460 1980 1300 2040 1320 2200" stroke="url(#vs-choc)" stroke-width="80" fill="none" stroke-linecap="round"/>`
    + `<path d="M1500 1900 C1460 1980 1300 2040 1320 2200" stroke="url(#vs-choc)" stroke-width="140" fill="none" stroke-linecap="round"/>`;
  for (const [x, y, w] of [[1180, 1640, 26], [1290, 1760, 34], [1450, 1850, 40], [1380, 1990, 50], [1240, 1530, 20]] as const) {
    main += `<g class="drift" style="animation-duration:7s"><path d="M${x} ${y} q${w / 2} -6 ${w} 0" stroke="#c48a64" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
  }
  main += bubbles(10, 44, 1120, 1520, 1600, 2000, '#c48a64', 26);
  main += `<g transform="translate(1340 1820)"><g class="leap"><path d="M-22 0 Q-8 -14 10 -8 Q20 -4 22 0 Q20 4 10 8 Q-8 14 -22 0 Z M-20 0 L-34 -9 L-31 0 L-34 9 Z" fill="#6a3a22" stroke="${INK}" stroke-width="2.5"/><circle cx="11" cy="-2" r="2.5" fill="#fff"/></g></g>`;
  // The waterfall cave: a chocolate cliff with icing on top and chocolate pouring past the cave mouth.
  main += `<g transform="translate(1110 1335)"><path d="M-118 12 Q-124 -58 -76 -96 Q-24 -130 30 -118 Q100 -102 116 -40 Q122 -6 118 12 Z" fill="#7a4a2c" stroke="${INK}" stroke-width="4"/>`
    + `<path d="M-104 -64 Q-70 -104 -20 -114 Q34 -122 84 -92 Q72 -72 56 -84 Q44 -64 28 -82 Q12 -62 -6 -82 Q-24 -60 -42 -80 Q-62 -60 -80 -76 Q-92 -62 -104 -64 Z" fill="#ffe8f4" stroke="${INK}" stroke-width="2"/>`
    + `<path d="M-36 12 L-36 -26 Q0 -56 36 -26 L36 12 Z" fill="#2a1408"/>`
    + `<g class="flowdown">${[-26, -8, 10, 28].map((x) => `<path d="M${x} -64 V-30" stroke="#9a6040" stroke-width="8" stroke-linecap="round"/>`).join('')}</g></g>`;
  main += E.el('river', VISTA.river[0], VISTA.river[1], '<g/>');
  // A board-game path of round tiles joins every place in the story, with a wafer bridge over the river.
  const PATH_PTS: [number, number][] = [[150, 1720], [450, 1690], [750, 1705], [1000, 1695], [1145, 1682], [1400, 1650], [1650, 1640], [1900, 1645], [2150, 1655], [2400, 1640], [2650, 1600], [2840, 1520], [2960, 1420], [3020, 1330]];
  const tileCols = ['#ff9fcf', '#7fe6c9', '#ffd36e', '#8fc8ff', '#c9b6ff'];
  let tiles = '', k = 0;
  for (let i = 1; i < PATH_PTS.length; i++) {
    const [x0, y0] = PATH_PTS[i - 1], [x1, y1] = PATH_PTS[i];
    const steps = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 56));
    for (let j = 0; j < steps; j++, k++) {
      const x = x0 + ((x1 - x0) * j) / steps, y = y0 + ((y1 - y0) * j) / steps, d = Math.max(0, (y - 1290) / 760), r = n1(8 + d * 13);
      if (x > 1060 && x < 1230) continue; // the bridge
      tiles += k % 7 === 3
        ? `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${r}" ry="${n1(r * 0.62)}" fill="#fff" stroke="${INK}" stroke-width="2"/>${star5(n1(x), n1(y - r * 0.05), n1(r * 0.55), '#ffd36e', '#c99a2e', 1.5)}`
        : `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${r}" ry="${n1(r * 0.62)}" fill="${tileCols[k % 5]}" stroke="${INK}" stroke-width="2"/>`;
    }
  }
  main += `<g opacity=".95">${tiles}</g>`;
  main += `<g transform="translate(1145 1680)"><rect x="-82" y="-13" width="164" height="26" rx="6" fill="#f2c98a" stroke="${INK}" stroke-width="3"/>${[-60, -36, -12, 12, 36, 60].map((x) => `<path d="M${x} -13 V13" stroke="#a8724a" stroke-width="2"/>`).join('')}<path d="M-82 -13 Q0 -30 82 -13" stroke="#ff9fcf" stroke-width="4" fill="none"/></g>`;
  // Sweets all over the land, smaller near the horizon and bigger close by (they never block a landmark).
  const RIVER_PTS: [number, number][] = [[1140, 1330], [1290, 1440], [1260, 1530], [1110, 1610], [1150, 1700], [1350, 1790], [1500, 1880], [1400, 1990], [1320, 2100]];
  const segDist = (pts: [number, number][], x: number, y: number) => {
    let best = Infinity;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)));
      best = Math.min(best, Math.hypot(x - (ax + t * (bx - ax)), y - (ay + t * (by - ay))));
    }
    return best;
  };
  const blocked = (x: number, y: number) => segDist(RIVER_PTS, x, y) < 40 + ((y - 1300) / 800) * 90
    || segDist(PATH_PTS, x, y) < 26 + ((y - 1300) / 760) * 24
    || ((x - 2250) / 430) ** 2 + ((y - 1505) / 110) ** 2 < 1 || (x > 2330 && x < 2990 && y > 1500 && y < 2070)
    || Math.hypot(x - 520, y - 1560) < 140 || (x > 980 && x < 1240 && y < 1380) || (x > 660 && x < 1010 && y > 1420 && y < 1530);
  const rs = rng(19);
  const items: [number, string][] = [];
  const pick = (list: string[]) => list[Math.floor(rs() * list.length)];
  for (let i = 0; i < 260; i++) {
    const y = 1310 + Math.pow(rs(), 1.1) * 740, x = -300 + rs() * (W + 600);
    if (blocked(x, y)) continue;
    const d = (y - 1290) / 760, sc = 0.35 + d * 1.05, kind = i % 6;
    let art: string;
    if (kind === 0 || kind === 3) art = lollipop(n1(x), n1(y), n1(18 * sc), n1(62 * sc), pick(['#ff9fcf', '#ffd36e', '#7fe6c9', '#c9b6ff', '#8fc8ff']), '#fff', 'sway slow');
    else if (kind === 1) art = gumdrop(n1(x), n1(y), n1(15 * sc), pick(['#ff9fcf', '#ffd36e', '#7fe6c9', '#c9b6ff', '#8fc8ff']));
    else if (kind === 2) art = `<path d="M${n1(x)} ${n1(y)} v${n1(-48 * sc)}" stroke="#fff8ee" stroke-width="${n1(5 * sc)}" stroke-linecap="round"/><g fill="${pick(['#ffc6e4', '#d9c6ff', '#c6f2ff'])}" stroke="${INK}" stroke-width="2"><circle cx="${n1(x - 12 * sc)}" cy="${n1(y - 50 * sc)}" r="${n1(14 * sc)}"/><circle cx="${n1(x + 12 * sc)}" cy="${n1(y - 52 * sc)}" r="${n1(14 * sc)}"/><circle cx="${n1(x)}" cy="${n1(y - 64 * sc)}" r="${n1(16 * sc)}"/></g>`;
    else if (kind === 4) art = `<path d="M${n1(x - 34 * sc)} ${n1(y)} Q${n1(x)} ${n1(y - 40 * sc)} ${n1(x + 34 * sc)} ${n1(y)} Z" fill="#9ff0d0" stroke="${INK}" stroke-width="2"/><path d="M${n1(x - 14 * sc)} ${n1(y - 14 * sc)} q8 -8 18 -8" stroke="#fff" stroke-width="3" fill="none" opacity=".6"/>`;
    else art = sc > 0.7 ? candyCane(n1(x), n1(y), n1(34 * sc), rs() > 0.5) : gumdrop(n1(x), n1(y), n1(13 * sc), '#ffb38a');
    items.push([y, art]);
  }
  // Candy Town: a few gumdrop houses near the fields.
  for (const [x, y, sc, c] of [[720, 1468, 0.55, '#ff9fcf'], [800, 1494, 0.65, '#8fc8ff'], [880, 1462, 0.5, '#ffd36e'], [960, 1490, 0.6, '#c9b6ff']] as const) {
    items.push([y, `<g transform="translate(${x} ${y}) scale(${sc})"><path d="M-50 0 Q-50 -76 0 -80 Q50 -76 50 0 Z" fill="${c}" stroke="${INK}" stroke-width="4"/><path d="M-12 0 V-30 Q0 -42 12 -30 V0 Z" fill="#7a4a2c" stroke="${INK}" stroke-width="3"/><circle cx="-26" cy="-44" r="9" fill="#fff4c7" stroke="${INK}" stroke-width="2.5"/><circle cx="26" cy="-44" r="9" fill="#fff4c7" stroke="${INK}" stroke-width="2.5"/><ellipse cx="-20" cy="-62" rx="10" ry="5" fill="#fff" opacity=".55"/></g>`]);
  }
  items.sort((a, b) => a[0] - b[0]).forEach(([, art]) => { main += art; });
  // The jelly fields where the crew lands, with the big candy-floss cloud.
  main += E.el('fields', VISTA.fields[0], VISTA.fields[1], `<circle cx="-50" cy="-24" r="42" fill="url(#vs-floss)"/><circle cx="0" cy="-42" r="56" fill="url(#vs-floss)"/><circle cx="56" cy="-22" r="42" fill="url(#vs-floss)"/><rect x="-86" y="-30" width="176" height="30" rx="15" fill="url(#vs-floss)"/>`);
  // The jelly-bean course over a pudding pool, with its start and finish flags.
  const [cx, cy] = VISTA.course;
  let course = `<ellipse cx="0" cy="20" rx="380" ry="74" fill="url(#vs-pud)" stroke="${INK}" stroke-width="4"/>`;
  const beanCols = ['#ff9fcf', '#7fe6c9', '#ffd36e', '#8fc8ff', '#c9b6ff', '#ffb38a', '#9fe08a'];
  for (let i = 0; i < 7; i++) course += jellyBean(-270 + i * 90, 26 + Math.sin(i) * 8, 52, 24, beanCols[i]);
  course += `<path d="M-350 10 V-70" stroke="#fff" stroke-width="5"/><path d="M-350 -70 l34 10 -34 10" fill="#7fe6c9" stroke="${INK}" stroke-width="2"/><path d="M350 10 V-80" stroke="#fff" stroke-width="5"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${350 + (i % 3) * 12}" y="${-80 + Math.floor(i / 3) * 12}" width="12" height="12" fill="${(i + Math.floor(i / 3)) % 2 ? '#fff' : '#1d1745'}"/>`).join('')}`;
  main += E.el('course', cx, cy, course);
  main += bubbles(8, 77, cx - 320, cx + 320, cy + 10, cy + 60, '#fff', 30);
  // The lollipop garden.
  const [gx, gy] = VISTA.garden;
  const lp = [[-230, 40, 34, 150], [-150, -10, 40, 180], [-60, 30, 44, 200], [40, -20, 38, 170], [130, 40, 46, 210], [220, 0, 34, 150], [300, 50, 30, 130]];
  const lpCols: [string, string][] = [['#ff9fcf', '#fff'], ['#ffd36e', '#ff9fcf'], ['#7fe6c9', '#fff'], ['#c9b6ff', '#ffd36e'], ['#8fc8ff', '#fff'], ['#ffb38a', '#fff4c7'], ['#ff9fcf', '#ffd36e']];
  main += E.el('garden', gx, gy, lp.map(([x, y, r, st], i) => lollipop(x, y, r, st, lpCols[i][0], lpCols[i][1], 'sway slow')).join(''));
  // Life: candy birds in the sky, butterflies over the fields.
  main += birds(12, 17, -400, 2400, 880, 1240, 2200) + butterflies(7, 29, 200, 3200, 1840, 1990);
  // Front: clouds the camera falls through, and thin wisps that drift past during the tour.
  let front = '';
  for (let i = 0; i < 7; i++) front += `<g opacity="${i % 2 ? 0.75 : 0.9}">${cloud(1380 + (i % 3) * 230 - (i % 2) * 120, 240 + i * 130, 2.4 + (i % 3) * 0.5, i % 2 ? '#fff6fb' : '#ffe6f3', 'drift')}</g>`;
  for (let i = 0; i < 4; i++) front += `<g opacity=".55">${cloud(-200 + i * 1100, 1480 + (i % 2) * 60, 2.2, '#fff', 'drift slow')}</g>`;
  return {
    id: 'vista', w: W, h: H, ground: 1900, top: -300, bottom: 2050, bg: '#5a3fc0', defs,
    layers: [{ p: 0.6, svg: sky }, { p: 0.3, svg: space }, { p: 0.45, svg: clouds }, { p: 0.7, svg: far }, { p: 1, svg: main }, { p: 1.6, svg: front, front: true }],
    els: E.anchors,
    scale: () => 0.5,
  };
}

function raysBurst(len: number, n: number) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, w = 0.09;
    s += `<path d="M0 -60 L${n1(Math.cos(a - w) * len)} ${n1(-60 + Math.sin(a - w) * len)} L${n1(Math.cos(a + w) * len)} ${n1(-60 + Math.sin(a + w) * len)} Z" fill="#fff4c7" opacity=".35"/>`;
  }
  return s;
}
