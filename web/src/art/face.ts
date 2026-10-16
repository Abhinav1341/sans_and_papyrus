// Anime-style heads drawn as SVG strings in "portrait space" (a 200x240 box, face centred at 100,108).
// Used by both the UI portraits and the full-body cinema rig, so every character looks the same everywhere.
import { shade, type FullLook, type HairStyle } from './looks';

export const EXPRS = [
  'normal', 'happy', 'grin', 'laugh', 'shock', 'scared', 'sad', 'cry', 'grumpy', 'smug', 'determined',
  'sleepy', 'wink', 'love', 'dizzy', 'yell', 'tongue', 'worried', 'closed', 'munch',
] as const;
export type Expr = (typeof EXPRS)[number];

export const LINE = '#1a1022';

/* ---------- hair ---------- */
const CAP_BACK = 'M42 112 C38 52 70 32 100 32 C130 32 162 52 158 112 Z';

export function hairBack(style: HairStyle, c: string): string {
  const d = shade(c, -18);
  switch (style) {
    case 'bob': return `<path d="M36 154 C26 56 66 28 100 28 C134 28 174 56 164 154 Q100 172 36 154 Z" fill="${d}"/>`;
    case 'long': return `<path d="M34 214 C24 56 66 28 100 28 C134 28 176 56 166 214 Q100 232 34 214 Z" fill="${d}"/>`;
    case 'ponytail': return `<path d="${CAP_BACK}" fill="${d}"/><path d="M146 58 C190 50 204 112 182 168 C180 128 168 100 148 94 Z" fill="${c}"/><circle cx="150" cy="62" r="10" fill="#ff6fae"/>`;
    case 'braid': {
      let s = `<path d="${CAP_BACK}" fill="${d}"/>`;
      [[146, 140], [150, 162], [148, 184], [144, 205]].forEach(([x, y]) => { s += `<ellipse cx="${x}" cy="${y}" rx="11" ry="13" fill="${c}" stroke="${d}" stroke-width="2"/>`; });
      return s + '<circle cx="143" cy="222" r="6" fill="#ff9fcf"/>';
    }
    case 'curly': {
      let s = `<path d="${CAP_BACK}" fill="${d}"/>`;
      [[42, 108, 20], [158, 108, 20], [46, 138, 17], [154, 138, 17], [52, 164, 13], [148, 164, 13]].forEach(([x, y, r]) => { s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${d}"/>`; });
      return s;
    }
    case 'bun': return `<circle cx="100" cy="28" r="22" fill="${c}"/><path d="M84 30 Q100 22 116 30" stroke="${d}" stroke-width="3" fill="none"/><path d="${CAP_BACK}" fill="${d}"/>`;
    default: return `<path d="${CAP_BACK}" fill="${d}"/>`;
  }
}

export function hairFront(style: HairStyle, c: string): string {
  const hl = `<path d="M66 56 Q84 44 106 44" stroke="#fff" stroke-opacity=".28" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  let p: string;
  switch (style) {
    case 'spiky': p = 'M44 104 C40 70 46 52 56 46 L50 24 L72 36 L76 14 L94 30 L104 10 L114 30 L134 16 L132 38 L154 30 L146 52 C156 62 158 82 156 104 C150 86 138 74 122 70 L112 84 L102 70 L88 84 L80 72 C64 76 50 88 44 104 Z'; break;
    case 'bob': case 'long': p = 'M44 126 C38 60 66 34 100 34 C134 34 162 60 156 126 C150 100 144 86 132 78 C118 86 100 88 80 82 C64 88 52 102 44 126 Z'; break;
    case 'ponytail': p = 'M46 104 C40 56 70 34 102 34 C134 34 160 56 154 100 C142 78 118 66 92 68 C72 70 56 84 46 104 Z'; break;
    case 'braid': p = 'M46 110 C40 56 70 34 100 34 C130 34 160 56 154 110 C150 84 132 66 104 64 L100 76 L96 64 C68 66 50 84 46 110 Z'; break;
    case 'curly': {
      let s = '';
      [[58, 86, 16], [68, 64, 18], [88, 50, 19], [112, 50, 19], [132, 64, 18], [142, 86, 16], [100, 44, 16]].forEach(([x, y, r]) => { s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`; });
      return s + hl;
    }
    case 'messy': p = 'M46 102 C42 60 64 40 94 38 L102 26 L110 40 C138 42 158 62 154 102 C148 86 136 76 122 72 L118 86 L104 74 L92 88 L84 74 C66 78 52 88 46 102 Z'; break;
    case 'bun': p = 'M46 102 C42 56 70 36 100 36 C130 36 158 56 154 102 C146 80 128 70 108 70 L100 78 L94 70 C72 70 54 80 46 102 Z'; break;
    default: p = 'M46 100 C44 56 70 36 100 36 C130 36 156 56 154 100 C150 84 140 74 126 70 C116 78 100 80 84 76 C70 74 54 84 46 100 Z';
  }
  return `<path d="${p}" fill="${c}"/>` + hl;
}

