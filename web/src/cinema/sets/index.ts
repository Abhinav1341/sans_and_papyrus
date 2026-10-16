// Every set in the story, built on first use and cached.
import type { SetDef } from './types';
import { hall, storeroom } from './school';
import { vortex, sky, station } from './space';
import { candyland, jellycourse, river, garden, mountain, summit, camp } from './candy';
import { galaxy, vista } from './world';

const BUILDERS: Record<string, () => SetDef> = {
  hall, storeroom, vortex, sky, station, galaxy, vista,
  candyland, jellycourse, river, garden, mountain, summit, camp,
};

const cache = new Map<string, SetDef>();
export function getSet(id: string): SetDef {
  let s = cache.get(id);
  if (!s) {
    const b = BUILDERS[id];
    if (!b) throw new Error(`Unknown set: ${id}`);
    s = b();
    cache.set(id, s);
  }
  return s;
}

export const SET_IDS = Object.keys(BUILDERS);
export type { SetDef };
