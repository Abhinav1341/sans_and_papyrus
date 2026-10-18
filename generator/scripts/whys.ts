/**
 * Fizz's "why" lines: after a child picks a weaker option in a situation, Fizz says why it didn't help (what it
 * did to someone's feelings or to the problem), then the child tries again (the game's guided retry).
 *
 *   npm run bank:whys -- write [--ids a,b] [--limit 5] [--redo]   write whys for live situations that need them
 *   npm run bank:whys -- export                                   → output/review/whys-<date>.md + .csv
 *   npm run bank:whys -- apply --file <csv> [--dry-run]          approve (whys go live) or reject (removed)
 *
 * Writing: Gemini (the writer model) drafts a line for every weak option, code checks the words, and the judge
 * model checks each line (kind, true to the story, teaches, no lecture, doesn't give the answer away). Lines that
 * pass are saved with whyApproved = false: the game uses them only after a person approves the item's whys.
 * Until then (or for a rejected line) Fizz uses a gentle line about the skill the choice missed.
 * Generated items are updated in Firestore; seeds in seeds/*.json (then run bank:upload-seeds).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { z, type AgeBand, type Situation } from "../../web/lib/schemas";
import { FirestoreBank, loadSeeds } from "../src/bank";
import { PIPELINE_CONFIG as CFG } from "../src/config";
import { loadEnv } from "../src/env";
import { UsageTracker, callJson, createGeminiClient } from "../src/gemini";
import { lineProblems } from "../src/rules";

const generatorDir = join(import.meta.dirname, "..");
loadEnv(generatorDir);
const [command] = process.argv.slice(2);
const { values } = parseArgs({
  args: process.argv.slice(3),
  options: {
    ids: { type: "string" }, limit: { type: "string" }, redo: { type: "boolean", default: false },
    file: { type: "string" }, "dry-run": { type: "boolean", default: false }, concurrency: { type: "string", default: "4" },
  },
});

const SEED_FILES = ["seed-situations.json", "seed-puzzles.json", "seed-situations-research.json", "seed-young.json"];
const MAX_WORDS: Record<AgeBand, number> = { "6-7": 20, "8-10": 26, "11-14": 30 };
const bank = new FirestoreBank();

/** How well a choice showed the item's focus skills (0–1), exactly as the game measures a first choice. */
function performance(item: Situation, optionId: string): number {
  const chosen = item.options.find((o) => o.id === optionId)!;
  const perfs = item.primaryCompetencies.flatMap((c) => {
    const vals = item.options.map((o) => o.scores?.[c] ?? 0);
    const max = Math.max(...vals), min = Math.min(...vals);
    return max === min ? [] : [((chosen.scores?.[c] ?? 0) - min) / (max - min)];
  });
  return perfs.length ? perfs.reduce((a, b) => a + b, 0) / perfs.length : 0.5;
}
/** The options that start a guided retry in the game (the same threshold as web/src/server/config.ts). */
const OFFER_RETRY_BELOW = 0.5;
const weakOptions = (i: Situation) => i.options.filter((o) => performance(i, o.id) < OFFER_RETRY_BELOW);

type Item = Situation & { _seedFile?: string };
async function liveSituations(): Promise<Item[]> {
  const seeds: Item[] = SEED_FILES.filter((f) => existsSync(join(generatorDir, "seeds", f))).flatMap((f) =>
    (JSON.parse(readFileSync(join(generatorDir, "seeds", f), "utf8")) as Situation[]).map((s) => ({ ...s, _seedFile: f })));
  const generated = (await bank.loadByStatus("active")) as Item[];
  return [...seeds.filter((s) => s.status === "active"), ...generated].filter((i) => i.kind === "situation" && !i.openChoice);
}

