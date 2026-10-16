// Full-body chibi characters (about 3.3 heads tall) built from jointed parts, so the same drawing
// can run, jump, climb and paddle in the cinema and stand still in the menus.
// Local space: feet at (0,0), up is negative y, the character faces +x (mirrored for left).
// Everything here is pure string building, so it renders on the server and in the browser alike.
import { shade, type FullLook } from './looks';
import { headBase, features, headExtras, hairBack, hairFront, talkMouth, LINE, type Expr } from './face';
import { POSES, type Joints, type PoseName } from './poses';

export interface Dims {
  scale: number;
  hipX: number; hipY: number;
  thigh: number; shin: number; legW: number;
  shX: number; shY: number;
  upper: number; fore: number; armW: number; hand: number;
  neckY: number; headScale: number;
  torsoTop: number; torsoBot: number; // half widths
}

const REGULAR: Dims = { scale: 1, hipX: 13, hipY: -100, thigh: 50, shin: 44, legW: 21, shX: 27, shY: -168, upper: 40, fore: 36, armW: 16, hand: 10, neckY: -176, headScale: 0.92, torsoTop: 30, torsoBot: 28 };

export function dimsFor(look: Pick<FullLook, 'build'>): Dims {
  if (look.build === 'big') return { ...REGULAR, scale: 1.08, hipX: 17, legW: 25, shX: 34, armW: 19, hand: 11, torsoTop: 38, torsoBot: 40, headScale: 0.94 };
  if (look.build === 'small') return { ...REGULAR, scale: 0.8, thigh: 46, shin: 40, hipY: -92, shY: -158, neckY: -166, headScale: 1.0 };
  return REGULAR;
}

const longSleeves = (l: FullLook) => l.extra === 'sweater' || l.extra === 'scarf' || l.extra === 'hoodie';
const f1 = (n: number) => Math.round(n * 10) / 10;

/** A capsule (rounded limb) pointing down from (0,0). */
const limb = (w: number, len: number, fill: string) =>
  `<rect x="${f1(-w / 2)}" y="${f1(-w / 2)}" width="${w}" height="${f1(len + w)}" rx="${f1(w / 2)}" fill="${fill}"/>`;

export interface RigExtras { stretch: number; look: number }
const NO_EXTRAS: RigExtras = { stretch: 1, look: 0.6 };
const RAD = Math.PI / 180;

/** How far the body must drop so the lower foot touches the ground. */
export function groundDrop(d: Dims, j: Joints): number {
  const ext = (h: number, k: number) => d.thigh * Math.cos(h * RAD) + d.shin * Math.cos((k - h) * RAD);
  return Math.max(0, d.thigh + d.shin - Math.max(ext(j.l1h, j.l1k), ext(j.l2h, j.l2k)));
}

export type JointKey = 'body' | 'upper' | 'l1' | 'l1s' | 'l2' | 'l2s' | 'a1' | 'a1f' | 'a1h' | 'a2' | 'a2f' | 'a2fl' | 'a2h' | 'head' | 'hb' | 'feat' | 'cape' | 'capeup';
type T = Record<JointKey, string>;

/** The SVG transform of every joint for one pose. */
export function jointTransforms(d: Dims, j: Joints, x: RigExtras = NO_EXTRAS): T {
  const drop = j.ground * groundDrop(d, j);
  const headT = `rotate(${f1(j.tilt)} 0 ${d.neckY})`;
  return {
    body: `translate(${f1(j.bx)} ${f1(j.by + drop)})`,
    upper: `rotate(${f1(j.lean)} 0 ${d.hipY})`,
    // The cape hangs behind the whole body (legs too), so it leans with the upper body from its own layer.
    capeup: `rotate(${f1(j.lean)} 0 ${d.hipY})`,
    l1: `translate(${-d.hipX} ${d.hipY}) rotate(${f1(-j.l1h)})`,
    l1s: `translate(0 ${d.thigh}) rotate(${f1(j.l1k)})`,
    l2: `translate(${d.hipX} ${d.hipY}) rotate(${f1(-j.l2h)})`,
    l2s: `translate(0 ${d.thigh}) rotate(${f1(j.l2k)})`,
    a1: `translate(${-d.shX} ${d.shY}) rotate(${f1(-j.a1s)})`,
    a1f: `translate(0 ${d.upper}) rotate(${f1(-j.a1e)})`,
    a1h: `translate(0 ${d.fore})`,
    a2: `translate(${d.shX} ${d.shY}) rotate(${f1(-j.a2s)})`,
    a2f: `translate(0 ${d.upper}) rotate(${f1(-j.a2e)})`,
    // Stretch (Ro's toffee arm) lengthens the front forearm and moves the hand to its end.
    a2fl: `scale(1 ${Math.round(x.stretch * 100) / 100})`,
    a2h: `translate(0 ${f1(d.fore * x.stretch)})`,
    head: headT,
    hb: headT,
    // The face turns a little towards where the character looks (anime three-quarter view).
    feat: `translate(${f1(x.look * 7)} 0)`,
    cape: `translate(0 ${d.shY - 6}) rotate(${f1(j.cape)})`,
  };
}

