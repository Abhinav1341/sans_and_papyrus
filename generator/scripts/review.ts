/**
 * Human review of generated items. Nothing the pipeline writes reaches a child until people approve it.
 *
 *   npm run bank:review-export                       drafts in Firestore → output/review/review-<date>.md + .csv
 *   npm run bank:review-export -- --from-run <file>  drafts from a local run file instead (for --local-only runs)
 *   npm run bank:review-apply -- --file <csv> [--dry-run]
 *
 * In the CSV, fill "decision" with approve or reject, "reviewers" with your name (two names separated by ";"
 * if two people reviewed together) and, for a rejection, a "note" saying why. Blank rows are skipped.
 * Situations go live after approvals from PIPELINE_CONFIG.requiredApprovals.situation different people;
 * puzzles after .puzzle. A rejection keeps the item out of the game for good.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { COMPETENCIES } from "../../web/lib/schemas";
import { FirestoreBank, type GeneratedRecord } from "../src/bank";
import { PIPELINE_CONFIG as CFG } from "../src/config";
import { constructById } from "../src/constructs";
import { loadEnv } from "../src/env";

const generatorDir = join(import.meta.dirname, "..");
loadEnv(generatorDir);
const [command] = process.argv.slice(2);
const { values } = parseArgs({
  args: process.argv.slice(3),
  options: { file: { type: "string" }, "from-run": { type: "string" }, "dry-run": { type: "boolean", default: false } },
});

const ABBR = { selfAwareness: "SA", selfManagement: "SM", socialAwareness: "SoA", relationshipSkills: "RS", responsibleDecisionMaking: "RDM" } as const;
const cell = (t: unknown) => String(t ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const csvCell = (t: unknown) => `"${String(t ?? "").replace(/"/g, '""')}"`;
const signed = (n = 0) => (n > 0 ? `+${n}` : String(n));
const required = (r: GeneratedRecord) => CFG.requiredApprovals[r.kind];

/** A small CSV reader (quoted fields, doubled quotes, commas and newlines inside quotes). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

function describe(r: GeneratedRecord): string {
  const construct = constructById(r.pipeline?.target?.construct);
  const principles = Object.entries(r.pipeline?.curation?.principles ?? {}).map(([k, v]) => `${v.pass ? "✓" : "✗"} ${k}: ${v.note}`);
  const options = r.kind === "situation"
    ? ["| Option | Answer | SA | SM | SoA | RS | RDM | Consequence shown |", "| --- | --- | --- | --- | --- | --- | --- | --- |",
       ...r.options.map((o) => `| ${o.id} | ${cell(o.text)} | ${COMPETENCIES.map((c) => signed(o.scores?.[c])).join(" | ")} | ${cell(o.consequence)} |`)]
    : ["| Option | Answer | Consequence shown |", "| --- | --- | --- |",
       ...r.options.map((o) => `| ${o.id}${o.id === r.puzzle?.correctOptionId ? " ✓" : ""} | ${cell(o.text)} | ${cell(o.consequence)} |`)];
  return [
    `### ${r.title} · \`${r.id}\``,
    `*Ages ${r.ageBand} · ${r.kind} · ${r.primaryCompetencies.map((c) => ABBR[c]).join(" + ") || r.puzzle?.domain} · difficulty ${r.difficulty} · reading level ${r.readingLevel} · needs ${required(r)} approval(s), has ${r.review?.approvals.length ?? 0}*`,
    "", r.text, "", ...options, "",
    ...(r.hint ? [`**Hint:** ${r.hint.text}`] : []),
    ...(r.puzzle ? [`**Explanation:** ${r.puzzle.explanation}`] : []),
    ...(construct ? [`**Built on:** ${construct.name} (${construct.source})`] : []),
    `**Grader (blind):** ${r.pipeline?.grade?.rationale ?? "—"}`,
    ...(principles.length ? ["**Satori-lens judge:**", ...principles.map((p) => `- ${p}`)] : []),
    "",
  ].join("\n");
}

async function exportDrafts() {
  const drafts: GeneratedRecord[] = values["from-run"]
    ? (JSON.parse(readFileSync(values["from-run"], "utf8")).accepted as GeneratedRecord[]).filter((r) => r.status === "draft")
    : await new FirestoreBank().loadByStatus("draft");
  drafts.sort((a, b) => a.ageBand.localeCompare(b.ageBand) || a.kind.localeCompare(b.kind) || a.createdAt.localeCompare(b.createdAt));
  const dir = join(generatorDir, "output", "review");
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
  const md = [
    `# Items waiting for review (${drafts.length})`, "",
    "Every item passed the rule checks, the duplicate check, the blind grader and the Satori-lens judge. None is live yet.",
    `Situations need ${CFG.requiredApprovals.situation} approvals from different people; puzzles need ${CFG.requiredApprovals.puzzle}.`,
    `Record decisions in review-${stamp}.csv, then run: npm run bank:review-apply -- --file output/review/review-${stamp}.csv`, "",
    ...drafts.map(describe),
  ].join("\n");
  const csv = [["id", "band", "kind", "construct", "title", "decision", "reviewers", "note"].join(","),
    ...drafts.map((r) => [r.id, r.ageBand, r.kind, r.pipeline?.target?.construct ?? "", r.title, "", "", ""].map(csvCell).join(","))].join("\n");
  writeFileSync(join(dir, `review-${stamp}.md`), md + "\n");
  writeFileSync(join(dir, `review-${stamp}.csv`), csv + "\n");
  console.log(`${drafts.length} drafts → output/review/review-${stamp}.md and .csv`);
}

async function applyDecisions() {
  if (!values.file) throw new Error("Pass --file <the filled-in review CSV>.");
  const [header, ...rows] = parseCsv(readFileSync(values.file, "utf8"));
  const col = (name: string) => header.indexOf(name);
  for (const name of ["id", "decision", "reviewers", "note"]) if (col(name) < 0) throw new Error(`The CSV has no "${name}" column.`);
  const bank = new FirestoreBank();
  const drafts = new Map((await bank.loadByStatus("draft")).map((r) => [r.id, r]));
  const now = new Date().toISOString();
  let live = 0, waiting = 0, rejected = 0, skipped = 0;
  for (const row of rows) {
    const id = row[col("id")]?.trim(), decision = row[col("decision")]?.trim().toLowerCase();
    const reviewers = (row[col("reviewers")] ?? "").split(/[;,]/).map((s) => s.trim()).filter(Boolean);
    const note = row[col("note")]?.trim() || undefined;
    if (!decision) { skipped++; continue; }
    const item = drafts.get(id);
    if (!item) { console.log(`- ${id}: not a draft any more (or not found), skipped`); skipped++; continue; }
    if (!reviewers.length) { console.log(`- ${id}: ${decision} needs a reviewer name, skipped`); skipped++; continue; }
    const review = { approvals: [...(item.review?.approvals ?? [])] };
    if (decision === "reject") {
      if (!note) { console.log(`- ${id}: a rejection needs a note saying why, skipped`); skipped++; continue; }
      console.log(`✗ ${id} "${item.title}" rejected by ${reviewers.join(" and ")}: ${note}`);
      if (!values["dry-run"]) await bank.saveReview(id, "rejected", { ...review, rejection: { reviewer: reviewers.join("; "), note, at: now } });
      rejected++;
    } else if (decision === "approve") {
      for (const reviewer of reviewers)
        if (!review.approvals.some((a) => a.reviewer.toLowerCase() === reviewer.toLowerCase())) review.approvals.push({ reviewer, note, at: now });
      const goesLive = review.approvals.length >= required(item);
      console.log(`${goesLive ? "✓" : "…"} ${id} "${item.title}" approvals ${review.approvals.length}/${required(item)}${goesLive ? ": now live" : ": waiting for another reviewer"}`);
      if (!values["dry-run"]) await bank.saveReview(id, goesLive ? "active" : "draft", review);
      if (goesLive) live++; else waiting++;
    } else {
      console.log(`- ${id}: decision must be approve or reject (got "${decision}"), skipped`); skipped++;
    }
  }
  console.log(`\n${values["dry-run"] ? "Dry run, nothing saved. " : ""}${live} live, ${waiting} waiting for another approval, ${rejected} rejected, ${skipped} skipped.`);
}

if (command === "export") await exportDrafts();
else if (command === "apply") await applyDecisions();
else throw new Error('Use "export" or "apply".');
process.exit(0); // Firestore keeps the process alive otherwise
