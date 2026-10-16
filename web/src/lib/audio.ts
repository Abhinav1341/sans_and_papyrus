'use client';
// One audio graph for the whole game: master <- voice / music / sfx buses, each with its own
// volume (the child-facing sound mixer). Music ducks under voices so lines are always clear.
// Browsers only allow audio after a tap or key press, so nothing is created before that.
import { store } from './store';

interface Graph {
  ctx: AudioContext;
  master: GainNode;
  /** Voices connect here. Lip-sync is measured before the volume, so mouths move even when muted. */
  voiceIn: GainNode;
  voice: GainNode;
  music: GainNode;
  musicDuck: GainNode;
  sfx: GainNode;
  analyser: AnalyserNode;
}

let graph: Graph | null = null;
let unlocked = false;
const unlockListeners = new Set<() => void>();

function build(): Graph | null {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();
  const master = ctx.createGain();
  // A gentle limiter: parents' phones are often at full volume.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -12;
  limiter.knee.value = 6;
  limiter.ratio.value = 8;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;
  master.gain.value = 0.9;
  master.connect(limiter);
  limiter.connect(ctx.destination);
  const voiceIn = ctx.createGain();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  const voice = ctx.createGain();
  voiceIn.connect(analyser);
  analyser.connect(voice);
  voice.connect(master);
  const music = ctx.createGain();
  const musicDuck = ctx.createGain();
  music.connect(musicDuck);
  musicDuck.connect(master);
  const sfx = ctx.createGain();
  sfx.connect(master);
  return { ctx, master, voiceIn, voice, music, musicDuck, sfx, analyser };
}

/** The audio graph, or null before the first gesture or when audio is unavailable. */
export function audio(): Graph | null {
  if (!unlocked || typeof window === 'undefined') return null;
  if (!graph) {
    try { graph = build(); } catch { graph = null; }
    if (graph) applyVolumes();
  }
  if (graph && graph.ctx.state === 'suspended' && !paused) graph.ctx.resume().catch(() => {});
  return graph;
}

export function isUnlocked() { return unlocked; }
export function onUnlock(fn: () => void) { unlockListeners.add(fn); return () => { unlockListeners.delete(fn); }; }

/** Call once on the client: unlocks audio on the first tap or key press. */
export function installAudioUnlock() {
  if (typeof window === 'undefined' || unlocked) return;
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    audio();
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
    unlockListeners.forEach((l) => l());
  };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
}

/** Bus volumes follow the settings (sliders and on/off switches). */
export function applyVolumes() {
  if (!graph) return;
  const s = store.get().settings;
  const t = graph.ctx.currentTime;
  graph.voice.gain.setTargetAtTime(s.voice ? 1.25 * s.vol.voice : 0, t, 0.05);
  graph.music.gain.setTargetAtTime(s.music ? 0.32 * s.vol.music : 0, t, 0.3);
  graph.sfx.gain.setTargetAtTime(s.sound ? 0.5 * s.vol.sfx : 0, t, 0.05);
}

let ducked = false;
/** Lowers the music while someone is speaking. */
export function duckMusic(on: boolean) {
  if (!graph || on === ducked) return;
  ducked = on;
  graph.musicDuck.gain.setTargetAtTime(on ? 0.35 : 1, graph.ctx.currentTime, on ? 0.08 : 0.4);
}

let paused = false;
/** Pause menu: freezes every sound (voices, music, effects) and resumes them in place. */
export function setAudioPaused(p: boolean) {
  paused = p;
  if (!graph) return;
  if (p) graph.ctx.suspend().catch(() => {});
  else graph.ctx.resume().catch(() => {});
}

/** Loudness of the voice bus right now (0..1), used for lip-sync. */
const levelBuf = new Float32Array(512);
export function voiceLevel(): number {
  if (!graph) return 0;
  graph.analyser.getFloatTimeDomainData(levelBuf);
  let sum = 0;
  for (let i = 0; i < levelBuf.length; i++) sum += levelBuf[i] * levelBuf[i];
  return Math.min(1, Math.sqrt(sum / levelBuf.length) * 6);
}
