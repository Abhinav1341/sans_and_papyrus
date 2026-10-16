// The ring of worlds and the chapters in story order. Locked worlds show as "coming soon".
import type { Chapter, Scene, Shot, World } from '@/cinema/types';
import { prologue } from './prologue';
import { candy } from './candy';

export const WORLDS: World[] = [
  prologue,
  candy,
  { id: 'magic', kind: 'magic', label: 'World 2', title: 'Wizzlewick, the Magic Kingdom', locked: true, chapters: [] },
  { id: 'space', kind: 'space', label: 'World 3', title: 'Station Zeta', locked: true, chapters: [] },
  { id: 'dino', kind: 'dino', label: 'World 4', title: 'Dino Valley', locked: true, chapters: [] },
  { id: 'ocean', kind: 'ocean', label: 'World 5', title: 'Deep Blue City', locked: true, chapters: [] },
  { id: 'noir', kind: 'noir', label: 'World 6', title: 'Noir Town', locked: true, chapters: [] },
  { id: 'pirate', kind: 'pirate', label: 'World 7', title: 'The Sky Pirate Islands', locked: true, chapters: [] },
  { id: 'glitch', kind: 'glitch', label: 'World 8', title: 'The Glitch World', locked: true, chapters: [] },
];

export interface ChapterRef extends Chapter { world: World; index: number }

export const CHAPTERS: ChapterRef[] = WORLDS.flatMap((w) => w.chapters.map((c, i) => ({ ...c, world: w, index: i })));

export function chapterById(id: string | null | undefined): ChapterRef | null {
  return CHAPTERS.find((c) => c.id === id) || null;
}

export function nextChapter(id: string): ChapterRef | null {
  const i = CHAPTERS.findIndex((c) => c.id === id);
  return i >= 0 && i < CHAPTERS.length - 1 ? CHAPTERS[i + 1] : null;
}

/** The chapter to play next (the first one not finished). */
export function currentChapter(done: string[]): ChapterRef {
  return CHAPTERS.find((c) => !done.includes(c.id)) || CHAPTERS[CHAPTERS.length - 1];
}

export function isUnlocked(id: string, done: string[]): boolean {
  const i = CHAPTERS.findIndex((c) => c.id === id);
  if (i <= 0) return i === 0;
  return done.includes(CHAPTERS[i - 1].id) || done.includes(id);
}

/** One entry per shot in reading order. Progress is saved as an index into this list. */
export interface FlatShot { scene: Scene; sceneIndex: number; shotIndex: number; shot: Shot }
export function flatten(ch: Chapter): FlatShot[] {
  return ch.scenes.flatMap((scene, sceneIndex) => scene.shots.map((shot, shotIndex) => ({ scene, sceneIndex, shotIndex, shot })));
}
