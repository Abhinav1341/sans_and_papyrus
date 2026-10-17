/**
 * Second opinion on hand-written seeds: the pipeline's blind grader (B) scores every option without
 * seeing our scores, then we list where it disagrees, for the human reviewers to look at.
 *
 * Usage (from the generator folder):  npx tsx scripts/grade-seeds.ts seeds/seed-situations-research.json <out.json>
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { COMPETENCIES, GradeResult, type Situation } from "../../web/lib/schemas";
import { PIPELINE_CONFIG as CFG } from "../src/config";
import { loadEnv } from "../src/env";
import { callJson, createGeminiClient, UsageTracker } from "../src/gemini";
import { GRADER_SYSTEM, graderPrompt } from "../src/prompts";

loadEnv(join(import.meta.dirname, ".."));
const [file, outFile] = process.argv.slice(2);
const seeds = JSON.parse(readFileSync(file, "utf8")) as Situation[];
const ai = createGeminiClient();
const usage = new UsageTracker();
const total = (s?: Record<string, number>) => Object.values(s ?? {}).reduce((a, b) => a + b, 0);

const report = [];
for (const s of seeds) {
  const g = await callJson(ai, {
    usage, model: CFG.models.grader, system: GRADER_SYSTEM, schema: GradeResult, temperature: CFG.temperature.grader,
    prompt: graderPrompt({ ...s, options: s.options.map(({ id, text, consequence }) => ({ id, text, consequence })) } as never),
  });
  const ours = Object.fromEntries(s.options.map((o) => [o.id, o.scores!]));
  const theirs = Object.fromEntries(g.optionScores.map((o) => [o.optionId, o.scores]));
  const bestOurs = s.options.reduce((a, o) => (total(o.scores) > total(a.scores) ? o : a)).id;
  const bestTheirs = Object.entries(theirs).reduce((a, e) => (total(e[1]) > total(a[1]) ? e : a))[0];
  const bigGaps = s.options.flatMap((o) =>
    COMPETENCIES.filter((c) => Math.abs((ours[o.id]?.[c] ?? 0) - (theirs[o.id]?.[c] ?? 0)) >= 2)
      .map((c) => `${o.id}.${c}: ours ${ours[o.id]?.[c] ?? 0}, grader ${theirs[o.id]?.[c] ?? 0}`));
  const row = {
    id: s.id, title: s.title, band: s.ageBand,
    bestOption: { ours: bestOurs, grader: bestTheirs, agree: bestOurs === bestTheirs },
    difficulty: { ours: s.difficulty, grader: g.difficulty },
    readingLevel: { ours: s.readingLevel, grader: g.readingLevel },
    bigGaps, rationale: g.rationale,
  };
  report.push(row);
  console.log(`${row.bestOption.agree ? "✓" : "≠"} ${s.id} best ${bestOurs}/${bestTheirs} · difficulty ${s.difficulty}/${g.difficulty} · ${bigGaps.length} big score gaps`);
}
writeFileSync(outFile, JSON.stringify(report, null, 1));
console.log(`\nAgree on best option: ${report.filter((r) => r.bestOption.agree).length}/${report.length}. Cost: ${JSON.stringify(usage.summary?.() ?? {})}`);
process.exit(0);
