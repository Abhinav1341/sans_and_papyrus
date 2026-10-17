/**
 * Runs the current judge (C) again over the items already in the bank: every seed and every live
 * generated item. Use it after changing the judge's model or prompt, to measure how it scores the bank
 * and which items it would now stop. It never changes an item's status: people decide that.
 *
 *   npm run bank:rejudge                    judge everything, write output/rejudge-<date>.json
 *   npm run bank:rejudge -- --limit 5       try it on a few items first (or --ids sit-01,rsit-09)
 *   npm run bank:rejudge -- --apply         also save each verdict and the openChoice flag
 *                                           (generated items in Firestore; seeds in seeds/*.json, then upload-seeds)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import type { Situation } from "../../web/lib/schemas";
import { FirestoreBank, loadSeeds, type GeneratedRecord } from "../src/bank";
import { PIPELINE_CONFIG as CFG } from "../src/config";
import { CONSTRUCTS, constructById } from "../src/constructs";
import { loadEnv } from "../src/env";
import { UsageTracker, callJson, createGeminiClient } from "../src/gemini";
import { CURATOR_SYSTEM, curatorPrompt, exampleForGenerator } from "../src/prompts";
import { JudgeResult } from "../src/run";

const generatorDir = join(import.meta.dirname, "..");
loadEnv(generatorDir);
const { values } = parseArgs({
  options: { apply: { type: "boolean", default: false }, limit: { type: "string" }, ids: { type: "string" }, concurrency: { type: "string", default: "4" } },
});

type Item = Situation & Partial<Pick<GeneratedRecord, "pipeline">>;
const bank = new FirestoreBank();
const seeds = loadSeeds();
const generated = await bank.loadByStatus("active");
let items: Item[] = [...seeds, ...generated];
if (values.ids) items = items.filter((i) => values.ids!.split(",").includes(i.id));
if (values.limit) items = items.slice(0, Number(values.limit));

/** The construct an item was built on: from the pipeline target, or the construct that lists the seed. */
const constructOf = (i: Item) => constructById(i.pipeline?.target?.construct) ?? CONSTRUCTS.find((c) => c.seedIds.includes(i.id));

/** The seed examples to compare against: the ones the writer saw, or (for a seed) its closest neighbours. */
function examplesFor(i: Item): Situation[] {
  const used = i.seedIds.map((id) => seeds.find((s) => s.id === id)).filter((s): s is Situation => !!s);
  if (used.length) return used;
  return seeds
    .filter((s) => s.id !== i.id && s.kind === i.kind && s.ageBand === i.ageBand)
    .sort((a, b) => Number(b.primaryCompetencies.some((c) => i.primaryCompetencies.includes(c))) - Number(a.primaryCompetencies.some((c) => i.primaryCompetencies.includes(c))))
    .slice(0, CFG.examplesPerPrompt);
}

const ai = createGeminiClient();
const usage = new UsageTracker();
const model = CFG.models.curator;
type Verdict = { id: string; source: string; status: string; kind: string; ageBand: string; title: string; construct?: string;
  accept: boolean; failed: string[]; openChoice: boolean; reasons: string[]; curation?: JudgeResult; error?: string };
type JudgeResult = import("../../web/lib/schemas").CurationResult;
const verdicts: Verdict[] = [];

