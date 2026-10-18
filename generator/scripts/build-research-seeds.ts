/**
 * Builds research-based seeds (situations, and puzzles) from a compact authoring file, then checks each one
 * with the shared schema and the generator's own rules. Seeds are written as "draft": the game only serves
 * "active" items, so nothing reaches a child until a person approves it (then run with --approve).
 *
 * Usage (from the generator folder):
 *   npx tsx scripts/build-research-seeds.ts <authoring.json>                          # → seeds/seed-situations-research.json
 *   npx tsx scripts/build-research-seeds.ts <authoring.json> --out seed-young.json    # another seed file
 *   add --approve to write them as active
 * The research basis of each seed is merged into seeds/research-basis.json.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { COMPETENCIES, Situation, type AgeBand, type Competency, type PuzzleDomain } from "../../web/lib/schemas";
import { loadSeeds } from "../src/bank";
import { checkCandidate, countWords, evaluateArithmetic, optionNumber } from "../src/rules";

type Authored = {
  id: string; band: AgeBand; title: string; difficulty: number; readingLevel: number;
  comp: Competency[]; tags: string[]; basis: string; text: string; hint: string;
  options: [string, Partial<Record<Competency, number>>, string][];
  /** Puzzles only. */
  puzzle?: { domain: PuzzleDomain; correct: string; explanation: string; computation?: string };
};

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { approve: { type: "boolean", default: false }, out: { type: "string", default: "seed-situations-research.json" } },
});
const [file] = positionals;
if (!file) throw new Error("Pass the authoring JSON file.");
const authored = JSON.parse(readFileSync(file, "utf8")) as Authored[];
const approve = values.approve;

// Expected time: seconds per word, calibrated on the existing seeds of each band and kind. A band with no
// seeds yet (6-7) reads a quarter slower than 8-10: these children are first readers, and every word is read aloud.
const existing = loadSeeds();
const secPerWord = (band: AgeBand, kind: string): number => {
  const xs = existing.filter((s) => s.ageBand === band && s.kind === kind);
  if (!xs.length) return band === "6-7" ? secPerWord("8-10", kind) * 1.25 : 1;
  return xs.reduce((a, s) => a + s.expectedTimeSec / s.wordCount, 0) / xs.length;
};

const out: Situation[] = [];
const basis: Record<string, string> = {};
let failures = 0;
for (const a of authored) {
  const kind = a.puzzle ? "puzzle" : "situation";
  const options = a.options.map(([text, scores, consequence], i) => ({
    id: "abcd"[i], text, consequence,
    ...(kind === "situation" ? { scores: Object.fromEntries(COMPETENCIES.map((c) => [c, scores[c] ?? 0])) as Record<Competency, number> } : {}),
  }));
  const puzzle = a.puzzle && { domain: a.puzzle.domain, correctOptionId: a.puzzle.correct, explanation: a.puzzle.explanation, ...(a.puzzle.computation ? { computation: a.puzzle.computation } : {}) };
  const wordCount = countWords(a.text) + options.reduce((n, o) => n + countWords(o.text), 0);
  const raw = {
    id: a.id, kind, title: a.title, text: a.text, ageBand: a.band, readingLevel: a.readingLevel,
    wordCount, expectedTimeSec: Math.round(wordCount * secPerWord(a.band, kind)), difficulty: a.difficulty,
    primaryCompetencies: a.comp, valueTags: a.tags, options, hint: { text: a.hint }, ...(puzzle ? { puzzle } : {}),
    source: "seed", seedIds: [], status: approve ? "active" : "draft", similarIds: [], createdAt: new Date().toISOString(),
  };
  const parsed = Situation.safeParse(raw);
  const problems = [
    ...(parsed.success ? [] : parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)),
    ...checkCandidate(
      { kind, title: a.title, text: a.text, ageBand: a.band, primaryCompetencies: a.comp, valueTags: a.tags,
        options: options.map(({ id, text, consequence }) => ({ id, text, consequence })), hint: { text: a.hint }, ...(puzzle ? { puzzle } : {}) } as never,
      { kind, ageBand: a.band },
    ),
    // Each primary competency must be one the best option actually shows.
    ...(kind === "situation" ? a.comp.filter((c) => Math.max(...options.map((o) => o.scores![c])) < 2).map((c) => `no option scores +2 on its primary competency ${c}`) : []),
    // A maths puzzle's computation must give the number in the correct option.
    ...(puzzle?.computation && evaluateArithmetic(puzzle.computation) !== optionNumber(options.find((o) => o.id === puzzle.correctOptionId)?.text ?? "")
      ? [`computation ${puzzle.computation} does not match the correct option`] : []),
  ];
  if (problems.length) { failures++; console.log(`✗ ${a.id} ${a.title}\n    ${problems.join("\n    ")}`); }
  else console.log(`✓ ${a.id} ${a.band} ${kind === "puzzle" ? puzzle!.domain : a.comp.join("+")} · ${wordCount} words · ${raw.expectedTimeSec}s`);
  if (parsed.success) out.push(parsed.data);
  basis[a.id] = a.basis;
}

const dir = join(import.meta.dirname, "..", "seeds");
writeFileSync(join(dir, values.out!), JSON.stringify(out, null, 1) + "\n");
const basisFile = join(dir, "research-basis.json");
const allBasis = existsSync(basisFile) ? JSON.parse(readFileSync(basisFile, "utf8")) as Record<string, string> : {};
writeFileSync(basisFile, JSON.stringify({ ...allBasis, ...basis }, null, 1) + "\n");
console.log(`\n${out.length} seeds written to seeds/${values.out} (${approve ? "active" : "draft"}), ${failures} with problems.`);
process.exit(failures ? 1 : 0);
