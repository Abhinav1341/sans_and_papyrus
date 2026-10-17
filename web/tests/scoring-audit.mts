/**
 * Checks the player-scoring rules for conflicts, in two layers:
 *
 * 1. Items: does each situation's scoring agree with itself? (a flat primary skill that can't be measured,
 *    the best answer lowering a skill, a good answer read as a poor one, the weakest answer raising a skill).
 *    These are content findings: the item's scores should be fixed, or the item marked an open choice.
 * 2. Rules: simulated children play hundreds of items, and the engine's rules must not contradict each other
 *    (best answers grow skills, weak ones don't, rushing never pays, a thoughtful hint never costs,
 *    open choices never move skills, only strong players step up, every skill can actually be measured).
 *    These are hard failures: the command exits with an error.
 *
 * Run from web/:
 *   npm run test:scoring            the seeds in generator/seeds (no cloud needed)
 *   npm run test:scoring -- --live  the live bank in Firestore (needs .env.local and gcloud login)
 *   add --write to save the result for the "How it works" page (src/data/scoring-audit.json)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { COMPETENCIES, Situation, type Competency } from '../lib/schemas';
import { loadBank } from '../src/server/bank';
import { GAME } from '../src/server/config';
import { applyAnswer, canStepUp, createPlayer, ratingFor, shortlist, type Round, type Skill } from '../src/server/engine';

const live = process.argv.includes('--live');
const seedsDir = join(import.meta.dirname, '..', '..', 'generator', 'seeds');
const bank: Situation[] = live
  ? (await loadBank(true)).items
  : ['seed-situations.json', 'seed-puzzles.json', 'seed-situations-research.json']
      .flatMap((f) => JSON.parse(readFileSync(join(seedsDir, f), 'utf8')) as unknown[])
      .map((x) => Situation.parse(x));
const situations = bank.filter((i) => i.kind === 'situation');
console.log(`Scoring audit on ${bank.length} items (${situations.length} situations) from ${live ? 'the live bank' : 'generator/seeds'}\n`);

const sum = (o: Situation['options'][number], cs: readonly Competency[]) => cs.reduce((a, c) => a + (o.scores?.[c] ?? 0), 0);
const normal = (i: Situation) => i.expectedTimeSec * 1000; // a calm, unhurried answer
/** A player whose level matches the item, so every skill is expected to score 0.5 (a fair, neutral test). */
const neutralFor = (i: Situation) => {
  const p = createPlayer('audit', i.ageBand === '8-10' ? 9 : 12, 'Audit');
  for (const s of Object.keys(p.skills) as Skill[]) p.skills[s] = ratingFor(p, i);
  return p;
};

/* ------------------------------------------------------------------ */
/* 1. Items                                                            */
/* ------------------------------------------------------------------ */

type Finding = { id: string; title: string; problem: string };
const findings: Finding[] = [];
for (const i of situations) {
  const prim = i.primaryCompetencies;
  const add = (problem: string) => findings.push({ id: i.id, title: i.title, problem });
  for (const c of prim) {
    const vals = i.options.map((o) => o.scores?.[c] ?? 0);
    if (Math.max(...vals) === Math.min(...vals)) add(`flat primary skill: every option scores ${vals[0]} on ${c}, so it can't be measured`);
  }
  if (i.openChoice) continue; // open choices don't move skills, so the remaining checks don't apply
  const ranked = [...i.options].sort((a, b) => sum(b, prim) - sum(a, prim) || sum(b, COMPETENCIES) - sum(a, COMPETENCIES));
  const best = ranked[0], worst = ranked[ranked.length - 1];
  const bestOut = applyAnswer(neutralFor(i), i, { optionId: best.id, responseTimeMs: normal(i), hintOpened: false });
  for (const [s, d] of Object.entries(bestOut.skillChanges)) if (d <= -3) add(`best answer "${best.id}" lowers ${s} by ${-d}`);
  const worstOut = applyAnswer(neutralFor(i), i, { optionId: worst.id, responseTimeMs: normal(i), hintOpened: false });
  for (const [s, d] of Object.entries(worstOut.skillChanges)) if (d >= 3) add(`weakest answer "${worst.id}" raises ${s} by ${d}`);
  for (const o of i.options) {
    if (o === best || !prim.every((c) => (o.scores?.[c] ?? 0) >= 1)) continue;
    const out = applyAnswer(neutralFor(i), i, { optionId: o.id, responseTimeMs: normal(i), hintOpened: false });
    if (out.performance < 0.5) add(`good answer "${o.id}" (+1 or more on every primary skill) is read as weak (performance ${out.performance.toFixed(2)})`);
  }
}
const flagged = new Set(findings.map((f) => f.id)).size;
console.log(`Items: ${flagged} of ${situations.length} situations have a scoring conflict${findings.length ? ':' : '.'}`);
for (const f of findings) console.log(`  - ${f.id} "${f.title}": ${f.problem}`);

/* ------------------------------------------------------------------ */
/* 2. Rules                                                            */
/* ------------------------------------------------------------------ */

let failures = 0, checks = 0, simulated = 0;
const check = (ok: unknown, msg: string) => {
  console.log(`  ${ok ? '✓' : '✗'} ${msg}`);
  checks++;
  if (!ok) failures++;
};
let seed = 42;
const random = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);

