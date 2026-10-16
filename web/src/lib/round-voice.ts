'use client';
// Bonus-round speech. Items come from the question bank, so they have no recorded clips; the server
// voices them with Google Cloud Text-to-Speech (/api/voice). Clips play through the game's voice bus,
// so the volume slider, "Read to me" and music ducking behave exactly as for story lines.
// If a clip can't be fetched, the device's own voice reads the line instead.
import { audio, duckMusic } from './audio';
import { captionWords } from './hash';
import { say, stopVoice, type Speech } from './voice';
import { store } from './store';

export interface Line { text: string; url: string | null; speaker: 'narrator' | 'fizz' }

/* ---------- clip cache ---------- */
const MAX = 40;
const bytes = new Map<string, Promise<ArrayBuffer | null>>();
function fetchClip(url: string) {
  let p = bytes.get(url);
  if (!p) {
    p = fetch(url, { credentials: 'same-origin' }).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null);
    bytes.set(url, p);
    while (bytes.size > MAX) bytes.delete(bytes.keys().next().value as string);
  }
  return p;
}
/** Starts downloading clips that will be needed soon (e.g. the options while the question is read). */
export function prefetch(urls: (string | null | undefined)[]) { for (const u of urls) if (u) void fetchClip(u); }

/* ---------- one line ---------- */
interface Playing { done: Promise<void>; wordIndex(): number; stop(): void }

function wordIndexAt(words: string[], t: number, dur: number) {
  // Spread the highlight over the clip by word length (Chirp voices don't report word timings).
  const lead = 0.15;
  const frac = Math.max(0, (t - lead) / Math.max(0.5, dur - lead * 2));
  const total = words.reduce((a, w) => a + w.length + 2, 0);
  let acc = 0;
  for (let i = 0; i < words.length; i++) { acc += words[i].length + 2; if (acc / total >= frac) return i; }
  return words.length - 1;
}

async function playLine(line: Line, force: boolean): Promise<Playing> {
  const words = captionWords(line.text);
  const g = audio();
  const data = line.url && g ? await fetchClip(line.url) : null;
  const buf = data && g ? await g.ctx.decodeAudioData(data.slice(0)).catch(() => null) : null;
  if (!g || !buf) {
    // Fallback: the device's speech voice, as before.
    const sp: Speech = say(line.speaker, line.text, { force });
    return { done: sp.done, wordIndex: () => sp.wordIndex(), stop: () => sp.stop() };
  }
  stopVoice();
  const src = g.ctx.createBufferSource();
  src.buffer = buf;
  src.connect(!store.get().settings.voice && force ? g.master : g.voiceIn);
  const at = g.ctx.currentTime + 0.03;
  let finished = false;
  let resolve!: () => void;
  const done = new Promise<void>((r) => { resolve = r; });
  const finish = () => { if (finished) return; finished = true; duckMusic(false); resolve(); };
  src.onended = finish;
  src.start(at);
  duckMusic(true);
  return {
    done,
    wordIndex: () => (finished ? words.length - 1 : wordIndexAt(words, g.ctx.currentTime - at, buf.duration)),
    stop: () => { try { src.stop(); } catch { /* already stopped */ } finish(); },
  };
}

/* ---------- a sequence of lines ---------- */
export interface Reading {
  /** Which line is being read (-1 before the first starts, lines.length when finished). */
  line(): number;
  wordIndex(): number;
  stop(): void;
  done: Promise<void>;
}

let active: Reading | null = null;

/**
 * Reads lines one after another. Without `force`, nothing is read when "Read to me" is off;
 * `force` (a tap on a "read this to me" button) is always heard. Starting a reading stops the last one.
 */
export function read(lines: Line[], { force = false } = {}): Reading {
  active?.stop();
  let index = -1, current: Playing | null = null, stopped = false;
  const done = (async () => {
    if (!force && !store.get().settings.voice) { index = lines.length; return; }
    prefetch(lines.map((l) => l.url));
    for (let i = 0; i < lines.length && !stopped; i++) {
      const p = await playLine(lines[i], force);
      if (stopped) { p.stop(); break; }
      index = i; current = p;
      await p.done;
    }
    index = lines.length;
  })();
  const r: Reading = {
    line: () => index,
    wordIndex: () => current?.wordIndex() ?? -1,
    stop: () => { stopped = true; current?.stop(); if (active === r) active = null; },
    done,
  };
  active = r;
  return r;
}

export function stopReading() { active?.stop(); stopVoice(); }
