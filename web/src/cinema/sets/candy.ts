// World 1, the Candy Nebula: landing fields, the jelly-bean race, the chocolate river, the
// lollipop garden, Sugar Mountain, its summit and the night camp.
import type { SetDef } from './types';
import { INK, FONT, lin, rad, stars, planet, cloud, lollipop, gumdrop, candyCane, jellyBean, hills, rng, sparkleStar, star5, elements, birds, butterflies, bubbles, comets } from './kit';
import { BEAN_X, LOLLI_X, PATH, SEATS } from './candy-layout';

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

/* ---------------- Sweet Landing: jelly hills, gumdrops, candy floss ---------------- */
export function candyland(): SetDef {
  const W = 2600;
  const E = elements();
  const defs = SKY('cl-sky') + JELLY('cl-jelly') + rad('cl-floss', [[0, '#fff0f8'], [1, '#ffb7dc']], 0.4, 0.35, 0.7) + lin('cl-hill', [[0, '#b8f5dd'], [1, '#7fe6c9']]);
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
  main += E.el('floss', 520, 712, `<g><circle cx="-90" cy="-40" r="70" fill="url(#cl-floss)"/><circle cx="0" cy="-70" r="96" fill="url(#cl-floss)"/><circle cx="96" cy="-38" r="72" fill="url(#cl-floss)"/><rect x="-150" y="-50" width="300" height="50" rx="25" fill="url(#cl-floss)"/><ellipse cx="-30" cy="-120" rx="30" ry="14" fill="#fff" opacity=".6"/></g>`);
  main += E.el('jellyhill', 1020, 716, `<path d="M-170 0 Q-150 -128 0 -132 Q150 -128 170 0 Z" fill="#9ff0d0" stroke="${INK}" stroke-width="5"/><path d="M-110 -70 Q-60 -110 10 -112" stroke="#fff" stroke-width="10" fill="none" opacity=".6" stroke-linecap="round"/><circle cx="60" cy="-60" r="8" fill="#fff" opacity=".5"/>`);
  main += E.el('tree', 1360, 712, lollipop(0, 0, 66, 260, '#7fe6c9', '#fff'));
  main += E.el('rock', 1560, 714, gumdrop(0, 0, 56, '#c9b6ff'));
  main += E.el('lolli', 2060, 712, lollipop(0, 0, 74, 300, '#ff9fcf', '#ffd36e'));
  main += E.el('skycloud', 1460, 330, cloud(-60, 0, 0.9, '#fff', ''));
  main += E.el('gumball', 1200, 560, `<circle r="15" fill="#ff7ab8" stroke="${INK}" stroke-width="3"/><circle cx="-5" cy="-5" r="5" fill="#fff" opacity=".7"/>`, { opacity: 0 });
  const front = gumdrop(-60, 1010, 90, '#ffd36e') + gumdrop(W + 40, 1000, 110, '#ff9fcf') + `<g opacity=".9">${[200, 900, 1600, 2300].map((x) => `<path d="M${x} 1010 q10 -60 0 -110 M${x + 20} 1010 q14 -50 10 -90" stroke="#5ccfae" stroke-width="16" fill="none" stroke-linecap="round"/>`).join('')}</g>`;
  return {
    id: 'candyland', w: W, h: 1000, ground: 715, top: -280, bottom: 1080, bg: '#ffd1e8', defs,
    layers: [{ p: 0.05, svg: far }, { p: 0.15, svg: clouds }, { p: 0.3, svg: mtn }, { p: 0.6, svg: mid }, { p: 1, svg: main }, { p: 1.3, svg: front, front: true }],
    els: E.anchors,
    scale: (y) => Math.max(0.6, Math.min(1.15, 1 + (y - 715) * 0.0022)),
  };
}

