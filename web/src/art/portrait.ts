// Head-and-shoulders portraits for menus, crew cards and manga reaction panels, plus Fizz the host.
import { CREW, captainLook, shade, type CrewId, type FullLook, type Look } from './looks';
import { headBase, features, headExtras, hairBack, hairFront, mouth, type Expr } from './face';

function bust(look: FullLook): string {
  const o = look.outfit, od = shade(o, -30);
  const neck = `<path d="M87 150 L87 186 L113 186 L113 150 Z" fill="${shade(look.skin, -22)}"/>`;
  let torso = `<path d="M22 242 C24 204 58 182 100 182 C142 182 176 204 178 242 Z" fill="${o}"/>`;
  switch (look.extra) {
    case 'hoodie': torso += `<path d="M58 190 Q100 222 142 190 Q132 178 100 178 Q68 178 58 190 Z" fill="${od}"/><path d="M90 206 L88 236 M110 206 L112 236" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`; break;
    case 'sweater': torso += `<path d="M76 184 Q100 200 124 184" stroke="${od}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M40 222 L160 222" stroke="${od}" stroke-width="4" stroke-dasharray="6 6"/>`; break;
    case 'scarf': torso += `<path d="M70 182 Q100 204 130 182 L132 196 Q100 216 68 196 Z" fill="#ffd36e"/><path d="M114 200 L124 238 L108 238 Z" fill="#ffd36e"/>`; break;
    default: torso += `<path d="M80 184 Q100 198 120 184" stroke="${od}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  }
  if (look.captain) torso += `<path d="M138 206 L141 213 L149 214 L143 219 L145 227 L138 223 L131 227 L133 219 L127 214 L135 213 Z" fill="#ffd36e" stroke="#c99a2e" stroke-width="1.5"/>`;
  return neck + torso;
}

/** Head-and-shoulders portrait in a 200x240 box. */
export function portraitSVG(look: FullLook, expr: Expr = 'happy', viewBox = '0 0 200 240'): string {
  return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">`
    + `${bust(look)}${hairBack(look.hair, look.hairColor)}${headBase(look)}${features(look, expr)}${mouth(expr)}`
    + `${hairFront(look.hair, look.hairColor)}${headExtras(look)}</svg>`;
}

/** A round face crop (lists, chips, chapter cards). */
export function faceSVG(look: FullLook, expr: Expr = 'happy'): string {
  return portraitSVG(look, expr, '30 22 140 150');
}

export function crewLook(id: CrewId): FullLook { return CREW[id]; }
export function heroFull(look: Look, cape = false): FullLook { return captainLook(look, { cape }); }

/* ---------- Fizz, the disco-ball host ---------- */
export const FIZZ_EXPRS = ['happy', 'excited', 'shock', 'sad', 'smug', 'sing', 'wink'] as const;
export type FizzExpr = (typeof FIZZ_EXPRS)[number];
const GLOW = '#8ff0ff';

export function fizzEyes(expr: FizzExpr, blink = false): string {
  const eye = (cx: number) => {
    if (blink && (expr === 'smug' || expr === 'shock')) return `<path d="M${cx - 8} 113 L${cx + 8} 113" stroke="${GLOW}" stroke-width="5" stroke-linecap="round"/>`;
    switch (expr) {
      case 'happy': case 'sing': return `<path d="M${cx - 9} 116 Q${cx} 104 ${cx + 9} 116" stroke="${GLOW}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
      case 'excited': return `<path d="M${cx} 102 L${cx + 4} 110 L${cx + 12} 111 L${cx + 6} 116 L${cx + 8} 124 L${cx} 120 L${cx - 8} 124 L${cx - 6} 116 L${cx - 12} 111 L${cx - 4} 110 Z" fill="${GLOW}"/>`;
      case 'shock': return `<circle cx="${cx}" cy="113" r="9" fill="none" stroke="${GLOW}" stroke-width="4"/>`;
      case 'sad': return `<path d="M${cx - 8} 110 L${cx + 8} 114" stroke="${GLOW}" stroke-width="5" stroke-linecap="round"/>`;
      case 'smug': return `<path d="M${cx - 9} 114 L${cx + 9} 114" stroke="${GLOW}" stroke-width="5" stroke-linecap="round"/>`;
      case 'wink': return cx > 100 ? `<path d="M${cx - 9} 116 Q${cx} 104 ${cx + 9} 116" stroke="${GLOW}" stroke-width="5" fill="none" stroke-linecap="round"/>` : `<ellipse cx="${cx}" cy="113" rx="6" ry="8" fill="${GLOW}"/>`;
      default: return `<ellipse cx="${cx}" cy="113" rx="6" ry="8" fill="${GLOW}"/>`;
    }
  };
  return eye(84) + eye(116);
}

export function fizzMouth(expr: FizzExpr, level: 0 | 1 | 2 = 0): string {
  if (level > 0) {
    const ry = level === 1 ? 5 : 8;
    return `<ellipse cx="100" cy="${130 + ry / 3}" rx="${level === 1 ? 8 : 10}" ry="${ry}" fill="${GLOW}"/>`;
  }
  switch (expr) {
    case 'happy': case 'wink': return `<path d="M88 128 Q100 138 112 128" stroke="${GLOW}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    case 'excited': return `<path d="M86 126 Q100 142 114 126 Z" fill="${GLOW}"/>`;
    case 'shock': return `<ellipse cx="100" cy="131" rx="6" ry="7" fill="none" stroke="${GLOW}" stroke-width="4"/>`;
    case 'sad': return `<path d="M90 133 Q100 125 110 133" stroke="${GLOW}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    case 'smug': return `<path d="M90 130 Q104 134 112 124" stroke="${GLOW}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    case 'sing': return `<ellipse cx="100" cy="130" rx="7" ry="6" fill="${GLOW}"/>`;
    default: return `<path d="M90 129 Q100 135 110 129" stroke="${GLOW}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  }
}

/** Fizz's body (ball, facets, screen) in portrait space. `id` keeps gradient ids unique per copy. */
export function fizzBody(id: string, faceHTML: string): string {
  let facets = '';
  for (let y = 58; y <= 168; y += 14) facets += `<path d="M38 ${y} Q100 ${y + (y < 110 ? -6 : 6)} 162 ${y}" stroke="#ffffff" stroke-opacity=".35" stroke-width="1.5" fill="none"/>`;
  for (let x = 46; x <= 154; x += 14) facets += `<path d="M${x} 50 Q${x + (x < 100 ? -8 : 8)} 110 ${x} 172" stroke="#ffffff" stroke-opacity=".3" stroke-width="1.5" fill="none"/>`;
  return `<defs><radialGradient id="${id}-ball" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#d9d3ff"/><stop offset=".75" stop-color="#8f84d8"/><stop offset="1" stop-color="#4b3f9a"/></radialGradient>`
    + `<clipPath id="${id}-clip"><circle cx="100" cy="111" r="62"/></clipPath></defs>`
    + `<path d="M100 49 L100 30" stroke="#c9c3f2" stroke-width="5"/><circle cx="100" cy="26" r="8" fill="#ff9fcf"/>`
    + `<circle cx="100" cy="111" r="62" fill="url(#${id}-ball)"/>`
    + `<g clip-path="url(#${id}-clip)"><g data-f="facets">${facets}</g>`
    + `<rect x="52" y="64" width="12" height="12" fill="#fff" opacity=".7"/><rect x="132" y="146" width="12" height="12" fill="#ff9fcf" opacity=".6"/><rect x="146" y="80" width="10" height="10" fill="#8ff0ff" opacity=".6"/><rect x="66" y="150" width="10" height="10" fill="#ffd36e" opacity=".6"/></g>`
    + `<rect x="58" y="94" width="84" height="50" rx="22" fill="#151036" stroke="#c9c3f2" stroke-width="3"/>`
    + faceHTML;
}

export const FIZZ_MIC = `<g transform="translate(150 150) rotate(25)"><rect x="0" y="0" width="12" height="36" rx="6" fill="#3b2f86"/><circle cx="6" cy="0" r="11" fill="#c9c3f2"/><path d="M-3 -3 L15 -3 M-3 3 L15 3" stroke="#8f84d8" stroke-width="2"/></g>`;

/** Fizz as a standalone SVG for menus. `uid` must be unique on the page. */
export function fizzSVG(expr: FizzExpr = 'happy', uid = 'fz'): string {
  const note = expr === 'sing' ? `<g fill="#ffd36e"><path d="M168 46 L168 74 A7 6 0 1 1 162 68 L162 40 L184 34 L184 62 A7 6 0 1 1 178 56 L178 42 Z"/></g>` : '';
  return `<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">`
    + `<ellipse cx="100" cy="222" rx="46" ry="8" fill="#8ff0ff" opacity=".25"/>`
    + fizzBody(uid, fizzEyes(expr) + fizzMouth(expr)) + FIZZ_MIC + note + '</svg>';
}

export function fizzFaceSVG(expr: FizzExpr = 'happy', uid = 'fzf'): string {
  return fizzSVG(expr, uid).replace('viewBox="0 0 200 240"', 'viewBox="30 22 140 150"');
}