/** Saves an item's options (with whys) and whyApproved, wherever the item lives. */
async function saveItem(item: Item, options: Situation["options"], whyApproved: boolean) {
  if (item._seedFile) {
    const path = join(generatorDir, "seeds", item._seedFile);
    const raw = readFileSync(path, "utf8");
    const indent = raw.match(/^\[\r?\n( +)/)?.[1].length ?? 2;
    const list = JSON.parse(raw) as Situation[];
    const s = list.find((x) => x.id === item.id)!;
    s.options = options;
    s.whyApproved = whyApproved;
    writeFileSync(path, JSON.stringify(list, null, indent) + "\n");
  } else {
    await bank.db.collection(CFG.collections.generated).doc(item.id).update({ options, whyApproved });
  }
}

/* ------------------------------------------------------------------ */
/* write                                                               */
/* ------------------------------------------------------------------ */

const WRITER_SYSTEM = `You write Fizz's "why" lines for a story game that helps children in India practise social-emotional skills.
After a child picks a choice that doesn't help, the game shows what happened (the consequence). Then Fizz, a kind robot
friend, says one "why" line, and the child tries another way. Your line helps them understand, so the next try is better.

Rules for each line:
- One or two short sentences, at most the word limit you are given. Plain words a child of that age knows.
- Say what the choice did: how the other person felt, or what happened to the problem. Build on the consequence; don't repeat it.
- Use only what the story and the consequence say: never invent new details or feelings that aren't there.
- End with an open question about feelings or what might help ("How might Riya feel now?", "What could make this
  easier?"). Never name the helpful action itself (not "maybe you could ask...", "try using calm words"): the
  child must find it on the next try.
- Warm, like a kind older friend. Use the story's names. Speak to the child as "you".
- Never: "wrong", "bad", "naughty", "should", "must", scolding, labels for the child, a moral or "the lesson is",
  praise, anything frightening, anything about medicine or illness.
Example: "Shouting made Kabir feel scared, and your drawing was still wet. Maybe there is a way to find out what happened first?"`;

const JUDGE_SYSTEM = `You check Fizz's "why" lines in a children's social-emotional learning game (ages given), as a warm,
clinically careful child psychologist. Each line is said after a child picks a choice that didn't help; the child then tries again.
Pass a line only if ALL are true:
- kind: no shaming, scolding, labels or "wrong"; the child would not feel stupid or told off;
- true: it matches what happened in the story and the consequence shown;
- teaches: it names the effect on someone's feelings or on the problem, so the child learns something;
- not a lecture: no moral, no "should", no summary of the lesson;
- open: it does not give away a specific option word for word;
- age-right: words and length fit the age band.
Give a one-line note naming the exact words that fail it.`;

const Written = z.object({ whys: z.array(z.object({ optionId: z.string(), why: z.string() })) });
const Judged = z.object({ verdicts: z.array(z.object({ optionId: z.string(), pass: z.boolean(), note: z.string().max(200) })) });

async function write() {
  const ai = createGeminiClient();
  const usage = new UsageTracker();
  // Items with a weak option still missing its why (all weak options with --redo).
  const needing = (i: Item) => weakOptions(i).filter((o) => values.redo || !o.why);
  let items = (await liveSituations()).filter((i) => !i.whyApproved && needing(i).length);
  if (values.ids) items = items.filter((i) => values.ids!.split(",").includes(i.id));
  if (values.limit) items = items.slice(0, Number(values.limit));
  let lines = 0, passed = 0;
  const queue = [...items];
  const one = async (i: Item) => {
    const weak = needing(i);
    if (!weak.length) return;
    const story = { ages: i.ageBand, title: i.title, story: i.text, focusSkills: i.primaryCompetencies,
      options: i.options.map((o) => ({ id: o.id, choice: o.text, consequence: o.consequence, needsWhy: weak.includes(o) })) };
    try {
      const w = await callJson(ai, { usage, model: CFG.models.generator, system: WRITER_SYSTEM, schema: Written, temperature: 0.6,
        prompt: `Word limit: ${MAX_WORDS[i.ageBand]} words.\nWrite one line for each option with needsWhy: true.\n${JSON.stringify(story, null, 1)}` });
      const drafts = w.whys.filter((x) => weak.some((o) => o.id === x.optionId))
        .map((x) => ({ ...x, why: x.why.trim(), problems: lineProblems(x.why, MAX_WORDS[i.ageBand]) }));
      const clean = drafts.filter((d) => !d.problems.length);
      const j = clean.length ? await callJson(ai, { usage, model: CFG.models.curator, system: JUDGE_SYSTEM, schema: Judged, temperature: 0.2,
        prompt: `${JSON.stringify(story, null, 1)}\n\nLines to check:\n${JSON.stringify(clean.map(({ optionId, why }) => ({ optionId, why })), null, 1)}` }) : { verdicts: [] };
      const ok = new Map(clean.filter((d) => j.verdicts.find((v) => v.optionId === d.optionId)?.pass).map((d) => [d.optionId, d.why]));
      // New lines replace only the options they were written for; lines that already passed stay.
      const options = i.options.map((o) => (ok.has(o.id) ? { ...o, why: ok.get(o.id)! } : o));
      lines += drafts.length;
      passed += ok.size;
      const failed = [...drafts.filter((d) => d.problems.length).map((d) => `${d.optionId}: ${d.problems.join("; ")}`),
        ...j.verdicts.filter((v) => !v.pass).map((v) => `${v.optionId}: ${v.note}`)];
      console.log(`${ok.size === weak.length ? "✓" : "…"} ${i.id} "${i.title}" ${ok.size}/${weak.length} whys${failed.length ? ` (dropped ${failed.join(" | ").slice(0, 160)})` : ""}`);
      if (!values["dry-run"]) await saveItem(i, options, false);
    } catch (err) {
      console.log(`! ${i.id}: ${(err as Error).message.slice(0, 120)}`);
    }
  };
  console.log(`Writing whys for ${items.length} live situations (writer ${CFG.models.generator}, judge ${CFG.models.curator})…`);
  await Promise.all(Array.from({ length: Number(values.concurrency) }, async () => { for (let i = queue.shift(); i; i = queue.shift()) await one(i); }));
  console.log(`\n${passed} of ${lines} lines passed the word check and the judge (cost about $${usage.estimateCost(CFG.pricesPerMillionUsd)?.toFixed(2)}).`);
  console.log("Next: npm run bank:upload-seeds (for seeds), then npm run bank:whys -- export");
}

/* ------------------------------------------------------------------ */
/* review                                                              */
/* ------------------------------------------------------------------ */

const csvCell = (t: unknown) => `"${String(t ?? "").replace(/"/g, '""')}"`;

async function exportReview() {
  const items = (await liveSituations()).filter((i) => !i.whyApproved && i.options.some((o) => o.why));
  const dir = join(generatorDir, "output", "review");
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
  const md = [`# Fizz's "why" lines waiting for review (${items.length} items)`, "",
    "After a choice that didn't help, the child sees the consequence, hears Fizz's why, and tries again.",
    `Approve or reject each item's lines in whys-${stamp}.csv, then run: npm run bank:whys -- apply --file output/review/whys-${stamp}.csv`, "",
    ...items.flatMap((i) => [`### ${i.title} · \`${i.id}\``, `*Ages ${i.ageBand}*`, "", i.text, "",
      ...i.options.map((o) => `- **${o.id})** ${o.text}  \n  → ${o.consequence}${o.why ? `  \n  **Fizz:** ${o.why}` : ""}`), ""])].join("\n");
  const csv = [["id", "ages", "title", "whys", "decision", "reviewer", "note"].join(","),
    ...items.map((i) => [i.id, i.ageBand, i.title, i.options.filter((o) => o.why).map((o) => `${o.id}) ${o.why}`).join(" | "), "", "", ""].map(csvCell).join(","))].join("\n");
  writeFileSync(join(dir, `whys-${stamp}.md`), md + "\n");
  writeFileSync(join(dir, `whys-${stamp}.csv`), "﻿" + csv + "\n");
  console.log(`${items.length} items → output/review/whys-${stamp}.md and .csv`);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (ch === '"') quoted = false; else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(field); rows.push(row); row = []; field = ""; }
    else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

async function apply() {
  if (!values.file) throw new Error("Pass --file <the filled-in whys CSV>.");
  const [header, ...rows] = parseCsv(readFileSync(values.file, "utf8").replace(/^﻿/, ""));
  const col = (n: string) => header.indexOf(n);
  const items = new Map((await liveSituations()).map((i) => [i.id, i]));
  let approved = 0, rejected = 0, skipped = 0;
  for (const row of rows) {
    const id = row[col("id")]?.trim(), decision = row[col("decision")]?.trim().toLowerCase();
    const item = items.get(id);
    if (!decision || !item) { skipped++; continue; }
    if (!row[col("reviewer")]?.trim()) { console.log(`- ${id}: needs a reviewer name, skipped`); skipped++; continue; }
    if (decision === "approve") {
      console.log(`✓ ${id} "${item.title}": whys approved`);
      if (!values["dry-run"]) await saveItem(item, item.options, true);
      approved++;
    } else if (decision === "reject") {
      console.log(`✗ ${id} "${item.title}": whys removed (Fizz uses the gentle general line)`);
      if (!values["dry-run"]) await saveItem(item, item.options.map(({ why: _w, ...o }) => o), false);
      rejected++;
    } else { console.log(`- ${id}: decision must be approve or reject`); skipped++; }
  }
  console.log(`\n${values["dry-run"] ? "Dry run, nothing saved. " : ""}${approved} approved, ${rejected} rejected, ${skipped} skipped.`);
  if (!values["dry-run"]) console.log("Seeds changed? Run npm run bank:upload-seeds. Then record the new lines: npm run voices:warm (in web/).");
}


if (command === "write") await write();
else if (command === "export") await exportReview();
else if (command === "apply") await apply();
else throw new Error('Use "write", "export" or "apply".');
process.exit(0); // Firestore keeps the process alive otherwise
