/**
 * Writes every item in the bank (seeds and accepted generated items from local run files) to one readable
 * Markdown file, grouped by kind, category and age band. Rejected items are listed at the end with reasons.
 *
 * Usage (from the generator folder):  npm run bank:export
 * Output: output/bank-readable.md
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadSeeds } from "../src/bank";

type Item = ReturnType<typeof loadSeeds>[number] & { pipeline?: any };
const outDir = join(import.meta.dirname, "..", "output");
const runFiles = existsSync(outDir) ? readdirSync(outDir).filter((f) => /^run-.*(?<!\.embeddings)\.json$/.test(f)).sort() : [];
const runs = runFiles.map((f) => JSON.parse(readFileSync(join(outDir, f), "utf8")));
const generated: Item[] = runs.flatMap((r) => r.accepted ?? []);
const rejected: any[] = runs.flatMap((r) => r.rejected ?? []);
const all: Item[] = [...loadSeeds(), ...generated];

const short: Record<string, string> = {
  selfAwareness: "Self-awareness", selfManagement: "Self-management", socialAwareness: "Social awareness",
  relationshipSkills: "Relationship skills", responsibleDecisionMaking: "Responsible decisions",
};
const category = (i: Item) => (i.kind === "puzzle" ? `Puzzle: ${i.puzzle?.domain}` : short[i.primaryCompetencies[0]] ?? "Other");
const scoreLine = (s?: Record<string, number>) =>
  s ? Object.entries(s).filter(([, v]) => v !== 0).map(([k, v]) => `${short[k]} ${v > 0 ? "+" : ""}${v}`).join(", ") || "neutral" : "";

const lines: string[] = [
  "# Question bank",
  "",
  `${all.length} items: ${all.length - generated.length} seeds and ${generated.length} generated. ${rejected.length} candidates were rejected.`,
  "",
];
const groups = new Map<string, Item[]>();
for (const i of all) {
  const key = `${category(i)} | ages ${i.ageBand}`;
  groups.set(key, [...(groups.get(key) ?? []), i]);
}
lines.push("| Category | Ages | Items |", "| --- | --- | --- |");
for (const [k, v] of [...groups].sort()) lines.push(`| ${k.split(" | ")[0]} | ${k.split(" | ")[1].replace("ages ", "")} | ${v.length} |`);
lines.push("");

for (const [k, items] of [...groups].sort()) {
  lines.push(`## ${k}`, "");
  for (const i of items) {
    const src = i.source === "seed" ? "seed" : "generated";
    lines.push(`### ${i.title}`, `*${src} · difficulty ${i.difficulty} · reading level ${i.readingLevel} · about ${i.expectedTimeSec}s · id ${i.id}*`, "", i.text, "");
    for (const o of i.options) {
      const mark = i.puzzle?.correctOptionId === o.id ? " ✅" : "";
      const sc = scoreLine(o.scores);
      lines.push(`- **${o.id})** ${o.text}${mark}${sc ? `  \n  _Scores: ${sc}_` : ""}  \n  → ${o.consequence}`);
    }
    if (i.hint) lines.push("", `Hint: ${i.hint.text}`);
    if (i.puzzle) lines.push("", `Explanation: ${i.puzzle.explanation}`);
    if (i.pipeline?.grade?.rationale) lines.push("", `Grader's note: ${i.pipeline.grade.rationale}`);
    lines.push("");
  }
}

if (rejected.length) {
  lines.push("## Rejected candidates", "", "| Title | Stage | Reason |", "| --- | --- | --- |");
  for (const r of rejected)
    lines.push(`| ${r.candidate?.title ?? "(not generated)"} | ${r.stage} | ${String(r.reasons?.[0] ?? "").replace(/\|/g, "/").replace(/\n/g, " ")} |`);
  lines.push("");
}

const file = join(outDir, "bank-readable.md");
writeFileSync(file, lines.join("\n"), "utf8");
console.log(`Wrote ${all.length} items (${rejected.length} rejected listed) to ${file}`);
