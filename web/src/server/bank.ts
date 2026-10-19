/**
 * The item bank: hand-written seeds plus accepted generated items, both from Firestore.
 * Cached in memory, because the bank only changes when someone runs the generator.
 */
import { Situation } from '../../lib/schemas';
import { COLLECTIONS, GAME } from './config';
import { db } from './db';
import { OPEN_LINE, openVoiceUrl, voiceUrl } from './tts';

let cache: { at: number; items: Situation[]; byId: Map<string, Situation> } | null = null;

export async function loadBank(force = false): Promise<{ items: Situation[]; byId: Map<string, Situation> }> {
  if (!force && cache && Date.now() - cache.at < GAME.bankCacheMs) return cache;
  const [seeds, generated] = await Promise.all([
    db().all<unknown>(COLLECTIONS.seeds),
    db().all<unknown>(COLLECTIONS.generated),
  ]);
  const items: Situation[] = [];
  let skipped = 0;
  for (const raw of [...seeds, ...generated]) {
    const r = Situation.safeParse(raw);
    if (r.success && r.data.status === 'active') items.push(r.data);
    else skipped++;
  }
  if (skipped) console.warn(`Item bank: skipped ${skipped} items that are not active or don't match the schema.`);
  if (!items.length) throw new Error('The item bank is empty. Run the generator: npm run bank:upload-seeds (in generator/).');
  cache = { at: Date.now(), items, byId: new Map(items.map((i) => [i.id, i])) };
  return cache;
}

/** Tests only. */
export function setBankForTests(items: Situation[]) {
  cache = { at: Date.now(), items, byId: new Map(items.map((i) => [i.id, i])) };
}

/** The item as the child's browser sees it: no scores, no answers. Options are shuffled per child. */
export interface ClientItem {
  id: string;
  kind: 'situation' | 'puzzle';
  title: string;
  text: string;
  options: { id: string; text: string; voice: string | null }[];
  hint: string | null;
  expectedTimeSec: number;
  /** Spoken versions (Cloud Text-to-Speech) of the question and the hint. */
  voice: { q: string | null; hint: string | null };
  /** A genuine dilemma: Fizz says more than one answer is okay, and the choice isn't measured. */
  open: { text: string; voice: string | null } | null;
}

export function toClientItem(item: Situation, optionOrder: string[]): ClientItem {
  const byId = new Map(item.options.map((o) => [o.id, o]));
  return {
    id: item.id,
    kind: item.kind,
    title: item.title,
    text: item.text,
    options: optionOrder.map((id) => ({ id, text: byId.get(id)!.text, voice: voiceUrl(item, `o.${id}`) })),
    hint: item.hint?.text ?? null,
    expectedTimeSec: item.expectedTimeSec,
    voice: { q: voiceUrl(item, 'q'), hint: voiceUrl(item, 'hint') },
    open: item.kind === 'situation' && item.openChoice ? { text: OPEN_LINE, voice: openVoiceUrl() } : null,
  };
}
