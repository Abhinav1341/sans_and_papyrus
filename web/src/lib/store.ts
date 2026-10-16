'use client';
// Save data: versioned schema, validated on load, kept on this device only (localStorage).
// Data minimisation: no real names (the name comes from a picker), no free text, no analytics.
import { useSyncExternalStore } from 'react';
import type { Look } from '@/art/looks';

export type VoiceChoice = 'a' | 'b' | 'c';
export type Speed = 'slow' | 'normal' | 'fast';

export interface Hero { name: string; look: Look; voice: VoiceChoice; age?: number } // age (6–14) is set in the builder; it decides the starting level of bonus rounds
export interface Settings {
  voice: boolean;   // read every line aloud
  sound: boolean;   // sound effects
  music: boolean;   // background music
  calm: boolean;    // less movement on screen
  movie: boolean;   // the story plays on by itself, like a film
  speed: Speed;     // pauses between lines
  vol: { voice: number; music: number; sfx: number };
}
export interface Save {
  v: 2;
  auth: { signedIn: boolean; method: string | null };
  hero: Hero | null;
  progress: { chapter: string | null; shot: number };
  done: string[];
  powers: string[];
  items: string[];
  seen: string[];
  settings: Settings;
}

const KEY = 'party-galaxy-save';

export function defaults(): Save {
  return {
    v: 2,
    auth: { signedIn: false, method: null },
    hero: null,
    progress: { chapter: null, shot: 0 },
    done: [],
    powers: [],
    items: [],
    seen: [],
    settings: { voice: true, sound: true, music: true, calm: false, movie: true, speed: 'normal', vol: { voice: 1, music: 0.5, sfx: 0.7 } },
  };
}

const SERVER_SNAPSHOT = defaults();

type Obj = Record<string, unknown>;
const obj = (x: unknown): Obj => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Obj) : {});
const strArr = (x: unknown): string[] => (Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string') : []);
const num01 = (x: unknown, d: number) => (typeof x === 'number' && x >= 0 && x <= 1 ? x : d);
const bool = (x: unknown, d: boolean) => (typeof x === 'boolean' ? x : d);
const str = (x: unknown): string | null => (typeof x === 'string' ? x : null);

function readLook(x: unknown): Look | null {
  const l = obj(x);
  const keys = ['skin', 'hair', 'hairColor', 'eyes', 'outfit'] as const;
  if (!keys.every((k) => typeof l[k] === 'string')) return null;
  return { skin: l.skin as string, hair: l.hair as Look['hair'], hairColor: l.hairColor as string, eyes: l.eyes as string, outfit: l.outfit as string };
}

/** Accepts anything (including the v1 save of the first web build) and returns a valid v2 save. */
export function migrate(raw: unknown): Save {
  const d = obj(raw);
  const s = obj(d.settings);
  const vol = obj(s.vol);
  const auth = obj(d.auth);
  const h = obj(d.hero);
  const prog = obj(d.progress);
  const legacy = d.v === 1;
  const look = readLook(h.look);
  const hero: Hero | null = typeof h.name === 'string' && look
    ? { name: h.name, look, voice: h.voice === 'b' || h.voice === 'c' ? h.voice : 'a', ...(typeof h.age === 'number' && h.age >= 6 && h.age <= 14 ? { age: Math.round(h.age) } : {}) }
    : null;
  const speed: Speed = s.speed === 'slow' || s.speed === 'normal' || s.speed === 'fast' ? s.speed
    : s.textSpeed === 'slow' ? 'slow' : s.textSpeed === 'fast' || s.textSpeed === 'instant' ? 'fast' : 'normal';
  return {
    v: 2,
    auth: { signedIn: bool(auth.signedIn, false), method: str(auth.method) },
    hero,
    // v1 shot numbers point into the old script, so a v1 save restarts its chapter.
    progress: !legacy && typeof prog.shot === 'number'
      ? { chapter: str(prog.chapter), shot: Math.max(0, Math.floor(prog.shot)) }
      : { chapter: null, shot: 0 },
    done: strArr(d.done),
    powers: strArr(d.powers),
    items: strArr(d.items),
    seen: strArr(d.seen),
    settings: {
      voice: bool(s.voice, bool(s.readAloud, true)),
      sound: bool(s.sound, true),
      music: bool(s.music, true),
      calm: bool(s.calm, false),
      movie: bool(s.movie, true),
      speed,
      vol: { voice: num01(vol.voice, 1), music: num01(vol.music, 0.5), sfx: num01(vol.sfx, 0.7) },
    },
  };
}

let state: Save | null = null;
const listeners = new Set<() => void>();

function current(): Save {
  if (state) return state;
  if (typeof window === 'undefined') return SERVER_SNAPSHOT;
  try {
    const raw = window.localStorage.getItem(KEY);
    state = raw ? migrate(JSON.parse(raw)) : defaults();
  } catch {
    state = defaults();
  }
  return state;
}

function persist() {
  try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode: keep playing in memory */ }
}

export const store = {
  get: current,
  /** Changes the save with a mutating function on a fresh copy, then saves and notifies. */
  update(fn: (s: Save) => void) {
    const next = structuredClone(current());
    fn(next);
    state = next;
    persist();
    listeners.forEach((l) => l());
  },
  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
  reset() { state = defaults(); persist(); listeners.forEach((l) => l()); },
};

/** The whole save, kept in sync. During server render and hydration it is the default save. */
export function useSave(): Save {
  return useSyncExternalStore(store.subscribe, current, () => SERVER_SNAPSHOT);
}

/** One slice of the save. The selector must return a primitive or an object from the save. */
export function useSaveSelector<T>(select: (s: Save) => T): T {
  return useSyncExternalStore(store.subscribe, () => select(current()), () => select(SERVER_SNAPSHOT));
}

const noop = () => () => {};
/** False during server render and hydration, true once the browser has the real save. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}

/** Captain level grows with chapters finished (story progress, never performance). */
export function levelInfo(s: Save) {
  return { level: 1 + s.done.length, chaptersDone: s.done.length };
}
