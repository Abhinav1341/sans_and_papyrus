// Characters on the stage. A kid actor is the jointed figure from art/figure.ts driven every frame
// by its pose or motion cycle (smoothly blended), with blinking, lip-sync from the voice audio,
// props in hand, squash-and-stretch and riding on things. Fizz has his own floating rig.
import { figureMarkup, rigEls, applyJoints, setArmLayer, setFace, dimsFor, messMarkup, type RigEls, type Dims } from '@/art/figure';
import { POSES, CYCLES, JOINT_KEYS, POSE_HEIGHT, gesture, breathe, type Joints, type PoseName, type CycleName, type PoseDef, type CycleOut } from '@/art/poses';
import { BLINKS, talkMouth, type Expr } from '@/art/face';
import { fizzBody, fizzEyes, fizzMouth, FIZZ_MIC, type FizzExpr } from '@/art/portrait';
import type { FullLook } from '@/art/looks';
import { EMOTE } from '@/art/icons';
import { PROPS } from './props';
import type { AnyExpr, CastId, EmoteKind, PropId } from './types';

export const NS = 'http://www.w3.org/2000/svg';
const f1 = (n: number) => Math.round(n * 10) / 10;
const GESTURE_POSES = new Set<PoseName>(['stand', 'relaxed', 'hips', 'point', 'present']);
/** Which of an actor's widths a pose or cycle uses. */
export function widthFor(w: { narrow: number; wide: number; lie: number }, pose: string): number {
  // Lying flat, or bent right over (stuck by the hands), the body spreads out sideways.
  if (pose === 'lie' || pose === 'splat' || pose === 'stuck' || pose === 'stuckPull') return w.lie;
  return WIDE_POSES.has(pose) ? w.wide : w.narrow;
}
/** Poses and cycles with arms held out to the side (the body is wider on screen). */
const WIDE_POSES = new Set<string>(['cheer', 'hold', 'flail', 'float', 'carry', 'jump', 'present', 'point', 'reach', 'yay', 'wave', 'shrug', 'hips', 'ride', 'stretchArm', 'dance', 'paddle', 'brace', 'holdUp']);

export interface RideTarget { kind: 'el' | 'actor'; name: string; dx: number; dy: number }

let uid = 0;

export abstract class Actor {
  readonly root: SVGGElement;
  protected flipG: SVGGElement;
  protected emoteG: SVGGElement;
  readonly shadow: SVGEllipseElement;
  x = 0; y = 0; lift = 0; s = 1; face: 1 | -1 = 1; flip = 1; sq = 0; rot = 0; alpha = 1;
  visible = true;
  pose: PoseName = 'stand';
  cycle: CycleName | null = null;
  cycleStart = 0;
  speaking = false;
  speakLevel = 0;
  ride: RideTarget | null = null;
  abstract readonly height: number; // unscaled height, for framing
  abstract expr: AnyExpr;
  protected emoteTimer = 0;
  private lastRoot = '';
  private lastFlip = '';
  private lastShadow = '';

  constructor(readonly id: CastId) {
    this.root = document.createElementNS(NS, 'g');
    this.root.setAttribute('class', 'actor');
    this.root.setAttribute('data-actor', id);
    this.flipG = document.createElementNS(NS, 'g');
    this.emoteG = document.createElementNS(NS, 'g');
    this.emoteG.setAttribute('class', 'emote');
    this.root.append(this.flipG, this.emoteG);
    this.shadow = document.createElementNS(NS, 'ellipse');
    this.shadow.setAttribute('fill', '#1a0f2a');
  }

  abstract setExpr(e: AnyExpr): void;
  abstract update(t: number, dt: number, instant: boolean): void;
  setProp(p: PropId | null): void { void p; /* only kids hold props */ }
  setPose(p: PoseName) { this.pose = p; }
  setCycle(c: CycleName | null, t: number) { if (c !== this.cycle) { this.cycle = c; this.cycleStart = t; } }

