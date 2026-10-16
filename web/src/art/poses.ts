// Poses and motion cycles for the full-body rig. Angles are degrees in the character's own frame
// (facing right): shoulders/hips 0 = limb hanging down, positive = swung forward (towards the
// facing side), 90 = straight forward, 180 = straight up. Elbows: positive bends the forearm
// forward. Knees: positive bends the shin backwards (a natural knee). Lean and tilt: positive
// tips the body or head towards the facing side. When the character faces left the whole rig is
// mirrored, so every pose works in both directions.

export interface Joints {
  bx: number; by: number;          // body offset (by > 0 moves down)
  lean: number; tilt: number;      // upper body lean, head tilt
  a1s: number; a1e: number;        // back arm: shoulder, elbow
  a2s: number; a2e: number;        // front arm
  l1h: number; l1k: number;        // back leg: hip, knee
  l2h: number; l2k: number;        // front leg
  cape: number;                    // cape swing
  ground: number;                  // 1 = feet stay on the ground (body drops to meet them), 0 = free
}

export const JOINT_KEYS: (keyof Joints)[] = ['bx', 'by', 'lean', 'tilt', 'a1s', 'a1e', 'a2s', 'a2e', 'l1h', 'l1k', 'l2h', 'l2k', 'cape', 'ground'];

const BASE: Joints = { bx: 0, by: 0, lean: 0, tilt: 0, a1s: -8, a1e: 8, a2s: 8, a2e: 8, l1h: -3, l1k: 2, l2h: 3, l2k: 2, cape: 0, ground: 1 };
const P = (j: Partial<Joints>): Joints => ({ ...BASE, ...j });

export interface PoseDef { j: Joints; a1front?: boolean; rot?: number; lift?: number }

