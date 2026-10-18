/**
 * Measured numbers for the game's "How it works" page: what each AI did and what each check stopped.
 * Reads the run files, the latest judge rerun (scripts/rejudge.ts) and real play from Firestore, and writes
 * web/src/data/ai-pipeline.json. Run it again whenever the bank changes, then deploy.
 *
 *   npm run bank:stats
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FirestoreBank, type RejectedRecord, type RunSummary } from "../src/bank";
import { PIPELINE_CONFIG as CFG } from "../src/config";
import { loadEnv } from "../src/env";

const generatorDir = join(import.meta.dirname, "..");
loadEnv(generatorDir);
const out = join(generatorDir, "output");

// 1. Generation: every run, funnel and real rejection examples.
const runs = readdirSync(out).filter((f) => /^run-.*\.json$/.test(f) && !f.endsWith(".embeddings.json"))
  .map((f) => JSON.parse(readFileSync(join(out, f), "utf8")) as { summary: RunSummary; rejected: RejectedRecord[] });
const byStage: Record<string, number> = {};
let requested = 0, accepted = 0, cost = 0;
for (const r of runs) {
  requested += r.summary.requested;
  accepted += r.summary.accepted;
  cost += r.summary.estimatedCostUsd ?? 0;
  for (const [k, v] of Object.entries(r.summary.rejectedByStage ?? {})) byStage[k] = (byStage[k] ?? 0) + Number(v);
}
const rejected = runs.flatMap((r) => r.rejected);
/** One real example per stage: the item's title and the reason it was stopped (never the full text). */
const examples = ["rules", "duplicate", "category", "curator"].flatMap((stage) => {
  const r = rejected.find((x) => x.stage === stage && x.candidate);
  return r ? [{ stage, title: r.candidate!.title, reason: r.reasons[0].replace(/\bgen-[\w-]+/g, "an earlier item") }] : [];
});

// 2. The judge rerun over the whole bank: the newest output/rejudge-*.json that judged the most items
// (small targeted reruns, such as checking a few new seeds, don't replace it).
const rejudgeFile = readdirSync(out).filter((f) => /^rejudge-\d+\.json$/.test(f))
  .map((f) => ({ f, n: (JSON.parse(readFileSync(join(out, f), "utf8")).verdicts ?? []).length }))
  .sort((a, b) => b.n - a.n || b.f.localeCompare(a.f))[0]?.f;
type Verdict = { id: string; source: string; title: string; accept: boolean; failed: string[]; openChoice: boolean;
  curation?: { principles?: Record<string, { pass: boolean; note: string }>; reasons: string[] } };
const rejudge = rejudgeFile ? JSON.parse(readFileSync(join(out, rejudgeFile), "utf8")) as { summary: Record<string, any>; verdicts: Verdict[] } : null;
const judgeQuotes = (rejudge?.verdicts ?? [])
  .filter((v) => !v.accept && v.curation)
  .map((v) => {
    const [k, p] = Object.entries(v.curation!.principles ?? {}).find(([, x]) => !x.pass) ?? [];
    return { title: v.title, source: v.source, check: k ?? v.failed[0] ?? "accept", note: p?.note ?? v.curation!.reasons[0] };
  })
  .filter((q) => q.note && q.note.length < 220)
  .slice(0, 4);

// 3. Play time: how the next item was really chosen, from every answer so far.
const db = new FirestoreBank().db;
const events = (await db.collection("playEvents").select("picker.source", "openChoice").get()).docs.map((d) => d.data() as { picker?: { source?: string }; openChoice?: boolean });
const picks = { total: events.length, ai: events.filter((e) => e.picker?.source === "ai").length };
const reports = (await db.collection("parentReports").select("source", "check").get()).docs.map((d) => d.data() as { source?: string; check?: { rewritten: boolean; passed: boolean } });

const stats = {
  asOf: new Date().toISOString(),
  models: {
    writer: CFG.models.generator, grader: CFG.models.grader, judge: CFG.models.curator, embedding: CFG.models.embedding,
    picker: "gemini-3.5-flash-lite", report: "gemini-3.8-flash",
  },
  generation: { runs: runs.length, requested, accepted, rejectedByStage: byStage, costUsd: Math.round(cost * 100) / 100, examples },
  rejudge: rejudge ? { file: rejudgeFile, ...rejudge.summary, quotes: judgeQuotes } : null,
  play: { answers: picks.total, aiPicks: picks.ai, reports: reports.length, reportsChecked: reports.filter((r) => r.check).length, reportsRewritten: reports.filter((r) => r.check?.rewritten).length },
};
const target = join(generatorDir, "..", "web", "src", "data", "ai-pipeline.json");
writeFileSync(target, JSON.stringify(stats, null, 2) + "\n");
console.log(JSON.stringify({ ...stats, generation: { ...stats.generation, examples: examples.length }, rejudge: stats.rejudge && { ...stats.rejudge, quotes: judgeQuotes.length } }, null, 2));
console.log(`→ ${target}`);
process.exit(0);