  /** Height right now (sitting, crouching and lying characters are shorter). */
  heightNow(): number {
    const f = (this.cycle && POSE_HEIGHT[this.cycle as 'paddle']) || (!this.cycle && POSE_HEIGHT[this.pose]) || 1;
    return this.height * f;
  }
  /** Top of the head in world space (for emotes, framing and particles). */
  /** Half the body's width in world units for a narrow pose, arms-out pose and lying down (for framing). */
  widths(): { narrow: number; wide: number; lie: number } {
    if (this.id === 'fizz') return { narrow: 104 * this.s, wide: 104 * this.s, lie: 104 * this.s };
    return { narrow: 76 * this.s, wide: 100 * this.s, lie: 160 * this.s };
  }
  /** Half the body's width right now, arms included (for framing: nobody gets cut in half). */
  halfWidth(): number { return widthFor(this.widths(), this.cycle ?? this.pose); }
  headTop() { return { x: this.x, y: this.y - this.lift - this.heightNow() * this.s }; }
  faceCenter() { return { x: this.x + 4 * this.face * this.s, y: this.y - this.lift - this.heightNow() * 0.72 * this.s }; }

  emote(kind: EmoteKind) {
    window.clearTimeout(this.emoteTimer);
    let inner: string;
    if (kind === 'gloom') inner = `<g opacity=".7">${[-40, -20, 0, 20, 40].map((dx, i) => `<path d="M${dx} ${-10 - (i % 2) * 14} V${60}" stroke="#5a6cc8" stroke-width="5" stroke-linecap="round"/>`).join('')}</g>`;
    else if (kind === 'blush') inner = `<g transform="translate(0 150)">${[-46, 34].map((dx) => `<path d="M${dx} 0 l8 -12 M${dx + 8} 0 l8 -12 M${dx + 16} 0 l8 -12" stroke="#ff6f91" stroke-width="4" stroke-linecap="round"/>`).join('')}</g>`;
    else {
      const svg = EMOTE[kind];
      inner = svg ? svg.replace('<svg ', '<svg x="-30" y="-30" width="60" height="60" overflow="visible" ') : '';
    }
    const side = kind === 'sweat' ? 46 : kind === 'gloom' || kind === 'blush' ? 0 : 52;
    this.emoteG.innerHTML = `<g class="emote-pop" transform="translate(${side} 0)">${inner}</g>`;
    this.emoteTimer = window.setTimeout(() => { this.emoteG.innerHTML = ''; }, 1900);
  }

  clearEmote() { window.clearTimeout(this.emoteTimer); this.emoteG.innerHTML = ''; }

  /** Writes position, facing, squash and visibility. */
  protected renderRoot(poseRot: number, extraLift: number, extraSq: number) {
    const lift = this.lift + extraLift;
    const sq = this.sq + extraSq;
    const r = `translate(${f1(this.x)} ${f1(this.y - lift)})`;
    if (r !== this.lastRoot) { this.root.setAttribute('transform', r); this.lastRoot = r; }
    const sx = this.flip * this.s * (1 + sq * 0.6), sy = this.s * (1 - sq);
    // A spin turns round the middle of the body (a flip, not a topple); a lying pose turns round the feet.
    const spin = this.rot ? `rotate(${f1(this.rot)} 0 ${f1(-this.height * 0.5)}) ` : '';
    const fl = `scale(${Math.round(sx * 1000) / 1000} ${Math.round(sy * 1000) / 1000}) ${spin}rotate(${f1(poseRot)})`;
    if (fl !== this.lastFlip) { this.flipG.setAttribute('transform', fl); this.lastFlip = fl; }
    // The emote floats above the head on the side the character faces, never mirrored.
    this.emoteG.setAttribute('transform', `translate(${f1(this.face * 20 * this.s)} ${f1(-this.heightNow() * this.s - 20)}) scale(${f1(this.s * 100) / 100})`);
    const k = Math.max(0, 1 - Math.min(lift, 600) / 700);
    const sh = `${f1(this.x)}|${f1(this.y)}|${f1(46 * this.s * k)}|${f1(0.24 * k)}`;
    if (sh !== this.lastShadow) {
      this.shadow.setAttribute('cx', String(f1(this.x)));
      this.shadow.setAttribute('cy', String(f1(this.y + 2)));
      this.shadow.setAttribute('rx', String(f1(46 * this.s * k)));
      this.shadow.setAttribute('ry', String(f1(9 * this.s * k)));
      this.shadow.setAttribute('opacity', String(f1(0.24 * k * 100) / 100));
      this.lastShadow = sh;
    }
    const vis = this.visible && this.alpha > 0.01;
    this.root.style.display = vis ? '' : 'none';
    this.shadow.style.display = vis && Math.abs(poseRot) < 30 ? '' : 'none';
    this.root.setAttribute('opacity', String(Math.round(this.alpha * 100) / 100));
  }
}

