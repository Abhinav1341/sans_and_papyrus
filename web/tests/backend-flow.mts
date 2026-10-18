/**
 * End-to-end test of the game backend without Google Cloud: in-memory database, the real seed bank,
 * and Gemini switched off (so the code fallback picker and plain report are used).
 *
 * Run from web/:  npm run test:backend
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Situation, type PlayEvent } from '../lib/schemas';
import { createGuest, deleteAccountAndData, signInWithEmail, signUpWithEmail, upgradeGuest } from '../src/server/accounts';
import { setBankForTests } from '../src/server/bank';
import { COLLECTIONS, GAME } from '../src/server/config';
import { MemoryDb, setDb } from '../src/server/db';
import { applyAnswer, categoryOf, createPlayer, ratingFor, shortlist, type Round } from '../src/server/engine';
import { limit, resetLimits } from '../src/server/limits';
import { getPlayer, upsertPlayer } from '../src/server/players';
import { getReport } from '../src/server/report';
import { checkReport } from '../src/server/report-check';
import { answerItem, nextItem, retryItem, startRound } from '../src/server/rounds';
import { createSessionValue, readSessionValue } from '../src/server/session';
import { partText } from '../src/server/tts';

process.env.GAME_AI = 'off'; // no AI in tests: exercise the code fallbacks

let failures = 0;
const check = (cond: unknown, msg: string) => {
  if (cond) console.log(`  ✓ ${msg}`);
  else { failures++; console.log(`  ✗ ${msg}`); }
};
async function rejects(p: Promise<unknown>, status: number, msg: string) {
  try { await p; check(false, msg); } catch (e) { check((e as { status?: number }).status === status, `${msg} (got ${(e as { status?: number }).status})`); }
}

const seedsDir = join(import.meta.dirname, '..', '..', 'generator', 'seeds');
const bank = ['seed-situations.json', 'seed-puzzles.json', 'seed-young.json'].flatMap((f) => JSON.parse(readFileSync(join(seedsDir, f), 'utf8')) as unknown[]).map((x) => Situation.parse(x));
const byId = new Map(bank.map((i) => [i.id, i]));

const db = new MemoryDb();
setDb(db);
setBankForTests(bank);

const total = (s?: Record<string, number>) => (s ? Object.values(s).reduce((a, b) => a + b, 0) : 0);
const best = (item: Situation) =>
  item.kind === 'puzzle' ? item.puzzle!.correctOptionId : [...item.options].sort((a, b) => total(b.scores) - total(a.scores))[0].id;
const worst = (item: Situation) =>
  item.kind === 'puzzle' ? item.options.find((o) => o.id !== item.puzzle!.correctOptionId)!.id : [...item.options].sort((a, b) => total(a.scores) - total(b.scores))[0].id;

async function playRound(accountId: string, gateId: string, style: 'strong' | 'weak' | 'rushed') {
  const start = await startRound(accountId, gateId);
  const served: string[] = [];
  let item = start.item;
  for (;;) {
    served.push(item.id);
    const full = byId.get(item.id)!;
    const optionId = style === 'strong' ? best(full) : worst(full);
    const responseTimeMs = style === 'rushed' ? full.expectedTimeSec * 100 : full.expectedTimeSec * 1000;
    const r = await answerItem(accountId, start.roundId, item.id, {
      optionId, responseTimeMs, hintOpened: style === 'weak' && !!full.hint, hintOpenedAtMs: full.expectedTimeSec * 500,
    });
    if (!r.feedback.consequence) throw new Error('missing consequence');
    if (r.done) break;
    const n = await nextItem(accountId, start.roundId);
    if (n.done) break;
    item = n.item;
  }
  return { size: start.size, served, first: start.item };
}

console.log('\nAccounts and sessions');
const acct = await signUpWithEmail('Parent@Example.com', 'correct horse');
await rejects(signUpWithEmail('parent@example.com', 'another one'), 409, 'duplicate email is refused (case-insensitive)');
await rejects(signInWithEmail('parent@example.com', 'wrong password'), 401, 'wrong password is refused');
check((await signInWithEmail(' PARENT@example.com ', 'correct horse')).id === acct.id, 'sign-in works with the right password');
check(!JSON.stringify(await db.get(COLLECTIONS.accounts, acct.id)).includes('correct horse'), 'password is not stored in plain text');
const cookie = createSessionValue(acct.id);
check(readSessionValue(cookie) === acct.id, 'session cookie round-trips');
check(readSessionValue(cookie.slice(0, -2) + 'xx') === null, 'tampered session cookie is rejected');

console.log('\nCaptain setup');
await rejects(startRound(acct.id, 'g-p-warmup'), 409, 'a round needs a Captain first');
const p0 = await upsertPlayer(acct.id, 'Aarav', 9);
check(p0.ageBand === '8-10' && p0.skills.socialAwareness === GAME.initialSkill(9), `age 9 → band 8-10, starting skill ${GAME.initialSkill(9)}`);

console.log('\nFirst round (strong answers)');
const r1 = await playRound(acct.id, 'g-p-warmup', 'strong');
check(r1.size === GAME.roundSize(9), `round size for age 9 is ${GAME.roundSize(9)}`);
check(r1.served.length === r1.size, `served ${r1.served.length} items`);
check(new Set(r1.served).size === r1.served.length, 'no repeats within a round');
check(r1.served.every((id) => byId.get(id)!.ageBand === '8-10'), 'every item is in the 8-10 band');
check(byId.get(r1.served[0])!.kind === 'situation', 'a round opens with a situation, not a puzzle');
check(r1.served.filter((id) => byId.get(id)!.kind === 'puzzle').length <= GAME.maxPuzzlesPerRound, 'at most one puzzle per round');
check(!('scores' in (r1.first.options[0] as object)) && !JSON.stringify(r1.first).includes('correctOptionId'), 'the browser never sees scores or answers');
const cats = r1.served.map((id) => categoryOf(byId.get(id)!));
check(cats.every((c, i) => i === 0 || c !== cats[i - 1]), `no category twice in a row (${cats.join(', ')})`);
const p1 = (await getPlayer(acct.id))!;
const avg = (p: typeof p1) => (['selfAwareness', 'selfManagement', 'socialAwareness', 'relationshipSkills', 'responsibleDecisionMaking'] as const).reduce((a, c) => a + p.skills[c], 0) / 5;
check(avg(p1) > avg(p0), `strong answers raise skills (${avg(p0).toFixed(0)} → ${avg(p1).toFixed(0)})`);
check(p1.roundsPlayed === 1 && p1.totalPlayed === r1.size, 'rounds and items are counted');

console.log('\nAnswer validation');
const rv = await startRound(acct.id, 'g-c1-power');
await rejects(answerItem(acct.id, rv.roundId, 'not-the-item', { optionId: 'a', responseTimeMs: 5000, hintOpened: false }), 409, 'answering an item that was not served is refused');
await rejects(answerItem(acct.id, rv.roundId, rv.item.id, { optionId: 'z', responseTimeMs: 5000, hintOpened: false }), 400, 'an option that does not exist is refused');
const other = await signUpWithEmail('someone@else.com', 'password123');
await rejects(answerItem(other.id, rv.roundId, rv.item.id, { optionId: 'a', responseTimeMs: 5000, hintOpened: false }), 404, "another account can't answer this round");
const again = await nextItem(acct.id, rv.roundId);
check(!again.done && again.item.id === rv.item.id, 'asking for "next" before answering returns the same item');

console.log('\nStruggling rounds (weak answers with hints) adapt downwards');
const before = (await getPlayer(acct.id))!;
const r2 = await playRound(acct.id, 'g-c2-bounce', 'weak');
const after = (await getPlayer(acct.id))!;
check(avg(after) < avg(before), `weak answers lower skills (${avg(before).toFixed(0)} → ${avg(after).toFixed(0)})`);
check(after.helpSeeking.hintsUsed > 0, `hints recorded (${after.helpSeeking.hintsUsed} used, ${after.helpSeeking.thoughtfulUses} thoughtful)`);
const avgDiff = (ids: string[]) => ids.reduce((a, id) => a + byId.get(id)!.difficulty, 0) / ids.length;
console.log(`    difficulty: strong round ${avgDiff(r1.served).toFixed(2)}, struggling round ${avgDiff(r2.served).toFixed(2)}`);
check(r2.served.every((id) => !r1.served.includes(id)), 'items from the last round are not repeated');

console.log('\nRushed answers');
const beforeRush = (await getPlayer(acct.id))!;
await playRound(acct.id, 'g-c3-raft', 'rushed');
const afterRush = (await getPlayer(acct.id))!;
check(afterRush.timeRatioAvg < beforeRush.timeRatioAvg, `rushing lowers the time-ratio average (${beforeRush.timeRatioAvg} → ${afterRush.timeRatioAvg})`);

console.log('\nPuzzles appear about once in four items');
for (const g of ['g-c4-garden', 'g-c5-climb', 'g-p-warmup', 'g-c1-power']) await playRound(acct.id, g, 'strong');
const events = await db.where<PlayEvent>(COLLECTIONS.events, 'playerId', acct.id);
const puzzles = events.filter((e) => e.kind === 'puzzle').length;
console.log(`    ${puzzles} puzzles in ${events.length} items; distinct items ${new Set(events.map((e) => e.situationId)).size}`);
check(puzzles >= 1 && puzzles <= Math.ceil(events.length / 3), 'puzzle share stays small but present');
check(events.every((e) => e.picker.shortlistIds.includes(e.picker.chosenId)), 'every pick came from its shortlist');
check(events.every((e) => e.picker.source === 'fallback'), 'without Gemini, the code fallback picks (no waiting, no crash)');

console.log('\nStrong 8-10 players can step up to gentle 11-14 items');
// A round in progress with a puzzle due (the seed bank's gentle 11-14 items are puzzles).
const firstSit = bank.find((i) => i.ageBand === '8-10' && i.kind === 'situation')!;
const midRound: Round = { id: 'r', playerId: 't', gateId: 'g', size: 4, served: [firstSit.id], answered: [firstSit.id], current: null, ease: 0, status: 'active', createdAt: '', updatedAt: '' };
const withSkills = (age: number, level: number) => {
  const pl = { ...createPlayer('t', age, 'T'), itemsSinceLastPuzzle: 3 };
  for (const k of Object.keys(pl.skills) as (keyof typeof pl.skills)[]) pl.skills[k] = level;
  return pl;
};
const offered = (pl: ReturnType<typeof withSkills>) => {
  const seen = new Map<string, Situation>();
  for (let n = 0; n < 40; n++) for (const c of shortlist(bank, pl, midRound, byId)) seen.set(c.item.id, c.item);
  return [...seen.values()];
};
const strongOffers = offered(withSkills(9, 1400));
const older = strongOffers.filter((i) => i.ageBand === '11-14');
check(older.length > 0, `a strong 9-year-old is offered some 11-14 items (${older.length})`);
check(older.every((i) => i.difficulty <= GAME.stepUp['8-10']!.maxDifficulty), 'only the gentlest 11-14 items (difficulty 1-2)');
check(offered(withSkills(9, GAME.initialSkill(9))).every((i) => i.ageBand === '8-10'), 'a typical 9-year-old stays in the 8-10 band');
const young = offered(withSkills(7, 1400));
check(withSkills(7, 850).ageBand === '6-7' && GAME.ageBand(6) === '6-7', 'ages 6 and 7 → band 6-7');
check(young.every((i) => i.ageBand === '6-7' || (i.ageBand === '8-10' && i.difficulty <= GAME.stepUp['6-7']!.maxDifficulty)), 'a 7-year-old gets 6-7 items and only the easiest 8-10 items, never 11-14, however strong');
const typicalSix = offered(withSkills(6, GAME.initialSkill(6)));
check(typicalSix.some((i) => i.ageBand === '6-7'), `a typical 6-year-old is offered their own band's items (${typicalSix.filter((i) => i.ageBand === '6-7').length})`);
const olderPuzzle = bank.find((i) => i.ageBand === '11-14')!;
check(ratingFor(withSkills(9, 1000), olderPuzzle) === GAME.itemRating(olderPuzzle.difficulty) + GAME.stepUp['8-10']!.bandOffset, 'older-band items count harder for a younger player');

console.log('\nRounds fit their story gate');
const gateRound = (gateId: string): Round => ({ ...midRound, gateId, served: [], answered: [] });
const typical = withSkills(9, GAME.initialSkill(9));
const riddleOpeners = Array.from({ length: 20 }, () => shortlist(bank, typical, gateRound('g-c3-rescue'), byId)[0].item.kind);
check(riddleOpeners.filter((k) => k === 'puzzle').length >= 15, `a "solve the riddle" gate opens with a puzzle (${riddleOpeners.filter((k) => k === 'puzzle').length}/20)`);
check(Array.from({ length: 20 }, () => shortlist(bank, typical, gateRound('g-c2-gap'), byId)[0].item.kind).every((k) => k === 'situation'), 'other gates never open with a puzzle');
const gapTops = Array.from({ length: 20 }, () => shortlist(bank, typical, gateRound('g-c2-gap'), byId)[0]);
check(gapTops.filter((c) => c.why.includes('fits the story moment')).length >= 10, `the Big Gap mostly opens with a teamwork or decision item (${gapTops.filter((c) => c.why.includes('fits the story moment')).length}/20)`);

console.log('\nAge change re-centres skills');
const pBefore = (await getPlayer(acct.id))!;
const pOlder = await upsertPlayer(acct.id, 'Aarav', 12);
check(pOlder.ageBand === '11-14', 'age 12 → band 11-14');
check(Math.round(pOlder.skills.math - pBefore.skills.math) === GAME.initialSkill(12) - GAME.initialSkill(9), 'skills shift by the difference in starting level');
const r3 = await playRound(acct.id, 'g-c2-bounce', 'strong');
check(r3.size === GAME.roundSize(12) && r3.served.every((id) => byId.get(id)!.ageBand === '11-14'), `age 12 gets ${GAME.roundSize(12)} items from the 11-14 band`);

console.log('\nConcurrent requests');
await upsertPlayer(other.id, 'Meera', 9);
const rc = await startRound(other.id, 'g-p-warmup');
const fullRv = byId.get(rc.item.id)!;
const evBefore = (await db.where(COLLECTIONS.events, 'playerId', other.id)).length;
const playedBefore = (await getPlayer(other.id))!.totalPlayed;
const tap = () => answerItem(other.id, rc.roundId, rc.item.id, { optionId: best(fullRv), responseTimeMs: 5000, hintOpened: false });
const taps = await Promise.allSettled([tap(), tap(), tap()]);
check(taps.filter((t) => t.status === 'fulfilled').length === 1, 'a triple-tapped answer is saved once');
check(taps.filter((t) => t.status === 'rejected').every((t) => (t.reason as { status?: number }).status === 409), 'the extra taps get "already answered"');
check((await db.where(COLLECTIONS.events, 'playerId', other.id)).length === evBefore + 1 && (await getPlayer(other.id))!.totalPlayed === playedBefore + 1, 'one event and one count for one answer');
const nexts = await Promise.all([nextItem(other.id, rc.roundId), nextItem(other.id, rc.roundId), nextItem(other.id, rc.roundId)]);
check(new Set(nexts.map((n) => (n.done ? 'done' : n.item.id))).size === 1, 'concurrent "next" calls all get the same item');
const rvStored = (await db.get<{ served: string[] }>(COLLECTIONS.rounds, rc.roundId))!;
check(rvStored.served.length === 2, `the round recorded one new item, not three (${rvStored.served.length} served)`);
const n0 = nexts[0];
const [, upserted] = await Promise.all([
  n0.done ? Promise.resolve(null) : answerItem(other.id, rc.roundId, n0.item.id, { optionId: best(byId.get(n0.item.id)!), responseTimeMs: 5000, hintOpened: false }),
  upsertPlayer(other.id, 'Meera', 9),
]);
check((await getPlayer(other.id))!.totalPlayed === playedBefore + 2 && upserted.heroName === 'Meera', 'renaming the Captain while answering loses neither change');

console.log('\nParent report');
const rep = await getReport(acct.id);
check(rep.status === 'ready' && 'report' in rep && rep.report.summary.length > 0, `report ready (${'source' in rep ? rep.source : '?'})`);
const pr = (await getPlayer(acct.id))!;
check(Object.values(pr.skillPlays ?? {}).reduce((a, b) => a + b, 0) > 0, 'the profile keeps running totals, so the report reads no events');
const shape = 'shape' in rep ? rep.shape : undefined;
check(shape && shape.social.length === 5 && [...shape.social, ...(shape.thinking ?? [])].every((x) => x.now >= 0 && x.now <= 1 && x.start === 0.5),
  'the report carries a skill shape: 5 social axes, positions between 0 and 1, start in the middle');
check(!JSON.stringify(shape).match(/\b(9|1[0-4])\d\d\b/), 'the shape holds positions only, never raw skill numbers');
check(shape?.social.some((x) => x.trend !== 'new'), 'skills the Captain practised are marked with a trend');
const rep2 = await getReport(acct.id, true);
check('createdAt' in rep && 'createdAt' in rep2 && rep2.createdAt === rep.createdAt, '"refresh" straight away reuses the report (cooldown)');
// A profile saved before the running totals existed: the report counts them from the events, once.
const legacy = { ...(await db.get<Record<string, unknown>>(COLLECTIONS.players, acct.id))! };
delete legacy.skillPlays; delete legacy.recentReasons;
await db.set(COLLECTIONS.players, acct.id, legacy);
await db.del(COLLECTIONS.reports, acct.id);
await getReport(acct.id);
const sorted = (o?: Record<string, number>) => JSON.stringify(Object.entries(o ?? {}).sort());
check(sorted((await getPlayer(acct.id))!.skillPlays) === sorted(pr.skillPlays), 'older profiles get their totals counted from the events once');

console.log('\nRequest limits and sessions');
resetLimits();
const rule = { max: 3, windowMs: 60_000 };
let blocked = 0;
for (let i = 0; i < 5; i++) { try { limit('guest:1.2.3.4', rule); } catch (e) { if ((e as { status?: number }).status === 429) blocked++; } }
check(blocked === 2, 'the 4th and 5th request in a window are refused with 429');
let otherOk = true;
try { limit('guest:5.6.7.8', rule); } catch { otherOk = false; }
check(otherOk, 'another address has its own limit');
const env = process.env as Record<string, string | undefined>;
const [savedEnv, savedSecret] = [env.NODE_ENV, env.SESSION_SECRET];
env.NODE_ENV = 'production'; delete env.SESSION_SECRET;
let threw = false;
try { createSessionValue('x'); } catch { threw = true; }
env.NODE_ENV = savedEnv; env.SESSION_SECRET = savedSecret;
check(threw, 'without SESSION_SECRET, production refuses to sign sessions');

console.log('\nGuests can save their progress');
const g = await createGuest();
await upsertPlayer(g.id, 'Kiran', 10);
const gr = await startRound(g.id, 'g-p-warmup');
await answerItem(g.id, gr.roundId, gr.item.id, { optionId: best(byId.get(gr.item.id)!), responseTimeMs: 5000, hintOpened: false });
const guestBefore = (await getPlayer(g.id))!;
const saved = await upgradeGuest(g.id, { method: 'email', email: 'Kiran.Parent@example.com', password: 'longenough' });
check(saved.id === g.id && saved.type === 'email', 'saving keeps the same account and makes it an email account');
check((await getPlayer(g.id))!.totalPlayed === guestBefore.totalPlayed && guestBefore.totalPlayed === 1, 'the Captain and their play carry over');
check((await signInWithEmail('kiran.parent@example.com', 'longenough')).id === g.id, 'they can now sign in with the email (on any device)');
await rejects(upgradeGuest(g.id, { method: 'email', email: 'x@example.com', password: 'longenough' }), 400, 'an account that is already saved cannot be saved again');
const g2 = await createGuest();
await rejects(upgradeGuest(g2.id, { method: 'email', email: 'PARENT@example.com', password: 'longenough' }), 409, "a guest can't take an email that already has an account");

console.log('\nDelete all data');
await deleteAccountAndData(acct.id);
const left = ['accounts', 'players', 'rounds', 'playEvents', 'parentReports'].map((c) => [...(db.data.get(c)?.values() ?? [])].filter((d) => JSON.stringify(d).includes(acct.id)).length);
check(left.every((n) => n === 0), 'nothing about the account is left');
check((await db.get(COLLECTIONS.accounts, other.id)) !== null, "other accounts are untouched");

console.log('\nGuided retry: why, try again, guide; naming the skill');
const focusSum = (i: Situation, id: string) => i.primaryCompetencies.reduce((n, c) => n + (i.options.find((o) => o.id === id)!.scores?.[c] ?? 0), 0);
const focusBest = (i: Situation) => [...i.options].sort((a, b) => focusSum(i, b.id) - focusSum(i, a.id))[0].id;
const perfOf = (i: Situation, id: string) => applyAnswer(createPlayer('x', 9, 'X'), i, { optionId: id, responseTimeMs: i.expectedTimeSec * 1000, hintOpened: false }).performance;
const weakOf = (i: Situation) => i.options.filter((o) => perfOf(i, o.id) < GAME.offerRetryBelow).map((o) => o.id);
const coach = await signUpWithEmail('coach@example.com', 'password123');
await upsertPlayer(coach.id, 'Kiki', 9);
const cr = await startRound(coach.id, 'g-c2-gap');
const ci = byId.get(cr.item.id)!;
const [weak1, weak2] = weakOf(ci);
const weakAns = await answerItem(coach.id, cr.roundId, ci.id, { optionId: weak1, responseTimeMs: ci.expectedTimeSec * 1000, hintOpened: false });
check(!!weakAns.feedback.why && !!weakAns.feedback.retry && !weakAns.feedback.skill && !weakAns.feedback.guide,
  `a weak first choice: Fizz says why ("${weakAns.feedback.why?.text}") and the child tries again (no skill line, no guide yet)`);
const measured = JSON.stringify((await getPlayer(coach.id))!.skills);
if (weak2) {
  const again = await retryItem(coach.id, cr.roundId, ci.id, weak2);
  check(!!again.feedback.why && !!again.feedback.retry && again.feedback.guide?.optionId === focusBest(ci), 'a second weak try: another why, and Fizz shows the most helpful option');
}
await rejects(retryItem(coach.id, cr.roundId, ci.id, weak2 ?? weak1), 409, 'the same way can only be tried once');
const second = await retryItem(coach.id, cr.roundId, ci.id, focusBest(ci));
check(!!second.feedback.skill && !second.feedback.retry && !second.feedback.why, `the helpful way names the skill ("${second.feedback.skill?.text}") and ends the retry`);
check(JSON.stringify((await getPlayer(coach.id))!.skills) === measured, 'retries move no skill: only the first choice is measured');
await rejects(retryItem(other.id, cr.roundId, ci.id, focusBest(ci)), 404, "nobody can try again in someone else's round");
const own = { ...ci, whyApproved: true, options: ci.options.map((o) => (o.id === weak1 ? { ...o, why: 'That made the others feel left behind. Maybe there is a way to cross together?' } : o)) };
check(partText(own, `w.${weak1}`)?.text.startsWith('That made') && partText({ ...own, whyApproved: false }, `w.${weak1}`) === null, "an item's own why is spoken only once a person has approved it");
const cn = await nextItem(coach.id, cr.roundId);
if (!cn.done && cn.item.kind === 'situation') {
  const ni = byId.get(cn.item.id)!;
  const strongAns = await answerItem(coach.id, cr.roundId, ni.id, { optionId: focusBest(ni), responseTimeMs: ni.expectedTimeSec * 1000, hintOpened: false });
  check(!!strongAns.feedback.skill && !strongAns.feedback.retry, 'a strong first choice names the skill and needs no retry');
}

console.log('\nParent note word check');
const note = { summary: 'Growing in noticing how friends feel.', strengths: ['Noticing others'], growingAreas: ['Staying calm is not changing yet'], habits: ['Points out when someone is left out'], tryAtHome: ['Ask what a story character might mean'] };
check(checkReport(note).length === 0, 'a kind, growth-framed note passes ("not changing yet" is allowed)');
for (const bad of ['She scored well', 'Shows low empathy', 'Behind other children', 'Possible ADHD', 'Made mistakes', 'A concern for now', 'Bad at maths', '80% right'])
  check(checkReport({ ...note, summary: bad }).length > 0, `"${bad}" is caught`);

console.log(failures ? `\n${failures} CHECK(S) FAILED` : '\nALL BACKEND CHECKS PASSED');
process.exit(failures ? 1 : 0);