type Style = 'best' | 'worst' | 'random' | 'best-rushed' | 'best-hint';
function choose(i: Situation, style: Style): string {
  if (i.kind === 'puzzle') return style === 'worst' ? i.options.find((o) => o.id !== i.puzzle!.correctOptionId)!.id
    : style === 'random' ? i.options[Math.floor(random() * i.options.length)].id : i.puzzle!.correctOptionId;
  if (style === 'random') return i.options[Math.floor(random() * i.options.length)].id;
  const r = [...i.options].sort((a, b) => sum(b, i.primaryCompetencies) - sum(a, i.primaryCompetencies));
  return (style === 'worst' ? r[r.length - 1] : r[0]).id;
}

/** One simulated child plays `n` items chosen by the real shortlist; returns the profile and the items seen. */
function simulate(age: number, style: Style, n: number) {
  seed = 42; // every style sees the same random stream, so they are compared fairly
  simulated++;
  let p = createPlayer(`sim-${style}`, age, 'Sim');
  const start = { ...p.skills };
  const byId = new Map(bank.map((i) => [i.id, i]));
  const seen: Situation[] = [];
  let round: Round | null = null;
  for (let k = 0; k < n; k++) {
    if (!round || round.answered.length >= round.size)
      round = { id: `r${k}`, playerId: p.id, gateId: 'g', size: GAME.roundSize(age), served: [], answered: [], current: null, ease: 0, status: 'active', createdAt: '', updatedAt: '' };
    const [top] = shortlist(bank, p, round, byId, random);
    if (!top) break;
    const i = top.item;
    const rushed = style === 'best-rushed';
    const out = applyAnswer(p, i, {
      optionId: choose(i, style),
      responseTimeMs: rushed ? normal(i) * 0.2 : normal(i),
      hintOpened: style === 'best-hint' && !!i.hint,
      hintOpenedAtMs: normal(i) * 0.5,
    });
    p = out.player;
    seen.push(i);
    round = { ...round, served: [...round.served, i.id], answered: [...round.answered, i.id], ease: out.ease };
  }
  return { p, start, seen };
}

const N = 120;
for (const age of [9, 12]) {
  console.log(`\nRules, age ${age} (${N} items per simulated child):`);
  const run = Object.fromEntries((['best', 'worst', 'random', 'best-rushed', 'best-hint'] as Style[]).map((s) => [s, simulate(age, s, N)]));
  const delta = (s: Style, k: Skill) => run[s].p.skills[k] - run[s].start[k];
  const measured = COMPETENCIES.filter((c) => run.best.seen.some((i) => i.kind === 'situation' && i.primaryCompetencies.includes(c)));
  check(measured.length === COMPETENCIES.length, `every CASEL skill is measured (${measured.length}/5 appear as a primary skill)`);
  for (const c of COMPETENCIES) {
    check(delta('best', c) > 0, `best answers grow ${c} (${delta('best', c).toFixed(0)})`);
    check(delta('worst', c) < 0, `weakest answers don't grow ${c} (${delta('worst', c).toFixed(0)})`);
    check(delta('best', c) > delta('random', c) && delta('random', c) > delta('worst', c), `${c}: best > random > weakest`);
    check(delta('best-rushed', c) <= delta('best', c), `rushing never pays on ${c} (${delta('best-rushed', c).toFixed(0)} vs ${delta('best', c).toFixed(0)})`);
  }
  check(delta('best-hint', 'relationshipSkills') >= delta('best', 'relationshipSkills'), `a thoughtful hint never costs relationship skills (${delta('best-hint', 'relationshipSkills').toFixed(0)} vs ${delta('best', 'relationshipSkills').toFixed(0)})`);
  const stepped = run.best.seen.filter((i) => i.ageBand !== run.best.p.ageBand).length;
  const weakStepped = run.worst.seen.filter((i) => i.ageBand !== run.worst.p.ageBand).length;
  check(weakStepped === 0, `a struggling child never gets older-band items (${weakStepped})`);
  if (age === 9) console.log(`  · a strong 9-year-old got ${stepped} older-band items after outgrowing their band`);
  const repeats = run.random.seen.length - new Set(run.random.seen.map((i) => i.id)).size;
  console.log(`  · ${new Set(run.random.seen.map((i) => i.id)).size} different items in ${run.random.seen.length} plays (${repeats} repeats)`);
}

const open = situations.find((i) => i.openChoice);
if (open) {
  console.log('\nOpen choices:');
  const out = applyAnswer(neutralFor(open), open, { optionId: open.options[0].id, responseTimeMs: normal(open), hintOpened: false });
  check(Object.keys(out.skillChanges).length === 0 && out.ease === 0, `"${open.title}" records the choice without moving any skill or the next item's level`);
} else console.log('\n(no open-choice items in this bank yet)');

const strong = createPlayer('x', 9, 'X');
for (const s of Object.keys(strong.skills) as Skill[]) strong.skills[s] = 900;
const older = bank.find((i) => i.ageBand === '11-14' && i.difficulty <= GAME.stepUp.maxDifficulty);
if (older) check(!canStepUp(strong, older), 'a 9-year-old at the starting level cannot step up');

console.log(`\n${failures ? `${failures} rule conflict(s) found.` : 'No rule conflicts.'} ${findings.length} item finding(s) on ${flagged} item(s).`);
if (process.argv.includes('--write'))
  writeFileSync(join(import.meta.dirname, '..', 'src', 'data', 'scoring-audit.json'), JSON.stringify({
    asOf: new Date().toISOString(), bank: live ? 'live' : 'seeds', items: bank.length, situations: situations.length,
    itemsWithConflicts: flagged, ruleChecks: checks, ruleConflicts: failures, simulatedChildren: simulated, itemsPerChild: N,
    openChoices: situations.filter((i) => i.openChoice).length,
  }, null, 2) + '\n');
process.exit(failures ? 1 : 0);