function legMarkup(d: Dims, look: FullLook, id: 'l1' | 'l2', t: T) {
  const back = id === 'l1';
  const thighFill = back ? shade(look.pants, -18) : look.pants;
  const shinFill = look.shorts ? (back ? shade(look.skin, -14) : look.skin) : thighFill;
  const shoe = back ? shade(look.shoes, -22) : look.shoes;
  const w = d.legW;
  const shoePath = `<path d="M${f1(-w / 2 - 2)} ${d.shin - 6} Q${f1(-w / 2 - 2)} ${d.shin + 8} ${f1(w / 2)} ${d.shin + 8} L${f1(w / 2 + 12)} ${d.shin + 8} Q${f1(w / 2 + 16)} ${d.shin + 1} ${f1(w / 2 + 6)} ${d.shin - 6} Z" fill="${shoe}" stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round"/>`;
  const sock = look.shorts ? `<rect x="${f1(-w / 2 + 1)}" y="${d.shin - 14}" width="${w - 2}" height="9" rx="3" fill="#ffffff"/>` : '';
  const hem = look.shorts ? `<rect x="${f1(-w / 2 - 1)}" y="${d.thigh - 22}" width="${w + 2}" height="8" rx="3" fill="${shade(look.pants, -30)}"/>` : '';
  const shinKey = id === 'l1' ? 'l1s' : 'l2s';
  return `<g data-j="${id}" transform="${t[id]}">${limb(w, d.thigh, thighFill)}${hem}`
    + `<g data-j="${shinKey}" transform="${t[shinKey]}">${limb(w - 2, d.shin - 4, shinFill)}${sock}${shoePath}</g></g>`;
}

function armMarkup(d: Dims, look: FullLook, id: 'a1' | 'a2', t: T) {
  const back = id === 'a1';
  const sleeve = back ? shade(look.outfit, -26) : look.outfit;
  const skin = back ? shade(look.skin, -14) : look.skin;
  const foreFill = longSleeves(look) ? sleeve : skin;
  const cuff = longSleeves(look) ? `<rect x="${f1(-d.armW / 2)}" y="${d.fore - 8}" width="${d.armW}" height="7" rx="3" fill="${shade(look.outfit, -36)}"/>` : '';
  const fk = id === 'a1' ? 'a1f' : 'a2f';
  const hk = id === 'a1' ? 'a1h' : 'a2h';
  const fl = id === 'a2' ? ` transform="${t.a2fl}"` : '';
  return `<g data-j="${id}" transform="${t[id]}">${limb(d.armW, d.upper, sleeve)}`
    + `<g data-j="${fk}" transform="${t[fk]}"><g data-j="${id}fl"${fl}>${limb(d.armW - 2, d.fore - 4, foreFill)}${cuff}</g>`
    + `<g data-j="${hk}" transform="${t[hk]}"><circle cx="0" cy="0" r="${d.hand}" fill="${skin}" stroke="${shade(look.skin, -40)}" stroke-width="1.5"/><g data-j="${id}p"></g></g></g></g>`;
}