export const POSES = {
  stand: { j: P({}) },
  relaxed: { j: P({ a1s: -6, a1e: 12, a2s: 10, a2e: 14, l1h: -6, l1k: 6, l2h: 4, l2k: 0, tilt: 3 }) },
  wave: { j: P({ a2s: 155, a2e: 25, tilt: 4 }) },
  cheer: { j: P({ a1s: -158, a1e: -12, a2s: 158, a2e: 12, l1h: -6, l1k: 4, l2h: 6, l2k: 4, lean: -4, tilt: -6 }) },
  yay: { j: P({ a1s: -20, a1e: 60, a2s: 150, a2e: 20, tilt: -4 }) },
  point: { j: P({ a1s: -12, a1e: 10, a2s: 92, a2e: 0, l1h: -4, l2h: 6, lean: 4, tilt: 2 }) },
  pointUp: { j: P({ a1s: -12, a1e: 10, a2s: 165, a2e: 0, tilt: -10 }) },
  present: { j: P({ a1s: -25, a1e: 15, a2s: 75, a2e: 10, tilt: 4 }) },
  think: { j: P({ a1s: 18, a1e: 72, a2s: 20, a2e: -165, tilt: 8 }), a1front: true },
  armsCrossed: { j: P({ a1s: 12, a1e: 80, a2s: -12, a2e: -80, tilt: -3 }), a1front: true },
  hips: { j: P({ a1s: -38, a1e: 85, a2s: 38, a2e: -85, l1h: -6, l2h: 6, tilt: -3 }) },
  shrug: { j: P({ a1s: -55, a1e: -75, a2s: 55, a2e: 75, tilt: 10 }) },
  scared: { j: P({ a1s: 15, a1e: 150, a2s: -15, a2e: -150, l1h: 12, l1k: 25, l2h: 16, l2k: 28, lean: -6 }), a1front: true },
  crouch: { j: P({ a1s: -45, a1e: 20, a2s: -35, a2e: 25, l1h: 50, l1k: 95, l2h: 58, l2k: 100, lean: 18 }) },
  jump: { j: P({ a1s: -150, a1e: -10, a2s: 160, a2e: 10, l1h: 40, l1k: 90, l2h: 20, l2k: 50, ground: 0, tilt: -6 }) },
  land: { j: P({ a1s: -30, a1e: 20, a2s: 30, a2e: 20, l1h: 30, l1k: 60, l2h: 36, l2k: 64, lean: 10 }) },
  flail: { j: P({ a1s: -140, a1e: -30, a2s: 140, a2e: 30, l1h: -20, l1k: 40, l2h: 30, l2k: 20, ground: 0 }) },
  float: { j: P({ a1s: -95, a1e: -15, a2s: 95, a2e: 15, l1h: -10, l1k: 30, l2h: 15, l2k: 35, ground: 0 }) },
  sit: { j: P({ a1s: -20, a1e: 20, a2s: 25, a2e: 30, l1h: 84, l1k: 6, l2h: 90, l2k: 4, lean: -4 }) },
  hug: { j: P({ a1s: 70, a1e: 40, a2s: 70, a2e: 50, tilt: 6 }), a1front: true },
  kneel: { j: P({ a1s: -10, a1e: 20, a2s: 15, a2e: 20, l1h: -5, l1k: 95, l2h: 75, l2k: 75 }) },
  hold: { j: P({ a1s: -168, a1e: -8, a2s: 168, a2e: 8, tilt: -8 }) },
  holdFront: { j: P({ a1s: 35, a1e: 55, a2s: 45, a2e: 45 }), a1front: true },
  reach: { j: P({ a1s: -20, a1e: 10, a2s: 120, a2e: 0, l1h: -15, l1k: 5, l2h: 10, l2k: 5, lean: 10 }) },
  facepalm: { j: P({ a2s: 30, a2e: -175, tilt: -6 }) },
  bow: { j: P({ lean: 35, tilt: 10, a1s: -5, a1e: 5, a2s: 5, a2e: 5 }) },
  lookUp: { j: P({ tilt: -15, lean: -5 }) },
  slump: { j: P({ lean: 8, tilt: 14, a1s: -2, a1e: 2, a2s: 2, a2e: 2, by: 4 }) },
  push: { j: P({ a1s: -15, a1e: 10, a2s: 80, a2e: 10, lean: 8 }) },
  lick: { j: P({ a1s: -10, a1e: 10, a2s: 30, a2e: 40, lean: 20, tilt: 18 }) },
  tiptoe: { j: P({ a1s: 30, a1e: 100, a2s: 40, a2e: 100, l1h: 10, l1k: 30, l2h: 20, l2k: 30, lean: 8 }), a1front: true },
  splat: { j: P({ a1s: -170, a2s: 170, l1h: -10, l1k: 20, l2h: 10, l2k: 30, ground: 0 }), rot: 90, lift: 26 },
  lie: { j: P({ a1s: -20, a1e: 30, a2s: 160, a2e: 20, l1h: 10, l1k: 30, l2h: -5, l2k: 10, ground: 0 }), rot: -90, lift: 26 },
  ride: { j: P({ a1s: -40, a1e: 30, a2s: 150, a2e: 20, l1h: 80, l1k: 80, l2h: 86, l2k: 86, ground: 0 }) },
  perch: { j: P({ a1s: 10, a1e: 30, a2s: 20, a2e: 40, l1h: 84, l1k: 84, l2h: 90, l2k: 80, lean: 4, ground: 0 }) },
  hugKnees: { j: P({ a1s: 40, a1e: 60, a2s: 46, a2e: 60, l1h: 120, l1k: 150, l2h: 124, l2k: 150, lean: 16, tilt: 8, ground: 1 }), a1front: true },
  carry: { j: P({ a1s: -150, a1e: -30, a2s: 150, a2e: 30, tilt: -4 }) },
  stretchArm: { j: P({ a1s: -15, a1e: 10, a2s: 90, a2e: 0, lean: 6, l1h: -12, l2h: 12 }) },
  reachDown: { j: P({ a1s: -30, a1e: 20, a2s: 14, a2e: 0, lean: 12, tilt: 10, l1h: -14, l1k: 10, l2h: 16, l2k: 14 }) },
} satisfies Record<string, PoseDef>;