/* ---------------- Mini-game one: the Jelly Bean Bounce ---------------- */
export function jellycourse(): SetDef {
  const W = 3300;
  const E = elements();
  const defs = SKY('jc-sky') + lin('jc-pud', [[0, '#ffc6dd'], [1, '#ff8fbf']]) + lin('jc-plat', [[0, '#f7d08a'], [1, '#e0a85a']]);
  const far = `<rect x="-600" y="-300" width="${W + 1200}" height="1400" fill="url(#jc-sky)"/>` + farMountain(2600, 600, 300, 'jc-glow')
    + cloud(200, 240, 1.3, '#fff0f8', 'drift slow') + cloud(1300, 180, 1.1, '#fff0f8', 'drift') + cloud(2200, 280, 1.4, '#ffe6f3', 'drift slow');
  let mid = `<path d="M-500 640 Q600 560 1400 620 T${W + 500} 600 L${W + 500} 760 L-500 760 Z" fill="#ffd1e8" stroke="#e8a8cc" stroke-width="4"/>`;
  mid += birds(8, 52, -300, W, 200, 440, 2000);
  for (let i = 0; i < 9; i++) mid += `<g transform="translate(${i * 400 - 100} 600)"><path d="M0 0 V-90" stroke="#fff" stroke-width="5"/><path d="M0 -90 L46 -76 L0 -62 Z" fill="${['#7fe6c9', '#ffd36e', '#8fc8ff'][i % 3]}"/></g>`;
  let main = `<rect x="-600" y="740" width="${W + 1200}" height="400" fill="url(#jc-pud)"/>`;
  for (let i = 0; i < 30; i++) main += `<g class="drift" style="animation-delay:${(i % 6) * 0.7}s"><path d="M${i * 120 - 300} ${770 + (i % 4) * 46} q30 -14 60 0 t60 0" stroke="#fff" stroke-width="5" fill="none" opacity=".5"/></g>`;
  main += bubbles(14, 7, 400, 2700, 780, 960, '#fff', 40);
  // Start and finish platforms
  main += `<rect x="-500" y="715" width="920" height="400" fill="url(#jc-plat)" stroke="${INK}" stroke-width="5"/>${[-400, -240, -80, 80, 240].map((x) => `<path d="M${x} 715 V1100" stroke="#c48a64" stroke-width="3"/>`).join('')}`
    + `<g><rect x="120" y="420" width="18" height="300" fill="#fff" stroke="${INK}" stroke-width="3"/><rect x="380" y="420" width="18" height="300" fill="#fff" stroke="${INK}" stroke-width="3"/><rect x="100" y="400" width="320" height="54" rx="14" fill="#7fe6c9" stroke="${INK}" stroke-width="4"/><text x="260" y="440" text-anchor="middle" font-size="34" fill="#1d1745" style="${FONT}">START</text></g>`;
  main += `<rect x="2700" y="715" width="1200" height="400" fill="url(#jc-plat)" stroke="${INK}" stroke-width="5"/>`;
  main += E.el('finish', 2950, 716, `<rect x="-170" y="-310" width="18" height="310" fill="#fff" stroke="${INK}" stroke-width="3"/><rect x="152" y="-310" width="18" height="310" fill="#fff" stroke="${INK}" stroke-width="3"/>`
    + `<rect x="-190" y="-340" width="380" height="64" rx="12" fill="#fff" stroke="${INK}" stroke-width="4"/>${Array.from({ length: 12 }, (_, i) => `<rect x="${-190 + i * 32}" y="${-340 + (i % 2) * 32}" width="32" height="32" fill="#1d1745" opacity=".85"/>`).join('')}`
    + `<rect x="-120" y="-268" width="240" height="44" rx="10" fill="#ffd36e" stroke="${INK}" stroke-width="3"/><text x="0" y="-236" text-anchor="middle" font-size="30" fill="#1d1745" style="${FONT}">FINISH</text>`);
  // Stepping-stone jelly beans
  const beanCols = ['#ff9fcf', '#7fe6c9', '#ffd36e', '#8fc8ff', '#c9b6ff', '#ffb38a', '#9fe08a', '#ff9fcf', '#8fc8ff'];
  BEAN_X.forEach((x, i) => {
    main += E.el(`b${i + 1}`, x, 716, `<ellipse cx="0" cy="60" rx="70" ry="14" fill="#e0679f" opacity=".35"/>${jellyBean(0, 70, 150, 70, beanCols[i])}`);
  });
  main += E.el('booth', 1700, 450, `<path d="M-110 0 L110 0 L90 70 L-90 70 Z" fill="#7B61FF" stroke="${INK}" stroke-width="5"/><rect x="-60" y="18" width="120" height="34" rx="8" fill="#120e2b"/><text x="0" y="45" text-anchor="middle" font-size="24" fill="#ff9fcf" style="${FONT}">LIVE!</text><ellipse cx="0" cy="96" rx="60" ry="12" fill="#8ff0ff" opacity=".35"/>`);
  return {
    id: 'jellycourse', w: W, h: 1000, ground: 715, top: -280, bottom: 1100, bg: '#ffd1e8', defs,
    layers: [{ p: 0.08, svg: far }, { p: 0.5, svg: mid }, { p: 1, svg: main }],
    els: E.anchors,
  };
}

