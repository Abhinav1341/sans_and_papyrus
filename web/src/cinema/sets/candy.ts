// World 1, the Candy Nebula: landing fields, the jelly-bean race, the chocolate river, the
// lollipop garden, Sugar Mountain, its summit and the night camp.
import type { SetDef } from './types';
import { INK, FONT, lin, rad, stars, planet, cloud, lollipop, gumdrop, candyCane, hills, rng, sparkleStar, star5, elements, birds, butterflies, bubbles, comets } from './kit';
import { BEAN_X, SINK_X, POLE_X, COURSE, BEAN_TOP, GUMBALL_TOP, SHIELD, RIVER, PLANK_DX, GARDEN, gardenScale, PATH, GRIPS, ICY_RAMP, SUMMIT, SHARE, SEATS } from './candy-layout';

const SKY = (id: string) => lin(id, [[0, '#b9a6ff'], [0.45, '#ffc6e4'], [1, '#ffe8c4']]);
const JELLY = (id: string) => lin(id, [[0, '#a6f0d4'], [1, '#5ccfae']]);

/** Rolling jelly ground with shiny highlights. */
function jellyGround(W: number, top: number, id: string) {
  let s = hills(-500, W + 500, top, 26, 220, 3, `url(#${id})`, 1100, INK);
  const r = rng(top);
  for (let i = 0; i < Math.ceil(W / 160); i++) {
    const x = i * 160 + r() * 60, y = top + 60 + r() * 220;
    s += `<path d="M${Math.round(x)} ${Math.round(y)} q20 -10 40 0" stroke="#fff" stroke-width="5" fill="none" opacity=".45" stroke-linecap="round"/>`;
  }
  return s;
}

/** Sugar Mountain in the distance with the glowing Giant Lollipop on top. */
function farMountain(x: number, base: number, h: number, id: string) {
  return `<defs>${rad(id, [[0, '#fff4c7', 0.9], [1, '#fff4c7', 0]])}</defs>`
    + `<path d="M${x - 520} ${base} L${x - 60} ${base - h} Q${x} ${base - h - 26} ${x + 60} ${base - h} L${x + 520} ${base} Z" fill="#fff6fb" stroke="#d8b8e8" stroke-width="5"/>`
    + `<path d="M${x - 200} ${base - h * 0.62} Q${x - 120} ${base - h * 0.5} ${x - 40} ${base - h * 0.62} T${x + 120} ${base - h * 0.6} T${x + 260} ${base - h * 0.5}" stroke="#ffb7dc" stroke-width="14" fill="none" stroke-linecap="round"/>`
    + `<circle cx="${x}" cy="${base - h - 70}" r="90" fill="url(#${id})" class="pulse"/>`
    + lollipop(x, base - h - 6, 36, 60, '#ff9fcf', '#ffd36e');
}

/** Soft candy-floss puffs: darker undersides, light tops, a few wisps; `top` adds the shine on top. */
function flossPuffs(puffs: [number, number, number][], top: boolean) {
  let s = '';
  for (const [x, y, r] of puffs) s += `<circle cx="${x}" cy="${y + r * 0.18}" r="${r}" fill="url(#cl-flossd)"/>`;
  for (const [x, y, r] of puffs) s += `<circle cx="${x}" cy="${y}" r="${r * 0.92}" fill="url(#cl-floss)"/>`;
  for (const [x, y, r] of puffs) s += `<path d="M${x - r * 0.5} ${y - r * 0.3} q${r * 0.3} ${-r * 0.25} ${r * 0.6} 0" stroke="#fff" stroke-width="${Math.max(3, r * 0.07).toFixed(1)}" fill="none" opacity=".7" stroke-linecap="round"/>`;
  if (top) s += `<ellipse cx="-20" cy="-210" rx="44" ry="16" fill="#fff" opacity=".75"/><path d="M-200 -10 q-30 -20 -60 -8 M210 -10 q30 -18 56 -4" stroke="#ffd1e8" stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/>`;
  return s;
}

/* ---------------- Sweet Landing: jelly hills, gumdrops, candy floss ---------------- */
export function candyland(): SetDef {
  const W = 2600;
  const E = elements();
  const defs = SKY('cl-sky') + JELLY('cl-jelly') + rad('cl-floss', [[0, '#fff6fb'], [0.55, '#ffd1e8'], [1, '#ff9fcf']], 0.4, 0.3, 0.75) + rad('cl-flossd', [[0, '#ffc6e4'], [1, '#f08cc0']], 0.5, 0.2, 0.8) + lin('cl-hill', [[0, '#b8f5dd'], [1, '#7fe6c9']]);
  const far = `<rect x="-600" y="-300" width="${W + 1200}" height="1400" fill="url(#cl-sky)"/>` + planet(2050, 190, 150, '#ffe3f1', '#ff9fcf', true, 'cl-pl')
    + stars(30, 8, -200, W + 200, 0, 300, '#fff');
  const clouds = cloud(-80, 260, 1.4, '#fff0f8', 'drift slow') + cloud(700, 200, 1.1, '#ffe6f3', 'drift') + cloud(1400, 300, 1.5, '#fff0f8', 'drift slow') + cloud(2300, 240, 1.2, '#ffe6f3', 'drift');
  const mtn = farMountain(1950, 560, 330, 'cl-glow') + `<path d="M-400 560 Q200 430 700 520 T1500 500 L1500 600 L-400 600 Z" fill="#ffd1e8" stroke="#e8a8cc" stroke-width="4"/>`;
  let mid = `<path d="M-500 600 Q300 520 900 580 T2200 560 T${W + 500} 580 L${W + 500} 700 L-500 700 Z" fill="url(#cl-hill)" stroke="${INK}" stroke-width="3"/>`;
  [[120, 560, 60, 170, '#ff9fcf', '#fff'], [560, 590, 46, 130, '#8fc8ff', '#fff'], [1120, 570, 54, 150, '#ffd36e', '#ff9fcf'], [2340, 575, 60, 170, '#c9b6ff', '#fff']]
    .forEach(([x, y, rr, st, a, b]) => { mid += lollipop(x as number, y as number, rr as number, st as number, a as string, b as string, 'sway slow'); });
  for (let x = -200; x < W + 200; x += 130) mid += candyCane(x, 640, 50, (x / 130) % 2 === 0);
  mid += birds(9, 41, -300, W, 180, 420, 1800);
  let main = jellyGround(W, 640, 'cl-jelly');
  main += butterflies(6, 13, 100, W - 200, 600, 690);
  main += gumdrop(300, 700, 46, '#ff9fcf') + gumdrop(2250, 706, 52, '#8fc8ff') + gumdrop(1700, 690, 30, '#ffd36e');
  // The candy-floss cloud the crew lands in: a big soft heap of puffs (the back half here; the front
  // puffs are drawn over the children, so they sink into it).
  main += E.el('floss', 520, 712, flossPuffs([[-170, -40, 62], [-100, -96, 86], [0, -132, 112], [104, -100, 90], [176, -44, 64], [-40, -60, 70], [60, -56, 72]], true));
  main += E.el('jellyhill', 1020, 716, `<path d="M-170 0 Q-150 -128 0 -132 Q150 -128 170 0 Z" fill="#9ff0d0" stroke="${INK}" stroke-width="5"/><path d="M-110 -70 Q-60 -110 10 -112" stroke="#fff" stroke-width="10" fill="none" opacity=".6" stroke-linecap="round"/><circle cx="60" cy="-60" r="8" fill="#fff" opacity=".5"/>`);
  main += E.el('tree', 1360, 712, lollipop(0, 0, 66, 260, '#7fe6c9', '#fff'));
  main += E.el('rock', 1560, 714, gumdrop(0, 0, 56, '#c9b6ff'));
  main += E.el('lolli', 2060, 712, lollipop(0, 0, 74, 300, '#ff9fcf', '#ffd36e'));
  main += E.el('skycloud', 1460, 330, cloud(-60, 0, 0.9, '#fff', ''));
  main += E.el('gumball', 1200, 560, `<circle r="15" fill="#ff7ab8" stroke="${INK}" stroke-width="3"/><circle cx="-5" cy="-5" r="5" fill="#fff" opacity=".7"/>`, { opacity: 0 });
  const front = gumdrop(-60, 1010, 90, '#ffd36e') + gumdrop(W + 40, 1000, 110, '#ff9fcf') + `<g opacity=".9">${[200, 900, 1600, 2300].map((x) => `<path d="M${x} 1010 q10 -60 0 -110 M${x + 20} 1010 q14 -50 10 -90" stroke="#5ccfae" stroke-width="16" fill="none" stroke-linecap="round"/>`).join('')}</g>`;
  return {
    id: 'candyland', w: W, h: 1000, ground: 715, top: -280, bottom: 1080, bg: '#ffd1e8', defs,
    layers: [{ p: 0.05, svg: far }, { p: 0.15, svg: clouds }, { p: 0.3, svg: mtn }, { p: 0.6, svg: mid }, { p: 1, svg: main },
      { p: 1, svg: E.el('flossfront', 520, 712, flossPuffs([[-150, 4, 56], [-70, -8, 66], [20, -2, 70], [110, -6, 62], [188, 6, 48]], false)), front: true },
      { p: 1.3, svg: front, front: true }],
    els: E.anchors,
    scale: (y) => Math.max(0.6, Math.min(1.15, 1 + (y - 715) * 0.0022)),
  };
}

