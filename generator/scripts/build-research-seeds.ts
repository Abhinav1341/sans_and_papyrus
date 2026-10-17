/**
 * Builds research-based seed situations from a compact authoring file, then checks each one with the
 * shared schema and the generator's own rules. Seeds are written as "draft": the game only serves
 * "active" items, so nothing reaches a child until a person approves it (then run with --approve).
 *
 * Usage (from the generator folder):
 *   npx tsx scripts/build-research-seeds.ts <authoring.json>             # build + check, all draft
 *   npx tsx scripts/build-research-seeds.ts <authoring.json> --approve   # same, but status active
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { COMPETENCIES, Situation, type Competency } from "../../web/lib/schemas";
import { loadSeeds } from "../src/bank";
import { checkCandidate, countWords } from "../src/rules";

type Authored = {
  id: string; band: "8-10" | "11-14"; title: string; difficulty: number; readingLevel: number;
  comp: Competency[]; tags: string[]; basis: string; text: string; hint: string;
  options: [string, Partial<Record<Competency, number>>, string][];
};

const [file, flag] = process.argv.slice(2);
if (!file) throw new Error("Pass the authoring JSON file.");
const authored = JSON.parse(readFileSync(file, "utf8")) as Authored[];
const approve = flag === "--approve";

// Expected time: seconds per word, calibrated on the existing seed situations of each band.
const existing = loadSeeds().filter((s) => s.kind === "situation");
const secPerWord = (band: string) => {
  const xs = existing.filter((s) => s.ageBand === band);
  return xs.reduce((a, s) => a + s.expectedTimeSec / s.wordCount, 0) / xs.length;
};

const out: Situation[] = [];
const basis: Record<string, string> = {};
let failures = 0;
for (const a of authored) {
  const options = a.options.map(([text, scores, consequence], i) => ({
    id: "abcd"[i], text, consequence,
    scores: Object.fromEntries(COMPETENCIES.map((c) => [c, scores[c] ?? 0])) as Record<Competency, number>,
  }));
  const wordCount = countWords(a.text) + options.reduce((n, o) => n + countWords(o.text), 0);
  const raw = {
    id: a.id, kind: "situation", title: a.title, text: a.text, ageBand: a.band, readingLevel: a.readingLevel,
    wordCount, expectedTimeSec: Math.round(wordCount * secPerWord(a.band)), difficulty: a.difficulty,
    primaryCompetencies: a.comp, valueTags: a.tags, options, hint: { text: a.hint },
    source: "seed", seedIds: [], status: approve ? "active" : "draft", similarIds: [], createdAt: new Date().toISOString(),
  };
  const parsed = Situation.safeParse(raw);
  const problems = [
    ...(parsed.success ? [] : parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)),
    ...checkCandidate(
      { kind: "situation", title: a.title, text: a.text, ageBand: a.band, primaryCompetencies: a.comp, valueTags: a.tags,
        options: options.map(({ id, text, consequence }) => ({ id, text, consequence })), hint: { text: a.hint } } as never,
      { kind: "situation", ageBand: a.band },
    ),
    // Each primary competency must be one the best option actually shows.
    ...a.comp.filter((c) => Math.max(...options.map((o) => o.scores[c])) < 2).map((c) => `no option scores +2 on its primary competency ${c}`),
  ];
  if (problems.length) { failures++; console.log(`✗ ${a.id} ${a.title}\n    ${problems.join("\n    ")}`); }
  else console.log(`✓ ${a.id} ${a.band} ${a.comp.join("+")} · ${wordCount} words · ${raw.expectedTimeSec}s`);
  if (parsed.success) out.push(parsed.data);
  basis[a.id] = a.basis;
}

const dir = join(import.meta.dirname, "..", "seeds");
writeFileSync(join(dir, "seed-situations-research.json"), JSON.stringify(out, null, 1) + "\n");
writeFileSync(join(dir, "research-basis.json"), JSON.stringify(basis, null, 1) + "\n");
console.log(`\n${out.length} seeds written (${approve ? "active" : "draft"}), ${failures} with problems.`);
process.exit(failures ? 1 : 0);
