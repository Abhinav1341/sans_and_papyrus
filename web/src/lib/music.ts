'use client';
// Soft procedural background music (no files): a few moods, each a looping 4-chord progression
// with pads, plucked arpeggios, bass, bells and very light percussion. Low tempo by default,
// no sudden stingers, ducked under every voice line (see audio.ts).
import { audio } from './audio';

export type Mood = 'none' | 'menu' | 'playful' | 'wonder' | 'sneaky' | 'race' | 'triumph' | 'night' | 'sad' | 'space' | 'mystery';
export const MOODS: Mood[] = ['none', 'menu', 'playful', 'wonder', 'sneaky', 'race', 'triumph', 'night', 'sad', 'space', 'mystery'];

interface MoodDef {
  bpm: number;
  root: number;                // MIDI note of the key
  scale: number[];             // semitone steps of the scale
  chords: number[][];          // chord tones as scale degrees (0-based), one chord per bar
  pad?: boolean; arp?: 'eighth' | 'sixteenth' | 'slow'; arpVoice?: 'pluck' | 'bell' | 'chip';
  bass?: 'root' | 'bounce' | 'walk'; bells?: number; drums?: 'soft' | 'drive' | 'tick';
}

const MAJ = [0, 2, 4, 5, 7, 9, 11];
const MIN = [0, 2, 3, 5, 7, 8, 10];
const LYD = [0, 2, 4, 6, 7, 9, 11];
const DOR = [0, 2, 3, 5, 7, 9, 10];
const tri = (d: number) => [d, d + 2, d + 4];

const DEFS: Record<Exclude<Mood, 'none'>, MoodDef> = {
  menu: { bpm: 92, root: 60, scale: MAJ, chords: [tri(0), tri(5), tri(3), tri(4)], pad: true, arp: 'eighth', arpVoice: 'pluck', bass: 'root', bells: 0.15, drums: 'soft' },
  playful: { bpm: 112, root: 65, scale: MAJ, chords: [tri(0), tri(3), tri(4), tri(0)], arp: 'eighth', arpVoice: 'pluck', bass: 'bounce', bells: 0.3, drums: 'soft' },
  wonder: { bpm: 72, root: 57, scale: LYD, chords: [[0, 2, 4, 6], [3, 5, 7, 9], [1, 3, 5, 7], [4, 6, 8, 10]], pad: true, arp: 'slow', arpVoice: 'bell', bass: 'root' },
  sneaky: { bpm: 100, root: 62, scale: MIN, chords: [tri(0), tri(3), tri(0), tri(4)], arp: 'eighth', arpVoice: 'pluck', bass: 'walk', drums: 'tick' },
  race: { bpm: 136, root: 67, scale: MAJ, chords: [tri(0), tri(4), tri(5), tri(3)], arp: 'sixteenth', arpVoice: 'chip', bass: 'bounce', bells: 0.2, drums: 'drive' },
  triumph: { bpm: 104, root: 60, scale: MAJ, chords: [tri(0), tri(3), tri(4), tri(0)], pad: true, arp: 'eighth', arpVoice: 'bell', bass: 'root', bells: 0.45, drums: 'soft' },
  night: { bpm: 66, root: 63, scale: MAJ, chords: [tri(0), tri(5), tri(3), tri(4)], pad: true, arp: 'slow', arpVoice: 'bell', bass: 'root' },
  sad: { bpm: 70, root: 57, scale: MIN, chords: [tri(0), tri(5), tri(2), tri(6)], pad: true, arp: 'slow', arpVoice: 'pluck', bass: 'root' },
  space: { bpm: 88, root: 52, scale: DOR, chords: [[0, 2, 4, 6], [3, 5, 7], [1, 3, 5], [4, 6, 8]], pad: true, arp: 'eighth', arpVoice: 'bell', bass: 'root', drums: 'soft' },
  mystery: { bpm: 96, root: 57, scale: MIN, chords: [tri(0), tri(5), tri(6), tri(0)], arp: 'eighth', arpVoice: 'chip', bass: 'root', drums: 'tick' },
};

const midiHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
function degree(def: MoodDef, d: number, octave = 0) {
  const n = def.scale.length;
  const o = Math.floor(d / n);
  return def.root + def.scale[((d % n) + n) % n] + 12 * (o + octave);
}

/* ---------- instruments ---------- */
type Out = { ctx: AudioContext; dest: AudioNode };
function env(o: Out, t: number, a: number, peak: number, dur: number, rel: number) {
  const g = o.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.setValueAtTime(peak, t + Math.max(a, dur - rel));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(o.dest);
  return g;
}
function osc(o: Out, type: OscillatorType, f: number, t: number, dur: number, to: AudioNode, detune = 0) {
  const x = o.ctx.createOscillator();
  x.type = type; x.frequency.value = f; x.detune.value = detune;
  x.connect(to); x.start(t); x.stop(t + dur + 0.05);
}
function lowpass(o: Out, f: number, to: AudioNode) {
  const lp = o.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = f; lp.connect(to); return lp;
}
const INSTR = {
  pad(o: Out, notes: number[], t: number, dur: number) {
    const g = env(o, t, 0.5, 0.035, dur, 0.6);
    const lp = lowpass(o, 900, g);
    notes.forEach((m) => { osc(o, 'sawtooth', midiHz(m), t, dur, lp, -6); osc(o, 'sawtooth', midiHz(m), t, dur, lp, 6); });
  },
  pluck(o: Out, m: number, t: number) {
    const g = env(o, t, 0.005, 0.09, 0.32, 0.25);
    osc(o, 'triangle', midiHz(m), t, 0.32, lowpass(o, 2600, g));
  },
  bell(o: Out, m: number, t: number, peak = 0.06) {
    const g = env(o, t, 0.005, peak, 1.3, 1.2);
    osc(o, 'sine', midiHz(m), t, 1.3, g);
    const g2 = env(o, t, 0.005, peak * 0.3, 0.8, 0.7);
    osc(o, 'sine', midiHz(m) * 2.01, t, 0.8, g2);
  },
  chip(o: Out, m: number, t: number) {
    const g = env(o, t, 0.005, 0.03, 0.14, 0.1);
    osc(o, 'square', midiHz(m), t, 0.14, lowpass(o, 1800, g));
  },
  bass(o: Out, m: number, t: number, dur: number) {
    const g = env(o, t, 0.01, 0.13, dur, Math.min(0.2, dur / 2));
    osc(o, 'triangle', midiHz(m), t, dur, lowpass(o, 520, g));
  },
  kick(o: Out, t: number, peak = 0.22) {
    const g = env(o, t, 0.003, peak, 0.16, 0.14);
    const x = o.ctx.createOscillator();
    x.frequency.setValueAtTime(120, t); x.frequency.exponentialRampToValueAtTime(45, t + 0.15);
    x.connect(g); x.start(t); x.stop(t + 0.2);
  },
  shaker(o: Out, t: number, peak = 0.025) {
    const len = Math.floor(o.ctx.sampleRate * 0.05);
    const b = o.ctx.createBuffer(1, len, o.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = o.ctx.createBufferSource(); s.buffer = b;
    const hp = o.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000;
    const g = o.ctx.createGain(); g.gain.value = peak;
    s.connect(hp); hp.connect(g); g.connect(o.dest); s.start(t);
  },
};

/* ---------- player ---------- */
interface Running { mood: Mood; gain: GainNode; step: number; next: number; timer: number; seed: number }
let current: Running | null = null;
let wanted: Mood = 'none';

function rand(r: Running) { r.seed = (r.seed * 1664525 + 1013904223) >>> 0; return r.seed / 4294967296; }

function schedule(r: Running) {
  const g = audio();
  if (!g || r.mood === 'none') return;
  const def = DEFS[r.mood as Exclude<Mood, 'none'>];
  const o: Out = { ctx: g.ctx, dest: r.gain };
  const sixteenth = 60 / def.bpm / 4;
  const horizon = g.ctx.currentTime + 0.25;
  if (r.next < g.ctx.currentTime) r.next = g.ctx.currentTime + 0.05;
  while (r.next < horizon) {
    const n = r.step, t = r.next;
    const bar = Math.floor(n / 16) % def.chords.length;
    const pos = n % 16;
    const chord = def.chords[bar];
    if (pos === 0 && def.pad) INSTR.pad(o, chord.map((d) => degree(def, d, -1)), t, sixteenth * 16);
    if (def.arp) {
      const every = def.arp === 'sixteenth' ? 1 : def.arp === 'eighth' ? 2 : 4;
      if (pos % every === 0) {
        const k = (pos / every) % (chord.length + 1);
        const d = k < chord.length ? chord[k] : chord[0] + def.scale.length;
        const m = degree(def, d, def.arp === 'slow' ? 1 : 0);
        if (def.arpVoice === 'bell') INSTR.bell(o, m, t, 0.035); else if (def.arpVoice === 'chip') INSTR.chip(o, m, t); else INSTR.pluck(o, m, t);
      }
    }
    if (def.bass) {
      const root = degree(def, chord[0], -2);
      if (def.bass === 'root' && pos % 8 === 0) INSTR.bass(o, root, t, sixteenth * 7);
      if (def.bass === 'bounce' && pos % 4 === 0) INSTR.bass(o, pos % 8 === 0 ? root : root + 7, t, sixteenth * 3);
      if (def.bass === 'walk' && pos % 4 === 0) INSTR.bass(o, degree(def, chord[0] + [0, 2, 4, 2][pos / 4], -2), t, sixteenth * 2);
    }
    if (def.bells && pos % 4 === 2 && rand(r) < def.bells) INSTR.bell(o, degree(def, chord[Math.floor(rand(r) * chord.length)], 1), t, 0.045);
    if (def.drums === 'soft') { if (pos === 0 || pos === 8) INSTR.kick(o, t, 0.16); if (pos % 4 === 2) INSTR.shaker(o, t, 0.018); }
    if (def.drums === 'drive') { if (pos % 4 === 0) INSTR.kick(o, t, 0.18); if (pos % 2 === 1) INSTR.shaker(o, t, 0.02); }
    if (def.drums === 'tick' && pos % 4 === 0) INSTR.shaker(o, t, 0.03);
    r.step++;
    r.next += sixteenth;
  }
}

function startMood(mood: Mood) {
  const g = audio();
  if (!g) return;
  const old = current;
  if (old) {
    old.gain.gain.setTargetAtTime(0.0001, g.ctx.currentTime, 0.5);
    window.setTimeout(() => { window.clearInterval(old.timer); old.gain.disconnect(); }, 2500);
    current = null;
  }
  if (mood === 'none') return;
  const gain = g.ctx.createGain();
  gain.gain.value = 0.0001;
  gain.gain.setTargetAtTime(1, g.ctx.currentTime + 0.2, 0.6);
  gain.connect(g.music);
  const r: Running = { mood, gain, step: 0, next: g.ctx.currentTime + 0.1, timer: 0, seed: 12345 + mood.length * 977 };
  r.timer = window.setInterval(() => schedule(r), 80);
  schedule(r);
  current = r;
}

/** Plays a mood (crossfading from the previous one). Safe to call before audio is unlocked. */
export function playMusic(mood: Mood) {
  wanted = mood;
  if (current?.mood === mood) return;
  if (!audio()) return;
  startMood(mood);
}

/** Called once audio unlocks, so the mood picked earlier starts. */
export function resumeWantedMusic() { if (current?.mood !== wanted) startMood(wanted); }
