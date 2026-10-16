'use client';
// Gentle synthesized sound effects (nothing to download). Kid audio rules: soft volume,
// no sudden loud stingers, a little pitch variation so repeated sounds never grate.
import { audio } from './audio';

type ToneOpts = { type?: OscillatorType; vol?: number; slideTo?: number | null; vibrato?: number };

function out() {
  const g = audio();
  return g ? { ctx: g.ctx, dest: g.sfx } : null;
}

let detune = 1;

function tone(freq: number, start: number, dur: number, { type = 'sine', vol = 1, slideTo = null, vibrato = 0 }: ToneOpts = {}) {
  const o = out(); if (!o) return;
  const { ctx, dest } = o;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq * detune, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo * detune, t0 + dur);
  if (vibrato) {
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    lfo.frequency.value = 9;
    lg.gain.value = vibrato;
    lfo.connect(lg); lg.connect(osc.frequency);
    lfo.start(t0); lfo.stop(t0 + dur + 0.05);
  }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(dest);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

const noiseCache = new Map<number, AudioBuffer>();
function noiseBuffer(ctx: BaseAudioContext, dur: number) {
  const key = Math.round(dur * 100);
  let b = noiseCache.get(key);
  if (!b) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noiseCache.set(key, b);
  }
  return b;
}

function noise(start: number, dur: number, { vol = 0.5, from = 800, to = 3000, q = 1, type = 'bandpass' as BiquadFilterType, fadeIn = 0.01 } = {}) {
  const o = out(); if (!o) return;
  const { ctx, dest } = o;
  const t0 = ctx.currentTime + start;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, dur);
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t0);
  f.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + fadeIn);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(dest);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

