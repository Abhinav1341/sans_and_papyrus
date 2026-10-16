'use client';
// Voices. Every story line has a pre-recorded clip in /public/voices (made by tools/voices),
// one distinct voice per character plus the storyteller. A clip's name comes from its voice, the
// voice's settings and the text, so a re-recorded voice never collides with a cached old clip. If a clip is missing (for example after editing a
// line without regenerating), the device's own speech voices are cast per character instead.
import cast from '@/data/voice-cast.json';
import { audio, duckMusic, isUnlocked, voiceLevel } from './audio';
import { store } from './store';
import { captionWords } from './hash';
import { spokenText, clipName } from './voice-text';

export type VoiceId = keyof typeof cast.voices;
export const VOICE_IDS = Object.keys(cast.voices) as VoiceId[];
type Entry = [number, number[]]; // [duration seconds, start time of each caption word]

const BASE = `/voices/${cast.version}`;
export const clipKey = (voice: VoiceId, text: string) => `${voice}|${clipName(voice, text)}`;
const clipUrl = (voice: VoiceId, text: string) => `${BASE}/${voice}/${clipName(voice, text)}.mp3`;

/* ---------- manifest ---------- */
let manifest: Record<string, Entry> | null = null;
let manifestP: Promise<void> | null = null;
export function loadManifest(): Promise<void> {
  if (!manifestP) {
    manifestP = fetch(`${BASE}/manifest.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((m: Record<string, Entry>) => { manifest = m && typeof m === 'object' ? m : {}; })
      .catch(() => { manifest = {}; });
  }
  return manifestP;
}
export function hasClip(voice: VoiceId, text: string) { return !!manifest?.[clipKey(voice, text)]; }

/* ---------- clip cache (bytes are kept so they can be decoded again; decoded buffers are bounded) ---------- */
const MAX = 60;
const bytes = new Map<string, Promise<ArrayBuffer | null>>();
const decoded = new Map<string, Promise<AudioBuffer | null>>();
function bound<K, V>(m: Map<K, V>) { while (m.size > MAX) { const k = m.keys().next().value as K; m.delete(k); } }

function fetchBytes(key: string, url: string) {
  let p = bytes.get(key);
  if (!p) {
    p = fetch(url).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null);
    bytes.set(key, p); bound(bytes);
  }
  return p;
}

function getBuffer(key: string, url: string): Promise<AudioBuffer | null> {
  const g = audio();
  if (!g) return Promise.resolve(null);
  let p = decoded.get(key);
  if (!p) {
    p = fetchBytes(key, url).then((b) => (b ? g.ctx.decodeAudioData(b.slice(0)).catch(() => null) : null));
    decoded.set(key, p); bound(decoded);
  }
  return p;
}

/** Starts downloading the clips for upcoming lines so they play without a gap. */
export async function preload(lines: { voice: VoiceId; text: string }[]) {
  await loadManifest();
  for (const l of lines) {
    const key = clipKey(l.voice, l.text);
    if (!manifest?.[key]) continue;
    if (isUnlocked()) getBuffer(key, clipUrl(l.voice, l.text));
    else fetchBytes(key, clipUrl(l.voice, l.text));
  }
}

/* ---------- fallback casting with the device's speech voices ---------- */
const FEMALE = /female|zira|aria|jenny|ana\b|sonia|libby|neerja|heera|samantha|karen|moira|tessa|veena|serena|victoria|fiona|susan|hazel|emma|michelle|google us english/i;
const MALE = /\bmale|david|mark|guy|ryan|prabhat|ravi|daniel|alex|fred|george|thomas|rishi|james|brian|christopher|eric|roger/i;
const WANT: Record<VoiceId, 'f' | 'm'> = { narrator: 'm', fizz: 'm', ro: 'm', meera: 'f', kiki: 'f', bunty: 'f', 'you-a': 'f', 'you-b': 'm', 'you-c': 'f' };
const ORDER: VoiceId[] = ['narrator', 'ro', 'meera', 'kiki', 'bunty', 'fizz', 'you-a', 'you-b', 'you-c'];
let casting: Map<VoiceId, SpeechSynthesisVoice | null> | null = null;

function castSystemVoices() {
  const all = typeof speechSynthesis !== 'undefined' ? speechSynthesis.getVoices() : [];
  const en = all.filter((v) => /^en/i.test(v.lang));
  if (!en.length) return null;
  const score = (v: SpeechSynthesisVoice) => (/natural|neural|online|google|enhanced|premium/i.test(v.name) ? 3 : 0) + (/en[-_](IN|GB)/i.test(v.lang) ? 1 : 0) + (v.localService ? 0 : 1);
  const used = new Map<string, number>();
  const map = new Map<VoiceId, SpeechSynthesisVoice | null>();
  for (const id of ORDER) {
    const g = WANT[id];
    const fits = en.filter((v) => (g === 'f' ? FEMALE.test(v.name) && !/\bmale/i.test(v.name.replace(/female/i, '')) : MALE.test(v.name)));
    const pool = fits.length ? fits : en;
    const best = [...pool].sort((a, b) => (used.get(a.name) || 0) - (used.get(b.name) || 0) || score(b) - score(a))[0] || null;
    if (best) used.set(best.name, (used.get(best.name) || 0) + 1);
    map.set(id, best);
  }
  return map;
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  speechSynthesis.addEventListener?.('voiceschanged', () => { casting = castSystemVoices(); });
}

export { spokenText };

/* ---------- speaking ---------- */
export interface Speech {
  readonly text: string;
  readonly words: string[];
  readonly ready: Promise<void>;
  readonly done: Promise<void>;
  kind(): 'clip' | 'tts' | 'silent';
  duration(): number;
  elapsed(): number;
  wordIndex(): number;
  level(): number;
  stop(): void;
}

let active: SpeechImpl | null = null;
let voicePaused = false;

export function estimateDuration(text: string) { return 0.4 + captionWords(text).length * 0.36; }

/** When each caption word starts (seconds from the start of the line): from the recording, or evenly spread. */
export function wordStarts(voice: VoiceId, text: string): number[] {
  const words = captionWords(text);
  const e = manifest?.[clipKey(voice, text)];
  if (e && e[1].length === words.length) return e[1];
  const d = e ? e[0] : estimateDuration(text);
  return words.map((_, i) => 0.06 + (i / Math.max(1, words.length)) * Math.max(0.2, d - 0.3));
}

class SpeechImpl implements Speech {
  text: string;
  words: string[];
  ready: Promise<void>;
  done: Promise<void>;
  private resolveReady!: () => void;
  private resolveDone!: () => void;
  private _kind: 'clip' | 'tts' | 'silent' = 'silent';
  private dur: number;
  private starts: number[] | null = null;
  private src: AudioBufferSourceNode | null = null;
  private ctxStart = 0;
  private clockStart = 0;
  private pausedAt = 0;
  private pausedTotal = 0;
  private ttsWord = -1;
  private finished = false;
  private silentTimer = 0;

  constructor(public voice: VoiceId, text: string) {
    this.text = text;
    this.words = captionWords(text);
    this.dur = estimateDuration(text);
    this.ready = new Promise((r) => { this.resolveReady = r; });
    this.done = new Promise((r) => { this.resolveDone = r; });
  }

  kind() { return this._kind; }
  duration() { return this.dur; }

  elapsed(): number {
    if (this._kind === 'clip') {
      const g = audio();
      return g ? Math.max(0, g.ctx.currentTime - this.ctxStart) : 0;
    }
    if (!this.clockStart) return 0;
    const now = voicePaused && this.pausedAt ? this.pausedAt : performance.now();
    return Math.max(0, (now - this.clockStart - this.pausedTotal) / 1000);
  }

  wordIndex(): number {
    if (this.finished) return this.words.length - 1;
    if (this._kind === 'tts' && this.ttsWord >= 0) return this.ttsWord;
    const t = this.elapsed();
    if (this.starts && this.starts.length === this.words.length) {
      let i = -1;
      while (i + 1 < this.starts.length && this.starts[i + 1] <= t + 0.05) i++;
      return i;
    }
    // Proportional estimate by word length.
    const total = this.words.reduce((a, w) => a + w.length + 2, 0);
    const lead = this._kind === 'clip' ? 0.15 : 0.1;
    const frac = Math.max(0, (t - lead) / Math.max(0.5, this.dur - lead));
    let acc = 0;
    for (let i = 0; i < this.words.length; i++) {
      acc += this.words[i].length + 2;
      if (acc / total >= frac) return i;
    }
    return this.words.length - 1;
  }

  level(): number {
    if (this.finished || (this.clockStart === 0 && this._kind !== 'clip')) return 0;
    if (this._kind === 'clip') return voiceLevel();
    if (voicePaused) return 0;
    const t = this.elapsed();
    if (t > this.dur) return 0;
    // Synthetic mouth movement when there is no audio to measure.
    return 0.35 + 0.35 * Math.sin(t * 23) + 0.3 * Math.sin(t * 13.7 + 1);
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    clearTimeout(this.silentTimer);
    if (active === this) { active = null; duckMusic(false); }
    this.resolveReady();
    this.resolveDone();
  }

  stop() {
    if (this.finished) return;
    try { this.src?.stop(); } catch { /* already stopped */ }
    if (this._kind === 'tts') { try { speechSynthesis.cancel(); } catch { /* ignore */ } }
    this.finish();
  }

  async start(force: boolean) {
    this.ready.then(() => { document.documentElement.dataset.voice = this._kind; });
    const s = store.get().settings;
    await loadManifest();
    if (this.finished) return;
    const entry = manifest?.[clipKey(this.voice, this.text)];
    const g = audio();
    if (entry && g) {
      const buf = await getBuffer(clipKey(this.voice, this.text), clipUrl(this.voice, this.text));
      if (this.finished) return;
      if (buf) {
        const src = g.ctx.createBufferSource();
        src.buffer = buf;
        // Muted voice still plays silently (the voice bus is at zero), so timing and lip-sync stay right.
        // A "read this to me" tap is always heard, so it skips the muted bus.
        src.connect(!s.voice && force ? g.master : g.voiceIn);
        this.src = src;
        this._kind = 'clip';
        this.dur = buf.duration;
        this.starts = entry[1];
        this.ctxStart = g.ctx.currentTime + 0.03;
        src.onended = () => this.finish();
        src.start(this.ctxStart);
        if (s.voice || force) duckMusic(true);
        this.resolveReady();
        return;
      }
    }
    if ((s.voice || force) && isUnlocked() && typeof speechSynthesis !== 'undefined') {
      this.startTTS();
      return;
    }
    this.startSilent();
  }

  private startSilent() {
    this._kind = 'silent';
    this.clockStart = performance.now();
    this.pausedTotal = 0;
    const tick = () => {
      if (this.finished) return;
      if (this.elapsed() >= this.dur) this.finish();
      else this.silentTimer = window.setTimeout(tick, 100);
    };
    this.silentTimer = window.setTimeout(tick, 100);
    this.resolveReady();
  }

  private startTTS() {
    try {
      if (!casting) casting = castSystemVoices();
      const u = new SpeechSynthesisUtterance(spokenText(this.text));
      const fb = (cast.fallback as Record<string, { pitch: number; rate: number }>)[this.voice] || { pitch: 1, rate: 1 };
      const v = casting?.get(this.voice) || null;
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-IN';
      u.pitch = fb.pitch; u.rate = fb.rate; u.volume = Math.min(1, store.get().settings.vol.voice);
      // Map spoken character positions back to caption words for the highlight.
      const spoken = spokenText(this.text);
      const offsets: number[] = [];
      { let pos = 0; for (const w of captionWords(spoken)) { const i = spoken.indexOf(w, pos); offsets.push(i); pos = i + w.length; } }
      u.onboundary = (e) => {
        if (e.name && e.name !== 'word') return;
        let i = 0; while (i + 1 < offsets.length && offsets[i + 1] <= e.charIndex) i++;
        this.ttsWord = Math.min(i, this.words.length - 1);
      };
      u.onstart = () => { this.clockStart = performance.now(); this.pausedTotal = 0; duckMusic(true); this.resolveReady(); };
      u.onend = () => this.finish();
      u.onerror = () => this.finish();
      this._kind = 'tts';
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
      // Safety nets: some browsers never fire onstart or onend.
      window.setTimeout(() => { if (!this.clockStart) { this.clockStart = performance.now(); this.resolveReady(); } }, 1200);
      window.setTimeout(() => this.finish(), (this.dur / fb.rate) * 1000 + 4000);
    } catch {
      this.startSilent();
    }
  }

  pause(p: boolean) {
    if (this._kind === 'clip') return; // the audio context itself is suspended
    if (p) this.pausedAt = performance.now();
    else if (this.pausedAt) { this.pausedTotal += performance.now() - this.pausedAt; this.pausedAt = 0; }
    if (this._kind === 'tts') { try { if (p) speechSynthesis.pause(); else speechSynthesis.resume(); } catch { /* ignore */ } }
  }
}

/**
 * Speaks a line in a character's voice. `force` speaks even when "Read to me" is off
 * (used when a child taps a "read this to me" button). Starting a line stops the previous one.
 */
export function say(voice: VoiceId, text: string, { force = false } = {}): Speech {
  active?.stop();
  const sp = new SpeechImpl(voice, text);
  active = sp;
  sp.start(force);
  return sp;
}

export function stopVoice() { active?.stop(); }

export function pauseVoice(p: boolean) {
  voicePaused = p;
  active?.pause(p);
}

/** The voice used for a speaker, given the Captain's chosen voice. */
export function voiceOf(speaker: string, heroVoice: 'a' | 'b' | 'c' = 'a'): VoiceId {
  if (speaker === 'you') return `you-${heroVoice}` as VoiceId;
  return (VOICE_IDS as string[]).includes(speaker) ? (speaker as VoiceId) : 'narrator';
}

export const VOICE_LABELS = Object.fromEntries(Object.entries(cast.voices).map(([k, v]) => [k, v.label])) as Record<VoiceId, string>;
