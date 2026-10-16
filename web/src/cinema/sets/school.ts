// School sets: the science-fair hall and the dusty store room with the mystery machine.
// Layout rule for every set: feet stand at about y 715 so wide shots keep bodies above the
// subtitles, and nothing important sits above y 100 (the HUD).
import type { SetDef } from './types';
import { INK, FONT, lin, rad, cloud, bunting, person, rays, dust, elements, rng, star5 } from './kit';

/* ---------------- The school hall, last day of the science fair ---------------- */
export function hall(): SetDef {
  const W = 2200;
  const E = elements();
  const defs = lin('hall-wall', [[0, '#fff1dc'], [1, '#f6dcbc']])
    + lin('hall-glass', [[0, '#8fd0ff'], [1, '#dff3ff']])
    + lin('hall-floor', [[0, '#c9946a'], [1, '#e2b48a']])
    + lin('hall-ray', [[0, '#fff8d8', 0.6], [1, '#fff8d8', 0]])
    + rad('hall-door', [[0, '#5a4466'], [1, '#2a1f38']]);

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
  for (let i = 0; i < 16; i++) {
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
  main += table(420, 280, '#ffd1e8') + table(820, 240, '#cfe8ff') + table(1180, 260, '#d9f5ea') + table(1560, 240, '#fff1b8');
  // Meera's volcano (the foam is hidden until it erupts)
  main += E.el('volcano', 420, 590,
    `<path d="M-70 0 L-18 -110 Q0 -118 18 -110 L70 0 Z" fill="#9b6a4a" stroke="${INK}" stroke-width="4"/><path d="M-40 -60 Q-10 -70 20 -50" stroke="#7a4f34" stroke-width="5" fill="none"/>`
    + `<ellipse cx="0" cy="-110" rx="20" ry="7" fill="#ff7ab8"/><rect x="40" y="-34" width="38" height="34" rx="4" fill="#fff" stroke="${INK}" stroke-width="2.5"/><text x="59" y="-12" text-anchor="middle" font-size="13" fill="#7B61FF" style="${FONT}">CALM</text>`);
  main += E.el('foam', 420, 482,
    `<g><circle cx="0" cy="-30" r="44" fill="#ff9fcf"/><circle cx="-36" cy="-6" r="30" fill="#ffb7dc"/><circle cx="36" cy="-10" r="32" fill="#ffc6e4"/><circle cx="-10" cy="-70" r="30" fill="#ffb7dc"/><circle cx="22" cy="-62" r="24" fill="#ff9fcf"/><circle cx="-14" cy="-40" r="12" fill="#fff" opacity=".6"/></g>`, { scale: 0 });
  // Solar-system model
  main += `<g><rect x="814" y="520" width="10" height="68" fill="#8a5a3a"/><circle cx="820" cy="510" r="26" fill="#ffd36e" stroke="${INK}" stroke-width="3"/><path d="M760 550 Q820 470 880 550" stroke="#c9b6ff" stroke-width="3" fill="none"/><circle cx="764" cy="544" r="10" fill="#8fc8ff" stroke="${INK}" stroke-width="2"/><circle cx="876" cy="544" r="13" fill="#ff9fcf" stroke="${INK}" stroke-width="2"/></g>`;
  // A biscuit-tin robot that sneezes
  main += E.el('robot', 1180, 590,
    `<rect x="-36" y="-70" width="72" height="70" rx="10" fill="#c9d4e0" stroke="${INK}" stroke-width="4"/><path d="M-36 -52 H36 M-36 -18 H36" stroke="#9aa8b8" stroke-width="4"/>`
    + `<rect x="-28" y="-128" width="56" height="54" rx="14" fill="#dfe6ee" stroke="${INK}" stroke-width="4"/><circle cx="-12" cy="-102" r="7" fill="#7fe6c9" stroke="${INK}" stroke-width="2"/><circle cx="12" cy="-102" r="7" fill="#7fe6c9" stroke="${INK}" stroke-width="2"/>`
    + `<path d="M-10 -86 Q0 -80 10 -86" stroke="${INK}" stroke-width="3" fill="none"/><path d="M0 -128 V-146" stroke="${INK}" stroke-width="3"/><circle cx="0" cy="-150" r="6" fill="#ff9fcf"/>`
    + `<path d="M-36 -50 L-58 -30 M36 -50 L58 -30" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`);
  // Plant project
  main += `<g><path d="M1540 588 L1546 548 H1574 L1580 588 Z" fill="#c48a64" stroke="${INK}" stroke-width="3"/><path d="M1560 548 Q1530 498 1500 508 Q1530 518 1560 548 Q1590 488 1620 498 Q1590 508 1560 548 Q1560 498 1560 468" stroke="#4f9a3c" stroke-width="5" fill="#7fe6c9"/></g>`;
  // The store-room door at the end of the hall
  main += `<g><rect x="1960" y="150" width="300" height="440" fill="#efd3b0"/><rect x="1990" y="210" width="180" height="390" rx="8" fill="url(#hall-door)" stroke="${INK}" stroke-width="5"/>`
    + `<path d="M2170 210 L2120 230 L2120 610 L2170 600 Z" fill="#a87c58" stroke="${INK}" stroke-width="4"/><circle cx="2132" cy="420" r="7" fill="#ffd36e"/>`
    + `<rect x="2000" y="168" width="160" height="30" rx="6" fill="#fff" stroke="${INK}" stroke-width="3"/><text x="2080" y="190" text-anchor="middle" font-size="20" fill="#7a3fa0" style="${FONT}">STORE ROOM</text>`
    + `<path d="M2010 600 L2150 600 L2180 650 L1990 650 Z" fill="#ffe9a8" opacity=".25"/></g>`;

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
    + lin('sr-cab', [[0, '#7B61FF'], [1, '#3b2f86']], 1, 0)
    + rad('sr-screen', [[0, '#bff6ff'], [0.6, '#5ad0ff'], [1, '#2a6fd0']])
    + rad('sr-glow', [[0, '#8ff0ff', 0.55], [1, '#8ff0ff', 0]]);

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
  // The mystery arcade machine
  const glow = `<ellipse cx="0" cy="-260" rx="230" ry="260" fill="url(#sr-glow)" class="pulse"/>`;
  const cab = `<path d="M-120 0 L-120 -380 Q-120 -470 -60 -480 L60 -480 Q120 -470 120 -380 L120 0 Z" fill="url(#sr-cab)" stroke="${INK}" stroke-width="6"/>`
    + `<rect x="-112" y="-540" width="224" height="78" rx="18" fill="#ffd36e" stroke="${INK}" stroke-width="6"/>`
    + `<text x="0" y="-512" text-anchor="middle" font-size="26" fill="#7a3fa0" style="${FONT}">PARTY</text><text x="0" y="-482" text-anchor="middle" font-size="26" fill="#7a3fa0" style="${FONT}">GALAXY</text>`
    + `<rect x="-90" y="-400" width="180" height="150" rx="16" fill="#151036" stroke="${INK}" stroke-width="5"/>`
    + `<rect x="-78" y="-388" width="156" height="126" rx="10" fill="url(#sr-screen)" class="pulse"/>`
    + `<text x="0" y="-330" text-anchor="middle" font-size="22" fill="#fff" style="${FONT}">PRESS</text><text x="0" y="-302" text-anchor="middle" font-size="22" fill="#fff" style="${FONT}">START</text>`
    + `<path d="M-110 -230 L110 -230 L130 -180 L-130 -180 Z" fill="#5a44d6" stroke="${INK}" stroke-width="5"/>`
    + `<circle cx="-50" cy="-206" r="13" fill="#ff9fcf" stroke="${INK}" stroke-width="3"/><circle cx="0" cy="-206" r="13" fill="#7fe6c9" stroke="${INK}" stroke-width="3"/><circle cx="50" cy="-206" r="13" fill="#ffd36e" stroke="${INK}" stroke-width="3"/>`
    + `<rect x="-26" y="-140" width="52" height="40" rx="6" fill="#151036" stroke="${INK}" stroke-width="3"/><rect x="-10" y="-132" width="20" height="24" rx="3" fill="#ffd36e" class="pulse"/>`
    + `<path d="M-120 -20 H120" stroke="#2a1f38" stroke-width="5"/><path d="M90 -10 Q160 10 200 4" stroke="#2a1f38" stroke-width="6" fill="none"/><rect x="196" y="-6" width="26" height="16" rx="4" fill="#2a1f38"/>`;
  main += E.el('machine', 1000, 700, glow + cab);
  // The golden token, hidden until it flies into the slot
  main += E.el('token', 1000, 560, `<circle r="15" fill="#ffd36e" stroke="#c99a2e" stroke-width="4"/><circle r="9" fill="none" stroke="#fff4c7" stroke-width="2.5"/>`, { opacity: 0 });
  main += `<path d="M${W - 10} 0 Q${W - 60} 40 ${W - 120} 10 M${W - 10} 0 Q${W - 50} 60 ${W - 70} 120 M${W - 10} 0 L${W - 100} 70" stroke="#d9d4e0" stroke-width="2" opacity=".5" fill="none" transform="translate(0 100)"/>`
    + `<g><path d="M1330 740 L1370 480" stroke="#c48a64" stroke-width="8"/><path d="M1300 740 Q1330 700 1370 740 Q1350 760 1300 760 Z" fill="#d9d4e0" stroke="${INK}" stroke-width="3"/></g>`;

  const front = `<g><path d="M-300 1080 L-300 860 Q-160 840 -40 880 L80 1080 Z" fill="#3a2c52" stroke="${INK}" stroke-width="4"/><rect x="${W - 120}" y="880" width="320" height="200" fill="#b8895c" stroke="${INK}" stroke-width="5"/></g>`;

  return {
    id: 'storeroom', w: W, h: 1000, ground: 740, top: -280, bottom: 1080, bg: '#3a2c52', defs,
    layers: [{ p: 0.4, svg: wall }, { p: 0.75, svg: beam }, { p: 1, svg: main }, { p: 1.3, svg: front, front: true }],
    els: E.anchors,
  };
}