/* ---------------- Mini-game one: the Jelly Bean Bounce (a long course over a pudding sea) ---------------- */
export function jellycourse(): SetDef {
  const W = COURSE.w;
  const E = elements();
  const defs = SKY('jc-sky') + lin('jc-pud', [[0, '#ffc6dd'], [1, '#ff8fbf']]) + lin('jc-plat', [[0, '#f7d08a'], [1, '#e0a85a']])
    + lin('jc-lip', [[0, '#ffbcd8'], [0.3, '#ff9fc8'], [1, '#f77fb4']])
    + rad('jc-gum1', [[0, '#fff'], [0.25, '#ffb7dc'], [1, '#ff5fa2']], 0.35, 0.3, 0.75)
    + rad('jc-gum2', [[0, '#fff'], [0.25, '#bff6e6'], [1, '#2fbf98']], 0.35, 0.3, 0.75)
    + rad('jc-gum3', [[0, '#fff'], [0.25, '#fff1b8'], [1, '#f2b021']], 0.35, 0.3, 0.75);
  const far = `<rect x="-900" y="-300" width="${W + 1800}" height="1400" fill="url(#jc-sky)"/>` + farMountain(3900, 600, 300, 'jc-glow')
    + [200, 1300, 2300, 3300, 4400, 5500, 6500].map((x, i) => cloud(x, 180 + (i % 3) * 60, 1.1 + (i % 2) * 0.3, i % 2 ? '#ffe6f3' : '#fff0f8', i % 2 ? 'drift' : 'drift slow')).join('');
  let mid = `<path d="M-500 640 Q600 560 1400 620 T2800 600 T4200 620 T5600 600 T7000 610 T${W + 600} 610 L${W + 600} 760 L-500 760 Z" fill="#ffd1e8" stroke="#e8a8cc" stroke-width="4"/>`;
  mid += birds(14, 52, -300, W, 200, 440, 2400);
  for (let i = 0; i < 19; i++) mid += `<g transform="translate(${i * 400 - 100} 600)"><path d="M0 0 V-90" stroke="#fff" stroke-width="5"/><path d="M0 -90 L46 -76 L0 -62 Z" fill="${['#7fe6c9', '#ffd36e', '#8fc8ff'][i % 3]}"/></g>`;
  // The pudding sea (its near edge is drawn in front of the beans, below).
  let main = `<rect x="-600" y="740" width="${W + 1200}" height="400" fill="url(#jc-pud)"/>`;
  // Start platform and sign.
  main += `<rect x="-500" y="715" width="${COURSE.start + 500}" height="400" fill="url(#jc-plat)" stroke="${INK}" stroke-width="5"/>${[-400, -240, -80, 80, 240].map((x) => `<path d="M${x} 715 V1100" stroke="#c48a64" stroke-width="3"/>`).join('')}`
    + `<g><rect x="120" y="420" width="18" height="300" fill="#fff" stroke="${INK}" stroke-width="3"/><rect x="380" y="420" width="18" height="300" fill="#fff" stroke="${INK}" stroke-width="3"/><rect x="100" y="400" width="320" height="54" rx="14" fill="#7fe6c9" stroke="${INK}" stroke-width="4"/><text x="260" y="440" text-anchor="middle" font-size="34" fill="#1d1745" style="${FONT}">START</text></g>`;
  // Candy-cane poles standing in the pudding: Ro hooks his toffee arm round them to swing ahead.
  POLE_X.forEach((x, i) => { main += E.el(`pole${i + 1}`, x, 800, candyCane(0, 0, 330, i % 2 === 1)); });
  // The Big Gap: a warning sign bobbing in the pudding.
  main += `<g transform="translate(${COURSE.gapFrom + 560} 770)"><g class="bob"><path d="M0 0 V-170" stroke="#fff" stroke-width="10" stroke-linecap="round"/><path d="M-90 -230 H90 L104 -200 L90 -170 H-90 L-104 -200 Z" fill="#ffd36e" stroke="${INK}" stroke-width="5"/><text x="0" y="-188" text-anchor="middle" font-size="32" fill="#1d1745" style="${FONT}">BIG GAP!</text></g></g>`;
  // The jelly beans: big, glossy and floating. Each one is a different flavour.
  const beanCols = ['#ff9fcf', '#7fe6c9', '#ffd36e', '#8fc8ff', '#c9b6ff', '#ffb38a', '#9fe08a'];
  BEAN_X.forEach((x, i) => { main += E.el(`b${i + 1}`, x, BEAN_TOP + 1, bigBean(beanCols[i % beanCols.length], i)); });
  // Sinking beans: paler, with bubbles rising round them (they slide under when stepped on).
  SINK_X.forEach((x, i) => {
    main += E.el(`k${i + 1}`, x, BEAN_TOP + 1, bigBean(['#e3d6ff', '#ffd9c4', '#d4ecff'][i], 20 + i) + bubbles(4, 60 + i, -80, 80, 30, 60, '#fff', 34));
  });
  // Giant gumballs (Kiki's stepping stones), hidden until she pops them onto the sinking beans (the
  // beans sink away under them, and the gumballs float).
  SINK_X.forEach((x, i) => {
    main += E.el(`gs${i + 1}`, x, GUMBALL_TOP + 70, `<circle r="70" fill="url(#jc-gum${i + 1})" stroke="${INK}" stroke-width="5"/><ellipse cx="-24" cy="-30" rx="20" ry="11" fill="#fff" opacity=".75" transform="rotate(-30 -24 -30)"/>`, { opacity: 0, scale: 0.2 });
  });
  // Meera's shield, laid flat on the last bean before the gap as a springboard.
  main += E.el('shieldboard', SHIELD.x, BEAN_TOP, `<ellipse cx="0" cy="-2" rx="70" ry="17" fill="#e0679f" stroke="${INK}" stroke-width="4"/><ellipse cx="0" cy="-8" rx="68" ry="15" fill="#ff9fcf" stroke="${INK}" stroke-width="4"/><ellipse cx="0" cy="-9" rx="46" ry="9" fill="#ffd1e8"/><path d="M-22 -10 q22 -9 44 0" stroke="#7fe6c9" stroke-width="4" fill="none"/><ellipse cx="-30" cy="-14" rx="10" ry="3" fill="#fff" opacity=".8"/>`, { opacity: 0, scale: 0.6 });
  // Sticky goo between Bunty's hands and his bean (shown when he gets stuck).
  main += E.el('goo', BEAN_X[0] + 25, BEAN_TOP, `<ellipse cx="0" cy="3" rx="38" ry="8" fill="#ffcf5c" opacity=".9"/><g fill="none" stroke="#ffcf5c" stroke-width="6" stroke-linecap="round"><path d="M-24 2 q-5 -16 2 -30"/><path d="M-9 2 q5 -18 -2 -34"/><path d="M9 2 q-5 -16 3 -31"/><path d="M24 2 q5 -14 -1 -27"/></g><circle cx="-16" cy="10" r="5" fill="#ffcf5c"/><circle cx="14" cy="11" r="4" fill="#ffcf5c"/><path d="M-30 0 q8 -4 16 0" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>`, { opacity: 0 });
  // Finish platform and arch.
  main += `<rect x="${COURSE.finish}" y="715" width="1200" height="400" fill="url(#jc-plat)" stroke="${INK}" stroke-width="5"/>${[0, 160, 320, 480, 640].map((dx) => `<path d="M${COURSE.finish + 80 + dx} 715 V1100" stroke="#c48a64" stroke-width="3"/>`).join('')}`;
  main += E.el('finish', COURSE.arch, 716, `<rect x="-170" y="-310" width="18" height="310" fill="#fff" stroke="${INK}" stroke-width="3"/><rect x="152" y="-310" width="18" height="310" fill="#fff" stroke="${INK}" stroke-width="3"/>`
    + `<rect x="-190" y="-340" width="380" height="64" rx="12" fill="#fff" stroke="${INK}" stroke-width="4"/>${Array.from({ length: 12 }, (_, i) => `<rect x="${-190 + i * 32}" y="${-340 + (i % 2) * 32}" width="32" height="32" fill="#1d1745" opacity=".85"/>`).join('')}`
    + `<rect x="-120" y="-268" width="240" height="44" rx="10" fill="#ffd36e" stroke="${INK}" stroke-width="3"/><text x="0" y="-236" text-anchor="middle" font-size="30" fill="#1d1745" style="${FONT}">FINISH</text>`);
  main += E.el('booth', COURSE.booth, 450, `<path d="M-110 0 L110 0 L90 70 L-90 70 Z" fill="#7B61FF" stroke="${INK}" stroke-width="5"/><rect x="-60" y="18" width="120" height="34" rx="8" fill="#120e2b"/><text x="0" y="45" text-anchor="middle" font-size="24" fill="#ff9fcf" style="${FONT}">LIVE!</text><ellipse cx="0" cy="96" rx="60" ry="12" fill="#8ff0ff" opacity=".35"/>`);
  // In front of everything on the course: the near edge of the pudding laps over the bottoms of the
  // beans, poles and gumballs, so they float in it (and anyone who falls in sinks into it).
  const x0 = COURSE.start, x1 = COURSE.finish, n = Math.round((x1 - x0) / 120), step = (x1 - x0) / n;
  const wave = (y: number, amp: number) => Array.from({ length: n }, (_, i) => `Q${f0(x0 + i * step + step / 2)} ${y + (i % 2 ? amp : -amp)} ${f0(x0 + (i + 1) * step)} ${y}`).join(' ');
  let lip = `<path d="M${x0} 776 ${wave(776, 12)} L${x1} 1150 L${x0} 1150 Z" fill="url(#jc-lip)"/>`
    + `<path d="M${x0} 778 ${wave(778, 12)}" stroke="#fff" stroke-width="5" fill="none" opacity=".6"/>`;
  for (let i = 0; i < Math.floor((x1 - x0) / 120); i++) lip += `<g class="drift" style="animation-delay:${(i % 6) * 0.7}s"><path d="M${x0 + i * 120 + 20} ${812 + (i % 4) * 40} q30 -14 60 0 t60 0" stroke="#fff" stroke-width="5" fill="none" opacity=".45"/></g>`;
  lip += bubbles(30, 7, x0 + 60, x1 - 60, 800, 960, '#fff', 40);
  return {
    id: 'jellycourse', w: W, h: 1000, ground: 715, top: -280, bottom: 1100, bg: '#ffd1e8', defs,
    layers: [{ p: 0.08, svg: far }, { p: 0.5, svg: mid }, { p: 1, svg: main }, { p: 1, svg: lip, front: true }],
    els: E.anchors,
  };
}