export type PoseName = keyof typeof POSES;

/** How tall a character is in a pose compared with standing (for camera framing and emotes). */
export const POSE_HEIGHT: Partial<Record<PoseName | CycleKey, number>> = {
  sit: 0.66, hugKnees: 0.6, kneel: 0.8, crouch: 0.82, land: 0.9, lie: 0.3, splat: 0.3, scared: 0.96, bow: 0.9, slump: 0.97,
  paddle: 0.8, tremble: 0.96,
};
type CycleKey = 'paddle' | 'tremble';
export const POSE_NAMES = Object.keys(POSES) as PoseName[];

/* ---------- motion cycles (t in seconds) ---------- */
export interface CycleOut { j: Joints; a1front?: boolean; lift?: number; sq?: number }
type CycleFn = (t: number) => CycleOut;
const TAU = Math.PI * 2;
const pos = (v: number) => Math.max(0, v);

export const CYCLES = {
  run: (t) => {
    const p = t * 2.4 * TAU, s = Math.sin(p), c = Math.cos(p);
    return { j: P({ l1h: 38 * s, l2h: -38 * s, l1k: 15 + 60 * pos(c), l2k: 15 + 60 * pos(-c), a1s: -45 * s, a2s: 45 * s, a1e: 85, a2e: 85, lean: 14, tilt: 4, by: 2 - 6 * Math.abs(s), cape: 32 + 6 * Math.sin(2 * p), ground: 0 }) };
  },
  walk: (t) => {
    const p = t * 1.5 * TAU, s = Math.sin(p), c = Math.cos(p);
    return { j: P({ l1h: 22 * s, l2h: -22 * s, l1k: 6 + 30 * pos(c), l2k: 6 + 30 * pos(-c), a1s: -20 * s, a2s: 20 * s, a1e: 15, a2e: 15, lean: 4, cape: 12 + 4 * Math.sin(2 * p) }) };
  },
  tiptoe: (t) => {
    const p = t * 1.1 * TAU, s = Math.sin(p), c = Math.cos(p);
    return { j: P({ l1h: 10 + 16 * s, l2h: 10 - 16 * s, l1k: 30 + 30 * pos(c), l2k: 30 + 30 * pos(-c), a1s: 30, a1e: 100, a2s: 40 + 6 * s, a2e: 100, lean: 8 }), a1front: true };
  },
  flail: (t) => {
    const p = t * 1.8 * TAU;
    return { j: P({ a1s: -140 + 35 * Math.sin(p * 1.3), a1e: -30 + 40 * Math.sin(p * 2), a2s: 140 + 35 * Math.sin(p * 1.3 + 1), a2e: 30 + 40 * Math.sin(p * 2 + 1), l1h: -20 + 30 * Math.sin(p), l1k: 40 + 30 * Math.sin(p + 1), l2h: 20 - 30 * Math.sin(p), l2k: 40 + 30 * Math.sin(p + 2), tilt: 6 * Math.sin(p), cape: 40, ground: 0 }) };
  },
  float: (t) => {
    const p = t * 0.5 * TAU, s = Math.sin(p);
    return { j: P({ a1s: -95 + 12 * s, a1e: -15, a2s: 95 - 12 * s, a2e: 15, l1h: -10 + 6 * s, l1k: 30, l2h: 15 - 6 * s, l2k: 35, tilt: 5 * s, cape: 20 + 8 * s, ground: 0 }) };
  },
  paddle: (t) => {
    const p = t * 0.8 * TAU, s = Math.sin(p);
    return { j: P({ l1h: -5, l1k: 95, l2h: 75, l2k: 75, a1s: 70 + 30 * s, a1e: 20, a2s: 60 + 30 * s, a2e: 30, lean: 14 + 8 * s }), a1front: true };
  },
  climb: (t) => {
    const p = t * 1.0 * TAU, s = Math.sin(p);
    return { j: P({ a1s: -160 + 25 * s, a1e: -20, a2s: 160 - 25 * s, a2e: 20, l1h: 30 + 30 * s, l1k: 60 + 30 * s, l2h: 30 - 30 * s, l2k: 60 - 30 * s, lean: 6, tilt: -8, ground: 0 }) };
  },
  dance: (t) => {
    const p = t * 1.6 * TAU, s = Math.sin(p);
    return { j: P({ a1s: -100 + 60 * s, a1e: -40, a2s: 100 + 60 * s, a2e: 40, bx: 6 * s, tilt: 8 * s, lean: 5 * s, l1h: -6 + 10 * s, l1k: 10 + 15 * pos(s), l2h: 6 + 10 * s, l2k: 10 + 15 * pos(-s) }) };
  },
  wave: (t) => {
    const s = Math.sin(t * 2.2 * TAU);
    return { j: P({ a2s: 155, a2e: 25 + 28 * s, tilt: 4 }) };
  },
  cheer: (t) => {
    const p = t * 1.5 * TAU, s = Math.sin(2 * p);
    return { j: P({ a1s: -158 + 12 * s, a1e: -12, a2s: 158 - 12 * s, a2e: 12, lean: -4, tilt: -6 }), lift: 14 * pos(Math.sin(p)) };
  },
  laugh: (t) => {
    const p = t * 3 * TAU, s = Math.sin(p);
    return { j: P({ a1s: 20, a1e: 70, a2s: -15, a2e: -75, lean: -6 + 3 * s, tilt: -10 + 4 * s, by: 1.5 * s }), a1front: true };
  },
  bounce: (t) => {
    const p = t * 1.5 * TAU, s = Math.sin(p);
    const up = pos(s);
    return { j: P({ a1s: -60 - 50 * up, a1e: -20, a2s: 60 + 50 * up, a2e: 20, l1h: 10 * (1 - up), l1k: 20 * (1 - up), l2h: 10 * (1 - up), l2k: 20 * (1 - up), ground: up > 0.05 ? 0 : 1, tilt: -4 * up }), lift: 60 * up, sq: up < 0.08 ? 0.12 * (1 - up / 0.08) : -0.06 * up };
  },
  tremble: (t) => {
    const s = Math.sin(t * 14 * TAU);
    return { j: P({ a1s: 15, a1e: 150, a2s: -15, a2e: -150, l1h: 12, l1k: 25, l2h: 16, l2k: 28, lean: -6, bx: 1.2 * s }), a1front: true };
  },
  munch: (t) => {
    const s = Math.sin(t * 2 * TAU);
    return { j: P({ a1s: 30, a1e: 110, a2s: 35, a2e: 115, tilt: 4 * s }), a1front: true };
  },
  hop: (t) => {
    const p = t * 2 * TAU, s = Math.sin(p);
    return { j: P({ a1s: -30 - 30 * pos(s), a2s: 30 + 30 * pos(s), a1e: 30, a2e: 30, ground: pos(s) > 0.05 ? 0 : 1 }), lift: 22 * pos(s) };
  },
  stretchArm: (t) => {
    const s = Math.sin(t * 3 * TAU);
    return { j: P({ a1s: -15, a1e: 10, a2s: 90 + 3 * s, a2e: 0, lean: 6, l1h: -12, l2h: 12 }) };
  },
} satisfies Record<string, CycleFn>;

export type CycleName = keyof typeof CYCLES;
export const CYCLE_NAMES = Object.keys(CYCLES) as CycleName[];

/** Gentle hand gestures while a standing character speaks. */
export function gesture(t: number, base: Joints): Joints {
  const s = Math.sin(t * 1.2 * TAU), c = Math.sin(t * 1.55 * TAU + 1);
  return { ...base, a2s: base.a2s + 22 + 12 * s, a2e: base.a2e + 35 + 15 * c, tilt: base.tilt + 2 * s };
}

/** Breathing for anyone standing still. */
export function breathe(t: number, phase: number): number {
  return 1.2 * Math.sin((t + phase) * 0.35 * TAU);
}
