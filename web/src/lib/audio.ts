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
/** 'running' when sound can be heard (used by automated phone checks). */
export function audioState(): string { return graph?.ctx.state ?? 'none'; }
export function onUnlock(fn: () => void) { unlockListeners.add(fn); return () => { unlockListeners.delete(fn); }; }

/*
 * Phones only let sound start inside a real tap. On a touch screen that is the END of the touch
 * (touchend / pointerup / click), not pointerdown, so all of them are listened to. The listeners stay
 * on: iOS and Android suspend audio after a phone call, the lock screen or switching apps, and the
 * next tap must wake it again. A one-sample silent buffer played inside the tap completes the unlock
 * on older iOS.
 */
const GESTURES = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'] as const;
let installed = false;

function wake() {
  const g = graph;
  if (!g || paused) return;
  if (g.ctx.state !== 'running') {
    g.ctx.resume().catch(() => {});
    try {
      const src = g.ctx.createBufferSource();
      src.buffer = g.ctx.createBuffer(1, 1, 22050);
      src.connect(g.ctx.destination);
      src.start(0);
    } catch { /* not ready yet */ }
  }
}

/*
 * iPhone mutes web-page sound when the ringer switch is on silent, unless the page asks for the
 * "playback" audio session (as a video player does). Newer iOS has an API for that; older iOS
 * switches session when a media element plays, so a silent looping clip is started inside the tap.
 */
let silentEl: HTMLAudioElement | null = null;
const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function silentWavUrl() {
  const n = 2205, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 22050, true); v.setUint32(28, 22050, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}
function playbackSession() {
  const nav = navigator as Navigator & { audioSession?: { type: string } };
  if (nav.audioSession) { try { if (nav.audioSession.type !== 'playback') nav.audioSession.type = 'playback'; } catch { /* unsupported */ } return; }
  if (!isIOS()) return;
  if (!silentEl) {
    silentEl = new Audio(silentWavUrl());
    silentEl.loop = true;
    silentEl.setAttribute('playsinline', '');
  }
  if (silentEl.paused && !paused) silentEl.play().catch(() => {});
}

/** Call once on the client: unlocks audio on the first tap or key press, and wakes it after interruptions. */
export function installAudioUnlock() {
  if (typeof window === 'undefined' || installed) return;
  installed = true;
  const onGesture = (e: Event) => {
    // pointerdown only counts as a gesture for a mouse; touches unlock on touchend / pointerup / click.
    if (e.type === 'pointerdown' && (e as PointerEvent).pointerType !== 'mouse') return;
    playbackSession();
    if (!unlocked) {
      unlocked = true;
      audio();
      wake();
      unlockListeners.forEach((l) => l());
      return;
    }
    wake();
  };
  for (const ev of GESTURES) window.addEventListener(ev, onGesture, { capture: true, passive: true });
  const back = () => { if (document.visibilityState === 'visible') wake(); };
  document.addEventListener('visibilitychange', back);
  window.addEventListener('pageshow', back);
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
  if (silentEl) { if (p) silentEl.pause(); else silentEl.play().catch(() => {}); }
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