const f0 = (v: number) => Math.round(v);

/** A big glossy jelly bean lying on its side; its flat top (y 0) is where feet go. */
function bigBean(c: string, seed: number) {
  const r = rng(seed + 5);
  let speck = '';
  for (let i = 0; i < 7; i++) speck += `<circle cx="${f0(-70 + r() * 140)}" cy="${f0(20 + r() * 28)}" r="${(2 + r() * 2.5).toFixed(1)}" fill="#fff" opacity=".45"/>`;
  return `<path d="M-104 40 C-108 -4 -70 -6 -36 -2 C-12 1 12 1 36 -2 C70 -6 108 -4 104 40 C100 86 -100 88 -104 40 Z" fill="${c}" stroke="${INK}" stroke-width="5"/>`
    + `<path d="M-84 54 C-60 70 60 72 84 52" stroke="#000" stroke-width="10" fill="none" opacity=".08" stroke-linecap="round"/>`
    + `<path d="M-74 16 C-46 6 30 8 72 14" stroke="#fff" stroke-width="9" fill="none" opacity=".5" stroke-linecap="round"/>`
    + `<ellipse cx="-58" cy="14" rx="16" ry="6" fill="#fff" opacity=".75"/>` + speck;
}

/* ---------------- Mini-game two: rafting down the Chocolate River ---------------- */
/** A chocolate fish, facing right (`flip` faces it left). `open` shows a wide-open hungry mouth. */
function chocFish(open: boolean, flip = false, s = 1) {
  const body = open
    ? `<path d="M-70 0 Q-30 -48 26 -30 L70 -34 L22 -2 L70 30 L26 28 Q-30 48 -70 0 Z" fill="#6a3a22" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M60 -30 l-8 10 l-8 -9 l-8 10 l-8 -9" fill="#fff" stroke="${INK}" stroke-width="2"/><path d="M60 26 l-8 -9 l-8 8 l-8 -9 l-8 8" fill="#fff" stroke="${INK}" stroke-width="2"/>`
    : `<path d="M-70 0 Q-30 -46 30 -26 Q60 -16 70 0 Q60 16 30 26 Q-30 46 -70 0 Z" fill="#6a3a22" stroke="${INK}" stroke-width="4"/><path d="M48 8 Q56 14 62 8" stroke="${INK}" stroke-width="3" fill="none"/>`;
  return `<g transform="scale(${flip ? -s : s} ${s})">${body}<path d="M-66 0 L-110 -30 L-100 0 L-110 30 Z" fill="#6a3a22" stroke="${INK}" stroke-width="4"/>`
    + `<path d="M-20 -34 Q0 -60 20 -30" fill="#8a5634" stroke="${INK}" stroke-width="3"/><circle cx="${open ? 14 : 34}" cy="-12" r="8" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="${open ? 16 : 36}" cy="-12" r="4" fill="${INK}"/>`
    + `<path d="M-40 -10 q10 10 0 20 M-20 -14 q12 14 0 28" stroke="#8a5634" stroke-width="4" fill="none"/></g>`;
}

