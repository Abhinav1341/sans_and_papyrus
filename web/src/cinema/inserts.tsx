'use client';
// Insert shots: full-screen close-ups of an object (the arcade screen, a hand with the golden
// token, the START button...). Gentle CSS animation only; blinking stays under once per second.
import { Svg } from '@/components/ui';

const F = "font-family:var(--font-baloo),'Baloo 2',sans-serif;font-weight:800";

function starPath(cx: number, cy: number, r: number) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)} `;
  }
  return d + 'Z';
}

/** A sleeve and hand reaching up the screen (the hand ends at the centre); rotated into place. */
function handArm(sleeve: string, skin: string): string {
  return `<rect x="-34" y="60" width="68" height="620" rx="24" fill="${sleeve}" stroke="#2a1838" stroke-width="6"/>`
    + `<rect x="-36" y="56" width="72" height="22" rx="10" fill="#fff" opacity=".55"/>`
    + `<path d="M-30 64 Q-34 20 -26 -6 Q0 -14 26 -6 Q34 20 30 64 Z" fill="${skin}" stroke="#2a1838" stroke-width="6" stroke-linejoin="round"/>`
    + [-19, -6, 7, 20].map((x, i) => `<rect x="${x - 6}" y="${-34 + Math.abs(i - 1.5) * 6}" width="12" height="40" rx="6" fill="${skin}" stroke="#2a1838" stroke-width="5"/>`).join('')
    + `<path d="M28 34 Q46 22 44 4" stroke="#2a1838" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M28 34 Q46 22 44 4" stroke="${skin}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
}
/** Who reaches in from where (degrees from "below"), sleeve colour and skin. The Captain is first. */
const HANDS: [number, string, string][] = [
  [0, '#ffd36f', '#c98e62'],      // the Captain: outfit and skin come from the player's Captain
  [72, '#5ccfae', '#e2b48a'],     // Meera
  [144, '#ffd33d', '#f0c49c'],    // Kiki
  [216, '#ff8f7e', '#c98e63'],    // Ro
  [288, '#ffb38a', '#c98e63'],    // Bunty
];

/**
 * Kiki eating the wafer raft, one bite per close-up (`n` bites): her hand holds a slab of raft, each
 * bite is cut out of it, and crumbs tumble down into the chocolate.
 */
function waferBites(n: number): string {
  const bites: [number, number, number][] = [[292, 262, 40], [318, 330, 36], [238, 236, 38]];
  const holes = bites.slice(0, n).map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#000"/>`).join('');
  const grid = Array.from({ length: 7 }, (_, i) => `<path d="M${88 + i * 34} 240 V390" stroke="#c48a4a" stroke-width="4"/>`).join('')
    + [280, 320, 360].map((y) => `<path d="M80 ${y} H330" stroke="#c48a4a" stroke-width="4"/>`).join('');
  const [bx, by] = bites[n - 1];
  const crumbs = Array.from({ length: 6 + n * 2 }, (_, i) => {
    const dx = ((i * 53) % 90) - 45, sz = 8 + (i % 3) * 5;
    return `<rect class="ins-crumb" style="--dx:${dx}px;animation-delay:${(i * 0.06).toFixed(2)}s" x="${bx - 10 + (i % 4) * 7}" y="${by + 10}" width="${sz}" height="${sz * 0.7}" rx="2" fill="#f2c98a" stroke="#2a1838" stroke-width="2"/>`;
  }).join('');
  return `<defs><linearGradient id="ins-wb${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc6e4"/><stop offset=".6" stop-color="#e7a07a"/><stop offset="1" stop-color="#6a3a22"/></linearGradient>
    <mask id="ins-wm${n}"><rect width="400" height="800" fill="#fff"/>${holes}</mask></defs>
    <rect width="400" height="800" fill="url(#ins-wb${n})"/>
    <path d="M-20 640 Q100 620 200 640 T420 640 V800 H-20 Z" fill="#5a3420"/><path d="M20 670 q40 -12 80 0 M220 690 q40 -12 80 0" stroke="#b07a52" stroke-width="6" fill="none" stroke-linecap="round"/>
    <g transform="translate(218 446) rotate(-14)">${handArm('#ffd33d', '#f0c49c')}</g>
    <g transform="rotate(-10 205 315)" mask="url(#ins-wm${n})">
      <rect x="72" y="232" width="266" height="166" rx="14" fill="#e0a85a" stroke="#2a1838" stroke-width="7"/>
      <rect x="80" y="240" width="250" height="150" rx="10" fill="#f2c98a"/>${grid}
      <rect x="86" y="246" width="120" height="16" rx="8" fill="#fff" opacity=".45"/>
    </g>
    <g class="ins-pop">${crumbs}</g>
    <text class="ins-pop" x="${n === 3 ? 200 : 120}" y="${n === 3 ? 170 : 190}" text-anchor="middle" font-size="${n === 3 ? 74 : 58}" fill="#fff" stroke="#2a1838" stroke-width="8" paint-order="stroke" transform="rotate(-8 200 180)" style="${F}">${n === 3 ? 'CRUNCH!' : 'crunch'}</text>`;
}