/* ---------------- a crew member or the Captain ---------------- */
export class KidActor extends Actor {
  readonly height: number;
  expr: Expr = 'normal';
  look: FullLook;
  private dims: Dims;
  private rig!: RigEls;
  private joints: Joints = { ...POSES.stand.j };
  private a1front = false;
  private poseRot = 0;
  private poseLift = 0;
  private cycLift = 0;
  private cycSq = 0;
  stretch = 1;
  gaze = 0.6;
  private gazeTarget = 0.6;
  private prop: PropId | null = null;
  private mouthLvl: 0 | 1 | 2 = 0;
  private blinkUntil = 0;
  private nextBlink = 2 + Math.random() * 3;
  private blinking = false;
  private phase = Math.random() * 3;

  constructor(id: CastId, look: FullLook) {
    super(id);
    this.look = look;
    this.dims = dimsFor(look);
    this.height = 318 * this.dims.scale;
    this.build();
  }

  private mess: string | null = null;

  private build() {
    this.flipG.innerHTML = `<g transform="scale(${this.dims.scale})">${figureMarkup(this.look, this.expr, this.joints, this.a1front)}</g>`;
    this.rig = rigEls(this.flipG);
    if (this.prop) this.rig.a2p.innerHTML = PROPS[this.prop];
    if (this.mess) this.rig.mess.innerHTML = messMarkup(this.mess);
  }

  setMess(color: string | null) {
    this.mess = color;
    this.rig.mess.innerHTML = color ? messMarkup(color) : '';
  }

  setCape(on: boolean) {
    if (!!this.look.cape === on) return;
    this.look = { ...this.look, cape: on };
    this.build();
  }

  setExpr(e: AnyExpr) {
    const ex = e as Expr;
    if (ex === this.expr) return;
    this.expr = ex;
    this.blinking = false;
    setFace(this.rig, this.look, ex);
    this.mouthLvl = 0;
  }

  widths() {
    // Bigger builds are wider, and a prop in hand (a shield, a paddle) reaches further out.
    const k = this.dims.scale, extra = this.prop ? 30 * this.s : 0;
    return { narrow: 76 * this.s * k + extra * 0.5, wide: 100 * this.s * k + extra, lie: 160 * this.s * k };
  }

  setProp(p: PropId | null) {
    this.prop = p;
    this.rig.a2p.innerHTML = p ? PROPS[p] : '';
  }

  setGaze(g: 'cam' | 'fwd') { this.gazeTarget = g === 'cam' ? 0 : 0.6; }

