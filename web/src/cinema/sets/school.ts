// School sets: the science-fair hall and the dusty store room with the mystery machine.
// Layout rule for every set: feet stand at about y 715 so wide shots keep bodies above the
// subtitles, and nothing important sits above y 100 (the HUD).
import type { SetDef } from './types';
import { INK, FONT, lin, rad, cloud, bunting, person, rays, dust, elements, rng, star5, sparkleStar } from './kit';
import { HALL, MACHINE } from './school-layout';

/* ---------------- The school hall, last day of the science fair ---------------- */
export function hall(): SetDef {
  const W = 2400;
  const E = elements();
  const defs = lin('hall-wall', [[0, '#fff1dc'], [1, '#f6dcbc']])
    + lin('hall-glass', [[0, '#8fd0ff'], [1, '#dff3ff']])
    + lin('hall-floor', [[0, '#c9946a'], [1, '#e2b48a']])
    + lin('hall-ray', [[0, '#fff8d8', 0.6], [1, '#fff8d8', 0]])
    + rad('hall-door', [[0, '#5a4466'], [1, '#2a1f38']])
    + lin('hall-foam', [[0, '#ffe3f1'], [0.5, '#ff9fcf'], [1, '#ff7ab8']], 1, 0)
    + lin('hall-leak', [[0, '#b9f3ff', 0.95], [1, '#7B61FF', 0]])
    + lin('hall-tin', [[0, '#e3ebf3'], [1, '#aebccb']], 1, 0);

  // Far wall: windows full of sky, the banner and bunting.
  let wall = `<rect x="-500" y="-300" width="${W + 1000}" height="900" fill="url(#hall-wall)"/>`
    + `<rect x="-500" y="440" width="${W + 1000}" height="160" fill="#ecc9a2"/><rect x="-500" y="436" width="${W + 1000}" height="10" fill="#d8b089"/>`;
  [150, 600, 1050, 1500, 1950].forEach((x, i) => {
    wall += `<g><rect x="${x}" y="150" width="250" height="260" rx="18" fill="url(#hall-glass)" stroke="#fff" stroke-width="14"/>`
      + cloud(x + 40, 240 + (i % 2) * 34, 0.6, '#ffffff', 'drift slow')
      + `<path d="M${x + 125} 150 V410 M${x} 290 H${x + 250}" stroke="#fff" stroke-width="10"/></g>`;
  });
  wall += `<g><rect x="790" y="96" width="620" height="70" rx="14" fill="#7B61FF" stroke="${INK}" stroke-width="4"/><text x="1100" y="146" text-anchor="middle" font-size="44" fill="#fff" style="${FONT}">SCIENCE FAIR</text>`
    + star5(828, 131, 16, '#ffd36e') + star5(1372, 131, 16, '#ffd36e') + '</g>'
    + bunting(-40, 780, 104, 26, ['#ff9fcf', '#7fe6c9', '#ffd36e', '#8fc8ff']) + bunting(1420, W + 40, 104, 26, ['#ffd36e', '#c9b6ff', '#ff9fcf', '#7fe6c9'])
    + `<g><circle cx="1880" cy="120" r="28" fill="#fff" stroke="${INK}" stroke-width="5"/><path d="M1880 120 V102 M1880 120 L1893 127" stroke="${INK}" stroke-width="4" stroke-linecap="round"/></g>`;
  const light = rays(270, 160, 5, 760, 24, -32, 'url(#hall-ray)', 1) + rays(1170, 160, 5, 760, 24, -32, 'url(#hall-ray)', 1);

  // Middle: poster boards and a soft crowd of families.
  const r = rng(7);
  let mid = '';
  [140, 760, 1340, 1880].forEach((x, i) => {
    const c = ['#8fc8ff', '#ff9fcf', '#7fe6c9', '#ffd36e'][i];
    mid += `<g><path d="M${x - 100} 560 L${x - 82} 410 L${x + 82} 410 L${x + 100} 560 Z" fill="#fff" stroke="${INK}" stroke-width="3"/><path d="M${x - 28} 410 V560 M${x + 28} 410 V560" stroke="#ddd" stroke-width="3"/>`
      + `<circle cx="${x}" cy="470" r="30" fill="${c}"/><path d="M${x - 64} 524 h46 M${x + 18} 524 h46 M${x - 64} 540 h36" stroke="#bbb" stroke-width="5" stroke-linecap="round"/></g>`;
  });
  const shirts = ['#b9a9e6', '#9fd3c4', '#f2b5c9', '#f6d38c', '#a9c9ee', '#d6b6f0'];
  const hairs = ['#3a2a3a', '#2a1c14', '#5a3a24', '#1c1530'];
  for (let i = 0; i < 15; i++) {
    const x = 60 + i * 135 + r() * 50;
    mid += person(x, 590 + r() * 14, 0.55 + r() * 0.12, shirts[i % shirts.length], hairs[i % hairs.length]);
  }

  // Ground plane: floor, project tables, the store-room door.
  let main = `<rect x="-500" y="560" width="${W + 1000}" height="520" fill="url(#hall-floor)"/>`;
  for (let y = 600; y < 1060; y += 46) main += `<path d="M-500 ${y} H${W + 500}" stroke="#b07c55" stroke-width="2.5" opacity=".5"/>`;
  for (let x = -500; x < W + 500; x += 180) main += `<path d="M${x} 560 L${x - 70} 1060" stroke="#b07c55" stroke-width="2" opacity=".32"/>`;
  main += `<ellipse cx="${W / 2}" cy="800" rx="900" ry="60" fill="#fff" opacity=".12"/>`;
  const table = (x: number, w: number, cloth: string) =>
    `<g><rect x="${x - w / 2 + 14}" y="606" width="14" height="62" fill="#8a5a3a"/><rect x="${x + w / 2 - 28}" y="606" width="14" height="62" fill="#8a5a3a"/>`
    + `<path d="M${x - w / 2} 592 H${x + w / 2} L${x + w / 2 - 8} 644 H${x - w / 2 + 8} Z" fill="${cloth}" stroke="${INK}" stroke-width="3"/><rect x="${x - w / 2}" y="586" width="${w}" height="12" rx="4" fill="#fff" opacity=".6"/></g>`;
  main += table(HALL.volcano, 280, '#ffd1e8') + table(820, 240, '#cfe8ff') + table(1180, 260, '#d9f5ea') + table(1560, 240, '#fff1b8');

  // Meera's volcano. The geyser grows up out of the crater, and a blob of foam flies over to land
  // on Ro's head; both are hidden until the eruption.
  const vx = HALL.volcano;
  main += E.el('volcano', vx, 590,
    `<path d="M-70 0 L-18 -110 Q0 -118 18 -110 L70 0 Z" fill="#9b6a4a" stroke="${INK}" stroke-width="4"/><path d="M-40 -60 Q-10 -70 20 -50" stroke="#7a4f34" stroke-width="5" fill="none"/>`
    + `<ellipse cx="0" cy="-110" rx="20" ry="7" fill="#ff7ab8"/><rect x="40" y="-34" width="38" height="34" rx="4" fill="#fff" stroke="${INK}" stroke-width="2.5"/><text x="59" y="-12" text-anchor="middle" font-size="13" fill="#7B61FF" style="${FONT}">CALM</text>`);
  main += E.el('geyser', vx, 482,
    `<path d="M-24 0 C-30 -60 -10 -110 -26 -170 C-38 -220 -8 -270 -18 -300 L18 -300 C10 -260 38 -220 26 -170 C12 -110 32 -60 24 0 Z" fill="url(#hall-foam)" stroke="${INK}" stroke-width="4"/>`
    + `<circle cx="0" cy="-312" r="46" fill="#ff9fcf" stroke="${INK}" stroke-width="4"/><circle cx="-38" cy="-290" r="28" fill="#ffb7dc" stroke="${INK}" stroke-width="3"/><circle cx="40" cy="-296" r="30" fill="#ffc6e4" stroke="${INK}" stroke-width="3"/>`
    + `<circle cx="-12" cy="-326" r="12" fill="#fff" opacity=".6"/><path d="M-10 -140 q6 -12 0 -26 M8 -80 q6 -12 0 -26" stroke="#fff" stroke-width="5" opacity=".55" fill="none" stroke-linecap="round"/>`, { scale: 0 });
  main += E.el('foam', vx, 482,
    `<g><circle cx="0" cy="-30" r="44" fill="#ff9fcf"/><circle cx="-36" cy="-6" r="30" fill="#ffb7dc"/><circle cx="36" cy="-10" r="32" fill="#ffc6e4"/><circle cx="-10" cy="-70" r="30" fill="#ffb7dc"/><circle cx="22" cy="-62" r="24" fill="#ff9fcf"/><circle cx="-14" cy="-40" r="12" fill="#fff" opacity=".6"/></g>`, { scale: 0 });
  main += E.el('blob', HALL.roSpot, 404,
    `<circle cx="0" cy="-8" r="40" fill="#ff9fcf" stroke="${INK}" stroke-width="4"/><circle cx="-30" cy="6" r="22" fill="#ffb7dc" stroke="${INK}" stroke-width="3"/><circle cx="32" cy="2" r="24" fill="#ffc6e4" stroke="${INK}" stroke-width="3"/>`
    + `<circle cx="-10" cy="-22" r="10" fill="#fff" opacity=".6"/>`, { opacity: 0 });

  // Solar-system model
  main += `<g><rect x="814" y="520" width="10" height="68" fill="#8a5a3a"/><circle cx="820" cy="510" r="26" fill="#ffd36e" stroke="${INK}" stroke-width="3"/><path d="M760 550 Q820 470 880 550" stroke="#c9b6ff" stroke-width="3" fill="none"/><circle cx="764" cy="544" r="10" fill="#8fc8ff" stroke="${INK}" stroke-width="2"/><circle cx="876" cy="544" r="13" fill="#ff9fcf" stroke="${INK}" stroke-width="2"/></g>`;

  // A biscuit-tin robot with a big red button nose. The head, the nose and the sneeze cloud are
  // separate pieces so the robot can lean back ("ah... ah...") and snap forward ("ACHOO!").
  const nose = E.el('robotnose', 0, -28, `<circle r="12" fill="#ff5f6d" stroke="${INK}" stroke-width="3"/><ellipse cx="-4" cy="-4" rx="4" ry="3" fill="#fff" opacity=".8"/>`);
  const head = E.el('robothead', 0, -74,
    `<path d="M0 -70 V-94" stroke="${INK}" stroke-width="4"/><circle cx="0" cy="-98" r="8" fill="#ff9fcf" stroke="${INK}" stroke-width="3"/>`
    + `<rect x="-38" y="-72" width="76" height="70" rx="16" fill="url(#hall-tin)" stroke="${INK}" stroke-width="4"/>`
    + `<circle cx="-40" cy="-36" r="7" fill="#9aa8b8" stroke="${INK}" stroke-width="3"/><circle cx="40" cy="-36" r="7" fill="#9aa8b8" stroke="${INK}" stroke-width="3"/>`
    + `<circle cx="-15" cy="-48" r="10" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="15" cy="-48" r="10" fill="#fff" stroke="${INK}" stroke-width="3"/>`
    + `<circle cx="-14" cy="-47" r="5" fill="#29c4c4"/><circle cx="16" cy="-47" r="5" fill="#29c4c4"/>`
    + `<rect x="-14" y="-16" width="28" height="9" rx="3" fill="#2a1f38"/><path d="M-7 -16 V-7 M0 -16 V-7 M7 -16 V-7" stroke="#9aa8b8" stroke-width="2"/>`
    + nose);
  main += E.el('robot', 1180, 590,
    `<path d="M-38 -50 L-62 -26 M38 -50 L62 -26" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><circle cx="-64" cy="-24" r="7" fill="#9aa8b8" stroke="${INK}" stroke-width="3"/><circle cx="64" cy="-24" r="7" fill="#9aa8b8" stroke="${INK}" stroke-width="3"/>`
    + `<rect x="-38" y="-74" width="76" height="74" rx="10" fill="url(#hall-tin)" stroke="${INK}" stroke-width="4"/><path d="M-38 -54 H38 M-38 -20 H38" stroke="#9aa8b8" stroke-width="4"/>`
    + `<circle cx="-14" cy="-37" r="6" fill="#7fe6c9" stroke="${INK}" stroke-width="2"/><circle cx="2" cy="-37" r="6" fill="#ffd36e" stroke="${INK}" stroke-width="2"/><circle cx="18" cy="-37" r="6" fill="#ff9fcf" stroke="${INK}" stroke-width="2"/>`
    + head);
  main += E.el('sneeze', 1150, 488,
    `<g fill="#f3fbff" stroke="#9ec9de" stroke-width="3"><circle cx="-40" cy="0" r="30"/><circle cx="-76" cy="-18" r="24"/><circle cx="-80" cy="18" r="22"/><circle cx="-112" cy="0" r="18"/></g>`
    + `<g fill="#bfe9ff">${[[-130, -26, 5], [-140, 14, 4], [-150, -6, 3], [-96, 34, 4], [-60, -40, 4]].map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="${rr}"/>`).join('')}</g>`
    + `<path d="M-20 -10 L-150 -50 M-20 0 L-170 0 M-20 10 L-150 50" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>`, { opacity: 0, scale: 0.3 });

  // Plant project
  main += `<g><path d="M1540 588 L1546 548 H1574 L1580 588 Z" fill="#c48a64" stroke="${INK}" stroke-width="3"/><path d="M1560 548 Q1530 498 1500 508 Q1530 518 1560 548 Q1590 488 1620 498 Q1590 508 1560 548 Q1560 498 1560 468" stroke="#4f9a3c" stroke-width="5" fill="#7fe6c9"/></g>`;

  // The store-room door at the end of the hall. When something inside hums, light leaks out of the
  // gaps and soft sound rings ripple out (the "doorglow" piece fades in for that shot).
  const dx = HALL.door;
  main += `<rect x="${dx - 120}" y="150" width="300" height="440" fill="#efd3b0"/>`;
  main += E.el('door', dx, 600,
    `<rect x="-90" y="-390" width="180" height="390" rx="8" fill="url(#hall-door)" stroke="${INK}" stroke-width="5"/>`
    + `<path d="M90 -390 L40 -370 L40 10 L90 0 Z" fill="#a87c58" stroke="${INK}" stroke-width="4"/><circle cx="52" cy="-180" r="7" fill="#ffd36e"/>`
    + `<rect x="-80" y="-432" width="160" height="30" rx="6" fill="#fff" stroke="${INK}" stroke-width="3"/><text x="0" y="-410" text-anchor="middle" font-size="20" fill="#7a3fa0" style="${FONT}">STORE ROOM</text>`
    + `<path d="M-70 -300 H30 M-70 -200 H30 M-70 -100 H30" stroke="#1d1530" stroke-width="3" opacity=".5"/>`);
  main += E.el('doorglow', dx, 600,
    `<path d="M-96 0 L40 0 L120 70 L-150 70 Z" fill="url(#hall-leak)" class="pulse"/>`
    + `<path d="M-94 -392 L-94 0" stroke="#b9f3ff" stroke-width="5" opacity=".85" class="pulse"/><path d="M-90 -394 H40" stroke="#b9f3ff" stroke-width="5" opacity=".85" class="pulse"/>`
    + `<g fill="none" stroke="#c9b6ff" stroke-width="5" stroke-linecap="round" opacity=".8">${[60, 100, 140].map((rr, i) => `<path class="pulse" style="animation-delay:${i * 0.5}s" d="M${-rr - 40} ${-260 + rr * 0.2} q-18 ${-rr * 0.35} 0 ${-rr * 0.7}"/>`).join('')}</g>`
    + sparkleStar(30, -160, 8, '#b9f3ff', 'tw') + sparkleStar(-120, -330, 7, '#ffd36e', 'tw') + sparkleStar(-150, -200, 6, '#fff', 'tw'), { opacity: 0 });
  main += `<path d="M${dx - 70} 600 L${dx + 70} 600 L${dx + 100} 650 L${dx - 90} 650 Z" fill="#ffe9a8" opacity=".25"/>`;

  // Foreground: the corner of a table and a big pot plant, out of focus.
  const front = `<g><path d="M-400 880 L170 880 L140 1080 L-400 1080 Z" fill="#ffd1e8" stroke="${INK}" stroke-width="5"/><rect x="-400" y="866" width="580" height="20" rx="8" fill="#fff" opacity=".7"/></g>`
    + `<g><path d="M1740 1060 L1760 880 H1860 L1880 1060 Z" fill="#c48a64" stroke="${INK}" stroke-width="5"/><path d="M1810 880 Q1740 780 1690 800 Q1750 820 1810 880 Q1860 770 1930 780 Q1870 810 1810 880" fill="#5ccfae" stroke="#2e8a6a" stroke-width="5"/></g>`;

  return {
    id: 'hall', w: W, h: 1000, ground: 715, top: -280, bottom: 1080, bg: '#f6dcbc', defs,
    layers: [{ p: 0.25, svg: wall + light }, { p: 0.6, svg: mid }, { p: 1, svg: main }, { p: 1.35, svg: front, front: true }],
    els: E.anchors,
  };
}

/* ---------------- The store room: dust, one beam of light, and the machine ---------------- */
export function storeroom(): SetDef {
  const W = 1500;
  const E = elements();
  const defs = lin('sr-wall', [[0, '#3a2c52'], [1, '#55426e']])
    + lin('sr-beam', [[0, '#fff3c4', 0.5], [1, '#fff3c4', 0]])
    + lin('sr-floor', [[0, '#6e5578'], [1, '#8a6e86']])
    + lin('sr-cab', [[0, '#3b2a8c'], [0.5, '#5a3fd6'], [1, '#2a1f6e']], 1, 0)
    + lin('sr-side', [[0, '#231a5c'], [1, '#14103a']])
    + lin('sr-marq', [[0, '#ffe9a8'], [1, '#ffb84d']])
    + rad('sr-screen', [[0, '#3b6fe0'], [0.7, '#14206a'], [1, '#0b0f3a']])
    + rad('sr-glow', [[0, '#8ff0ff', 0.5], [1, '#8ff0ff', 0]])
    + rad('sr-planet', [[0, '#ffe3f1'], [1, '#ff7ab8']], 0.35, 0.3, 0.8)
    + lin('sr-pull', [[0, '#fff8d8', 0.85], [1, '#b9f3ff', 0]]);

  let wall = `<rect x="-400" y="-300" width="${W + 800}" height="960" fill="url(#sr-wall)"/>`
    + `<rect x="150" y="120" width="170" height="110" rx="8" fill="#ffe9a8" stroke="#2a1f38" stroke-width="10"/><path d="M235 120 V230 M150 175 H320" stroke="#2a1f38" stroke-width="7"/>`;
  const shelf = (x: number, y: number, w: number) => `<rect x="${x}" y="${y}" width="${w}" height="12" fill="#8a6a50" stroke="${INK}" stroke-width="2"/>`;
  wall += shelf(30, 330, 360) + shelf(30, 470, 360) + shelf(1110, 310, 340) + shelf(1110, 450, 340);
  const box = (x: number, y: number, w: number, h: number, c: string) => `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${c}" stroke="${INK}" stroke-width="2.5"/><path d="M${x} ${y - h + 12} H${x + w}" stroke="#000" stroke-opacity=".15" stroke-width="3"/>`;
  wall += box(50, 330, 90, 70, '#c49a6c') + box(150, 330, 70, 50, '#d8b48a') + box(240, 330, 120, 90, '#b8895c')
    + box(60, 470, 110, 80, '#d8b48a') + box(190, 470, 80, 60, '#c49a6c') + box(1130, 310, 80, 60, '#c49a6c') + box(1230, 310, 130, 96, '#b8895c')
    + `<circle cx="1190" cy="420" r="30" fill="#ff8f7e" stroke="${INK}" stroke-width="3"/><path d="M1163 412 Q1190 438 1218 414" stroke="#fff" stroke-width="3" fill="none"/>`
    + `<circle cx="1300" cy="424" r="26" fill="#fff" stroke="${INK}" stroke-width="3"/><path d="M1290 402 l10 12 14 -4 M1286 436 l12 -8" stroke="${INK}" stroke-width="3" fill="none"/>`
    + `<path d="M1390 450 L1410 280 M1410 280 l-16 -10 M1410 280 l12 -14" stroke="#d8b48a" stroke-width="8" stroke-linecap="round"/>`;
  const beam = `<path d="M170 230 L320 230 L880 820 L500 820 Z" fill="url(#sr-beam)"/>` + dust(40, 11, 240, 880, 250, 800);

  let main = `<rect x="-400" y="660" width="${W + 800}" height="420" fill="url(#sr-floor)"/><path d="M-400 660 H${W + 400}" stroke="#2a1f38" stroke-width="6"/>`;
  main += `<g><path d="M110 740 L140 600 L180 600 L200 740 Z" fill="#8fc8ff" stroke="${INK}" stroke-width="3"/><path d="M158 600 L170 440" stroke="#c48a64" stroke-width="8"/><path d="M140 440 Q170 400 200 440" fill="#d9d4e0" stroke="${INK}" stroke-width="3"/></g>`;

  // The mystery arcade machine: marquee with chasing bulbs, neon-edged cabinet, a screen showing a
  // tiny Party Galaxy, joystick and buttons, and a glowing token slot. Its plug lies on the floor.
  const glow = `<ellipse cx="0" cy="-280" rx="260" ry="300" fill="url(#sr-glow)" class="pulse"/><ellipse cx="0" cy="6" rx="200" ry="26" fill="#8ff0ff" opacity=".18" class="pulse"/>`;
  let bulbs = '';
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    bulbs += `<circle class="tw" style="animation-delay:${(i % 2) * 1.6}s" cx="${Math.round(-118 + t * 236)}" cy="-588" r="7" fill="#fff4c7" stroke="#c99a2e" stroke-width="2"/>`;
    bulbs += `<circle class="tw" style="animation-delay:${((i + 1) % 2) * 1.6}s" cx="${Math.round(-118 + t * 236)}" cy="-470" r="7" fill="#fff4c7" stroke="#c99a2e" stroke-width="2"/>`;
  }
  let stars = '';
  const rs = rng(9);
  for (let i = 0; i < 16; i++) stars += `<circle class="tw" style="animation-delay:${(i % 5) * 0.6}s" cx="${Math.round(-70 + rs() * 140)}" cy="${Math.round(-392 + rs() * 108)}" r="${(1 + rs() * 1.6).toFixed(1)}" fill="#fff"/>`;
  const cab =
    // side panels with neon edges
    `<path d="M-150 0 L-150 -440 Q-150 -470 -126 -476 L-112 -476 L-112 0 Z" fill="url(#sr-side)" stroke="${INK}" stroke-width="5"/>`
    + `<path d="M150 0 L150 -440 Q150 -470 126 -476 L112 -476 L112 0 Z" fill="url(#sr-side)" stroke="${INK}" stroke-width="5"/>`
    + `<path d="M-144 -8 L-144 -440 Q-144 -464 -124 -468" stroke="#ff7ab8" stroke-width="5" fill="none" opacity=".9" class="pulse"/><path d="M144 -8 L144 -440 Q144 -464 124 -468" stroke="#7fe6c9" stroke-width="5" fill="none" opacity=".9" class="pulse" style="animation-delay:1.2s"/>`
    + `<path d="M-136 -120 l-6 30 l10 -6 l-4 26" stroke="#ffd36e" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M136 -260 l6 30 l-10 -6 l4 26" stroke="#ffd36e" stroke-width="4" fill="none" stroke-linecap="round"/>`
    + star5(-131, -330, 9, '#ffd36e', INK, 2) + star5(131, -150, 9, '#ff9fcf', INK, 2)
    // body
    + `<path d="M-112 0 L-112 -476 L112 -476 L112 0 Z" fill="url(#sr-cab)" stroke="${INK}" stroke-width="6"/>`
    // marquee
    + `<rect x="-130" y="-600" width="260" height="142" rx="22" fill="url(#sr-marq)" stroke="${INK}" stroke-width="6"/>` + bulbs
    + `<circle cx="-78" cy="-528" r="26" fill="url(#sr-planet)" stroke="${INK}" stroke-width="3"/><ellipse cx="-78" cy="-524" rx="40" ry="9" fill="none" stroke="#7B61FF" stroke-width="4"/>`
    + `<text x="22" y="-534" text-anchor="middle" font-size="34" fill="#7a3fa0" style="${FONT}">PARTY</text><text x="22" y="-500" text-anchor="middle" font-size="34" fill="#7a3fa0" style="${FONT}">GALAXY</text>`
    // screen with a tiny galaxy
    + `<rect x="-96" y="-420" width="192" height="172" rx="18" fill="#0d0a26" stroke="${INK}" stroke-width="5"/><rect x="-86" y="-410" width="172" height="152" rx="12" fill="url(#sr-screen)"/>` + stars
    + `<g transform="translate(0 -350)"><ellipse rx="56" ry="13" fill="none" stroke="#ffd36e" stroke-width="3" opacity=".8"/><circle r="22" fill="url(#sr-planet)"/><path d="M-56 0 A56 13 0 0 0 56 0" fill="none" stroke="#ffd36e" stroke-width="3"/></g>`
    + `<g class="pulse"><text x="0" y="-276" text-anchor="middle" font-size="19" fill="#fff" style="${FONT}">PRESS START</text></g>`
    + `<path d="M-86 -410 L86 -410 L60 -380 L-60 -380 Z" fill="#fff" opacity=".07"/>`
    // control panel: joystick and buttons
    + `<path d="M-124 -236 L124 -236 L146 -176 L-146 -176 Z" fill="#4b36c4" stroke="${INK}" stroke-width="5"/>`
    + `<rect x="-92" y="-224" width="10" height="30" rx="4" fill="#2a1f38"/><circle cx="-87" cy="-226" r="14" fill="#ff5f6d" stroke="${INK}" stroke-width="3"/><ellipse cx="-91" cy="-230" rx="5" ry="3" fill="#fff" opacity=".7"/>`
    + `<circle cx="-30" cy="-204" r="12" fill="#7fe6c9" stroke="${INK}" stroke-width="3"/><circle cx="2" cy="-210" r="12" fill="#ffd36e" stroke="${INK}" stroke-width="3"/><circle cx="34" cy="-204" r="12" fill="#8fc8ff" stroke="${INK}" stroke-width="3"/>`
    + `<g class="pulse"><ellipse cx="88" cy="-203" rx="22" ry="14" fill="#ff7ab8" stroke="${INK}" stroke-width="3"/><text x="88" y="-198" text-anchor="middle" font-size="10" fill="#fff" style="${FONT}">START</text></g>`
    // coin door with a glowing token slot
    + `<rect x="-64" y="-150" width="128" height="110" rx="12" fill="#2a1f6e" stroke="${INK}" stroke-width="4"/>`
    + `<rect x="-30" y="-136" width="60" height="44" rx="8" fill="#0d0a26" stroke="${INK}" stroke-width="3"/><rect x="-6" y="-130" width="12" height="32" rx="4" fill="#ffd36e" class="pulse"/>`
    + `<text x="0" y="-70" text-anchor="middle" font-size="12" fill="#ffd36e" style="${FONT}">INSERT TOKEN</text><rect x="-14" y="-62" width="28" height="12" rx="3" fill="#0d0a26"/>`
    + `<path d="M-112 -20 H112" stroke="#2a1f38" stroke-width="5"/>`
    // the unplugged plug
    + `<path d="M120 -12 Q180 12 230 4" stroke="#2a1f38" stroke-width="6" fill="none"/><rect x="226" y="-6" width="28" height="18" rx="4" fill="#2a1f38"/><path d="M254 -1 h10 M254 8 h10" stroke="#9aa8b8" stroke-width="3"/>`;
  main += E.el('machine', MACHINE.x, MACHINE.y, glow + cab);
  // When the button is pressed the screen pulls everything in: light rays and a swirl from the screen.
  let pull = `<circle r="150" fill="url(#sr-glow)"/>`;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    pull += `<path d="M0 0 L${Math.round(Math.cos(a - 0.07) * 700)} ${Math.round(Math.sin(a - 0.07) * 700)} L${Math.round(Math.cos(a + 0.07) * 700)} ${Math.round(Math.sin(a + 0.07) * 700)} Z" fill="url(#sr-pull)" opacity=".5"/>`;
  }
  let swirl = '';
  for (let k = 0; k < 4; k++) {
    let d = '';
    for (let t = 0; t <= 40; t++) { const an = (t / 40) * Math.PI * 2.4 + (k * Math.PI) / 2, rr = 10 + t * 7; d += `${t ? 'L' : 'M'}${(Math.cos(an) * rr).toFixed(1)} ${(Math.sin(an) * rr).toFixed(1)} `; }
    swirl += `<path d="${d}" stroke="#fff" stroke-width="7" fill="none" opacity=".55" stroke-linecap="round"/>`;
  }
  main += E.el('pull', MACHINE.x, MACHINE.screen, `<g class="spin-slow" style="transform-origin:0 0;transform-box:view-box">${pull}</g><g class="spin-6" style="transform-origin:0 0;transform-box:view-box">${swirl}</g>`, { opacity: 0, scale: 0.4 });
  // The golden token, hidden until it flies into the slot
  main += E.el('token', MACHINE.x, MACHINE.y - 115, `<circle r="15" fill="#ffd36e" stroke="#c99a2e" stroke-width="4"/><circle r="9" fill="none" stroke="#fff4c7" stroke-width="2.5"/>`, { opacity: 0 });
  main += `<path d="M${W - 10} 0 Q${W - 60} 40 ${W - 120} 10 M${W - 10} 0 Q${W - 50} 60 ${W - 70} 120 M${W - 10} 0 L${W - 100} 70" stroke="#d9d4e0" stroke-width="2" opacity=".5" fill="none" transform="translate(0 100)"/>`
    + `<g><path d="M1330 740 L1370 480" stroke="#c48a64" stroke-width="8"/><path d="M1300 740 Q1330 700 1370 740 Q1350 760 1300 760 Z" fill="#d9d4e0" stroke="${INK}" stroke-width="3"/></g>`;

  const front = `<g><path d="M-300 1080 L-300 860 Q-160 840 -40 880 L80 1080 Z" fill="#3a2c52" stroke="${INK}" stroke-width="4"/><rect x="${W - 120}" y="880" width="320" height="200" fill="#b8895c" stroke="${INK}" stroke-width="5"/></g>`;

  return {
    id: 'storeroom', w: W, h: 1000, ground: 740, top: -280, bottom: 1080, bg: '#3a2c52', defs,
    layers: [{ p: 0.4, svg: wall }, { p: 0.75, svg: beam }, { p: 1, svg: main }, { p: 1.3, svg: front, front: true }],
    els: E.anchors,
  };
}