const INSERTS: Record<string, string> = {
  wafer1: waferBites(1),
  wafer2: waferBites(2),
  wafer3: waferBites(3),
  screen: `<defs><radialGradient id="ins-scr" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#3b6fe0"/><stop offset="1" stop-color="#101a5a"/></radialGradient></defs>
    <rect width="400" height="800" fill="#1a1238"/>
    <rect x="18" y="150" width="364" height="470" rx="40" fill="#2a1f50" stroke="#7B61FF" stroke-width="10"/>
    <rect x="44" y="176" width="312" height="418" rx="22" fill="url(#ins-scr)"/>
    ${Array.from({ length: 30 }, (_, i) => `<circle class="tw" style="animation-delay:${(i % 6) * 0.5}s" cx="${60 + ((i * 97) % 280)}" cy="${190 + ((i * 53) % 390)}" r="${1 + (i % 3)}" fill="#fff"/>`).join('')}
    <text x="200" y="262" text-anchor="middle" font-size="44" fill="#ffd36e" style="${F}">PARTY</text>
    <text x="200" y="310" text-anchor="middle" font-size="44" fill="#ffd36e" style="${F}">GALAXY</text>
    <g class="ins-blink"><text x="200" y="400" text-anchor="middle" font-size="34" fill="#fff" style="${F}">PRESS START</text></g>
    <text x="200" y="470" text-anchor="middle" font-size="26" fill="#8ff0ff" style="${F}">PLAYERS: 5</text>
    <g>${Array.from({ length: 5 }, (_, i) => `<path class="ins-pop" style="animation-delay:${0.4 + i * 0.22}s" d="${starPath(118 + i * 41, 525, 15)}" fill="#ffd36e" stroke="#c99a2e" stroke-width="2"/>`).join('')}</g>`,
  token: `<defs><radialGradient id="ins-tk" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff4c7"/><stop offset="1" stop-color="#ffd36e" stop-opacity="0"/></radialGradient></defs>
    <rect width="400" height="800" fill="#2a1f50"/>
    <g class="ins-spin" style="transform-origin:200px 360px">${Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return `<path d="M200 360 L${(200 + Math.cos(a - 0.08) * 600).toFixed(0)} ${(360 + Math.sin(a - 0.08) * 600).toFixed(0)} L${(200 + Math.cos(a + 0.08) * 600).toFixed(0)} ${(360 + Math.sin(a + 0.08) * 600).toFixed(0)} Z" fill="#ffd36e" opacity=".18"/>`; }).join('')}</g>
    <circle cx="200" cy="360" r="200" fill="url(#ins-tk)"/>
    <path d="M60 800 C70 640 120 560 200 540 C280 520 340 560 350 620 L360 800 Z" fill="#c98e62" stroke="#2a1838" stroke-width="6"/>
    <path d="M120 600 C150 560 250 550 300 590" stroke="#a8714a" stroke-width="6" fill="none"/>
    <g class="ins-rise"><circle cx="200" cy="420" r="92" fill="#ffd36e" stroke="#c99a2e" stroke-width="12"/><circle cx="200" cy="420" r="62" fill="none" stroke="#fff4c7" stroke-width="8"/><path d="${starPath(200, 420, 46)}" fill="#fff4c7"/></g>
    <path class="ins-pop" style="animation-delay:.6s" d="M300 300 l8 22 22 8 -22 8 -8 22 -8 -22 -22 -8 22 -8z" fill="#fff"/>
    <path class="ins-pop" style="animation-delay:.9s" d="M96 360 l6 16 16 6 -16 6 -6 16 -6 -16 -16 -6 16 -6z" fill="#fff"/>`,
  // The START button with the Captain's finger hovering over it ("One... two...")...
  button: `<defs><radialGradient id="ins-btn" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffd1e8"/><stop offset="1" stop-color="#ff5fa2"/></radialGradient></defs>
    <rect width="400" height="800" fill="#2a1f50"/>
    <rect x="0" y="300" width="400" height="500" fill="#5a44d6"/><path d="M0 300 H400" stroke="#2a1838" stroke-width="8"/>
    <ellipse cx="200" cy="420" rx="150" ry="70" fill="#2a1838"/>
    <g><ellipse cx="200" cy="400" rx="140" ry="64" fill="url(#ins-btn)" stroke="#2a1838" stroke-width="8"/><text x="200" y="414" text-anchor="middle" font-size="40" fill="#fff" style="${F}">START</text></g>
    <g class="ins-hover"><path d="M150 800 L160 520 Q164 470 200 470 Q236 470 240 520 L250 800 Z" fill="#c98e62" stroke="#2a1838" stroke-width="7"/><path d="M178 500 Q200 488 222 500" stroke="#f0c9a6" stroke-width="7" fill="none"/></g>`,
  // ...and the press, on "THREE!": the button goes down and light bursts out.
  press: `<defs><radialGradient id="ins-btn2" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffd1e8"/><stop offset="1" stop-color="#ff5fa2"/></radialGradient><radialGradient id="ins-burst" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff8d8"/><stop offset="1" stop-color="#fff8d8" stop-opacity="0"/></radialGradient></defs>
    <rect width="400" height="800" fill="#2a1f50"/>
    <rect x="0" y="300" width="400" height="500" fill="#5a44d6"/><path d="M0 300 H400" stroke="#2a1838" stroke-width="8"/>
    <g class="ins-burst">${Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; return `<path d="M200 400 L${(200 + Math.cos(a - 0.09) * 520).toFixed(0)} ${(400 + Math.sin(a - 0.09) * 520).toFixed(0)} L${(200 + Math.cos(a + 0.09) * 520).toFixed(0)} ${(400 + Math.sin(a + 0.09) * 520).toFixed(0)} Z" fill="#fff4c7" opacity=".55"/>`; }).join('')}<circle cx="200" cy="400" r="190" fill="url(#ins-burst)"/></g>
    <ellipse cx="200" cy="420" rx="150" ry="70" fill="#2a1838"/>
    <g class="ins-down"><ellipse cx="200" cy="400" rx="140" ry="64" fill="url(#ins-btn2)" stroke="#2a1838" stroke-width="8"/><text x="200" y="414" text-anchor="middle" font-size="40" fill="#fff" style="${F}">START</text></g>
    <g class="ins-push"><path d="M150 800 L160 520 Q164 470 200 470 Q236 470 240 520 L250 800 Z" fill="#c98e62" stroke="#2a1838" stroke-width="7"/><path d="M178 500 Q200 488 222 500" stroke="#f0c9a6" stroke-width="7" fill="none"/></g>`,
  // The hands-in, seen from above: five arms reach in from around the game board and stack up.
  hands: `<defs><radialGradient id="ins-hb" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#5a44d6"/><stop offset="1" stop-color="#231a63"/></radialGradient><radialGradient id="ins-hg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff8d8" stop-opacity=".95"/><stop offset="1" stop-color="#ffd36e" stop-opacity="0"/></radialGradient></defs>
    <rect width="400" height="800" fill="#120e2b"/>
    <circle cx="200" cy="400" r="196" fill="url(#ins-hb)" stroke="#c9b6ff" stroke-width="6"/>
    ${Array.from({ length: 18 }, (_, i) => { const a = (i / 18) * Math.PI * 2; return `<circle cx="${(200 + Math.cos(a) * 172).toFixed(0)}" cy="${(400 + Math.sin(a) * 172).toFixed(0)}" r="12" fill="${['#ff9fcf', '#7fe6c9', '#ffd36e', '#8fc8ff', '#c9b6ff'][i % 5]}" stroke="#2a1838" stroke-width="3"/>`; }).join('')}
    ${HANDS.map(([deg, sleeve, skin], i) => `<g transform="translate(200 400) rotate(${deg})"><g class="ins-hand" style="animation-delay:${(0.2 + i * 0.42).toFixed(2)}s"><g transform="translate(0 ${i * -5})">${handArm(sleeve, skin)}</g></g></g>`).join('')}
    <circle class="ins-hglow" cx="200" cy="400" r="150" fill="url(#ins-hg)"/>`,
  // Ro's toffee arm springs back and ties itself into a bow.
  knot: `<defs><linearGradient id="ins-ks" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9a6ff"/><stop offset="1" stop-color="#ffd1e8"/></linearGradient></defs>
    <rect width="400" height="800" fill="url(#ins-ks)"/>
    <path d="M-20 520 H420 V800 H-20 Z" fill="#9ff0d0"/>
    <g class="ins-wiggle">
      <path d="M40 430 C120 430 150 300 230 330 C310 360 300 480 220 470 C140 460 170 380 250 400 C300 412 330 420 368 440" fill="none" stroke="#2a1838" stroke-width="40" stroke-linecap="round" pathLength="1" class="ins-draw"/>
      <path d="M40 430 C120 430 150 300 230 330 C310 360 300 480 220 470 C140 460 170 380 250 400 C300 412 330 420 368 440" fill="none" stroke="#c98e63" stroke-width="30" stroke-linecap="round" pathLength="1" class="ins-draw"/>
      <circle class="ins-handpop" cx="372" cy="442" r="22" fill="#c98e63" stroke="#2a1838" stroke-width="5"/>
    </g>
    <g class="ins-bow" style="transform-origin:236px 404px">
      <path d="M236 404 C200 360 160 372 168 404 C160 436 200 448 236 404 Z" fill="#c98e63" stroke="#2a1838" stroke-width="6" stroke-linejoin="round"/>
      <path d="M236 404 C272 360 312 372 304 404 C312 436 272 448 236 404 Z" fill="#c98e63" stroke="#2a1838" stroke-width="6" stroke-linejoin="round"/>
      <circle cx="236" cy="404" r="17" fill="#b9784c" stroke="#2a1838" stroke-width="6"/>
    </g>
    <path d="M-20 380 L60 380 L64 470 L-20 474 Z" fill="#ff8f7e" stroke="#2a1838" stroke-width="6"/><path d="M52 384 L60 470" stroke="#e06a5a" stroke-width="8"/>`,
  rulecard: `<rect width="400" height="800" fill="#1d1745"/>
    <g class="ins-rise"><rect x="40" y="150" width="320" height="470" rx="26" fill="#fff" stroke="#7B61FF" stroke-width="10"/>
    <text x="200" y="222" text-anchor="middle" font-size="34" fill="#7B61FF" style="${F}">FIZZ'S RULES</text>
    <text x="70" y="300" font-size="25" fill="#2a1838" style="${F}">1. Every world</text><text x="98" y="332" font-size="25" fill="#2a1838" style="${F}">gives new powers.</text>
    <text x="70" y="400" font-size="25" fill="#2a1838" style="${F}">2. Play silly games.</text><text x="98" y="432" font-size="25" fill="#2a1838" style="${F}">Win Stars.</text>
    <text x="70" y="500" font-size="25" fill="#2a1838" style="${F}">3. Big Prize = the</text><text x="98" y="532" font-size="25" fill="#2a1838" style="${F}">whole crew moves on!</text></g>`,
  map: `<rect width="400" height="800" fill="#3b2f86"/>
    <g class="ins-rise"><path d="M30 190 L140 150 L260 190 L370 150 L370 610 L260 650 L140 610 L30 650 Z" fill="#ffd1e8" stroke="#ff7ab8" stroke-width="8"/>
    <path d="M140 150 V610 M260 190 V650" stroke="#ff7ab8" stroke-width="4"/>
    <path d="M70 560 Q120 500 180 520 T300 420 T330 260" stroke="#8a5a3a" stroke-width="5" fill="none" stroke-dasharray="10 10"/>
    <circle cx="80" cy="555" r="16" fill="#7fe6c9" stroke="#2a1838" stroke-width="3"/><text x="80" y="595" text-anchor="middle" font-size="18" fill="#2a1838" style="${F}">Jelly</text>
    <path d="M150 470 q30 -20 60 0 t60 0" stroke="#7a4a2c" stroke-width="16" fill="none" stroke-linecap="round"/><text x="210" y="510" text-anchor="middle" font-size="18" fill="#2a1838" style="${F}">River</text>
    <path d="M270 330 L320 230 L370 330 Z" fill="#fff" stroke="#2a1838" stroke-width="4"/><circle cx="320" cy="215" r="18" fill="#ff9fcf" stroke="#2a1838" stroke-width="3"/><text x="300" y="360" text-anchor="middle" font-size="18" fill="#2a1838" style="${F}">Sugar Mountain</text></g>`,
  stars3: `<rect width="400" height="800" fill="#2a1f50"/>
    ${[110, 200, 290].map((x, i) => `<g class="ins-pop" style="animation-delay:${0.2 + i * 0.3}s"><path d="${starPath(x, 400, 46)}" fill="#ffd36e" stroke="#c99a2e" stroke-width="5"/></g>`).join('')}
    <text x="200" y="520" text-anchor="middle" font-size="34" fill="#fff" style="${F}">3 STARS</text>`,
};

export const INSERT_IDS = Object.keys(INSERTS);

/** `skin` and `outfit` paint the Captain's own hand and sleeve in close-ups (token, START button, hands-in). */
export function Insert({ id, skin, outfit }: { id: string; skin?: string; outfit?: string }) {
  let body = INSERTS[id];
  if (!body) return null;
  if (skin) body = body.replaceAll('#c98e62', skin);
  if (outfit) body = body.replaceAll('#ffd36f', outfit);
  return <Svg className={`insert ins-${id}`} html={`<svg viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${body}</svg>`} />;
}
