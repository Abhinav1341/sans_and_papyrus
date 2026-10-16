/**
 * Bonus rounds: a story gate opens a round of 3–5 items. The flow is
 *   start → (answer → next)* → done
 * `answer` returns the consequence at once; the browser calls `next` while the child reads it,
 * so choosing the next item (including the AI picker) never makes the child wait.
 *
 * Concurrency: an answer is checked and saved in one transaction, so a double tap or a retry can't
 * count twice or overwrite skills. Choosing the next item calls Gemini, which is too slow to hold a
 * transaction open, so the choice is made first and saved only if nobody moved the round on meanwhile.
 */
import { randomUUID } from 'node:crypto';
import type { PlayEvent } from '../../lib/schemas';
import { loadBank, toClientItem, type ClientItem } from './bank';
import { COLLECTIONS, GAME } from './config';
import { db } from './db';
import { applyAnswer, shortlist, shuffledOptionIds, type AnswerInput, type Round } from './engine';
import { HttpError } from './http';
import { pickNext } from './picker';
import { getPlayer, parsePlayer } from './players';
import { doneVoiceUrl, voiceUrl } from './tts';

const now = () => new Date().toISOString();

async function loadRound(accountId: string, roundId: string): Promise<Round> {
  const r = await db().get<Round>(COLLECTIONS.rounds, roundId);
  if (!r || r.playerId !== accountId) throw new HttpError(404, 'That bonus round was not found.');
  return r;
}

async function requirePlayer(accountId: string) {
  const p = await getPlayer(accountId);
  if (!p) throw new HttpError(409, 'Set up your Captain first.');
  return p;
}

/** The item a round is currently showing, as the browser sees it. */
async function currentView(round: Round): Promise<{ done: true } | { done: false; number: number; item: ClientItem }> {
  if (round.status === 'done' || !round.current) return { done: true };
  const { byId } = await loadBank();
  const item = byId.get(round.current.itemId);
  if (!item) return { done: true };
  return { done: false, number: round.served.length, item: toClientItem(item, round.current.optionOrder) };
}

/**
 * Chooses the next item and saves it on the round. Returns the round as stored: if another request
 * served an item first, that one wins and this choice is dropped. Null when the bank has run out.
 */
async function serveNext(round: Round, lastStruggled: boolean): Promise<Round | null> {
  const p = await requirePlayer(round.playerId);
  const { items, byId } = await loadBank();
  const candidates = shortlist(items, p, round, byId);
  if (!candidates.length) return null; // the bank for this age has run out: end the round kindly
  // The first item is picked by code, instantly: the child is waiting on the "Let's go" tap. Later items
  // are picked by Gemini while the child hears the last consequence, so its time is never noticed.
  const picker = await pickNext(p, candidates, lastStruggled, { ai: round.served.length > 0 });
  const item = byId.get(picker.chosenId)!;
  return db().transaction(async (tx) => {
    const stored = await tx.get<Round>(COLLECTIONS.rounds, round.id);
    if (stored && (stored.current || stored.status !== 'active' || stored.served.length !== round.served.length)) return stored;
    const next: Round = {
      ...round,
      served: [...round.served, item.id],
      current: { itemId: item.id, optionOrder: shuffledOptionIds(item), servedAt: Date.now(), picker },
      updatedAt: now(),
    };
    tx.set(COLLECTIONS.rounds, next.id, next);
    return next;
  });
}

export async function startRound(accountId: string, gateId: string) {
  const p = await requirePlayer(accountId);
  const round: Round = {
    id: randomUUID(),
    playerId: accountId,
    gateId,
    size: GAME.roundSize(p.age ?? 9),
    served: [],
    answered: [],
    current: null,
    ease: 0,
    status: 'active',
    createdAt: now(),
    updatedAt: now(),
  };
  const served = await serveNext(round, false);
  const view = served ? await currentView(served) : null;
  if (!view || view.done) throw new HttpError(503, 'No challenges for this age yet. Please try again later.');
  return { roundId: round.id, size: round.size, number: 1, item: view.item };
}