export function river(): SetDef {
  const W = 3400;
  const E = elements();
  const defs = SKY('rv-sky') + JELLY('rv-jelly') + lin('rv-choc', [[0, '#8a5634'], [1, '#5a3420']]) + lin('rv-wafer', [[0, '#f2c98a'], [1, '#d8a060']]) + lin('rv-cliff', [[0, '#7a4a2c'], [1, '#4a2a18']])
    + rad('rv-whirl', [[0, '#3a1e0e'], [0.6, '#5a3420'], [1, '#8a5634', 0]]);
  const far = `<rect x="-600" y="-300" width="${W + 1200}" height="1400" fill="url(#rv-sky)"/>` + cloud(100, 220, 1.2, '#fff0f8', 'drift slow') + cloud(1200, 180, 1.4, '#ffe6f3', 'drift') + cloud(2400, 240, 1.1, '#fff0f8', 'drift slow')
    + `<path d="M-500 560 Q500 460 1300 530 T2600 500 T${W + 500} 520 L${W + 500} 620 L-500 620 Z" fill="#ffd1e8" stroke="#e8a8cc" stroke-width="4"/>`;
  let mid = `<path d="M-500 600 Q800 560 1700 590 T${W + 500} 580 L${W + 500} 660 L-500 660 Z" fill="url(#rv-jelly)" stroke="${INK}" stroke-width="3"/>`;
  [[200, 600, 50, 140, '#ffd36e', '#fff'], [900, 590, 60, 170, '#ff9fcf', '#fff'], [1600, 600, 44, 120, '#8fc8ff', '#fff'], [2300, 590, 56, 160, '#c9b6ff', '#ffd36e'], [2800, 600, 48, 130, '#7fe6c9', '#fff']]
    .forEach(([x, y, rr, st, a, b]) => { mid += lollipop(x as number, y as number, rr as number, st as number, a as string, b as string, 'sway slow'); });
  mid += birds(8, 63, -300, W, 180, 420, 2000);
  // The river, flowing
  let main = `<rect x="-600" y="640" width="${W + 1200}" height="460" fill="url(#rv-choc)"/><path d="M-600 640 H${W + 600}" stroke="#3a2010" stroke-width="6"/>`;
  for (let i = 0; i < 40; i++) main += `<g class="drift" style="animation-duration:${6 + (i % 4)}s;animation-delay:${(i % 7) * 0.5}s"><path d="M${i * 100 - 400} ${680 + (i % 5) * 60} q40 -12 80 0" stroke="#b07a52" stroke-width="6" fill="none" opacity=".7" stroke-linecap="round"/></g>`;
  main += bubbles(18, 19, 300, 3000, 700, 1000, '#c48a64', 34);
  // Wafer jetty where the crew starts
  main += `<rect x="-600" y="700" width="1060" height="44" fill="url(#rv-wafer)" stroke="${INK}" stroke-width="4"/>${[-500, -380, -260, -140, -20, 100, 220, 340].map((x) => `<path d="M${x} 700 V744" stroke="#a8724a" stroke-width="2"/>`).join('')}`
    + `<rect x="380" y="744" width="22" height="120" fill="#a8724a"/><rect x="-100" y="744" width="22" height="120" fill="#a8724a"/>`;
  const wafer = (w: number) => `<rect x="${-w / 2}" y="-12" width="${w}" height="40" rx="6" fill="url(#rv-wafer)" stroke="${INK}" stroke-width="4"/>${Array.from({ length: Math.floor(w / 30) }, (_, i) => `<path d="M${-w / 2 + 15 + i * 30} -12 V28" stroke="#a8724a" stroke-width="2"/>`).join('')}<path d="M${-w / 2} 8 H${w / 2}" stroke="#a8724a" stroke-width="2"/><path d="M${-w / 2 - 10} 30 Q0 50 ${w / 2 + 10} 30" stroke="#b07a52" stroke-width="5" fill="none"/>`;
  const goo = (h = 1) => `<g fill="none" stroke="#ffcf5c" stroke-linecap="round"><path d="M-6 -14 q-6 ${18 * h} 2 ${36 * h}" stroke-width="8"/><path d="M6 -12 q6 ${16 * h} -2 ${32 * h}" stroke-width="6"/></g><ellipse cx="0" cy="-12" rx="14" ry="6" fill="#ffcf5c"/><ellipse cx="-4" cy="-14" rx="5" ry="2" fill="#fff" opacity=".8"/>`;
  const raftW = PLANK_DX.length * 104;
  // The crew's big raft (five planks), Ro's little raft in the near lane, and the glued raft after the repair.
  main += E.el('raft', RIVER.raft, 712, wafer(raftW));
  main += E.el('raftro', RIVER.roRaft, RIVER.lane, wafer(170));
  main += E.el('raft2', RIVER.split, 712, wafer(raftW) + PLANK_DX.slice(1).map((dx) => `<g transform="translate(${dx - 52} 0)">${goo(0.7)}</g>`).join(''), { opacity: 0 });
  // Where the raft splits: the same raft as five loose planks, the goo that glues each crack, and crumbs.
  PLANK_DX.forEach((dx, i) => { main += E.el(`p${i + 1}`, RIVER.split + dx, 712, wafer(100), { opacity: 0 }); });
  PLANK_DX.slice(1).forEach((dx, i) => { main += E.el(`g${i + 1}`, RIVER.split + dx - 52, 712, goo(1), { opacity: 0, scale: 0.3 }); });
  main += E.el('crumbs', RIVER.split, 724, `<g>${[-170, -90, 10, 120, 190].map((x, i) => `<rect x="${x}" y="${(i % 2) * 8}" width="${16 + (i % 3) * 6}" height="10" rx="3" fill="#f2c98a" stroke="${INK}" stroke-width="2" transform="rotate(${(i - 2) * 22} ${x} 0)"/>`).join('')}</g>`, { opacity: 0 });
  // Hungry chocolate fish: two that attack the crew's raft, one that eats Ro's raft, and the curious one.
  main += E.el('fish', 1900, 820, chocFish(false), { opacity: 0 });
  main += E.el('fishL', RIVER.split - 235, 880, chocFish(true), { opacity: 0 });
  main += E.el('fishR', RIVER.split + 265, 880, chocFish(true, true), { opacity: 0 });
  main += E.el('fishro', RIVER.whirl + 120, 900, chocFish(true, true, 1.5), { opacity: 0 });
  main += E.el('gball', RIVER.split, 560, `<circle r="16" fill="#ff7ab8" stroke="${INK}" stroke-width="3"/><circle cx="-5" cy="-6" r="5" fill="#fff" opacity=".7"/>`, { opacity: 0 });
  // The whirlpool Ro falls into: swirling rings (the near half is drawn in front of him, below).
  const rings = (rx: number, ry: number, n: number) => Array.from({ length: n }, (_, i) => `<ellipse cx="0" cy="0" rx="${rx - i * (rx / n)}" ry="${ry - i * (ry / n)}" fill="none" stroke="${i % 2 ? '#b07a52' : '#d9a273'}" stroke-width="${6 - i}" stroke-dasharray="${40 - i * 6} ${18 + i * 4}"/>`).join('');
  main += E.el('whirl', RIVER.whirl, 820, `<ellipse rx="170" ry="52" fill="url(#rv-whirl)"/><g class="spin-6">${rings(160, 48, 4)}</g>`, { opacity: 0 });
  // The waterfall cave and the finish ledge
  main += `<path d="M${RIVER.ledge} 700 L${W + 600} 700 L${W + 600} 1100 L${RIVER.ledge} 1100 Z" fill="url(#rv-jelly)" stroke="${INK}" stroke-width="4"/>`;
  main += E.el('cave', RIVER.cave, 700, `<path d="M-260 0 L-260 -380 Q-200 -470 0 -480 Q200 -470 260 -380 L260 0 Z" fill="url(#rv-cliff)" stroke="${INK}" stroke-width="5"/><path d="M-140 0 L-140 -230 Q0 -320 140 -230 L140 0 Z" fill="#2a1408"/>`
    + `<g class="flowdown">${[-110, -60, 0, 60, 110].map((x) => `<path d="M${x} -470 V-380" stroke="#8a5634" stroke-width="18" stroke-linecap="round"/>`).join('')}</g>`
    + `<rect x="-130" y="-300" width="260" height="56" rx="12" fill="#ffd36e" stroke="${INK}" stroke-width="4"/><text x="0" y="-262" text-anchor="middle" font-size="34" fill="#1d1745" style="${FONT}">FINISH</text>`);
  const front = `<path d="M-500 940 Q${W / 2} 900 ${W + 500} 940 L${W + 500} 1100 L-500 1100 Z" fill="url(#rv-jelly)" stroke="${INK}" stroke-width="4"/>`;
  // In front of Ro when he is in the whirlpool: the near side of the swirl and the chocolate around his middle.
  const whirlFront = E.el('whirlfront', RIVER.whirl, 820, `<path d="M-175 0 Q-170 -70 -60 -80 Q0 -66 60 -80 Q170 -70 175 0 Q170 64 0 68 Q-170 64 -175 0 Z" fill="#5a3420"/>`
    + `<g class="spin-6" style="animation-direction:reverse">${rings(150, 40, 3)}</g><path d="M-120 -50 q30 -14 60 0 M40 -54 q30 -12 60 0" stroke="#d9a273" stroke-width="5" fill="none" stroke-linecap="round"/>`, { opacity: 0 });
  return {
    id: 'river', w: W, h: 1000, ground: 700, top: -280, bottom: 1080, bg: '#ffd1e8', defs,
    layers: [{ p: 0.1, svg: far }, { p: 0.55, svg: mid }, { p: 1, svg: main }, { p: 1, svg: whirlFront, front: true }, { p: 1.3, svg: front, front: true }],
    els: E.anchors,
  };
}

