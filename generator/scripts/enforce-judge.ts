/**
 * Applies the judge's latest verdicts to the bank: anything the judge (C) stopped is taken out of the game,
 * exactly as if it had been stopped when it was generated. People can still fix and re-approve a seed.
 *
 *   generated item the judge stopped → status "rejected" (with the judge's reasons as the rejection note)
 *   seed the judge stopped          → status "draft" in seeds/*.json (fix it, then approve it again)
 *
 * Verdicts come from scripts/rejudge.ts: each generated item's saved verdict, and the newest rejudge file for seeds.
 *
 *   npm run bank:enforce-judge -- --dry-run     list what would change
 *   npm run bank:enforce-judge                  apply it, then: npm run bank:upload-seeds
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { FirestoreBank, type GeneratedRecord } from "../src/bank";
import { PIPELINE_CONFIG as CFG } from "../src/config";
import { loadEnv } from "../src/env";

const generatorDir = join(import.meta.dirname, "..");
loadEnv(generatorDir);
const { values } = parseArgs({ options: { "dry-run": { type: "boolean", default: false } } });
const dry = values["dry-run"];
const outDir = join(generatorDir, "output");

type Verdict = { accept: boolean; failed: string[]; model?: string };
const verdict = new Map<string, Verdict>();
for (const f of readdirSync(outDir).filter((f) => /^rejudge-\d+\.json$/.test(f)).sort()) {
  const d = JSON.parse(readFileSync(join(outDir, f), "utf8"));
  for (const v of d.verdicts ?? []) if (!v.error) verdict.set(v.id, { accept: v.accept, failed: v.failed, model: d.summary?.model });
}

const bank = new FirestoreBank();
const generated = (await bank.loadGenerated()) as (GeneratedRecord & { pipeline: { rejudge?: Verdict & { at?: string } } })[];
for (const g of generated) if (g.pipeline?.rejudge) verdict.set(g.id, g.pipeline.rejudge);

const now = new Date().toISOString();
let pulled = 0;
for (const g of generated) {
  const v = verdict.get(g.id);
  if (!v || v.accept || g.status === "rejected") continue;
  const note = `Stopped by the judge: ${v.failed.join(", ") || "not accepted"}`;
  console.log(`✗ ${g.id} "${g.title}" (${g.ageBand}, was ${g.status}) → rejected. ${note}`);
  if (!dry) await bank.db.collection(CFG.collections.generated).doc(g.id).update({
    status: "rejected",
    review: { approvals: g.review?.approvals ?? [], rejection: { reviewer: `Judge C (${v.model ?? CFG.models.curator})`, note, at: now } },
  });
  pulled++;
}

let seedsBack = 0;
for (const f of ["seed-situations.json", "seed-puzzles.json", "seed-situations-research.json", "seed-young.json"]) {
  const path = join(generatorDir, "seeds", f);
  if (!existsSync(path)) continue;
  const raw = readFileSync(path, "utf8");
  const indent = raw.match(/^\[\r?\n( +)/)?.[1].length ?? 2; // keep each file's own formatting
  const list = JSON.parse(raw) as { id: string; title: string; status: string }[];
  let changed = false;
  for (const s of list) {
    const v = verdict.get(s.id);
    if (!v || v.accept || s.status !== "active") continue;
    console.log(`✗ seed ${s.id} "${s.title}" → draft (fix and approve again). Stopped by the judge: ${v.failed.join(", ")}`);
    s.status = "draft";
    changed = true;
    seedsBack++;
  }
  if (changed && !dry) writeFileSync(path, JSON.stringify(list, null, indent) + "\n");
}

console.log(`\n${dry ? "Dry run, nothing saved. " : ""}${pulled} generated items taken out (rejected), ${seedsBack} seeds back to draft.`);
if (!dry && seedsBack) console.log("Now run: npm run bank:upload-seeds");
process.exit(0);
