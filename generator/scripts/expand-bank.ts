/**
 * Expands the item bank with the three-stage AI pipeline.
 *
 * Usage (from the generator folder):
 *   npm run bank:expand -- --count 10
 *   npm run bank:expand -- --count 8 --kind mixed --band 8-10
 *   npm run bank:expand -- --count 5 --kind situation --competency socialAwareness
 *   npm run bank:expand -- --count 4 --kind puzzle --domain math --local-only
 *
 * Options:
 *   --count N          how many candidates to generate (default 5)
 *   --kind K           situation | puzzle | mixed (default situation; mixed = about 1 puzzle in 4)
 *   --band B           6-7 | 8-10 | 11-14 | any (default any: alternates 8-10 and 11-14)
 *   --competency C     focus one CASEL competency (situations)
 *   --domain D         math | reasoning | vocabulary (puzzles)
 *   --concurrency N    candidates processed at once (default 2)
 *   --local-only       skip Firestore; results go only to output/
 *   --draft-examples   also learn from same-band draft seeds (a new band under review); results are still drafts
 */
import { join } from "node:path";
import { parseArgs } from "node:util";
import { COMPETENCIES, PUZZLE_DOMAINS, type Competency, type PuzzleDomain } from "../../web/lib/schemas";
import { FirestoreBank } from "../src/bank";
import { createGeminiClient } from "../src/gemini";
import { expandBank, type ExpandOptions } from "../src/run";
import { loadEnv } from "../src/env";

const generatorDir = join(import.meta.dirname, "..");
loadEnv(generatorDir);

const { values } = parseArgs({
  options: {
    count: { type: "string", default: "5" },
    kind: { type: "string", default: "situation" },
    band: { type: "string", default: "any" },
    competency: { type: "string" },
    domain: { type: "string" },
    concurrency: { type: "string", default: "2" },
    "local-only": { type: "boolean", default: false },
    "draft-examples": { type: "boolean", default: false },
  },
});

const fail = (msg: string) => {
  console.error(msg);
  process.exit(1);
};
if (!["situation", "puzzle", "mixed"].includes(values.kind!)) fail("--kind must be situation, puzzle or mixed");
if (!["6-7", "8-10", "11-14", "any"].includes(values.band!)) fail("--band must be 6-7, 8-10, 11-14 or any");
if (values.competency && !COMPETENCIES.includes(values.competency as Competency)) fail(`--competency must be one of ${COMPETENCIES.join(", ")}`);
if (values.domain && !PUZZLE_DOMAINS.includes(values.domain as PuzzleDomain)) fail(`--domain must be one of ${PUZZLE_DOMAINS.join(", ")}`);

const opts: ExpandOptions = {
  count: Math.max(1, Number(values.count) || 5),
  kind: values.kind as ExpandOptions["kind"],
  ageBand: values.band as ExpandOptions["ageBand"],
  competency: values.competency as Competency | undefined,
  domain: values.domain as PuzzleDomain | undefined,
  concurrency: Math.max(1, Number(values.concurrency) || 2),
  draftExamples: values["draft-examples"],
};

const { summary, file } = await expandBank(opts, {
  ai: createGeminiClient(),
  store: values["local-only"] ? undefined : new FirestoreBank(),
  outDir: join(generatorDir, "output"),
  log: (line) => console.log(line),
});

console.log(`\nAccepted ${summary.accepted} of ${summary.requested}.`);
for (const [stage, n] of Object.entries(summary.rejectedByStage)) console.log(`  rejected at ${stage}: ${n}`);
for (const [cat, n] of Object.entries(summary.acceptedByCategory)) console.log(`  accepted ${cat}: ${n}`);
for (const [model, u] of Object.entries(summary.usage))
  console.log(`  ${model}: ${u.calls} calls, ${u.inputTokens} input / ${u.outputTokens + u.thinkingTokens} output tokens`);
if (summary.estimatedCostUsd !== null) console.log(`Estimated cost: about $${summary.estimatedCostUsd.toFixed(3)} (models without a price are not included)`);
console.log(`Run file: ${file}`);
if (!values["local-only"]) console.log("Stored in Firestore: generatedItems (accepted), rejectedItems, pipelineRuns");

// Firestore keeps network connections open; exit explicitly once the work is done.
process.exit(0);
