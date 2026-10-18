/**
 * The Parent Corner report: Gemini turns the Captain's play into a short, kind growth summary.
 * It sees only aggregated signals (skill trends, hint and timing habits, categories played, the picker's
 * reasons), never raw answers. Cached, and refreshed after a few new answers or once a day.
 * Reads only the profile's running totals, never the full list of play events.
 */
import { ParentReport, type PlayEvent, type PlayerProfile } from '../../lib/schemas';
import { COLLECTIONS, GAME } from './config';
import { db } from './db';
import { geminiJson } from './gemini';
import { getPlayer, parsePlayer } from './players';
import { checkReport } from './report-check';

const LABEL: Record<string, string> = {
  selfAwareness: 'Understanding their own feelings', selfManagement: 'Calming down and staying patient',
  socialAwareness: 'Noticing how others feel', relationshipSkills: 'Getting along and asking for help',
  responsibleDecisionMaking: 'Making fair, honest choices', math: 'Maths', reasoning: 'Reasoning', vocabulary: 'Vocabulary',
};

interface StoredReport {
  playerId: string;
  report: ParentReport;
  basedOnEvents: number;
  createdAt: string;
  source: 'ai' | 'fallback';
  /** The code check on the AI note: problems found in the first draft, and whether a rewrite fixed them. */
  check?: { firstDraftProblems: string[]; rewritten: boolean; passed: boolean };
  /** How long writing the note took, Gemini calls and any rewrite included. */
  latencyMs?: number;
}

export function summarise(p: PlayerProfile) {
  const start = p.startSkill ?? 1000;
  const plays = p.skillPlays ?? {};
  const growth = Object.entries(p.skills)
    .map(([k, v]) => ({ skill: LABEL[k] ?? k, change: Math.round(v - start), played: plays[k] ?? 0 }))
    .filter((g) => g.played > 0)
    .sort((a, b) => b.change - a.change);
  const hints = p.helpSeeking;
  const habit =
    p.timeRatioAvg < 0.6 ? 'often answers before finishing reading' : p.timeRatioAvg > 2 ? 'takes plenty of time to think' : 'reads and thinks at a steady pace';
  return {
    captain: p.heroName ?? 'Captain',
    ageBand: p.ageBand,
    itemsPlayed: p.totalPlayed,
    roundsPlayed: p.roundsPlayed ?? 0,
    // Words, not numbers, so the note has nothing to repeat as a score. A skill that hasn't moved is
    // "not changing yet": never "weak" or "behind".
    skillTrends: growth.map((g) => `${g.skill}: ${g.change >= 60 ? 'growing well' : g.change >= 20 ? 'growing' : 'not changing yet'} (${g.played} items)`),
    timing: habit,
    hints: hints.hintsOffered
      ? `${hints.hintsUsed} of ${hints.hintsOffered} hints used (${hints.thoughtfulUses} after thinking first, ${hints.reflexUses} straight away)`
      : 'no hints offered yet',
    whyItemsWereChosen: [...(p.recentReasons ?? [])].reverse(),
  };
}

/**
 * Profiles saved before the running totals existed: count them from the play events, once.
 * Every later answer keeps the totals up to date, so this never runs twice for a player.
 */
async function backfillTotals(p: PlayerProfile): Promise<PlayerProfile> {
  if (p.skillPlays || p.totalPlayed === 0) return p;
  const events = await db().where<PlayEvent>(COLLECTIONS.events, 'playerId', p.id, { orderBy: 'createdAt' });
  const plays: Record<string, number> = {};
  for (const e of events) for (const k of Object.keys(e.skillChanges ?? {})) plays[k] = (plays[k] ?? 0) + 1;
  const reasons = events.filter((e) => e.picker.source === 'ai').slice(0, 5).map((e) => e.picker.reason).reverse();
  return db().transaction(async (tx) => {
    const fresh = parsePlayer(await tx.get<unknown>(COLLECTIONS.players, p.id), p.id) ?? p;
    if (fresh.skillPlays) return fresh;
    const updated = { ...fresh, skillPlays: plays, recentReasons: reasons };
    tx.set(COLLECTIONS.players, p.id, updated);
    return updated;
  });
}

const SYSTEM = `You write a short, warm progress note for the parent of a child (aged 8 to 14) who plays a story game
that practises social-emotional skills (CASEL) and a few puzzles.
Rules:
- Growth framing only. Never label the child ("low empathy", "bad at maths"), never diagnose, never mention scores or numbers.
- Never compare with other children, never use worry words ("concern", "behind"), never call a choice a mistake.
- A skill that is "not changing yet" is described exactly that way, as something to practise together.
- Base everything on the data given; if there is little data, say so kindly.
- strengths and growingAreas: concrete, everyday wording (max 3 each).
- habits: what their play suggests about how they approach choices (e.g. takes time to think, asks for help when stuck).
- tryAtHome: simple conversation starters or activities for this week (max 3).
- thinkingSkills: one line on puzzles, only if puzzles were played.
- Plain English a busy parent can read in 30 seconds.`;

function fallbackReport(s: ReturnType<typeof summarise>): ParentReport {
  return {
    summary: `${s.captain} has played ${s.itemsPlayed} bonus-round items so far. Here is what their choices show.`,
    strengths: s.skillTrends.slice(0, 2).map((t) => t.split(':')[0]),
    growingAreas: s.skillTrends.slice(-2).map((t) => t.split(':')[0]),
    habits: [`${s.captain} ${s.timing}.`],
    tryAtHome: ['Ask about a story from today: what would they do differently?'],
  };
}

