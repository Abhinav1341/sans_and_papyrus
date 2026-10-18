/**
 * Load benchmark: N guest players play bonus rounds at the same time against a deployed game, and every
 * API call is timed from the client. Players answer back-to-back with no reading pauses, so the load is
 * far heavier than the same number of real children. Each guest account is deleted at the end
 * (DELETE /api/account), so the benchmark leaves no players behind.
 *
 *   npx tsx tools/benchmark.mts --url https://… --players 20 --rounds 2 --label gemini-on --out ../pitch/bench-on.json
 */
import { writeFileSync } from 'node:fs';

const arg = (k: string, d: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > 0 ? process.argv[i + 1] : d;
};
const BASE = arg('url', 'http://localhost:3000').replace(/\/$/, '');
const PLAYERS = Number(arg('players', '20'));
const ROUNDS = Number(arg('rounds', '2'));
const LABEL = arg('label', 'run');
const OUT = arg('out', '');
const GATES = ['g-p-warmup', 'g-c1-power', 'g-c2-bounce', 'g-c2-gap'];

type Sample = { endpoint: string; ms: number; status: number; player: number };
const samples: Sample[] = [];

async function timed(player: number, endpoint: string, url: string, init: RequestInit = {}) {
  const t0 = performance.now();
  const res = await fetch(BASE + url, init);
  const body = await res.json().catch(() => null);
  samples.push({ endpoint, ms: performance.now() - t0, status: res.status, player });
  return { res, body };
}

async function play(i: number) {
  let cookie = '';
  const call = async (endpoint: string, url: string, method = 'GET', body?: unknown) => {
    const r = await timed(i, endpoint, url, {
      method,
      headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const set = r.res.headers.getSetCookie().find((c) => c.startsWith('pg_session='));
    if (set) cookie = set.split(';')[0];
    if (!r.res.ok) throw new Error(`${endpoint} → ${r.res.status} ${JSON.stringify(r.body)}`);
    return r.body;
  };

  await call('POST auth/guest', '/api/auth/guest', 'POST', {});
  try {
    await call('PUT player', '/api/player', 'PUT', { heroName: `Bench${i}`, age: 6 + (i % 9) });
    for (let r = 0; r < ROUNDS; r++) {
      const start = await call('POST round/start', '/api/round/start', 'POST', { gateId: GATES[r % GATES.length] });
      let item = start.item;
      for (let k = 0; item && k < 8; k++) {
        const option = item.options[Math.floor(Math.random() * item.options.length)].id;
        await call('POST round/answer', '/api/round/answer', 'POST', {
          roundId: start.roundId, itemId: item.id, optionId: option, responseTimeMs: 5000 + Math.round(Math.random() * 10000), hintOpened: false,
        });
        const next = await call('POST round/next', '/api/round/next', 'POST', { roundId: start.roundId });
        item = next.done ? null : next.item;
      }
    }
    await call('GET report', '/api/report?refresh=1');
  } finally {
    await call('DELETE account', '/api/account', 'DELETE').catch((e) => console.warn(`player ${i}: ${(e as Error).message}`));
  }
}

const pct = (s: number[], q: number) => s[Math.min(s.length - 1, Math.floor(q * s.length))];
function summary(list: Sample[]) {
  const ms = list.map((x) => x.ms).sort((a, b) => a - b);
  const r = (n: number) => Math.round(n);
  return {
    n: list.length,
    errors: list.filter((x) => x.status >= 400).length,
    p50: r(pct(ms, 0.5)), p95: r(pct(ms, 0.95)), max: r(ms[ms.length - 1]),
    mean: r(ms.reduce((a, b) => a + b, 0) / Math.max(1, ms.length)),
  };
}

// First request: on a service scaled to zero this includes the cold start.
const first = await timed(-1, 'GET auth/config (first request)', '/api/auth/config');
const page = await (async () => { const t0 = performance.now(); const r = await fetch(BASE + '/'); await r.text(); return { ms: Math.round(performance.now() - t0), status: r.status }; })();

const t0 = performance.now();
const results = await Promise.allSettled(Array.from({ length: PLAYERS }, (_, i) => play(i)));
const wallMs = performance.now() - t0;
const failures = results.flatMap((r, i) => (r.status === 'rejected' ? [`player ${i}: ${(r.reason as Error).message}`] : []));

const timed2 = samples.filter((s) => s.player >= 0);
const endpoints = [...new Set(timed2.map((s) => s.endpoint))];
const report = {
  label: LABEL, url: BASE, at: new Date().toISOString(),
  players: PLAYERS, roundsEach: ROUNDS, completedPlayers: PLAYERS - failures.length,
  firstRequestMs: Math.round(first.res ? samples[0].ms : 0), homePageMs: page.ms,
  wallSeconds: +(wallMs / 1000).toFixed(1),
  requests: timed2.length,
  requestsPerSecond: +(timed2.length / (wallMs / 1000)).toFixed(1),
  errorRate: timed2.filter((s) => s.status >= 400).length / Math.max(1, timed2.length),
  all: summary(timed2),
  byEndpoint: Object.fromEntries(endpoints.map((e) => [e, summary(timed2.filter((s) => s.endpoint === e))])),
  failures,
};
console.log(JSON.stringify(report, null, 2));
if (OUT) writeFileSync(OUT, JSON.stringify({ ...report, samples: timed2.map(({ endpoint, ms, status }) => ({ endpoint, ms: Math.round(ms), status })) }, null, 1));