/* ---------------- Mini-game three: the lollipop garden ---------------- */
/**
 * A giant lollipop melting in the warm sun: glossy drips run down from the candy, and now and then a
 * drop falls (slowly; calm mode stops it). Planted at (x, y); `stem` is the stick above the ground.
 */
function meltyLollipop(x: number, y: number, r: number, stem: number, a: string, b: string, seed: number, cls = '') {
  const cy = -stem - r * 0.2;
  const rr = rng(seed);
  let drips = '';
  for (let i = 0; i < 4; i++) {
    const t = ((38 + i * 34 + rr() * 12) * Math.PI) / 180;
    const px = Math.cos(t) * r * 0.94, py = cy + Math.sin(t) * r * 0.94;
    const w = Math.max(6, r * (0.14 + rr() * 0.06)), len = r * (0.22 + rr() * 0.3);
    drips += `<path d="M${n2(px - w / 2)} ${n2(py - w)} L${n2(px - w / 2)} ${n2(py + len)} A${n2(w / 2)} ${n2(w / 2)} 0 0 0 ${n2(px + w / 2)} ${n2(py + len)} L${n2(px + w / 2)} ${n2(py - w)} Z" fill="${a}" stroke="${INK}" stroke-width="2.5"/>`
      + `<path d="M${n2(px - w * 0.15)} ${n2(py)} V${n2(py + len * 0.8)}" stroke="#fff" stroke-width="${n2(w * 0.25)}" opacity=".55" stroke-linecap="round"/>`
      + `<circle class="drip" style="animation-delay:${n2(rr() * 3)}s" cx="${n2(px)}" cy="${n2(py + len + w * 0.9)}" r="${n2(w * 0.42)}" fill="${a}" stroke="${INK}" stroke-width="2"/>`;
  }
  // A glossy glaze on top, so the candy looks wet and sweet.
  const glaze = `<path d="M${n2(-r * 0.7)} ${n2(cy - r * 0.15)} Q${n2(-r * 0.2)} ${n2(cy - r * 0.95)} ${n2(r * 0.6)} ${n2(cy - r * 0.55)}" stroke="#fff" stroke-width="${n2(Math.max(3, r * 0.08))}" fill="none" opacity=".6" stroke-linecap="round"/>`;
  return `<g transform="translate(${x} ${y})"><g${cls ? ` class="${cls}"` : ''}>${lollipop(0, 0, r, stem, a, b)}${drips}${glaze}</g></g>`;
}
const n2 = (v: number) => Math.round(v * 10) / 10;