  update(t: number, dt: number, instant: boolean) {
    let target: Joints;
    let a1f = false, rot = 0, lift = 0, cl = 0, cs = 0;
    if (this.cycle) {
      const out: CycleOut = CYCLES[this.cycle](t - this.cycleStart);
      target = out.j; a1f = !!out.a1front; cl = out.lift || 0; cs = out.sq || 0;
    } else {
      const p: PoseDef = POSES[this.pose];
      target = p.j; a1f = !!p.a1front; rot = p.rot || 0; lift = p.lift || 0;
      if (this.speaking && GESTURE_POSES.has(this.pose)) target = gesture(t, target);
      if (target.ground > 0.5) target = { ...target, by: target.by + breathe(t, this.phase) };
    }
    const k = instant ? 1 : 1 - Math.exp(-dt * 16);
    for (const key of JOINT_KEYS) this.joints[key] += (target[key] - this.joints[key]) * k;
    this.poseRot += (rot - this.poseRot) * k;
    this.poseLift += (lift - this.poseLift) * k;
    this.cycLift += (cl - this.cycLift) * (instant ? 1 : 1 - Math.exp(-dt * 30));
    this.cycSq += (cs - this.cycSq) * (instant ? 1 : 1 - Math.exp(-dt * 30));
    this.gaze += (this.gazeTarget - this.gaze) * k;
    if (a1f !== this.a1front) { this.a1front = a1f; setArmLayer(this.rig, a1f); }
    applyJoints(this.rig, this.dims, this.joints, { stretch: this.stretch, look: this.gaze });

    // Lip-sync: three mouth shapes chosen from the loudness of the voice.
    const L = this.speaking ? this.speakLevel : 0;
    const lvl: 0 | 1 | 2 = L > 0.55 ? 2 : L > 0.16 ? 1 : 0;
    if (lvl !== this.mouthLvl) { this.mouthLvl = lvl; this.rig.mouth.innerHTML = talkMouth(this.expr, lvl); }

    // Blinking every few seconds while the eyes are open.
    if (!instant && BLINKS.has(this.expr)) {
      if (!this.blinking && t >= this.nextBlink) { this.blinking = true; this.blinkUntil = t + 0.12; setFace(this.rig, this.look, this.expr, true); this.mouthLvl = 0; }
      else if (this.blinking && t >= this.blinkUntil) { this.blinking = false; this.nextBlink = t + 2.2 + Math.random() * 3.2; setFace(this.rig, this.look, this.expr); this.mouthLvl = 0; }
    }
    this.renderRoot(this.poseRot, this.poseLift + this.cycLift, this.cycSq);
  }
}

/* ---------------- Fizz, the floating disco-ball host ---------------- */
export class FizzActor extends Actor {
  readonly height = 330;
  expr: FizzExpr = 'happy';
  private faceG!: SVGGElement;
  private mouthG!: SVGGElement;
  private facets!: SVGGElement | null;
  private mouthLvl: 0 | 1 | 2 = 0;
  private bob = 0;

  constructor() {
    super('fizz');
    const id = `fzst${++uid}`;
    // Ball centre about 210 units above the shadow; Fizz always hovers.
    this.flipG.innerHTML = `<g data-fz="body"><g transform="translate(-125 -349) scale(1.25)">${fizzBody(id, `<g data-fz="face">${fizzEyes('happy')}</g><g data-fz="mouth">${fizzMouth('happy')}</g>`)}${FIZZ_MIC}</g></g>`;
    this.faceG = this.flipG.querySelector('[data-fz="face"]') as SVGGElement;
    this.mouthG = this.flipG.querySelector('[data-fz="mouth"]') as SVGGElement;
    this.facets = this.flipG.querySelector('[data-f="facets"]') as SVGGElement | null;
  }

  setExpr(e: AnyExpr) {
    const fe = (['happy', 'excited', 'shock', 'sad', 'smug', 'sing', 'wink'].includes(e) ? e : 'happy') as FizzExpr;
    if (fe === this.expr) return;
    this.expr = fe;
    this.faceG.innerHTML = fizzEyes(fe);
    this.mouthG.innerHTML = fizzMouth(fe);
    this.mouthLvl = 0;
  }

  update(t: number, dt: number, instant: boolean) {
    this.bob = 9 * Math.sin(t * 1.7);
    if (this.facets) this.facets.setAttribute('transform', `translate(${f1((t * 9) % 14)} 0)`);
    const L = this.speaking ? this.speakLevel : 0;
    const lvl: 0 | 1 | 2 = L > 0.55 ? 2 : L > 0.16 ? 1 : 0;
    if (lvl !== this.mouthLvl) { this.mouthLvl = lvl; this.mouthG.innerHTML = fizzMouth(this.expr, lvl); }
    const tilt = this.speaking ? 4 * Math.sin(t * 3.1) : 2 * Math.sin(t * 0.9);
    void dt; void instant;
    this.renderRoot(tilt, this.bob, 0);
  }
}