/* ---------------- Mini-game two: rafting down the Chocolate River ---------------- */
export function river(): SetDef {
  const W = 3400;
  const E = elements();
  const defs = SKY('rv-sky') + JELLY('rv-jelly') + lin('rv-choc', [[0, '#8a5634'], [1, '#5a3420']]) + lin('rv-wafer', [[0, '#f2c98a'], [1, '#d8a060']]) + lin('rv-cliff', [[0, '#7a4a2c'], [1, '#4a2a18']]);
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
  main += E.el('raft', 760, 712, wafer(380));
  main += E.el('raftro', 560, 712, wafer(170));
  main += E.el('pieces', 760, 730, `<g>${[-150, -60, 40, 130].map((x, i) => `<rect x="${x}" y="${(i % 2) * 10}" width="60" height="22" rx="4" fill="#f2c98a" stroke="${INK}" stroke-width="3" transform="rotate(${(i - 1.5) * 14} ${x + 30} 10)"/>`).join('')}</g>`, { opacity: 0 });
  main += E.el('fish', 1900, 820, `<path d="M-70 0 Q-30 -46 30 -26 Q60 -16 70 0 Q60 16 30 26 Q-30 46 -70 0 Z" fill="#6a3a22" stroke="${INK}" stroke-width="4"/><path d="M-66 0 L-110 -30 L-100 0 L-110 30 Z" fill="#6a3a22" stroke="${INK}" stroke-width="4"/><circle cx="34" cy="-8" r="7" fill="#fff"/><circle cx="36" cy="-8" r="3.5" fill="${INK}"/><path d="M48 8 Q56 14 62 8" stroke="${INK}" stroke-width="3" fill="none"/><ellipse cx="20" cy="10" rx="8" ry="4" fill="#ff9fcf" opacity=".6"/>`, { opacity: 0 });
  // The waterfall cave and the finish ledge
  main += `<path d="M2840 700 L${W + 600} 700 L${W + 600} 1100 L2840 1100 Z" fill="url(#rv-jelly)" stroke="${INK}" stroke-width="4"/>`;
  main += E.el('cave', 3180, 700, `<path d="M-260 0 L-260 -380 Q-200 -470 0 -480 Q200 -470 260 -380 L260 0 Z" fill="url(#rv-cliff)" stroke="${INK}" stroke-width="5"/><path d="M-140 0 L-140 -230 Q0 -320 140 -230 L140 0 Z" fill="#2a1408"/>`
    + `<g class="flowdown">${[-110, -60, 0, 60, 110].map((x) => `<path d="M${x} -470 V-380" stroke="#8a5634" stroke-width="18" stroke-linecap="round"/>`).join('')}</g>`
    + `<rect x="-130" y="-300" width="260" height="56" rx="12" fill="#ffd36e" stroke="${INK}" stroke-width="4"/><text x="0" y="-262" text-anchor="middle" font-size="34" fill="#1d1745" style="${FONT}">FINISH</text>`);
  const front = `<path d="M-500 940 Q${W / 2} 900 ${W + 500} 940 L${W + 500} 1100 L-500 1100 Z" fill="url(#rv-jelly)" stroke="${INK}" stroke-width="4"/>`;
  return {
    id: 'river', w: W, h: 1000, ground: 700, top: -280, bottom: 1080, bg: '#ffd1e8', defs,
    layers: [{ p: 0.1, svg: far }, { p: 0.55, svg: mid }, { p: 1, svg: main }, { p: 1.3, svg: front, front: true }],
    els: E.anchors,
  };
}

