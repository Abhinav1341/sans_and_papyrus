// Drawing kit for the story sets (anime background style: soft gradients, layered silhouettes,
// cel-shaded props with dark outlines, light rays, hazy far layers). Deterministic: the same set
// always draws the same way.
export const INK = '#2a1838';
export const FONT = 'font-family:var(--font-baloo),\'Baloo 2\',sans-serif;font-weight:800';

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const n1 = (v: number) => Math.round(v * 10) / 10;

export function lin(id: string, stops: [number, string, number?][], x2 = 0, y2 = 1) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op !== undefined ? ` stop-opacity="${op}"` : ''}/>`).join('')}</linearGradient>`;
}
export function rad(id: string, stops: [number, string, number?][], cx = 0.5, cy = 0.5, r = 0.5) {
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op !== undefined ? ` stop-opacity="${op}"` : ''}/>`).join('')}</radialGradient>`;
}

export function stars(n: number, seed: number, x0: number, x1: number, y0: number, y1: number, color = '#fff') {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = n1(x0 + r() * (x1 - x0)), y = n1(y0 + r() * (y1 - y0)), rr = n1(r() * 2.2 + 0.8);
    s += `<circle${i % 3 === 0 ? ' class="tw"' : ''} style="animation-delay:${n1(r() * 4)}s" cx="${x}" cy="${y}" r="${rr}" fill="${color}" opacity="${n1(0.5 + r() * 0.5)}"/>`;
  }
  return s;
}

export function sparkleStar(x: number, y: number, r: number, color = '#fff', cls = '') {
  return `<path${cls ? ` class="${cls}"` : ''} d="M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r} Z" fill="${color}"/>`;
}

export function star5(cx: number, cy: number, r: number, fill: string, stroke = '#c99a2e', sw = 3) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    d += `${i ? 'L' : 'M'}${n1(cx + Math.cos(a) * rr)} ${n1(cy + Math.sin(a) * rr)} `;
  }
  return `<path d="${d}Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
}

/** A puffy cloud. CSS animations would override a transform attribute, so motion goes on an inner group. */
export function cloud(x: number, y: number, s: number, c: string, cls = 'drift') {
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="${cls}"><circle cx="0" cy="0" r="30" fill="${c}"/><circle cx="34" cy="-14" r="40" fill="${c}"/><circle cx="74" cy="-4" r="32" fill="${c}"/><circle cx="104" cy="6" r="22" fill="${c}"/><rect x="0" y="0" width="104" height="28" fill="${c}"/></g></g>`;
}

export function planet(x: number, y: number, r: number, a: string, b: string, ring: boolean, id: string) {
  return `<defs>${rad(id, [[0, a], [1, b]], 0.35, 0.3, 0.8)}</defs>`
    + (ring ? `<ellipse cx="${x}" cy="${y}" rx="${n1(r * 1.8)}" ry="${n1(r * 0.42)}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="${n1(r * 0.1)}"/>` : '')
    + `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id})"/>`
    + `<path d="M${n1(x - r * 0.62)} ${n1(y + r * 0.55)} A${r} ${r} 0 0 0 ${n1(x + r * 0.85)} ${n1(y + r * 0.3)} A${n1(r * 1.15)} ${n1(r * 1.15)} 0 0 1 ${n1(x - r * 0.62)} ${n1(y + r * 0.55)} Z" fill="#000" opacity=".12"/>`
    + (ring ? `<path d="M${n1(x - r * 1.8)} ${y} A${n1(r * 1.8)} ${n1(r * 0.42)} 0 0 0 ${n1(x + r * 1.8)} ${y}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="${n1(r * 0.1)}"/>` : '');
}

