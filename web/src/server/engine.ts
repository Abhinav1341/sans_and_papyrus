/**
 * The adaptive part of the game, as pure functions (no database, no AI), so it is easy to test.
 *
 * Skills and items share one scale (an Elo-style rating). Each answer moves the child's skill levels
 * towards what their choice showed. The next item is chosen to sit slightly above their level, to
 * vary categories and settings, to gently favour the skills that are still growing, and never to
 * repeat recent or near-identical items.
 */
import {
  COMPETENCIES, PUZZLE_EVERY_N_ITEMS, newPlayerProfile,
  type Competency, type PlayerProfile, type Situation, type SkillLevels,
} from '../../lib/schemas';
import { GAME } from './config';

export type Skill = keyof SkillLevels;

/* ------------------------------------------------------------------ */
/* Players                                                             */
/* ------------------------------------------------------------------ */

export function createPlayer(accountId: string, age: number, heroName: string): PlayerProfile {
  const base = newPlayerProfile(accountId, GAME.ageBand(age));
  const start = GAME.initialSkill(age);
  const skills = Object.fromEntries(Object.keys(base.skills).map((k) => [k, start])) as SkillLevels;
  return { ...base, skills, age, heroName, startSkill: start, recentCategories: [], roundsPlayed: 0 };
}

/** Changing age moves the band and re-centres skills on the new age, keeping what was learned. */
export function changeAge(p: PlayerProfile, age: number): PlayerProfile {
  const oldStart = p.startSkill ?? GAME.initialSkill(p.age ?? age);
  const shift = GAME.initialSkill(age) - oldStart;
  const skills = Object.fromEntries(Object.entries(p.skills).map(([k, v]) => [k, v + shift])) as SkillLevels;
  return { ...p, age, ageBand: GAME.ageBand(age), skills, startSkill: GAME.initialSkill(age), updatedAt: new Date().toISOString() };
}

/* ------------------------------------------------------------------ */
/* Items                                                               */
/* ------------------------------------------------------------------ */

export const categoryOf = (i: Situation): string =>
  i.kind === 'puzzle' ? `puzzle:${i.puzzle!.domain}` : `situation:${i.primaryCompetencies[0]}`;

/** The skills an item mainly exercises. */
export function skillsOf(i: Situation): Skill[] {
  return i.kind === 'puzzle' ? [i.puzzle!.domain] : (i.primaryCompetencies.length ? i.primaryCompetencies : [...COMPETENCIES]);
}

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
export const levelFor = (p: PlayerProfile, i: Situation) => avg(skillsOf(i).map((s) => p.skills[s]));
const caselAverage = (p: PlayerProfile) => avg(COMPETENCIES.map((c) => p.skills[c]));

/* ------------------------------------------------------------------ */
/* Rounds and the shortlist                                            */
/* ------------------------------------------------------------------ */

export interface Round {
  id: string;
  playerId: string;
  gateId: string;
  size: number;
  served: string[];           // item ids, in order
  answered: string[];
  current: { itemId: string; optionOrder: string[]; servedAt: number; picker: PickerInfo } | null;
  ease: number;               // added to the target level for the next item
  status: 'active' | 'done';
  createdAt: string;
  updatedAt: string;
}

export interface PickerInfo {
  shortlistIds: string[];
  chosenId: string;
  reason: string;
  source: 'ai' | 'fallback';
}

export interface Candidate {
  item: Situation;
  score: number;
  target: number;
  rating: number;
  why: string[];
}

/**
 * Ranks the items a child could see next. `random` is injectable so tests are repeatable.
 * Returns up to GAME.shortlistSize candidates, best first.
 */