function torsoMarkup(d: Dims, look: FullLook) {
  const o = look.outfit, od = shade(o, -26);
  const top = d.shY - 8, bot = d.hipY + 10;
  const tw = d.torsoTop, bw = d.torsoBot;
  const body = `<path d="M${-tw} ${top + 10} Q${-tw} ${top} ${-tw + 12} ${top} L${tw - 12} ${top} Q${tw} ${top} ${tw} ${top + 10} L${bw} ${bot - 4} Q${bw} ${bot} ${bw - 6} ${bot} L${-bw + 6} ${bot} Q${-bw} ${bot} ${-bw} ${bot - 4} Z" fill="${o}" stroke="${shade(o, -55)}" stroke-width="2"/>`;
  const shadow = `<path d="M${-tw + 2} ${top + 10} L${-tw + 16} ${top + 4} L${-bw + 14} ${bot - 2} L${-bw + 2} ${bot - 4} Z" fill="${od}" opacity=".55"/>`;
  const neck = `<rect x="-8" y="${d.neckY - 8}" width="16" height="${top - d.neckY + 14}" rx="5" fill="${shade(look.skin, -22)}"/>`;
  const collar = `<path d="M-12 ${top + 1} Q0 ${top + 10} 12 ${top + 1}" stroke="${od}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  let detail = '';
  switch (look.extra) {
    case 'hoodie':
      detail = `<path d="M${-tw + 6} ${top + 2} Q0 ${top + 22} ${tw - 6} ${top + 2}" stroke="${od}" stroke-width="7" fill="none" stroke-linecap="round"/>`
        + `<path d="M-6 ${top + 12} L-7 ${top + 34} M6 ${top + 12} L7 ${top + 34}" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`
        + `<path d="M${-bw + 10} ${bot - 22} L${bw - 10} ${bot - 22} L${bw - 14} ${bot - 6} L${-bw + 14} ${bot - 6} Z" fill="${od}" opacity=".7"/>`;
      break;
    case 'sweater':
      detail = `<path d="M-14 ${top + 2} Q0 ${top + 14} 14 ${top + 2}" stroke="${od}" stroke-width="6" fill="none" stroke-linecap="round"/>`
        + `<path d="M${-bw + 4} ${bot - 18} L${bw - 4} ${bot - 18}" stroke="${od}" stroke-width="4" stroke-dasharray="6 5"/>`
        + `<path d="M${-tw + 6} ${top + 30} L${tw - 6} ${top + 30}" stroke="#ffd36e" stroke-width="5" opacity=".8"/>`;
      break;
    case 'scarf':
      detail = `<path d="M-18 ${top - 4} Q0 ${top + 12} 18 ${top - 4} L19 ${top + 6} Q0 ${top + 22} -19 ${top + 6} Z" fill="#ffd36e" stroke="#c99a2e" stroke-width="1.5"/>`
        + `<path d="M8 ${top + 8} L16 ${top + 40} L4 ${top + 38} Z" fill="#ffd36e" stroke="#c99a2e" stroke-width="1.5"/>`;
      break;
    case 'starclip':
      detail = collar + `<path d="M0 ${top + 22} l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1z" fill="#fff" opacity=".9"/>`;
      break;
    case 'glasses':
      detail = collar + `<rect x="${bw - 22}" y="${top + 26}" width="13" height="15" rx="3" fill="${od}"/><path d="M${bw - 19} ${top + 24} l0 6 M${bw - 13} ${top + 22} l0 8" stroke="#ffd36e" stroke-width="2.5" stroke-linecap="round"/>`;
      break;
    case 'cap':
      detail = collar + `<circle cx="0" cy="${top + 30}" r="9" fill="#fff" opacity=".85"/><circle cx="0" cy="${top + 30}" r="4" fill="${od}"/>`;
      break;
    default:
      detail = collar;
  }
  const badge = look.captain ? `<path d="M${tw - 16} ${top + 18} l3.5 7 7.5 1 -5.5 5 1.5 7.5 -7 -4 -7 4 1.5 -7.5 -5.5 -5 7.5 -1z" fill="#ffd36e" stroke="#c99a2e" stroke-width="1.5"/>` : '';
  const belt = `<rect x="${-bw}" y="${bot - 8}" width="${bw * 2}" height="8" rx="3" fill="${shade(look.pants, -10)}"/>`;
  return neck + body + shadow + detail + belt + badge;
}

/** The Captain's cape, behind the whole body: it hangs from the shoulders to the knees and flares out,
 *  so its edges and hem show around the body like a real cape. */
function capeMarkup(d: Dims, transform: string) {
  const w = d.torsoTop + 6, len = -d.hipY + 40, flare = w + 30;
  const hem = `L${flare} ${len} Q${f1(flare * 0.5)} ${len + 14} 0 ${len} Q${f1(-flare * 0.5)} ${len + 14} ${-flare} ${len}`;
  return `<g data-j="cape" transform="${transform}">`
    + `<path d="M${-w} 0 L${w} 0 ${hem} Z" fill="#4b36c4" stroke="#2a1838" stroke-width="3" stroke-linejoin="round"/>`
    + `<path d="M${-w + 8} 6 L${w - 8} 6 L${flare - 10} ${len - 6} Q0 ${len + 4} ${-flare + 10} ${len - 6} Z" fill="#7B61FF"/>`
    + `<path d="M${-w + 18} 14 L${-flare + 24} ${len - 12} M${w - 18} 14 L${flare - 24} ${len - 12}" stroke="#5a44d6" stroke-width="5" stroke-linecap="round" opacity=".7"/>`
    + `<path d="M${-flare} ${len} Q${f1(-flare * 0.5)} ${len + 14} 0 ${len} Q${f1(flare * 0.5)} ${len + 14} ${flare} ${len}" stroke="#ffd36e" stroke-width="4" fill="none"/></g>`;
}

/** The front of the cape: ties over the shoulders and a gold star clasp at the collar. */
function capeFrontMarkup(d: Dims) {
  const w = d.torsoTop + 6, y = d.shY - 2;
  return `<path d="M${-w} ${y} Q${-w + 8} ${y + 22} -6 ${y + 14} L-3 ${y + 4} Z M${w} ${y} Q${w - 8} ${y + 22} 6 ${y + 14} L3 ${y + 4} Z" fill="#5a44d6" stroke="#2a1838" stroke-width="2.5" stroke-linejoin="round"/>`
    + `<circle cx="0" cy="${y + 13}" r="7" fill="#ffd36e" stroke="#c99a2e" stroke-width="2"/><path d="M0 ${y + 8.5} l1.4 3 3.2 .4 -2.4 2.2 .7 3.2 -2.9 -1.6 -2.9 1.6 .7 -3.2 -2.4 -2.2 3.2 -.4z" fill="#fff4c7"/>`;
}

/** Head in rig space: portrait space scaled so the chin sits on the neck. */
export function headTransform(d: Dims) {
  return `translate(0 ${d.neckY}) scale(${d.headScale}) translate(-100 -158)`;
}

/** The inner markup of one character in a pose. */
export function figureMarkup(look: FullLook, expr: Expr = 'normal', joints: Joints = POSES.stand.j, a1front = false, extras: RigExtras = NO_EXTRAS): string {
  const d = dimsFor(look);
  const t = jointTransforms(d, joints, extras);
  const head = `<g data-j="head" transform="${t.head}"><g transform="${headTransform(d)}">${headBase(look)}`
    + `<g data-p="feat" transform="${t.feat}">${features(look, expr)}<g data-p="mouth">${talkMouth(expr, 0)}</g></g>`
    + `${hairFront(look.hair, look.hairColor)}${headExtras(look)}<g data-p="mess"></g></g></g>`;
  const headBack = `<g data-j="hb" transform="${t.hb}"><g transform="${headTransform(d)}">${hairBack(look.hair, look.hairColor)}</g></g>`;
  const arm1 = armMarkup(d, look, 'a1', t);
  return `<g data-j="body" transform="${t.body}">`
    + (look.cape ? `<g data-j="capeup" transform="${t.capeup}">${capeMarkup(d, t.cape)}</g>` : '')
    + `<g data-j="legs">${legMarkup(d, look, 'l1', t)}${legMarkup(d, look, 'l2', t)}</g>`
    + `<g data-j="upper" transform="${t.upper}">${headBack}`
    + `<g data-j="a1back">${a1front ? '' : arm1}</g>`
    + `<g data-j="torso">${torsoMarkup(d, look)}${look.cape ? capeFrontMarkup(d) : ''}</g>`
    + `<g data-j="a1front">${a1front ? arm1 : ''}</g>`
    + `${head}${armMarkup(d, look, 'a2', t)}</g></g>`;
}

export interface RigEls {
  body: SVGGElement; upper: SVGGElement;
  l1: SVGGElement; l1s: SVGGElement; l2: SVGGElement; l2s: SVGGElement;
  a1: SVGGElement; a1f: SVGGElement; a1h: SVGGElement; a1p: SVGGElement;
  a2: SVGGElement; a2f: SVGGElement; a2fl: SVGGElement; a2h: SVGGElement; a2p: SVGGElement;
  a1back: SVGGElement; a1front: SVGGElement;
  head: SVGGElement; hb: SVGGElement; feat: SVGGElement; mouth: SVGGElement; mess: SVGGElement;
  cape: SVGGElement | null;
  capeup: SVGGElement | null;
  last: Partial<Record<JointKey, string>>;
}

export function rigEls(root: Element): RigEls {
  const q = (k: string) => root.querySelector(`[data-j="${k}"]`) as SVGGElement;
  return {
    body: q('body'), upper: q('upper'),
    l1: q('l1'), l1s: q('l1s'), l2: q('l2'), l2s: q('l2s'),
    a1: q('a1'), a1f: q('a1f'), a1h: q('a1h'), a1p: q('a1p'),
    a2: q('a2'), a2f: q('a2f'), a2fl: q('a2fl'), a2h: q('a2h'), a2p: q('a2p'),
    a1back: q('a1back'), a1front: q('a1front'),
    head: q('head'), hb: q('hb'),
    feat: root.querySelector('[data-p="feat"]') as SVGGElement,
    mouth: root.querySelector('[data-p="mouth"]') as SVGGElement,
    mess: root.querySelector('[data-p="mess"]') as SVGGElement,
    cape: root.querySelector('[data-j="cape"]') as SVGGElement | null,
    capeup: root.querySelector('[data-j="capeup"]') as SVGGElement | null,
    last: {},
  };
}

const KEYS: JointKey[] = ['body', 'upper', 'l1', 'l1s', 'l2', 'l2s', 'a1', 'a1f', 'a1h', 'a2', 'a2f', 'a2fl', 'a2h', 'head', 'hb', 'feat', 'cape', 'capeup'];

/** Writes joint angles into the live SVG, touching only transforms that changed. */
export function applyJoints(el: RigEls, d: Dims, j: Joints, x: RigExtras = NO_EXTRAS) {
  const t = jointTransforms(d, j, x);
  for (const k of KEYS) {
    if (el.last[k] === t[k]) continue;
    const node = k === 'cape' ? el.cape : k === 'capeup' ? el.capeup : el[k];
    if (!node) continue;
    node.setAttribute('transform', t[k]);
    el.last[k] = t[k];
  }
}

/** Moves the back arm in front of or behind the torso. */
export function setArmLayer(el: RigEls, front: boolean) {
  const parent = front ? el.a1front : el.a1back;
  if (el.a1.parentNode !== parent) parent.appendChild(el.a1);
}

/** Redraws the face for a new expression (or a blink). */
export function setFace(el: RigEls, look: FullLook, expr: Expr, blink = false) {
  el.feat.innerHTML = `${features(look, expr, blink)}<g data-p="mouth">${talkMouth(expr, 0)}</g>`;
  el.mouth = el.feat.querySelector('[data-p="mouth"]') as SVGGElement;
}

/** Splats of foam (or anything gooey) on the head, in portrait space. */
export function messMarkup(color: string): string {
  const blob = (x: number, y: number, r: number) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
  const drip = (x: number, y: number, len: number) => `<path d="M${x - 6} ${y} Q${x - 6} ${y + len} ${x} ${y + len + 6} Q${x + 6} ${y + len} ${x + 6} ${y} Z" fill="${color}"/>`;
  return `<g opacity=".92">${blob(84, 30, 20)}${blob(110, 26, 18)}${blob(132, 40, 15)}${blob(64, 46, 14)}${blob(98, 44, 16)}`
    + `${drip(60, 52, 40)}${drip(140, 54, 30)}${drip(104, 52, 14)}<circle cx="128" cy="140" r="7" fill="${color}"/><circle cx="74" cy="152" r="5" fill="${color}"/>`
    + `<circle cx="92" cy="24" r="5" fill="#fff" opacity=".6"/></g>`;
}

/* ---------- static figures for menus ---------- */
/** A complete standalone SVG of a character in a pose (builder, profile, cards). */
export function figureSVG(look: FullLook, expr: Expr = 'happy', pose: PoseName = 'stand', viewBox = '-100 -345 200 362'): string {
  const d = dimsFor(look);
  const p: { j: Joints; a1front?: boolean } = POSES[pose];
  return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">`
    + `<ellipse cx="0" cy="2" rx="${Math.round(46 * d.scale)}" ry="9" fill="#000" opacity=".22"/>`
    + `<g transform="scale(${d.scale})">${figureMarkup(look, expr, p.j, !!p.a1front)}</g></svg>`;
}