export function lollipop(x: number, y: number, r: number, stem: number, a: string, b: string, cls = '') {
  let swirl = '';
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * Math.PI * 2, a1 = ((i + 0.5) / 8) * Math.PI * 2;
    swirl += `<path d="M0 0 L${n1(Math.cos(a0) * r)} ${n1(Math.sin(a0) * r)} A${r} ${r} 0 0 1 ${n1(Math.cos(a1) * r)} ${n1(Math.sin(a1) * r)} Z" fill="${b}"/>`;
  }
  const inner = `<rect x="${n1(-r * 0.09)}" y="0" width="${n1(r * 0.18)}" height="${stem}" rx="${n1(r * 0.09)}" fill="#fff8ee" stroke="#d8cfc0" stroke-width="2"/>`
    + `<g transform="translate(0 ${-r * 0.2})"><circle r="${r}" fill="${a}" stroke="${INK}" stroke-width="${n1(Math.max(2, r * 0.05))}"/>${swirl}<circle r="${n1(r * 0.22)}" fill="${a}"/><ellipse cx="${n1(-r * 0.4)}" cy="${n1(-r * 0.45)}" rx="${n1(r * 0.28)}" ry="${n1(r * 0.14)}" fill="#fff" opacity=".55" transform="rotate(-35 ${n1(-r * 0.4)} ${n1(-r * 0.45)})"/></g>`;
  return `<g transform="translate(${x} ${y - stem})"><g${cls ? ` class="${cls}"` : ''}>${inner}</g></g>`;
}

export function gumdrop(x: number, y: number, r: number, c: string, hi = '#fff') {
  return `<path d="M${x - r} ${y} Q${x - r} ${y - r * 1.25} ${x} ${y - r * 1.3} Q${x + r} ${y - r * 1.25} ${x + r} ${y} Z" fill="${c}" stroke="${INK}" stroke-width="3"/>`
    + `<ellipse cx="${n1(x - r * 0.35)}" cy="${n1(y - r * 0.85)}" rx="${n1(r * 0.22)}" ry="${n1(r * 0.12)}" fill="${hi}" opacity=".6"/>`
    + sprinkleDots(x, y - r * 0.55, r * 0.75, r * 0.45, Math.floor(r / 6), Math.floor(x + y));
}

function sprinkleDots(cx: number, cy: number, rx: number, ry: number, n: number, seed: number) {
  const r = rng(seed);
  const cols = ['#fff', '#ffd36e', '#7fe6c9', '#8fc8ff'];
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r());
    s += `<circle cx="${n1(cx + Math.cos(a) * rx * d)}" cy="${n1(cy + Math.sin(a) * ry * d)}" r="2.2" fill="${cols[i % 4]}" opacity=".85"/>`;
  }
  return s;
}

export function candyCane(x: number, y: number, h: number, flip = false) {
  const w = 14;
  const hook = flip ? -1 : 1;
  const path = `M${x} ${y} L${x} ${y - h} Q${x} ${y - h - 34} ${x + 26 * hook} ${y - h - 34} Q${x + 52 * hook} ${y - h - 34} ${x + 52 * hook} ${y - h - 6}`;
  return `<path d="${path}" stroke="${INK}" stroke-width="${w + 6}" fill="none" stroke-linecap="round"/><path d="${path}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${path}" stroke="#ff8fb8" stroke-width="${w}" fill="none" stroke-dasharray="12 12" stroke-linecap="butt"/>`;
}

export function jellyBean(x: number, y: number, w: number, h: number, c: string, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M${-w / 2} 0 C${-w / 2} ${-h * 0.9} ${-w * 0.15} ${-h * 1.05} 0 ${-h * 0.7} C${w * 0.18} ${-h * 1.05} ${w / 2} ${-h * 0.95} ${w / 2} ${-h * 0.15} C${w / 2} ${h * 0.55} ${-w / 2} ${h * 0.55} ${-w / 2} 0 Z" fill="${c}" stroke="${INK}" stroke-width="4"/><ellipse cx="${-w * 0.2}" cy="${-h * 0.55}" rx="${w * 0.14}" ry="${h * 0.1}" fill="#fff" opacity=".55"/></g>`;
}

export function bunting(x0: number, x1: number, y: number, sag: number, colors: string[]) {
  const n = Math.max(2, Math.round((x1 - x0) / 44));
  let s = `<path d="M${x0} ${y} Q${(x0 + x1) / 2} ${y + sag * 2} ${x1} ${y}" stroke="#7a5a8a" stroke-width="2" fill="none"/>`;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const px = x0 + (x1 - x0) * t;
    const py = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * (y + sag * 2) + t * t * y;
    s += `<path d="M${n1(px - 14)} ${n1(py)} L${n1(px + 14)} ${n1(py)} L${n1(px)} ${n1(py + 30)} Z" fill="${colors[i % colors.length]}"/>`;
  }
  return s;
}

/** Soft background people (no faces), for crowds far away. */
export function person(x: number, y: number, s: number, c: string, hair: string) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-26 0 Q-28 -70 0 -76 Q28 -70 26 0 Z" fill="${c}"/><circle cx="0" cy="-98" r="24" fill="#e9c4a0"/><path d="M-25 -100 Q-24 -128 0 -128 Q24 -128 25 -100 Q12 -112 0 -110 Q-12 -112 -25 -100 Z" fill="${hair}"/></g>`;
}