/* ---------------- Mini-game three: the lollipop garden ---------------- */
export function garden(): SetDef {
  const W = 2460;
  const E = elements();
  const defs = SKY('gd-sky') + JELLY('gd-jelly') + rad('gd-sun', [[0, '#fff8d8'], [1, '#ffd36e', 0]]);
  const far = `<rect x="-600" y="-300" width="${W + 1200}" height="1400" fill="url(#gd-sky)"/><circle cx="1800" cy="230" r="140" fill="url(#gd-sun)"/>` + cloud(300, 220, 1.2, '#fff0f8', 'drift slow') + cloud(1300, 170, 1.3, '#ffe6f3', 'drift');
  let mid = `<path d="M-500 590 Q500 520 1300 570 T${W + 500} 560 L${W + 500} 700 L-500 700 Z" fill="#b8f5dd" stroke="${INK}" stroke-width="3"/>`;
  for (let i = 0; i < 14; i++) mid += lollipop(i * 190 - 100, 590, 34, 90, ['#ff9fcf', '#ffd36e', '#8fc8ff', '#c9b6ff'][i % 4], '#fff', 'sway slow');
  mid += birds(7, 74, -300, W, 160, 400, 1800);
  let main = jellyGround(W, 640, 'gd-jelly');
  const cols: [string, string][] = [['#ff9fcf', '#fff'], ['#ffd36e', '#ff9fcf'], ['#7fe6c9', '#fff'], ['#c9b6ff', '#ffd36e'], ['#8fc8ff', '#fff']];
  LOLLI_X.forEach((x, i) => {
    main += E.el(`lp${i + 1}`, x, 650, lollipop(0, 0, 66, 400, cols[i][0], cols[i][1]));
    main += E.el(`st${i + 1}`, x + (i % 2 ? 70 : -70), 690, star5(0, -24, 24, '#ffd36e', '#c99a2e', 3), { opacity: 0, scale: 0.4 });
  });
  main += butterflies(8, 37, 300, W - 300, 560, 700);
  for (let i = 0; i < 18; i++) main += `<circle cx="${i * 140 + 40}" cy="${740 + (i % 3) * 70}" r="${8 + (i % 3) * 3}" fill="${['#ff9fcf', '#ffd36e', '#fff'][i % 3]}" opacity=".8"/>`;
  return {
    id: 'garden', w: W, h: 1000, ground: 715, top: -280, bottom: 1080, bg: '#ffd1e8', defs,
    layers: [{ p: 0.1, svg: far }, { p: 0.5, svg: mid }, { p: 1, svg: main }],
    els: E.anchors,
  };
}

