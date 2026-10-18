/**
 * Records every bonus-round line in the bank with Cloud Text-to-Speech ahead of time, so no child waits
 * the ~3 s it takes to make a clip the first time. Clips already stored in Firestore are skipped, so
 * re-running after the generator adds items only records the new ones.
 *
 * Run from web/ after the bank changes:  npm run voices:warm
 */
import { loadBank } from '../src/server/bank';
import { clip, partText, SHARED_LINES, type Speaker } from '../src/server/tts';

const { items } = await loadBank(true);
const lines: { text: string; speaker: Speaker }[] = Object.values(SHARED_LINES);
for (const item of items) {
  const parts = ['q', 'hint', 'x', ...item.options.flatMap((o) => [`o.${o.id}`, `c.${o.id}`, `w.${o.id}`])];
  for (const part of parts) {
    const line = partText(item, part);
    if (line) lines.push(line);
  }
}
const chars = lines.reduce((a, l) => a + l.text.length, 0);
console.log(`${items.length} items → ${lines.length} lines (${chars} characters, made only if not stored yet)`);

let done = 0, failed = 0;
const started = Date.now();
const queue = [...lines];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Text-to-Speech has a per-minute quota: on "exhausted", wait and try again. */
async function record(l: { text: string; speaker: Speaker }) {
  for (let attempt = 1; ; attempt++) {
    try { return await clip(l.speaker, l.text); } catch (e) {
      if (attempt >= 6 || !/exhausted|quota|429/i.test((e as Error).message)) throw e;
      await sleep(10_000 * attempt);
    }
  }
}
await Promise.all(Array.from({ length: 2 }, async () => {
  for (let l = queue.shift(); l; l = queue.shift()) {
    try { await record(l); } catch (e) { failed++; console.warn(`  ✗ ${l.text.slice(0, 50)}… ${(e as Error).message}`); }
    if (++done % 25 === 0) console.log(`  ${done}/${lines.length}`);
  }
}));
console.log(`Done: ${done - failed} ready, ${failed} failed, in ${Math.round((Date.now() - started) / 1000)} s.`);
process.exit(failed ? 1 : 0); // Firestore keeps the process alive otherwise