export function garden(): SetDef {
  const W = GARDEN.w;
  const E = elements();
  const defs = SKY('gd-sky') + JELLY('gd-jelly') + rad('gd-sun', [[0, '#fff8d8'], [1, '#ffd36e', 0]]) + rad('gd-glow', [[0, '#fff8d8', 0.8], [1, '#fff8d8', 0]]);
  const far = `<rect x="-600" y="-300" width="${W + 1200}" height="1400" fill="url(#gd-sky)"/><circle cx="1800" cy="230" r="140" fill="url(#gd-sun)"/>`
    + [300, 1300, 2300, 3300].map((x, i) => cloud(x, 170 + (i % 2) * 50, 1.2 + (i % 2) * 0.1, i % 2 ? '#ffe6f3' : '#fff0f8', i % 2 ? 'drift' : 'drift slow')).join('');
  let mid = `<path d="M-500 590 Q500 520 1300 570 T2600 560 T${W + 500} 570 L${W + 500} 700 L-500 700 Z" fill="#b8f5dd" stroke="${INK}" stroke-width="3"/>`;
  const bg: [string, string][] = [['#ff9fcf', '#fff'], ['#ffd36e', '#ff9fcf'], ['#8fc8ff', '#fff'], ['#c9b6ff', '#ffd36e'], ['#7fe6c9', '#fff']];
  for (let i = 0; i < 22; i++) mid += meltyLollipop(i * 190 - 100, 600, 30 + (i % 3) * 6, 80 + (i % 4) * 14, bg[i % 5][0], bg[i % 5][1], 200 + i, 'sway slow');
  mid += birds(10, 74, -300, W, 160, 400, 2000);
  let main = jellyGround(W, 640, 'gd-jelly');
  // The big garden: lollipop trees, gumdrop bushes, candy flowers and mushrooms to hide Stars behind.
  const trees: [number, number, number, number, string, string][] = [[160, 700, 72, 330, '#ff9fcf', '#ffd36e'], [560, 690, 60, 260, '#8fc8ff', '#fff'], [1720, 690, 70, 320, '#c9b6ff', '#fff'], [2010, 700, 84, 340, '#ffd36e', '#ff9fcf'], [2380, 690, 62, 280, '#7fe6c9', '#fff'], [2900, 700, 76, 330, '#ff9fcf', '#fff'], [3380, 690, 66, 300, '#8fc8ff', '#ffd36e']];
  trees.forEach(([x, y, r, st, a, b], i) => { main += meltyLollipop(x, y, r, st, a, b, 300 + i); });
  [[300, 712, 70, '#7fe6c9'], [880, 716, 44, '#ff9fcf'], [1600, 712, 52, '#ffd36e'], [2240, 716, 46, '#c9b6ff'], [3060, 714, 58, '#8fc8ff']]
    .forEach(([x, y, r, c]) => { main += gumdrop(x as number, y as number, r as number, c as string); });
  // Candy flowers (one is a hiding place), and a candy mushroom.
  const flower = (x: number, y: number, s: number, c: string) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 Q-6 -60 0 -110" stroke="#5ccfae" stroke-width="8" fill="none"/>${[0, 72, 144, 216, 288].map((d) => `<ellipse cx="0" cy="-138" rx="16" ry="28" fill="${c}" stroke="${INK}" stroke-width="3" transform="rotate(${d} 0 -112)"/>`).join('')}<circle cy="-112" r="14" fill="#ffd36e" stroke="${INK}" stroke-width="3"/></g>`;
  main += flower(700, 712, 1.3, '#ff9fcf') + flower(1530, 712, 0.9, '#8fc8ff') + flower(2520, 712, 1.0, '#ffd36e') + flower(3260, 712, 1.1, '#c9b6ff');
  main += `<g transform="translate(2640 716)"><rect x="-20" y="-70" width="40" height="70" rx="12" fill="#fff6ea" stroke="${INK}" stroke-width="4"/><path d="M-110 -60 Q-100 -170 0 -176 Q100 -170 110 -60 Z" fill="#ff7ab8" stroke="${INK}" stroke-width="5"/>${[-60, -10, 45].map((x, i) => `<circle cx="${x}" cy="${-110 - (i % 2) * 30}" r="${12 + i * 3}" fill="#fff"/>`).join('')}</g>`;
  main += E.el('flossbush', 3160, 600, cloud(-90, -40, 0.9, '#fff0f8', 'bob'));
  main += butterflies(10, 37, 300, W - 300, 560, 700);
  for (let i = 0; i < 26; i++) main += `<circle cx="${i * 140 + 40}" cy="${740 + (i % 3) * 70}" r="${8 + (i % 3) * 3}" fill="${['#ff9fcf', '#ffd36e', '#fff'][i % 3]}" opacity=".8"/>`;
  // The five game lollipops, one per child, candy at mouth height (they lean towards the children in the wind).
  const stripes = ['#fff', '#ff9fcf', '#fff', '#ffd36e', '#fff4c7'];
  GARDEN.spots.forEach((sp, i) => {
    main += E.el(`lp${i + 1}`, sp.x, sp.y, meltyLollipop(0, 0, sp.r, Math.round(sp.mouth - sp.r * 0.2), GARDEN.candy[i], stripes[i], 500 + i));
  });
  // Fizz's five Stars in their hiding places (hidden until found).
  GARDEN.stars.forEach(([x, y], i) => { main += E.el(`st${i + 1}`, x, y, `<circle r="40" fill="url(#gd-glow)"/>${star5(0, 0, 26, '#ffd36e', '#c99a2e', 3)}`, { opacity: 0, scale: 0.4 }); });
  return {
    id: 'garden', w: W, h: 1000, ground: 715, top: -280, bottom: 1080, bg: '#ffd1e8', defs,
    layers: [{ p: 0.1, svg: far }, { p: 0.5, svg: mid }, { p: 1, svg: main }],
    els: E.anchors,
    scale: gardenScale,
  };
}