/* ---------------- The Big Prize: Sugar Mountain (a tall set to climb) ---------------- */
export function mountain(): SetDef {
  const W = 1600, H = 2600;
  const E = elements();
  const defs = lin('mt-sky', [[0, '#7b5fd6'], [0.5, '#c9a6f0'], [1, '#ffd1e8']]) + lin('mt-ice', [[0, '#ffffff'], [1, '#f2e6ff']], 1, 0) + rad('mt-glow', [[0, '#fff4c7', 0.95], [1, '#fff4c7', 0]]);
  const far = `<rect x="-600" y="-400" width="${W + 1200}" height="${H + 800}" fill="url(#mt-sky)"/>` + stars(80, 21, -400, W + 400, -300, 900)
    + planet(1300, 300, 90, '#ffe3f1', '#ff9fcf', true, 'mt-pl') + birds(10, 85, -400, W, 500, 2200, 1800) + cloud(-100, 1100, 1.6, '#fff0f8', 'drift slow') + cloud(1100, 1500, 1.4, '#ffe6f3', 'drift') + cloud(200, 1900, 1.5, '#fff0f8', 'drift slow');
  // The mountain body
  let main = `<path d="M-400 ${H + 100} L-100 1300 Q200 700 560 520 Q800 420 1040 520 Q1400 700 1700 1300 L${W + 400} ${H + 100} Z" fill="url(#mt-ice)" stroke="#d8b8e8" stroke-width="8"/>`;
  main += `<path d="M300 900 Q420 980 520 900 T740 920 T980 880 T1240 940" stroke="#ffb7dc" stroke-width="22" fill="none" stroke-linecap="round" opacity=".7"/>`
    + `<path d="M120 1500 Q300 1580 460 1500 T800 1520 T1140 1490 T1460 1540" stroke="#8fc8ff" stroke-width="22" fill="none" stroke-linecap="round" opacity=".6"/>`
    + `<path d="M40 2100 Q260 2180 480 2100 T900 2120 T1300 2090 T1600 2140" stroke="#ffd36e" stroke-width="22" fill="none" stroke-linecap="round" opacity=".6"/>`;
  // Ledges along the climbing path
  for (let i = 0; i < PATH.length; i++) {
    const [x, y] = PATH[i];
    main += `<path d="M${x - 170} ${y + 4} Q${x} ${y - 10} ${x + 170} ${y + 4} L${x + 150} ${y + 40} Q${x} ${y + 52} ${x - 150} ${y + 40} Z" fill="#ffd1e8" stroke="${INK}" stroke-width="4"/>`;
    if (i < PATH.length - 1) {
      const [nx, ny] = PATH[i + 1];
      main += `<path d="M${x} ${y} L${nx} ${ny}" stroke="#ffe8f4" stroke-width="64" stroke-linecap="round" opacity=".9"/><path d="M${x} ${y} L${nx} ${ny}" stroke="#ffb7dc" stroke-width="6" stroke-dasharray="14 18" opacity=".8"/>`;
    }
  }
  const r = rng(41);
  for (let i = 0; i < 70; i++) main += `<rect x="${Math.round(100 + r() * 1400)}" y="${Math.round(700 + r() * 1800)}" width="5" height="15" rx="2" fill="${['#ff9fcf', '#7fe6c9', '#ffd36e', '#8fc8ff'][i % 4]}" transform="rotate(${Math.round(r() * 180)} ${Math.round(100 + r() * 1400)} ${Math.round(700 + r() * 1800)})" opacity=".8"/>`;
  main += candyCane(220, 2300, 120) + candyCane(1300, 1980, 110, true) + candyCane(300, 1300, 100);
  main += `<rect x="-400" y="2440" width="${W + 800}" height="400" fill="#ffd1e8" stroke="${INK}" stroke-width="5"/>`;
  main += `<circle cx="800" cy="280" r="160" fill="url(#mt-glow)" class="pulse"/>`;
  main += E.el('giant', 800, 520, lollipop(0, 0, 110, 230, '#ff9fcf', '#ffd36e'));
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
  const pieces = [-220, -110, 0, 110, 220].map((x, i) => `<g transform="translate(${x} 0) rotate(${(i - 2) * 8})">${lollipop(0, 0, 32, 70, ['#ff9fcf', '#ffd36e', '#7fe6c9', '#c9b6ff', '#8fc8ff'][i], '#fff')}</g>`).join('');
  main += E.el('pieces', 800, 640, pieces, { opacity: 0 });
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