export function shortlist(bank: Situation[], p: PlayerProfile, round: Round, byId: Map<string, Situation>, random: () => number = Math.random): Candidate[] {
  const band = p.ageBand;
  const inRound = new Set(round.served);
  const recent = p.recentSituationIds.slice(-GAME.recentWindow);
  const lastServed = round.served.length ? byId.get(round.served[round.served.length - 1]) : undefined;
  const avoidSimilar = new Set(
    [...round.served, ...recent.slice(-3)].flatMap((id) => byId.get(id)?.similarIds ?? [])
  );
  const roundCategories = round.served.map((id) => byId.get(id)).filter(Boolean).map((i) => categoryOf(i!));
  const puzzlesInRound = round.served.filter((id) => byId.get(id)?.kind === 'puzzle').length;
  const isFirst = round.served.length === 0;
  const puzzleDue = p.itemsSinceLastPuzzle >= PUZZLE_EVERY_N_ITEMS - 1;
  const recentCats = p.recentCategories ?? [];
  const casel = caselAverage(p);

  const eligible = (strictRecent: number) =>
    bank.filter((i) => {
      if (i.ageBand !== band || inRound.has(i.id)) return false;
      if (strictRecent > 0 && recent.slice(-strictRecent).includes(i.id)) return false; // slice(-0) would be everything
      if (i.kind === 'puzzle' && (isFirst || puzzlesInRound >= GAME.maxPuzzlesPerRound)) return false;
      return true;
    });
  // Prefer items not seen recently; if the bank for this band is small, relax step by step.
  let pool = eligible(GAME.recentWindow);
  if (pool.length < GAME.shortlistSize * 2) pool = eligible(10);
  if (pool.length < GAME.shortlistSize) pool = eligible(0);

  const scored = pool.map((item): Candidate => {
    const why: string[] = [];
    const level = levelFor(p, item);
    const target = level + GAME.stretch + round.ease;
    const rating = GAME.itemRating(item.difficulty);
    let score = -Math.abs(rating - target) / 150;

    if (avoidSimilar.has(item.id)) { score -= 1.2; why.push('similar to a recent item'); }
    const cat = categoryOf(item);
    if (lastServed && categoryOf(lastServed) === cat) { score -= 0.7; why.push('same category as the last item'); }
    else if (roundCategories.includes(cat)) { score -= 0.35; why.push('category already in this round'); }
    if (!recentCats.slice(-6).includes(cat)) { score += 0.2; why.push('fresh category'); }

    if (item.kind === 'situation') {
      // Gently favour the competencies that are still growing.
      const gap = (casel - level) / 100;
      if (gap > 0) { score += Math.min(0.6, gap * 0.6); why.push('a growing skill'); }
    } else if (puzzleDue) {
      score += 0.9; why.push('puzzle due');
    } else {
      score -= 0.4;
    }
    score += random() * 0.15;
    return { item, score, target, rating, why };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, GAME.shortlistSize);
}

/* ------------------------------------------------------------------ */
/* Answers                                                             */
/* ------------------------------------------------------------------ */

export interface AnswerInput {
  optionId: string;
  responseTimeMs: number;
  hintOpened: boolean;
  hintOpenedAtMs?: number;
}

export interface AnswerOutcome {
  player: PlayerProfile;
  performance: number;        // 0–1: how well the choice showed the item's skills
  correct?: boolean;          // puzzles only (never shown to the child as right or wrong)
  timeRatio: number;
  ease: number;               // for the next item in this round
  skillChanges: Partial<Record<Skill, number>>;
}

const expectedScore = (skill: number, rating: number) => 1 / (1 + 10 ** ((rating - skill) / 400));
const round1 = (n: number) => Math.round(n * 10) / 10;

export function applyAnswer(p0: PlayerProfile, item: Situation, a: AnswerInput): AnswerOutcome {
  const p: PlayerProfile = structuredClone(p0);
  const rating = GAME.itemRating(item.difficulty);
  const timeRatio = Math.max(0, a.responseTimeMs / 1000 / item.expectedTimeSec);
  const rushed = timeRatio < GAME.rushedRatio;
  const weight = rushed ? 0.5 : timeRatio > GAME.slowRatio ? 0.7 : 1;
  const k = GAME.kFactor * weight;
  const changes: Partial<Record<Skill, number>> = {};
  const bump = (s: Skill, d: number) => {
    p.skills[s] += d;
    changes[s] = round1((changes[s] ?? 0) + d);
  };

  let performance: number;
  let correct: boolean | undefined;
  if (item.kind === 'puzzle') {
    correct = a.optionId === item.puzzle!.correctOptionId;
    performance = correct ? 1 : 0;
    const s = item.puzzle!.domain;
    bump(s, k * (performance - expectedScore(p.skills[s], rating)));
  } else {
    const chosen = item.options.find((o) => o.id === a.optionId)!;
    const perfs: number[] = [];
    for (const c of COMPETENCIES as readonly Competency[]) {
      const vals = item.options.map((o) => o.scores?.[c] ?? 0);
      const max = Math.max(...vals), min = Math.min(...vals);
      if (max === min) continue; // the options don't differ on this skill: nothing to learn
      const perf = ((chosen.scores?.[c] ?? 0) - min) / (max - min);
      const primary = item.primaryCompetencies.includes(c);
      if (primary) perfs.push(perf);
      bump(c, k * (primary ? 1 : 0.5) * (perf - expectedScore(p.skills[c], rating)));
    }
    performance = perfs.length ? avg(perfs) : 0.5;
    if (rushed) bump('selfManagement', -3); // answering before reading is a self-management signal
  }

  // Help-seeking: asking for help when it's genuinely hard is a strength.
  if (item.hint) p.helpSeeking.hintsOffered++;
  if (a.hintOpened && item.hint) {
    p.helpSeeking.hintsUsed++;
    const thoughtful =
      (a.hintOpenedAtMs ?? 0) >= GAME.thoughtfulHintShare * item.expectedTimeSec * 1000 && rating >= levelFor(p0, item) - 50;
    if (thoughtful) {
      p.helpSeeking.thoughtfulUses++;
      bump('relationshipSkills', GAME.helpSeekingBoost);
    } else {
      p.helpSeeking.reflexUses++;
    }
  }

  p.timeRatioAvg = Math.round((p.timeRatioAvg * 0.8 + Math.min(timeRatio, 5) * 0.2) * 100) / 100;
  p.recentSituationIds = [...p.recentSituationIds, item.id].slice(-GAME.recentWindow);
  p.recentCategories = [...(p.recentCategories ?? []), categoryOf(item)].slice(-10);
  p.itemsSinceLastPuzzle = item.kind === 'puzzle' ? 0 : p.itemsSinceLastPuzzle + 1;
  p.totalPlayed++;
  p.updatedAt = new Date().toISOString();
  for (const s of Object.keys(p.skills) as Skill[]) p.skills[s] = round1(p.skills[s]);

  const struggled = a.hintOpened || performance < 0.4;
  const ease = struggled ? GAME.easeAfterStruggle : performance >= 0.8 ? GAME.liftAfterSuccess : 0;
  return { player: p, performance, correct, timeRatio, ease, skillChanges: changes };
}

/** Fisher–Yates shuffle of an item's option ids, so the best option isn't always in the same place. */
export function shuffledOptionIds(item: Situation, random: () => number = Math.random): string[] {
  const ids = item.options.map((o) => o.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}
