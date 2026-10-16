/**
 * Runs once when a server instance starts (see src/instrumentation.ts), so the first player doesn't pay
 * for cold connections: opening Firestore and loading the item bank, and signing in to Text-to-Speech.
 * Measured locally, the first request after a start took 11 s without this.
 */
import { loadBank } from './bank';
import { warmTts } from './tts';

export async function warmUp(): Promise<void> {
  const started = Date.now();
  const timeout = new Promise<'timeout'>((r) => setTimeout(() => r('timeout'), 15_000));
  const results = await Promise.race([Promise.allSettled([loadBank(), warmTts()]), timeout]);
  if (results === 'timeout') { console.warn('Warm-up is still running after 15 s; serving requests anyway.'); return; }
  const failed = results.filter((r) => r.status === 'rejected').map((r) => String((r as PromiseRejectedResult).reason?.message ?? r));
  console.log(`Warm-up done in ${Date.now() - started} ms${failed.length ? ` (skipped: ${failed.join('; ')})` : ''}.`);
}