async function judge(i: Item) {
  const construct = constructOf(i);
  const grade = {
    optionScores: i.options.filter((o) => o.scores).map((o) => ({ optionId: o.id, scores: o.scores! })),
    difficulty: i.difficulty, readingLevel: i.readingLevel, expectedTimeSec: i.expectedTimeSec,
    ...(i.puzzle ? { solvedOptionId: i.puzzle.correctOptionId } : {}), rationale: "",
  };
  const base = { id: i.id, source: i.source, status: i.status, kind: i.kind, ageBand: i.ageBand, title: i.title, construct: construct?.id };
  try {
    const c = await callJson(ai, {
      usage, model, system: CURATOR_SYSTEM, schema: JudgeResult, temperature: CFG.temperature.curator,
      prompt: curatorPrompt(exampleForGenerator(i) as never, grade, examplesFor(i), construct),
    });
    const failed = [
      ...(!c.safe ? ["safe"] : []), ...(!c.fitsGame ? ["fitsGame"] : []), ...(c.hintIsNudge === false ? ["hintIsNudge"] : []),
      ...(c.explanationIsKind === false ? ["explanationIsKind"] : []), ...(c.originalPlot === false ? ["originalPlot"] : []),
      ...Object.entries(c.principles).filter(([, v]) => !v.pass).map(([k]) => k),
    ];
    const accept = c.accept && failed.length === 0;
    const openChoice = i.kind === "situation" && (c.openChoice || !!construct?.openChoice);
    verdicts.push({ ...base, accept, failed, openChoice, reasons: c.reasons, curation: c });
    console.log(`${accept ? "✓" : "✗"} ${i.id} "${i.title}"${openChoice ? " [open choice]" : ""}${failed.length ? `: ${failed.join(", ")}` : ""}`);
  } catch (err) {
    verdicts.push({ ...base, accept: false, failed: [], openChoice: false, reasons: [], error: (err as Error).message });
    console.log(`! ${i.id}: ${(err as Error).message.slice(0, 120)}`);
  }
}

console.log(`Judging ${items.length} items (${seeds.length} seeds, ${generated.length} live generated) with ${model}…`);
const queue = [...items];
await Promise.all(Array.from({ length: Number(values.concurrency) }, async () => { for (let i = queue.shift(); i; i = queue.shift()) await judge(i); }));

const judged = verdicts.filter((v) => !v.error);
const count = (xs: Verdict[]) => ({ judged: xs.length, accepted: xs.filter((v) => v.accept).length, stopped: xs.filter((v) => !v.accept).length, openChoice: xs.filter((v) => v.openChoice).length });
const failedBy: Record<string, number> = {};
for (const v of judged) for (const f of v.failed) failedBy[f] = (failedBy[f] ?? 0) + 1;
const summary = {
  model, at: new Date().toISOString(),
  all: count(judged), seeds: count(judged.filter((v) => v.source === "seed")), generated: count(judged.filter((v) => v.source === "generated")),
  errors: verdicts.length - judged.length, failedBy, usage: usage.summary(), costUsd: usage.estimateCost(CFG.pricesPerMillionUsd),
};
const dir = join(generatorDir, "output");
mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
const file = join(dir, `rejudge-${stamp}.json`);
writeFileSync(file, JSON.stringify({ summary, verdicts: verdicts.sort((a, b) => a.id.localeCompare(b.id)) }, null, 2) + "\n");
console.log(`\n${JSON.stringify(summary, null, 2)}\n→ ${file}`);

if (values.apply) {
  for (const v of judged.filter((v) => v.source === "generated"))
    await bank.db.collection(CFG.collections.generated).doc(v.id).update({ openChoice: v.openChoice, "pipeline.rejudge": { model, at: summary.at, accept: v.accept, failed: v.failed, curation: v.curation } });
  // Seeds: the JSON files are the source of truth, so the flag goes there (run bank:upload-seeds afterwards).
  const flags = new Map(judged.filter((v) => v.source === "seed").map((v) => [v.id, v.openChoice]));
  for (const f of ["seed-situations.json", "seed-puzzles.json", "seed-situations-research.json"]) {
    const path = join(generatorDir, "seeds", f);
    const raw = readFileSync(path, "utf8");
    const indent = raw.match(/^\[\r?\n( +)/)?.[1].length ?? 2; // keep each file's own formatting
    const list = JSON.parse(raw) as Record<string, unknown>[];
    for (const s of list) {
      const flag = flags.get(s.id as string);
      if (flag === undefined) continue;
      if (flag) s.openChoice = true; else delete s.openChoice;
    }
    writeFileSync(path, JSON.stringify(list, null, indent) + "\n");
  }
  console.log("Saved verdicts and openChoice flags. Run npm run bank:upload-seeds to send the seed flags to Firestore.");
}
process.exit(0); // Firestore keeps the process alive otherwise