/* ---------------- The Big Prize: Sugar Mountain (a tall set to climb) ---------------- */
export function mountain(): SetDef {
  const W = 1600, H = 2600;
  const E = elements();
  const defs = lin('mt-sky', [[0, '#7b5fd6'], [0.5, '#c9a6f0'], [1, '#ffd1e8']]) + lin('mt-ice', [[0, '#ffffff'], [1, '#efe2ff']], 1, 0)
    + rad('mt-glow', [[0, '#fff4c7', 0.95], [1, '#fff4c7', 0]]) + lin('mt-glaze', [[0, '#f2fbff', 0.95], [1, '#9fd8ff', 0.9]]) + lin('mt-shelf', [[0, '#f7d08a'], [1, '#d8a060']]);
  const far = `<rect x="-600" y="-400" width="${W + 1200}" height="${H + 800}" fill="url(#mt-sky)"/>` + stars(80, 21, -400, W + 400, -300, 900)
    + planet(1300, 300, 90, '#ffe3f1', '#ff9fcf', true, 'mt-pl') + birds(10, 85, -400, W, 500, 2200, 1800) + cloud(-100, 1100, 1.6, '#fff0f8', 'drift slow') + cloud(1100, 1500, 1.4, '#ffe6f3', 'drift') + cloud(200, 1900, 1.5, '#fff0f8', 'drift slow');
  // The mountain: a broad sugar peak with a flat summit, wide enough for every ledge of the road.
  let main = `<path d="M-400 ${H + 100} L-220 1800 Q20 1100 230 700 Q320 520 450 496 L820 496 Q1020 560 1260 760 Q1460 1000 1560 1500 Q1660 2000 ${W + 400} ${H + 100} Z" fill="url(#mt-ice)" stroke="#d8b8e8" stroke-width="8"/>`;
  // Coloured icing bands across the slopes.
  [[1000, '#ffb7dc', 0.6], [1650, '#8fc8ff', 0.5], [2250, '#ffd36e', 0.5]].forEach(([y, c, o]) => {
    main += `<path d="M-200 ${y} Q200 ${(y as number) + 70} 500 ${y} T1100 ${(y as number) - 10} T1700 ${y}" stroke="${c}" stroke-width="24" fill="none" stroke-linecap="round" opacity="${o}"/>`;
  });
  // The frosting cap on the summit, dripping down the slopes.
  let cap = `<path d="M210 760 Q300 540 450 488 L820 488 Q1050 560 1230 740`;
  const drips = [[250, 700, 70], [330, 590, 110], [430, 520, 80], [560, 500, 130], [700, 500, 90], [860, 520, 120], [980, 590, 80], [1110, 660, 100], [1200, 720, 60]];
  cap += drips.reverse().map(([x, y, d]) => ` L${x + 26} ${y} Q${x + 26} ${y + d} ${x} ${y + d} Q${x - 26} ${y + d} ${x - 26} ${y}`).join('') + ' Z" fill="#fff" stroke="#e6d6f5" stroke-width="5"/>';
  main += cap;
  // The zig-zag icing road: a pink frosting ramp with a dashed middle and candy-cane railings.
  for (let i = 0; i < PATH.length - 1; i++) {
    const [x, y] = PATH[i], [nx, ny] = PATH[i + 1];
    const icy = i === ICY_RAMP;
    main += `<path d="M${x} ${y} L${nx} ${ny}" stroke="#cfa8e0" stroke-width="86" stroke-linecap="round"/>`
      + `<path d="M${x} ${y} L${nx} ${ny}" stroke="${icy ? 'url(#mt-glaze)' : '#ffe0ef'}" stroke-width="74" stroke-linecap="round"/>`
      + `<path d="M${x} ${y} L${nx} ${ny}" stroke="${icy ? '#fff' : '#ff9fcf'}" stroke-width="5" stroke-dasharray="${icy ? '60 30' : '16 18'}" opacity=".85"/>`;
    // Railings on the downhill side of each ramp.
    const n = Math.floor(Math.hypot(nx - x, ny - y) / 110);
    for (let k = 1; k < n; k++) {
      const t = k / n, px = x + (nx - x) * t, py = y + (ny - y) * t;
      main += candyCane(Math.round(px), Math.round(py + 44), 34, k % 2 === 0);
    }
    if (icy) {
      for (let k = 0; k < 6; k++) main += sparkleStar(Math.round(x + (nx - x) * (k + 0.5) / 6), Math.round(y + (ny - y) * (k + 0.5) / 6) - 20, 9, '#fff', 'tw');
      main += `<g transform="translate(${Math.round(x + (nx - x) * 0.55)} ${Math.round(y + (ny - y) * 0.55) + 40})"><path d="M0 0 V-120" stroke="#fff" stroke-width="8" stroke-linecap="round"/><rect x="-74" y="-170" width="148" height="56" rx="12" fill="#8fc8ff" stroke="${INK}" stroke-width="4"/><text x="0" y="-132" text-anchor="middle" font-size="24" fill="#1d1745" style="${FONT}">SLIPPERY!</text></g>`;
    }
  }
  // Landings at every corner: a wafer shelf topped with icing.
  for (let i = 0; i < PATH.length; i++) {
    const [x, y] = PATH[i];
    if (i === 0) continue;
    const w = i === PATH.length - 1 ? 260 : 170;
    main += `<path d="M${x - w} ${y + 4} Q${x} ${y - 12} ${x + w} ${y + 4} L${x + w - 20} ${y + 46} Q${x} ${y + 58} ${x - w + 20} ${y + 46} Z" fill="url(#mt-shelf)" stroke="${INK}" stroke-width="4"/>`
      + `<path d="M${x - w} ${y + 4} Q${x} ${y - 12} ${x + w} ${y + 4}" stroke="#fff" stroke-width="16" fill="none" stroke-linecap="round"/>`;
  }
  // Candy-cane posts Ro's toffee arm grabs to pull himself up.
  GRIPS.forEach(([x, gy], i) => { main += E.el(`post${i + 1}`, x, gy + 50, candyCane(0, 0, 100, true)); });
  // Sprinkles everywhere.
  const r = rng(41);
  for (let i = 0; i < 70; i++) {
    const sx = Math.round(100 + r() * 1400), sy = Math.round(700 + r() * 1700), rot = Math.round(r() * 180);
    main += `<rect x="${sx}" y="${sy}" width="5" height="15" rx="2" fill="${['#ff9fcf', '#7fe6c9', '#ffd36e', '#8fc8ff'][i % 4]}" transform="rotate(${rot} ${sx} ${sy})" opacity=".8"/>`;
  }
  main += `<rect x="-400" y="2440" width="${W + 800}" height="400" fill="#ffd1e8" stroke="${INK}" stroke-width="5"/>`;
  // The Giant Lollipop, glowing on the summit.
  main += `<circle cx="${SUMMIT.giant}" cy="260" r="190" fill="url(#mt-glow)" class="pulse"/>`;
  main += E.el('giant', SUMMIT.giant, 520, lollipop(0, 0, 110, 230, '#ff9fcf', '#ffd36e'));
  return {
    id: 'mountain', w: W, h: H, ground: 2440, top: -350, bottom: 2700, bg: '#7b5fd6', defs,
    layers: [{ p: 0.2, svg: far }, { p: 1, svg: main }],
    els: E.anchors,
  };
}