export async function answerItem(accountId: string, roundId: string, itemId: string, a: AnswerInput) {
  const { byId } = await loadBank();
  const item = byId.get(itemId);
  const option = item?.options.find((o) => o.id === a.optionId);

  return db().transaction(async (tx) => {
    // All reads first (a Firestore rule), then the checks, then the writes.
    const round = await tx.get<Round>(COLLECTIONS.rounds, roundId);
    const player = parsePlayer(await tx.get<unknown>(COLLECTIONS.players, accountId), accountId);
    if (!round || round.playerId !== accountId) throw new HttpError(404, 'That bonus round was not found.');
    if (round.status !== 'active' || round.current?.itemId !== itemId) throw new HttpError(409, 'This item was already answered.');
    if (!item) throw new HttpError(410, 'This item is no longer available.');
    if (!option) throw new HttpError(400, 'That choice is not part of this item.');
    if (!player) throw new HttpError(409, 'Set up your Captain first.');

    // Trust the browser's timing, but never more than the time the server actually saw.
    const serverElapsed = Date.now() - round.current.servedAt;
    const responseTimeMs = Math.max(0, Math.min(a.responseTimeMs, serverElapsed + 3000));
    const hintOpenedAtMs = a.hintOpened ? Math.max(0, Math.min(a.hintOpenedAtMs ?? 0, responseTimeMs)) : undefined;

    const out = applyAnswer(player, item, { ...a, responseTimeMs, hintOpenedAtMs });
    const picker = round.current.picker;

    // Running totals for the parent report (so it never has to read every event).
    const plays = { ...(out.player.skillPlays ?? {}) };
    for (const s of Object.keys(out.skillChanges)) plays[s] = (plays[s] ?? 0) + 1;
    out.player.skillPlays = plays;
    if (picker.source === 'ai') out.player.recentReasons = [...(out.player.recentReasons ?? []), picker.reason].slice(-5);

    const event: PlayEvent = {
      id: randomUUID(),
      playerId: accountId,
      situationId: item.id,
      kind: item.kind,
      optionId: option.id,
      correct: out.correct,
      optionOrder: round.current.optionOrder,
      responseTimeMs: Math.round(responseTimeMs),
      expectedTimeSec: item.expectedTimeSec,
      timeRatio: Math.round(out.timeRatio * 100) / 100,
      hint: { available: !!item.hint, opened: a.hintOpened && !!item.hint, openedAtMs: hintOpenedAtMs !== undefined ? Math.round(hintOpenedAtMs) : undefined },
      picker,
      roundId: round.id,
      gateId: round.gateId,
      performance: Math.round(out.performance * 100) / 100,
      skillChanges: out.skillChanges,
      createdAt: now(),
    };

    const answered = [...round.answered, item.id];
    const done = answered.length >= round.size;
    if (done) out.player.roundsPlayed = (out.player.roundsPlayed ?? 0) + 1;
    tx.set(COLLECTIONS.players, accountId, out.player);
    tx.set(COLLECTIONS.events, event.id, event);
    tx.set(COLLECTIONS.rounds, round.id, { ...round, answered, current: null, ease: out.ease, status: done ? 'done' : 'active', updatedAt: now() } satisfies Round);

    return {
      feedback: {
        consequence: option.consequence,
        // Puzzles get a gentle walk-through after any answer; the child is never told "wrong".
        explanation: item.kind === 'puzzle' ? item.puzzle!.explanation : null,
        voice: { consequence: voiceUrl(item, `c.${option.id}`), explanation: voiceUrl(item, 'x'), done: done ? doneVoiceUrl() : null },
      },
      answered: answered.length,
      size: round.size,
      done,
    };
  });
}

export async function nextItem(accountId: string, roundId: string) {
  const round = await loadRound(accountId, roundId);
  // Already done, or asked twice (e.g. a retry)? Return what is already there.
  if (round.status === 'done' || round.current) return currentView(round);
  const served = await serveNext(round, round.ease < 0);
  if (served) return currentView(served);
  await db().transaction(async (tx) => {
    const stored = await tx.get<Round>(COLLECTIONS.rounds, round.id);
    if (stored && !stored.current) tx.set(COLLECTIONS.rounds, round.id, { ...stored, status: 'done', updatedAt: now() } satisfies Round);
  });
  return { done: true as const };
}
