/**
 * Writes the whole question bank, as it stands now, to one readable Markdown file and one CSV:
 * every seed (from seeds/*.json) and every generated item (from Firestore, so statuses are current),
 * grouped by age band and category, with each item's status (live, waiting for review, rejected) and the
 * latest judge verdict (scripts/rejudge.ts). Falls back to the local run files when Firestore isn't reachable.
 *
 * Usage (from the generator folder):  npm run bank:export
 * Output: output/bank-readable.md and output/bank-all.csv
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FirestoreBank, loadSeeds, type GeneratedRecord } from "../src/bank";
import { loadEnv } from "../src/env";

type Item = ReturnType<typeof loadSeeds>[number] & { pipeline?: GeneratedRecord["pipeline"] & { rejudge?: { accept: boolean; failed: string[] } } };
const generatorDir = join(import.meta.dirname, "..");
loadEnv(generatorDir);
const outDir = join(generatorDir, "output");
const files = existsSync(outDir) ? readdirSync(outDir) : [];

const runs = files.filter((f) => /^run-.*(?<!\.embeddings)\.json$/.test(f)).sort().map((f) => JSON.parse(readFileSync(join(outDir, f), "utf8")));
const rejectedCount = runs.reduce((n, r) => n + (r.rejected?.length ?? 0), 0);
let generated: Item[];
let source = "Firestore";
try {
  generated = await new FirestoreBank().loadGenerated();
} catch (err) {
  console.warn(`Firestore not reachable (${(err as Error).message}); using local run files, whose statuses may be out of date.`);
  generated = runs.flatMap((r) => r.accepted ?? []);
  source = "local run files";
}
const all: Item[] = [...loadSeeds(), ...generated];

// The latest judge verdict per item: generated items carry it; seeds take it from the newest rejudge file that judged them.
const verdict = new Map<string, { accept: boolean; failed: string[] }>();
for (const f of files.filter((f) => /^rejudge-\d+\.json$/.test(f)).sort())
  for (const v of JSON.parse(readFileSync(join(outDir, f), "utf8")).verdicts ?? []) if (!v.error) verdict.set(v.id, { accept: v.accept, failed: v.failed });
for (const i of generated) if (i.pipeline?.rejudge) verdict.set(i.id, i.pipeline.rejudge);

const short: Record<string, string> = {
  selfAwareness: "Self-awareness", selfManagement: "Self-management", socialAwareness: "Social awareness",
  relationshipSkills: "Relationship skills", responsibleDecisionMaking: "Responsible decisions",
};
const BANDS = ["6-7", "8-10", "11-14"];
const STATUS: Record<string, string> = { active: "live", draft: "waiting for review", rejected: "rejected" };
const category = (i: Item) => (i.kind === "puzzle" ? `Puzzle: ${i.puzzle?.domain}` : short[i.primaryCompetencies[0]] ?? "Other");
const judgeNote = (i: Item) => { const v = verdict.get(i.id); return !v ? "not re-judged" : v.accept ? "passed" : `flagged: ${v.failed.join(", ") || "not accepted"}`; };
const scoreLine = (s?: Record<string, number>) =>
  s ? Object.entries(s).filter(([, v]) => v !== 0).map(([k, v]) => `${short[k]} ${v > 0 ? "+" : ""}${v}`).join(", ") || "neutral" : "";
const count = (pred: (i: Item) => boolean) => all.filter(pred).length;

const lines: string[] = [
  "# Question bank",
  "",
  `${all.length} items: ${count((i) => i.source === "seed")} hand-written seeds and ${count((i) => i.source !== "seed")} generated (statuses from ${source}, ${new Date().toISOString().slice(0, 10)}).`,
  `${rejectedCount} generated candidates were stopped by the pipeline and are not listed. Only **live** items reach children.`,
  "",
  "| Ages | Live | Waiting for review | Rejected | Live but flagged by the judge |",
  "| --- | --- | --- | --- | --- |",
  ...BANDS.map((b) => `| ${b} | ${count((i) => i.ageBand === b && i.status === "active")} | ${count((i) => i.ageBand === b && i.status === "draft")} | ${count((i) => i.ageBand === b && i.status === "rejected")} | ${count((i) => i.ageBand === b && i.status === "active" && verdict.get(i.id)?.accept === false)} |`),
  "",
];

const groups = new Map<string, Item[]>();
for (const i of [...all].sort((a, b) => BANDS.indexOf(a.ageBand) - BANDS.indexOf(b.ageBand) || category(a).localeCompare(category(b)))) {
  const key = `Ages ${i.ageBand} · ${category(i)}`;
  groups.set(key, [...(groups.get(key) ?? []), i]);
}
lines.push("| Group | Items | Live |", "| --- | --- | --- |");
for (const [k, v] of groups) lines.push(`| ${k} | ${v.length} | ${v.filter((i) => i.status === "active").length} |`);
lines.push("");

for (const [k, items] of groups) {
  lines.push(`## ${k}`, "");
  for (const i of items) {
    lines.push(`### ${i.title}`, `*${i.source === "seed" ? "seed" : "generated"} · **${STATUS[i.status] ?? i.status}** · judge: ${judgeNote(i)} · difficulty ${i.difficulty} · reading level ${i.readingLevel} · about ${i.expectedTimeSec}s${i.openChoice ? " · dilemma (not scored)" : ""} · id ${i.id}*`, "", i.text, "");
    for (const o of i.options) {
      const mark = i.puzzle?.correctOptionId === o.id ? " ✅" : "";
      const sc = scoreLine(o.scores);
      lines.push(`- **${o.id})** ${o.text}${mark}${sc ? `  \n  _Scores: ${sc}_` : ""}  \n  → ${o.consequence}`);
    }
    if (i.hint) lines.push("", `Hint: ${i.hint.text}`);
    if (i.puzzle) lines.push("", `Explanation: ${i.puzzle.explanation}`);
    lines.push("");
  }
}

const csvCell = (t: unknown) => `"${String(t ?? "").replace(/"/g, '""')}"`;
const csv = [
  ["id", "ages", "kind", "category", "source", "status", "judge", "dilemma", "difficulty", "title", "text", "options"].join(","),
  ...all.map((i) => [i.id, i.ageBand, i.kind, category(i), i.source, STATUS[i.status] ?? i.status, judgeNote(i), i.openChoice ? "yes" : "", i.difficulty, i.title, i.text,
    i.options.map((o) => `${o.id}) ${o.text}${i.puzzle?.correctOptionId === o.id ? " [answer]" : ""}`).join(" | ")].map(csvCell).join(",")),
].join("\n");

writeFileSync(join(outDir, "bank-readable.md"), lines.join("\n") + "\n", "utf8");
writeFileSync(join(outDir, "bank-all.csv"), "﻿" + csv + "\n", "utf8"); // BOM so Excel reads the ₹ and quotes correctly
console.log(`Wrote ${all.length} items to output/bank-readable.md and output/bank-all.csv`);
process.exit(0); // Firestore keeps the process alive otherwise