const SFX = {
  tap: () => tone(660, 0, 0.08, { type: 'triangle', vol: 0.4 }),
  blip: () => tone(880, 0, 0.05, { type: 'square', vol: 0.06 }),
  pop: () => tone(420, 0, 0.12, { vol: 0.7, slideTo: 900 }),
  boing: () => tone(170, 0, 0.5, { vol: 0.8, slideTo: 520, vibrato: 18 }),
  whoosh: () => noise(0, 0.6, { vol: 0.5, from: 400, to: 2400, fadeIn: 0.2 }),
  swoosh: () => noise(0, 0.3, { vol: 0.35, from: 900, to: 3000, fadeIn: 0.08 }),
  sparkle: () => { [1320, 1760, 2093, 2637].forEach((f, i) => tone(f, i * 0.07, 0.25, { type: 'triangle', vol: 0.28 })); },
  chime: () => { [784, 988, 1175].forEach((f, i) => tone(f, i * 0.12, 0.5, { vol: 0.42 })); },
  fanfare: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, i === 3 ? 0.7 : 0.22, { type: 'triangle', vol: 0.45 })); },
  tada: () => { [523, 659, 784].forEach((f) => tone(f, 0, 0.9, { type: 'triangle', vol: 0.3 })); tone(1047, 0.1, 0.8, { type: 'triangle', vol: 0.25 }); },
  drum: () => { tone(110, 0, 0.18, { vol: 0.8, slideTo: 60 }); tone(110, 0.22, 0.18, { vol: 0.8, slideTo: 60 }); tone(160, 0.44, 0.3, { vol: 0.9, slideTo: 70 }); },
  drumroll: () => { for (let i = 0; i < 22; i++) noise(i * 0.06, 0.05, { vol: 0.12 + i * 0.012, from: 180, to: 140, type: 'lowpass' }); tone(130, 1.35, 0.4, { vol: 0.8, slideTo: 70 }); },
  zap: () => tone(1200, 0, 0.3, { type: 'sawtooth', vol: 0.1, slideTo: 200 }),
  splash: () => { noise(0, 0.5, { vol: 0.45, from: 300, to: 900 }); noise(0.08, 0.35, { vol: 0.25, from: 1500, to: 600 }); },
  squish: () => tone(300, 0, 0.25, { vol: 0.6, slideTo: 140 }),
  splat: () => { noise(0, 0.25, { vol: 0.5, from: 500, to: 150, type: 'lowpass' }); tone(220, 0, 0.2, { vol: 0.5, slideTo: 90 }); },
  ding: () => tone(1568, 0, 0.6, { vol: 0.35 }),
  sad: () => { tone(392, 0, 0.35, { type: 'triangle', vol: 0.3 }); tone(330, 0.3, 0.55, { type: 'triangle', vol: 0.3 }); },
  thud: () => { tone(95, 0, 0.22, { vol: 0.8, slideTo: 48 }); noise(0, 0.12, { vol: 0.2, from: 300, to: 120, type: 'lowpass' }); },
  bonk: () => { tone(560, 0, 0.09, { type: 'triangle', vol: 0.55 }); tone(390, 0.07, 0.14, { type: 'triangle', vol: 0.45 }); },
  stretch: () => tone(180, 0, 0.9, { type: 'triangle', vol: 0.45, slideTo: 900, vibrato: 25 }),
  snap: () => { tone(900, 0, 0.18, { type: 'triangle', vol: 0.45, slideTo: 180 }); noise(0.12, 0.08, { vol: 0.3, from: 2000, to: 800 }); },
  slurp: () => { noise(0, 0.45, { vol: 0.4, from: 2200, to: 500, q: 4 }); tone(500, 0.05, 0.35, { vol: 0.2, slideTo: 260 }); },
  munch: () => { for (let i = 0; i < 4; i++) noise(i * 0.14, 0.08, { vol: 0.35, from: 1800, to: 900, q: 2 }); },
  patter: () => { for (let i = 0; i < 6; i++) tone(240 + (i % 2) * 40, i * 0.11, 0.05, { type: 'triangle', vol: 0.18 }); },
  vortex: () => { noise(0, 2.2, { vol: 0.35, from: 200, to: 2600, fadeIn: 0.6 }); tone(140, 0, 2.2, { type: 'triangle', vol: 0.18, slideTo: 620, vibrato: 30 }); },
  wind: () => noise(0, 2.2, { vol: 0.22, from: 300, to: 700, type: 'lowpass', fadeIn: 0.8 }),
  cheer: () => {
    for (let i = 0; i < 10; i++) noise(i * 0.09 + Math.random() * 0.04, 0.07, { vol: 0.28, from: 2400, to: 1800, q: 1.5 });
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.1 + i * 0.1, 0.35, { type: 'triangle', vol: 0.25 }));
  },
  coin: () => { tone(988, 0, 0.09, { type: 'square', vol: 0.12 }); tone(1319, 0.08, 0.35, { type: 'square', vol: 0.12 }); },
  clink: () => { tone(2349, 0, 0.18, { type: 'triangle', vol: 0.25 }); tone(3136, 0.06, 0.25, { type: 'triangle', vol: 0.18 }); },
  magic: () => { [784, 988, 1175, 1568, 1976, 2349].forEach((f, i) => tone(f, i * 0.06, 0.4, { type: 'triangle', vol: 0.18 })); },
  bubble: () => { [600, 760, 900].forEach((f, i) => tone(f, i * 0.09, 0.08, { vol: 0.3, slideTo: f * 1.6 })); },
  gulp: () => tone(380, 0, 0.18, { vol: 0.45, slideTo: 160 }),
  wobble: () => tone(260, 0, 0.6, { vol: 0.45, vibrato: 40 }),
  hum: () => { tone(110, 0, 1.6, { type: 'sine', vol: 0.18 }); tone(220, 0, 1.6, { type: 'triangle', vol: 0.06 }); },
  beep: () => { tone(1046, 0, 0.12, { type: 'square', vol: 0.08 }); tone(1568, 0.14, 0.18, { type: 'square', vol: 0.08 }); },
  creak: () => tone(140, 0, 0.6, { type: 'sawtooth', vol: 0.06, slideTo: 95, vibrato: 12 }),
  swirl: () => { [523, 659, 784, 988].forEach((f, i) => tone(f, i * 0.05, 0.3, { type: 'sine', vol: 0.2, slideTo: f * 1.5 })); noise(0, 0.6, { vol: 0.2, from: 600, to: 3000, fadeIn: 0.15 }); },
} as const;

export type SoundId = keyof typeof SFX;
export const SOUND_IDS = Object.keys(SFX) as SoundId[];

export function sfx(name: SoundId) {
  const fn = SFX[name];
  if (!fn) return;
  detune = 0.96 + Math.random() * 0.08;
  try { fn(); } catch { /* audio not available */ }
  detune = 1;
}