/* ---------- eyes ---------- */
function openEye(cx: number, iris: string, { irisR = 1, lookY = 0 } = {}) {
  return `<ellipse cx="${cx}" cy="113" rx="11.5" ry="13.5" fill="#fff"/>`
    + `<ellipse cx="${cx}" cy="${115 + lookY}" rx="${8.5 * irisR}" ry="${11 * irisR}" fill="${iris}"/>`
    + `<ellipse cx="${cx}" cy="${116 + lookY}" rx="${4.2 * irisR}" ry="${5.8 * irisR}" fill="#120a18"/>`
    + `<circle cx="${cx + 3.5}" cy="${109 + lookY}" r="${3.4 * irisR}" fill="#fff"/>`
    + `<circle cx="${cx - 3}" cy="${120 + lookY}" r="${1.6 * irisR}" fill="#fff" opacity=".85"/>`
    + `<path d="M${cx - 13} 106 Q${cx} 96 ${cx + 13} 106" stroke="${LINE}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
}
const arcEye = (cx: number) => `<path d="M${cx - 10} 117 Q${cx} 104 ${cx + 10} 117" stroke="${LINE}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
const lineEye = (cx: number) => `<path d="M${cx - 10} 115 Q${cx} 120 ${cx + 10} 115" stroke="${LINE}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
const flatEye = (cx: number) => `<path d="M${cx - 11} 114 L${cx + 11} 114" stroke="${LINE}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
const starEye = (cx: number) => `<path d="M${cx} 101 L${cx + 4} 110 L${cx + 13} 111 L${cx + 6} 117 L${cx + 8} 126 L${cx} 121 L${cx - 8} 126 L${cx - 6} 117 L${cx - 13} 111 L${cx - 4} 110 Z" fill="#ffd36e" stroke="#c99a2e" stroke-width="2"/>`;
const spiralEye = (cx: number) => `<path d="M${cx} 113 m-2 0 a2 2 0 1 1 4 0 a4 4 0 1 1 -8 0 a6 6 0 1 1 12 0 a8 8 0 1 1 -16 0" stroke="${LINE}" stroke-width="2.5" fill="none"/>`;
// Squeezed shut, the classic anime yell: > <
const squeezeEye = (cx: number, left: boolean) => left
  ? `<path d="M${cx - 10} 106 L${cx + 8} 114 L${cx - 10} 122" stroke="${LINE}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
  : `<path d="M${cx + 10} 106 L${cx - 8} 114 L${cx + 10} 122" stroke="${LINE}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

/** Expressions whose eyes are open, so the character can blink. */
export const BLINKS = new Set<Expr>(['normal', 'sad', 'cry', 'smug', 'grumpy', 'determined', 'worried', 'tongue', 'shock', 'scared']);

export function eyes(expr: Expr, iris: string, skin: string, blink = false): string {
  const L = 80, R = 120;
  if (blink && BLINKS.has(expr)) return flatEye(L) + flatEye(R);
  switch (expr) {
    case 'happy': case 'laugh': case 'grin': case 'munch': return arcEye(L) + arcEye(R);
    case 'wink': return openEye(L, iris) + arcEye(R);
    case 'sleepy': case 'closed': return lineEye(L) + lineEye(R);
    case 'love': return starEye(L) + starEye(R);
    case 'dizzy': return spiralEye(L) + spiralEye(R);
    case 'yell': return squeezeEye(L, true) + squeezeEye(R, false);
    case 'shock': case 'scared': return [L, R].map((cx) => `<ellipse cx="${cx}" cy="112" rx="12.5" ry="15" fill="#fff" stroke="${LINE}" stroke-width="3"/><circle cx="${cx}" cy="113" r="4.5" fill="${iris}"/><circle cx="${cx}" cy="113" r="2.2" fill="#120a18"/>`).join('');
    case 'sad': case 'cry': return openEye(L, iris, { lookY: 2 }) + openEye(R, iris, { lookY: 2 });
    case 'worried': return openEye(L, iris, { irisR: 0.8, lookY: 1 }) + openEye(R, iris, { irisR: 0.8, lookY: 1 });
    case 'tongue': return openEye(L, iris, { lookY: 3 }) + openEye(R, iris, { lookY: 3 });
    case 'smug': return [L, R].map((cx) => openEye(cx, iris) + `<path d="M${cx - 14} 99 L${cx + 14} 99 L${cx + 14} 112 Q${cx} 108 ${cx - 14} 112 Z" fill="${skin}"/><path d="M${cx - 13} 112 Q${cx} 107 ${cx + 13} 112" stroke="${LINE}" stroke-width="4" fill="none" stroke-linecap="round"/>`).join('');
    case 'grumpy': case 'determined': return [L, R].map((cx) => openEye(cx, iris) + `<path d="M${cx - 14} 98 L${cx + 14} 98 L${cx + 14} 106 L${cx - 14} 108 Z" fill="${skin}"/>`).join('');
    default: return openEye(L, iris) + openEye(R, iris);
  }
}

export function brows(expr: Expr, c: string): string {
  const L = 80, R = 120;
  const pair = (l: string, r: string) => `<path d="${l}" stroke="${c}" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="${r}" stroke="${c}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  switch (expr) {
    case 'grumpy': case 'determined': case 'yell': return pair(`M${L - 12} 92 L${L + 10} 99`, `M${R + 12} 92 L${R - 10} 99`);
    case 'sad': case 'cry': case 'scared': case 'worried': return pair(`M${L - 11} 97 L${L + 10} 91`, `M${R + 11} 97 L${R - 10} 91`);
    case 'shock': return pair(`M${L - 11} 88 Q${L} 82 ${L + 11} 88`, `M${R - 11} 88 Q${R} 82 ${R + 11} 88`);
    case 'smug': return pair(`M${L - 11} 95 Q${L} 92 ${L + 11} 95`, `M${R - 11} 90 Q${R} 84 ${R + 11} 90`);
    case 'happy': case 'laugh': case 'grin': case 'love': case 'munch': case 'closed': return pair(`M${L - 11} 93 Q${L} 87 ${L + 11} 93`, `M${R - 11} 93 Q${R} 87 ${R + 11} 93`);
    default: return pair(`M${L - 11} 95 Q${L} 90 ${L + 11} 95`, `M${R - 11} 95 Q${R} 90 ${R + 11} 95`);
  }
}

const stroke = (d: string, w = 4) => `<path d="${d}" stroke="${LINE}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const TONGUE = '#ff7a8a';
const MOUTH_IN = '#7a2333';

export function mouth(expr: Expr): string {
  switch (expr) {
    case 'happy': case 'love': return stroke('M88 138 Q100 150 112 138');
    case 'grin': return `<path d="M86 136 Q100 156 114 136 Z" fill="${MOUTH_IN}" stroke="${LINE}" stroke-width="3" stroke-linejoin="round"/><path d="M89 138 L111 138" stroke="#fff" stroke-width="4"/>`;
    case 'laugh': return `<path d="M83 134 Q100 164 117 134 Z" fill="${MOUTH_IN}" stroke="${LINE}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="100" cy="151" rx="8" ry="4" fill="${TONGUE}"/>`;
    case 'yell': return `<path d="M84 134 L116 134 Q114 162 100 162 Q86 162 84 134 Z" fill="${MOUTH_IN}" stroke="${LINE}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="100" cy="155" rx="9" ry="5" fill="${TONGUE}"/>`;
    case 'shock': case 'scared': return `<ellipse cx="100" cy="144" rx="7" ry="9" fill="${MOUTH_IN}" stroke="${LINE}" stroke-width="3"/>`;
    case 'sad': return stroke('M90 146 Q100 137 110 146');
    case 'cry': return `<path d="M88 148 Q94 138 100 142 Q106 138 112 148" fill="${MOUTH_IN}" stroke="${LINE}" stroke-width="3" stroke-linejoin="round"/>`;
    case 'grumpy': return stroke('M90 144 Q100 139 110 144');
    case 'smug': return stroke('M90 142 Q104 146 112 135');
    case 'determined': return stroke('M90 141 Q100 145 110 140');
    case 'sleepy': return `<ellipse cx="100" cy="143" rx="4" ry="5" fill="${MOUTH_IN}"/>`;
    case 'dizzy': return stroke('M88 142 q4 -5 8 0 q4 5 8 0 q4 -5 8 0', 3.5);
    case 'worried': return stroke('M89 144 q5 -4 11 0 q5 4 11 0', 3.5);
    case 'wink': return stroke('M89 138 Q102 150 113 136');
    case 'tongue': return `<path d="M88 137 Q100 149 112 137 Z" fill="${MOUTH_IN}" stroke="${LINE}" stroke-width="3" stroke-linejoin="round"/><path d="M95 141 Q100 156 105 141 Z" fill="${TONGUE}" stroke="${LINE}" stroke-width="2"/>`;
    case 'closed': return stroke('M92 140 Q100 145 108 140');
    case 'munch': return `<ellipse cx="88" cy="139" rx="9" ry="7" fill="#000" opacity=".06"/><ellipse cx="112" cy="139" rx="9" ry="7" fill="#000" opacity=".06"/>` + stroke('M92 141 q4 4 8 0 q4 4 8 0', 3.5);
    default: return stroke('M91 139 Q100 146 109 139');
  }
}

const SMILEY = new Set<Expr>(['happy', 'grin', 'laugh', 'love', 'wink', 'smug', 'munch', 'closed', 'tongue']);
const OPEN_ALREADY = new Set<Expr>(['shock', 'scared', 'yell', 'laugh']);

/** Mouth shapes for lip-sync: level 0 is the expression's own mouth, 1 half open, 2 open. */
export function talkMouth(expr: Expr, level: 0 | 1 | 2): string {
  if (level === 0) return mouth(expr);
  if (OPEN_ALREADY.has(expr)) {
    const ry = level === 1 ? 6 : 10;
    return `<ellipse cx="100" cy="${142 + ry / 3}" rx="${level === 1 ? 7 : 9}" ry="${ry}" fill="${MOUTH_IN}" stroke="${LINE}" stroke-width="3"/><ellipse cx="100" cy="${146 + ry / 2}" rx="5" ry="2.5" fill="${TONGUE}"/>`;
  }
  if (SMILEY.has(expr)) {
    const depth = level === 1 ? 148 : 156;
    return `<path d="M87 137 Q100 ${depth} 113 137 Z" fill="${MOUTH_IN}" stroke="${LINE}" stroke-width="3" stroke-linejoin="round"/>${level === 2 ? `<ellipse cx="100" cy="150" rx="6" ry="3" fill="${TONGUE}"/>` : ''}`;
  }
  const ry = level === 1 ? 4.5 : 8;
  return `<ellipse cx="100" cy="${142 + (level === 2 ? 1 : 0)}" rx="${level === 1 ? 6.5 : 8}" ry="${ry}" fill="${MOUTH_IN}" stroke="${LINE}" stroke-width="3"/>`;
}

/* ---------- head ---------- */
export function headBase(look: Pick<FullLook, 'skin'>): string {
  const sk = look.skin, skd = shade(sk, -20);
  return `<ellipse cx="48" cy="114" rx="8" ry="11" fill="${skd}"/><ellipse cx="152" cy="114" rx="8" ry="11" fill="${skd}"/>`
    + `<path d="M48 108 C48 66 72 48 100 48 C128 48 152 66 152 108 C152 140 130 164 100 166 C70 164 48 140 48 108 Z" fill="${sk}"/>`
    // soft cel shadow under the fringe
    + `<path d="M52 104 C60 92 74 86 100 86 C126 86 140 92 148 104 C146 96 138 82 100 80 C62 82 54 96 52 104 Z" fill="${skd}" opacity=".35"/>`;
}

/** Blush, nose, eyes, brows (everything that shifts when the head turns). Mouth is separate for lip-sync. */
export function features(look: Pick<FullLook, 'skin' | 'eyes' | 'hairColor'>, expr: Expr, blink = false): string {
  const skd = shade(look.skin, -20);
  const blushOp = ['happy', 'laugh', 'grin', 'love', 'wink', 'munch', 'closed'].includes(expr) ? 0.55 : 0.28;
  const tears = expr === 'cry'
    ? `<path d="M74 126 Q70 142 74 156" stroke="#8fc8ff" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M126 126 Q130 142 126 156" stroke="#8fc8ff" stroke-width="5" fill="none" stroke-linecap="round"/>`
    : '';
  return `<ellipse cx="70" cy="132" rx="9" ry="5" fill="#ff7a9a" opacity="${blushOp}"/><ellipse cx="130" cy="132" rx="9" ry="5" fill="#ff7a9a" opacity="${blushOp}"/>`
    + `<path d="M99 124 q3 3 -1 5" stroke="${skd}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
    + eyes(expr, look.eyes, look.skin, blink) + brows(expr, look.hairColor) + tears;
}

export function headExtras(look: FullLook): string {
  let s = '';
  switch (look.extra) {
    case 'glasses': s += `<g fill="none" stroke="#2b1a12" stroke-width="3.5"><rect x="64" y="99" width="32" height="28" rx="10"/><rect x="104" y="99" width="32" height="28" rx="10"/><path d="M96 111 L104 111"/></g><path d="M68 104 L76 101" stroke="#fff" stroke-width="3" opacity=".6"/>`; break;
    case 'cap': s += `<path d="M50 84 C50 36 150 36 150 84 Z" fill="#4a7bd8"/><path d="M50 84 Q100 72 172 86 Q170 98 150 94 Q100 84 48 92 Z" fill="#355fb3"/><path d="M100 50 L104 59 L113 60 L106 66 L108 75 L100 70 L92 75 L94 66 L87 60 L96 59 Z" fill="#ffd36e"/>`; break;
    case 'starclip': s += `<path d="M138 62 L141 70 L149 71 L143 76 L145 84 L138 80 L131 84 L133 76 L127 71 L135 70 Z" fill="#ffd36e" stroke="#c99a2e" stroke-width="1.5"/>`; break;
    default: break;
  }
  if (look.hearingAid) s += `<path d="M150 104 q10 2 8 16 q-2 8 -8 8" fill="none" stroke="#e9e4ff" stroke-width="5" stroke-linecap="round"/><circle cx="151" cy="127" r="3.5" fill="#8fc8ff"/>`;
  return s;
}