export function banner(x: number, y: number, w: number, h: number, text: string, bg: string, fg = '#fff', size = 40) {
  return `<g><path d="M${x} ${y} L${x + w} ${y} L${x + w - 18} ${y + h / 2} L${x + w} ${y + h} L${x} ${y + h} L${x + 18} ${y + h / 2} Z" fill="${bg}" stroke="${INK}" stroke-width="3"/><text x="${x + w / 2}" y="${y + h / 2 + size * 0.35}" text-anchor="middle" font-size="${size}" fill="${fg}" style="${FONT}">${text}</text></g>`;
}

export function rays(x: number, y: number, n: number, len: number, spread: number, angle: number, color: string, opacity: number, cls = '') {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = ((angle + (i - (n - 1) / 2) * (spread / Math.max(1, n - 1))) * Math.PI) / 180;
    const w = (len * 0.09) * (i % 2 ? 0.6 : 1);
    const ex = x + Math.sin(a) * len, ey = y + Math.cos(a) * len;
    const px = Math.cos(a) * w, py = -Math.sin(a) * w;
    s += `<path d="M${x} ${y} L${n1(ex + px)} ${n1(ey + py)} L${n1(ex - px)} ${n1(ey - py)} Z" fill="${color}" opacity="${opacity}"/>`;
  }
  return `<g${cls ? ` class="${cls}"` : ''}>${s}</g>`;
}

/** Wobbly ground band from x0 to x1 at height y with soft hills. */
export function hills(x0: number, x1: number, y: number, amp: number, step: number, seed: number, fill: string, bottom: number, stroke?: string) {
  const r = rng(seed);
  let d = `M${x0} ${bottom} L${x0} ${y}`;
  for (let x = x0; x < x1; x += step) {
    const nx = Math.min(x1, x + step);
    const cy = y - amp * (0.4 + r() * 0.8);
    d += ` Q${n1(x + step / 2)} ${n1(cy)} ${nx} ${n1(y + (r() - 0.5) * amp * 0.3)}`;
  }
  d += ` L${x1} ${bottom} Z`;
  return `<path d="${d}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="4"` : ''}/>`;
}

export function dust(n: number, seed: number, x0: number, x1: number, y0: number, y1: number, color = '#fff6d8') {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) s += `<circle class="${i % 2 ? 'drift' : 'bob'}" style="animation-delay:${n1(r() * 5)}s" cx="${n1(x0 + r() * (x1 - x0))}" cy="${n1(y0 + r() * (y1 - y0))}" r="${n1(1 + r() * 2.4)}" fill="${color}" opacity="${n1(0.25 + r() * 0.5)}"/>`;
  return s;
}

/**
 * Named, movable elements. Each is drawn around its own (0,0) and placed at an anchor; the engine
 * moves it by rewriting its transform from that anchor, so ambient CSS animations must go on
 * inner groups, never on the element itself.
 */
export interface ElInit { rot?: number; scale?: number; opacity?: number }
export function elements() {
  const anchors: Record<string, { x: number; y: number; init?: ElInit }> = {};
  return {
    anchors,
    el(name: string, x: number, y: number, inner: string, init?: ElInit) {
      anchors[name] = init ? { x, y, init } : { x, y };
      const sc = init?.scale ?? 1, rot = init?.rot ?? 0, op = init?.opacity ?? 1;
      return `<g data-el="${name}" transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})"${op !== 1 ? ` opacity="${op}"` : ''}>${inner}</g>`;
    },
  };
}

/* ---------------- Ambient life: small things that move on their own, so every place feels alive ----------------
 * Each moves on an inner group (a CSS animation would override a transform attribute). All motion is slow and
 * smooth, nothing blinks, and calm mode or reduced motion stops it (see globals.css). */
const BRIGHT = ['#ff7ab8', '#7fe6c9', '#ffd36e', '#8fc8ff', '#c9b6ff', '#ffb38a'];