/* ---------------- The summit and the Giant Lollipop ---------------- */
export function summit(): SetDef {
  const W = 1600;
  const E = elements();
  const defs = lin('sm-sky', [[0, '#5a3fc0'], [0.55, '#c9a6f0'], [1, '#ffd1e8']]) + lin('sm-ice', [[0, '#ffffff'], [1, '#f2e6ff']]) + rad('sm-glow', [[0, '#fff4c7', 0.95], [0.5, '#ffe9a8', 0.5], [1, '#ffe9a8', 0]]);
  const far = `<rect x="-600" y="-300" width="${W + 1200}" height="1400" fill="url(#sm-sky)"/>` + stars(70, 12, -400, W + 400, -200, 500) + planet(260, 240, 80, '#cfe8ff', '#7B61FF', true, 'sm-pl')
    + cloud(-120, 640, 1.6, '#fff0f8', 'drift slow') + cloud(1100, 600, 1.5, '#ffe6f3', 'drift');
  let main = `<path d="M-500 1100 L-500 760 Q-100 690 300 700 L1300 700 Q1700 690 ${W + 500} 760 L${W + 500} 1100 Z" fill="url(#sm-ice)" stroke="#d8b8e8" stroke-width="8"/>`
    + `<path d="M300 700 Q500 740 700 700 T1100 710 T1300 700" stroke="#ffb7dc" stroke-width="16" fill="none" stroke-linecap="round" opacity=".7"/>`;
  main += `<circle cx="800" cy="360" r="300" fill="url(#sm-glow)" class="pulse"/>`;
  main += E.el('giant', 800, 704, lollipop(0, 0, 160, 210, '#ff9fcf', '#ffd36e'));
  // What is left after the crack: the stick (the crew's treasure).
  main += E.el('stub', 800, 704, `<rect x="-14" y="-210" width="28" height="210" rx="14" fill="#fff8ee" stroke="#d8cfc0" stroke-width="3"/><path d="M-14 -210 l8 -16 l8 12 l8 -14 l8 18" fill="#ff9fcf" stroke="${INK}" stroke-width="3"/>`, { opacity: 0 });
  // The five pieces of the Giant Lollipop (each flies to one of the crew); Ro's is the smallest.
  SHARE.forEach(([, , r], i) => {
    const wedge = `<path d="M0 0 L${-r} ${-r * 0.5} A${r * 1.1} ${r * 1.1} 0 0 1 ${r} ${-r * 0.5} Z" fill="${['#ff9fcf', '#ffd36e', '#ff9fcf', '#ffd36e', '#ff9fcf'][i]}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M${-r * 0.5} ${-r * 0.55} Q0 ${-r * 0.8} ${r * 0.5} ${-r * 0.55}" stroke="#fff" stroke-width="5" fill="none" opacity=".7"/>`;
    main += E.el(`pc${i + 1}`, 800, 462, wedge, { opacity: 0, scale: 0.6 });
  });
  for (let i = 0; i < 10; i++) main += sparkleStar(560 + (i % 5) * 120, 200 + Math.floor(i / 5) * 220, 12, '#fff', 'tw');
  main += birds(6, 96, -300, W, 380, 620, 1800);
  return {
    id: 'summit', w: W, h: 1000, ground: 715, top: -280, bottom: 1080, bg: '#5a3fc0', defs,
    layers: [{ p: 0.15, svg: far }, { p: 1, svg: main }],
    els: E.anchors,
  };
}

/* ---------------- Night camp under candy stars ---------------- */
export function camp(): SetDef {
  const W = 1800;
  const E = elements();
  const defs = lin('cp-sky', [[0, '#0b0820'], [0.6, '#2a1f6e'], [1, '#5a3f9a']]) + lin('cp-jelly', [[0, '#3f8f7c'], [1, '#235a50']]) + rad('cp-lamp', [[0, '#fff4c7', 0.9], [0.4, '#ffd36e', 0.45], [1, '#ffd36e', 0]]);
  const far = `<rect x="-600" y="-300" width="${W + 1200}" height="1400" fill="url(#cp-sky)"/>` + stars(160, 17, -500, W + 500, -200, 600)
    + `<g><circle cx="1350" cy="220" r="90" fill="#fff4c7"/><circle cx="1395" cy="196" r="84" fill="#2a1f6e"/>${[0, 1, 2].map((i) => `<circle cx="${1300 + i * 14}" cy="${200 + i * 30}" r="5" fill="#ff9fcf"/>`).join('')}</g>`
    + comets(5, 27, -200, W + 200, -200, 300);
  let mid = '';
  for (let i = 0; i < 8; i++) mid += lollipop(i * 260 - 60, 610, 60 + (i % 3) * 14, 220, '#4b3f9a', '#3b2f86');
  mid += `<path d="M-500 600 Q300 540 1000 590 T${W + 500} 580 L${W + 500} 700 L-500 700 Z" fill="#2f5a66"/>`;
  let main = hills(-500, W + 500, 640, 20, 260, 9, 'url(#cp-jelly)', 1100, INK);
  main += `<circle cx="900" cy="600" r="240" fill="url(#cp-lamp)" class="pulse"/>`
    + `<g><rect x="894" y="560" width="12" height="150" fill="#c9b6ff"/><circle cx="900" cy="548" r="34" fill="#ffd36e" stroke="${INK}" stroke-width="4"/><circle cx="890" cy="538" r="10" fill="#fff" opacity=".7"/></g>`;
  for (const x of [200, 1620]) main += `<g><circle cx="${x}" cy="560" r="120" fill="url(#cp-lamp)"/><rect x="${x - 4}" y="560" width="8" height="150" fill="#c9b6ff"/><circle cx="${x}" cy="552" r="18" fill="#ffd36e"/></g>`;
  SEATS.forEach((x, i) => { main += E.el(`seat${i + 1}`, x, 716, gumdrop(0, 0, 58, ['#ff9fcf', '#7fe6c9', '#ffd36e', '#c9b6ff'][i])); });
  // The next world, Wizzlewick, high in the sky: a purple planet with a castle on top.
  main += E.el('next', 760, 150, `<circle r="104" fill="#160f3a"/><circle r="150" fill="url(#cp-lamp)" class="pulse" opacity=".6"/>`
    + `<path d="M-40 -50 v-30 l12 -14 l12 14 v30 M-10 -50 v-46 l14 -18 l14 18 v46 M24 -50 v-26 l10 -12 l10 12 v26" fill="#e9e1ff" stroke="${INK}" stroke-width="3"/>`
    + `<circle r="62" fill="#9a7ae8" stroke="#e1d6ff" stroke-width="4"/><path d="M-58 -10 Q0 -34 58 -6" stroke="#fff" stroke-width="5" fill="none" opacity=".3"/><circle cx="-20" cy="-22" r="12" fill="#fff" opacity=".35"/>`
    + sparkleStar(-90, -70, 10, '#fff', 'tw') + sparkleStar(84, -50, 8, '#ffd36e', 'tw'));
  return {
    id: 'camp', w: W, h: 1000, ground: 715, top: -280, bottom: 1080, bg: '#0b0820', defs,
    layers: [{ p: 0.1, svg: far }, { p: 0.5, svg: mid }, { p: 1, svg: main }],
    els: E.anchors,
  };
}