/* ---------- the skill shape (Parent Corner chart) ---------- */

/** One spoke of the chart. Positions only (0–1), never the skill numbers, and no scores are shown. */
export interface ShapeAxis { key: string; label: string; now: number; start: number; played: number; trend: 'more' | 'some' | 'steady' | 'harder' | 'new' }

const SHAPE_LABEL: Record<string, string> = {
  selfAwareness: 'Knowing their feelings', selfManagement: 'Staying calm', socialAwareness: 'Noticing others',
  relationshipSkills: 'Getting along', responsibleDecisionMaking: 'Fair choices',
  math: 'Maths', reasoning: 'Reasoning', vocabulary: 'Words',
};

/**
 * Where each skill sits now compared with where the Captain started (the starting level for their age).
 * The start is the middle of the chart (0.5); ±SPAN skill points reach the centre or the edge. A few good
 * rounds move a skill 50–100 points, so the scale is tight enough for that growth to show.
 */
export function skillShape(p: PlayerProfile) {
  const SPAN = 150;
  const start = p.startSkill ?? 1000;
  const plays = p.skillPlays ?? {};
  const axis = (key: string): ShapeAxis => {
    const d = p.skills[key as keyof typeof p.skills] - start;
    const played = plays[key] ?? 0;
    const trend = !played ? 'new' : d >= 60 ? 'more' : d >= 20 ? 'some' : d > -20 ? 'steady' : 'harder';
    return { key, label: SHAPE_LABEL[key], now: Math.max(0.08, Math.min(1, 0.5 + d / (2 * SPAN))), start: 0.5, played, trend };
  };
  const social = ['selfAwareness', 'selfManagement', 'socialAwareness', 'relationshipSkills', 'responsibleDecisionMaking'].map(axis);
  const thinking = ['math', 'reasoning', 'vocabulary'].map(axis);
  return { social, thinking: thinking.some((a) => a.played > 0) ? thinking : null };
}

/** One report being written per account at a time: a second request waits for the first. */
const writing = new Map<string, Promise<ReportResult>>();
type ReportResult = Awaited<ReturnType<typeof buildReport>>;

export function getReport(accountId: string, refresh = false): Promise<ReportResult> {
  const pending = writing.get(accountId);
  if (pending) return pending;
  const p = buildReport(accountId, refresh).finally(() => writing.delete(accountId));
  writing.set(accountId, p);
  return p;
}

async function buildReport(accountId: string, refresh: boolean) {
  const found = await getPlayer(accountId);
  if (!found) return { status: 'no-captain' as const };
  const p = await backfillTotals(found);
  const itemsPlayed = p.totalPlayed;
  if (itemsPlayed < GAME.reportMinEvents) return { status: 'too-early' as const, itemsPlayed, needed: GAME.reportMinEvents };

  const cached = await db().get<StoredReport>(COLLECTIONS.reports, accountId);
  const age = cached ? Date.now() - Date.parse(cached.createdAt) : Infinity;
  const fresh = cached && itemsPlayed - cached.basedOnEvents < GAME.reportRefreshEvents && age < GAME.reportMaxAgeMs;
  // "Refresh" can't be used to call Gemini over and over: a report younger than the cooldown is reused.
  const forced = refresh && age >= GAME.reportRefreshCooldownMs;
  const stats = { itemsPlayed, roundsPlayed: p.roundsPlayed ?? 0 };
  const shape = skillShape(p); // always from the live profile, so the chart is current even when the note is cached
  if (cached && (fresh || age < GAME.reportRefreshCooldownMs) && !forced) return { status: 'ready' as const, ...cached, stats, shape };

  const s = summarise(p);
  let report: ParentReport, source: StoredReport['source'] = 'ai';
  let check: StoredReport['check'];
  const started = Date.now();
  try {
    if (!GAME.aiEnabled) throw new Error('AI is switched off (GAME_AI=off)');
    const write = (extra = '') => geminiJson({ model: GAME.models.report, system: SYSTEM, prompt: JSON.stringify(s, null, 1) + extra, schema: ParentReport, temperature: 0.4, timeoutMs: 20000 });
    report = await write();
    // Code checks every AI note before a parent sees it; one rewrite, then the plain version.
    const firstDraftProblems = checkReport(report);
    check = { firstDraftProblems, rewritten: firstDraftProblems.length > 0, passed: !firstDraftProblems.length };
    if (firstDraftProblems.length) {
      report = await write(`\n\nYour last draft used words parents must not see. Rewrite it without them:\n- ${firstDraftProblems.join('\n- ')}`);
      check.passed = checkReport(report).length === 0;
      if (!check.passed) throw new Error(`the note still failed the word check (${checkReport(report).join('; ')})`);
    }
  } catch (err) {
    console.warn(`Parent report: using the plain version (${(err as Error).message})`);
    report = fallbackReport(s);
    source = 'fallback';
  }
  const stored: StoredReport = { playerId: accountId, report, basedOnEvents: itemsPlayed, createdAt: new Date().toISOString(), source, ...(check ? { check } : {}), latencyMs: Date.now() - started };
  await db().set(COLLECTIONS.reports, accountId, stored);
  return { status: 'ready' as const, ...stored, stats, shape };
}