/** Candy birds gliding across the sky, flapping gently. `span` is how far each one travels. */
export function birds(n: number, seed: number, x0: number, x1: number, y0: number, y1: number, span = 1600, cols = BRIGHT) {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = n1(x0 + r() * (x1 - x0)), y = n1(y0 + r() * (y1 - y0)), sc = n1(0.6 + r() * 0.6), dur = n1(26 + r() * 16), delay = n1(-r() * dur);
    const c = cols[i % cols.length];
    s += `<g transform="translate(${x} ${y}) scale(${sc})"><g class="glide" style="--span:${span}px;animation-duration:${dur}s;animation-delay:${delay}s">`
      + `<g class="flap" style="animation-delay:${n1(-r())}s"><path d="M-24 2 Q-12 -14 0 2 Q12 -14 24 2 Q12 -4 0 8 Q-12 -4 -24 2 Z" fill="${c}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/></g>`
      + `<circle cx="0" cy="4" r="5" fill="${c}" stroke="${INK}" stroke-width="2"/></g></g>`;
  }
  return s;
}

/** Candy butterflies fluttering in small loops near the ground. */
export function butterflies(n: number, seed: number, x0: number, x1: number, y0: number, y1: number) {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = n1(x0 + r() * (x1 - x0)), y = n1(y0 + r() * (y1 - y0)), dur = n1(8 + r() * 6), c = BRIGHT[(i + 2) % BRIGHT.length];
    s += `<g transform="translate(${x} ${y})"><g class="flutter" style="animation-duration:${dur}s;animation-delay:${n1(-r() * dur)}s"><g class="wings" style="animation-delay:${n1(-r())}s">`
      + `<path d="M0 0 Q-16 -18 -20 -4 Q-18 8 0 2 Q18 8 20 -4 Q16 -18 0 0 Z" fill="${c}" stroke="${INK}" stroke-width="2"/></g>`
      + `<path d="M0 -6 V6" stroke="${INK}" stroke-width="3" stroke-linecap="round"/></g></g>`;
  }
  return s;
}

/** Bubbles that rise a little and fade (chocolate bubbles on the river, fizzy bubbles in space). */
export function bubbles(n: number, seed: number, x0: number, x1: number, y0: number, y1: number, color = '#fff', rise = 60) {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = n1(x0 + r() * (x1 - x0)), y = n1(y0 + r() * (y1 - y0)), rr = n1(4 + r() * 8), dur = n1(3.5 + r() * 3);
    s += `<g transform="translate(${x} ${y})"><circle class="rise" style="--rise:${-rise}px;animation-duration:${dur}s;animation-delay:${n1(-r() * dur)}s" r="${rr}" fill="none" stroke="${color}" stroke-width="2.5" opacity=".8"/></g>`;
  }
  return s;
}

/** Shooting stars that slide slowly across the sky and fade in and out (never a flash). */
export function comets(n: number, seed: number, x0: number, x1: number, y0: number, y1: number, color = '#fff6d8') {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = n1(x0 + r() * (x1 - x0)), y = n1(y0 + r() * (y1 - y0)), dur = n1(9 + r() * 7), dir = r() > 0.5 ? 1 : -1;
    s += `<g transform="translate(${x} ${y}) scale(${dir} 1)"><g class="comet" style="animation-duration:${dur}s;animation-delay:${n1(-r() * dur)}s">`
      + `<path d="M0 0 L-150 -60 L-146 -52 Z" fill="${color}" opacity=".55"/><circle r="5" fill="${color}"/><circle r="11" fill="${color}" opacity=".25"/></g></g>`;
  }
  return s;
}

/** Party balloons drifting slowly upward. */
export function balloons(n: number, seed: number, x0: number, x1: number, y0: number, y1: number) {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = n1(x0 + r() * (x1 - x0)), y = n1(y0 + r() * (y1 - y0)), dur = n1(16 + r() * 10), c = BRIGHT[i % BRIGHT.length], sc = n1(0.7 + r() * 0.5);
    s += `<g transform="translate(${x} ${y}) scale(${sc})"><g class="float-up" style="animation-duration:${dur}s;animation-delay:${n1(-r() * dur)}s">`
      + `<path d="M0 34 q6 16 -2 30 q-6 14 2 26" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/>`
      + `<ellipse cx="0" cy="0" rx="24" ry="30" fill="${c}" stroke="${INK}" stroke-width="3"/><path d="M-5 30 L5 30 L0 37 Z" fill="${c}" stroke="${INK}" stroke-width="2"/>`
      + `<ellipse cx="-8" cy="-10" rx="6" ry="9" fill="#fff" opacity=".5"/></g></g>`;
  }
  return s;
}
