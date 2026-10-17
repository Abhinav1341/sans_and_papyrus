/**
 * Builds a self-contained HTML dashboard for the question generator from local files:
 * seeds/ and every output/run-*.json. No server and no extra packages: open the file in a browser.
 * Run files are committed to git, so teammates who pull get the same dashboard.
 *
 * Usage (from the generator folder):  npm run bank:dashboard
 * Output: output/dashboard.html
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadSeeds } from "../src/bank";

const genDir = join(import.meta.dirname, "..");
const outDir = join(genDir, "output");

const runFiles = existsSync(outDir)
  ? readdirSync(outDir).filter((f) => /^run-.*(?<!\.embeddings)\.json$/.test(f)).sort()
  : [];
const runs = runFiles
  .map((f) => JSON.parse(readFileSync(join(outDir, f), "utf8")))
  .sort((a, b) => String(a.summary?.startedAt).localeCompare(String(b.summary?.startedAt)));
const seeds = loadSeeds();

const COMPETENCY_LABEL: Record<string, string> = {
  selfAwareness: "Self-awareness",
  selfManagement: "Self-management",
  socialAwareness: "Social awareness",
  relationshipSkills: "Relationship skills",
  responsibleDecisionMaking: "Responsible decisions",
};
const DOMAIN_LABEL: Record<string, string> = { math: "Maths puzzles", reasoning: "Reasoning puzzles", vocabulary: "Vocabulary puzzles" };
const STAGES = [
  { key: "generator", step: "Written by A", reject: "A failed to write" },
  { key: "rules", step: "Passed rule checks", reject: "Rule checks" },
  { key: "duplicate", step: "Not a duplicate", reject: "Duplicate" },
  { key: "grader", step: "Graded by B", reject: "Grader (B)" },
  { key: "category", step: "In the right category", reject: "Off-category" },
  { key: "curator", step: "Passed the Satori-lens judge (C)", reject: "Satori-lens judge (C)" },
  { key: "schema", step: "Saved for human review", reject: "Schema" },
] as const;

const categoryOf = (i: any): string =>
  i.kind === "puzzle"
    ? DOMAIN_LABEL[i.puzzle?.domain] ?? "Puzzles"
    : COMPETENCY_LABEL[i.pipeline?.target?.competency ?? i.primaryCompetencies?.[0]] ?? "Other";
const targetLabel = (t: any) =>
  t ? (t.kind === "puzzle" ? DOMAIN_LABEL[t.domain] ?? "Puzzle" : COMPETENCY_LABEL[t.competency] ?? "Situation") : "";

const accepted = runs.flatMap((r) => (r.accepted ?? []).map((a: any) => ({ ...a, runId: r.summary?.runId })));
const rejected = runs.flatMap((r) => (r.rejected ?? []).map((x: any) => ({ ...x, runId: r.summary?.runId })));
const items = [...seeds.map((s) => ({ ...s, runId: null })), ...accepted];

/* ---------------- headline numbers ---------------- */
const requested = runs.reduce((n, r) => n + (r.summary?.requested ?? 0), 0);
const cost = runs.reduce((n, r) => n + (r.summary?.estimatedCostUsd ?? 0), 0);

/* ---------------- funnel across all runs ---------------- */
const rejectedByStage: Record<string, number> = {};
for (const r of runs) for (const [k, v] of Object.entries(r.summary?.rejectedByStage ?? {})) rejectedByStage[k] = (rejectedByStage[k] ?? 0) + Number(v);
let remaining = requested;
const funnel = [{ label: "Candidates requested", value: requested, dropped: 0 }];
for (const s of STAGES) {
  const dropped = rejectedByStage[s.key] ?? 0;
  remaining -= dropped;
  funnel.push({ label: s.step, value: remaining, dropped });
}

/* ---------------- coverage and difficulty ---------------- */
const categories = [...Object.values(COMPETENCY_LABEL), ...Object.values(DOMAIN_LABEL)];
const coverage = categories.map((c) => {
  const inCat = items.filter((i: any) => categoryOf(i) === c);
  const by = (band: string) => inCat.filter((i: any) => i.ageBand === band);
  return {
    label: c,
    values: [by("8-10").length, by("11-14").length],
    detail: ["8-10", "11-14"].map((b) => {
      const list = by(b);
      return `${b}: ${list.filter((i: any) => i.source === "seed").length} seeds, ${list.filter((i: any) => i.source !== "seed").length} generated`;
    }),
  };
});
const difficulty = [1, 2, 3, 4].map((d) => ({
  label: `Difficulty ${d}`,
  values: ["8-10", "11-14"].map((b) => items.filter((i: any) => i.ageBand === b && i.difficulty === d).length),
}));
const askedVsGraded = accepted
  .filter((a: any) => a.pipeline?.target?.difficulty)
  .map((a: any) => ({ asked: a.pipeline.target.difficulty, graded: a.difficulty }));

/* ---------------- runs, growth, usage ---------------- */
let cumulative = seeds.length;
const runRows = runs.map((r, idx) => {
  const s = r.summary ?? {};
  const targets = [...(r.accepted ?? []).map((a: any) => a.pipeline?.target), ...(r.rejected ?? []).map((x: any) => x.target)];
  const targetSet = [...new Set(targets.map(targetLabel).filter(Boolean))];
  const usage = Object.values(s.usage ?? {}) as any[];
  cumulative += s.accepted ?? 0;
  return {
    n: idx + 1,
    runId: s.runId,
    startedAt: s.startedAt,
    minutes: s.finishedAt && s.startedAt ? (Date.parse(s.finishedAt) - Date.parse(s.startedAt)) / 60000 : null,
    targets: targetSet.length > 3 ? `Mixed (${targetSet.length} categories)` : targetSet.join(", "),
    requested: s.requested ?? 0,
    accepted: s.accepted ?? 0,
    rejectedByStage: s.rejectedByStage ?? {},
    cost: s.estimatedCostUsd ?? null,
    tokens: usage.reduce((n, u) => n + (u.inputTokens ?? 0) + (u.outputTokens ?? 0) + (u.thinkingTokens ?? 0), 0),
    models: s.models ?? {},
    bankAfter: cumulative,
  };
});
const usageByModel: Record<string, { calls: number; input: number; output: number; thinking: number }> = {};
for (const r of runs)
  for (const [m, u] of Object.entries<any>(r.summary?.usage ?? {})) {
    const t = (usageByModel[m] ??= { calls: 0, input: 0, output: 0, thinking: 0 });
    t.calls += u.calls ?? 0;
    t.input += u.inputTokens ?? 0;
    t.output += u.outputTokens ?? 0;
    t.thinking += u.thinkingTokens ?? 0;
  }

/* ---------------- items for the browser ---------------- */
const browserItems = items.map((i: any) => ({
  id: i.id,
  title: i.title,
  kind: i.kind,
  category: categoryOf(i),
  band: i.ageBand,
  source: i.source === "seed" ? "Seed" : "Generated",
  difficulty: i.difficulty,
  askedDifficulty: i.pipeline?.target?.difficulty ?? null,
  readingLevel: i.readingLevel,
  seconds: i.expectedTimeSec,
  text: i.text,
  options: i.options.map((o: any) => ({
    id: o.id, text: o.text, consequence: o.consequence, correct: i.puzzle?.correctOptionId === o.id,
    scores: o.scores ? Object.entries(o.scores).filter(([, v]) => v !== 0).map(([k, v]) => `${COMPETENCY_LABEL[k]} ${Number(v) > 0 ? "+" : ""}${v}`) : [],
  })),
  hint: i.hint?.text ?? null,
  explanation: i.puzzle?.explanation ?? null,
  grader: i.pipeline?.grade?.rationale ?? null,
  curator: i.pipeline?.curation?.reasons ?? null,
  similarity: i.pipeline?.maxSimilarity ?? null,
  runId: i.runId,
}));
const rejectedRows = rejected
  .map((x: any) => ({
    title: x.candidate?.title ?? "(nothing written)",
    stage: STAGES.find((s) => s.key === x.stage)?.reject ?? x.stage,
    reason: (x.reasons ?? []).join(" · "),
    target: targetLabel(x.target),
    band: x.target?.ageBand ?? "",
    runId: x.runId,
    at: x.createdAt,
  }))
  .sort((a: any, b: any) => String(b.at).localeCompare(String(a.at)));

const data = {
  builtAt: new Date().toISOString(),
  kpis: {
    bank: items.length,
    seeds: seeds.length,
    generated: accepted.length,
    runs: runs.length,
    requested,
    acceptance: requested ? accepted.length / requested : null,
    cost,
    costPerItem: accepted.length ? cost / accepted.length : null,
  },
  funnel,
  rejectedByStage: STAGES.map((s) => ({ label: s.reject, value: rejectedByStage[s.key] ?? 0 })).filter((r) => r.value > 0),
  coverage,
  difficulty,
  askedVsGraded,
  runs: runRows,
  usage: Object.entries(usageByModel).map(([model, u]) => ({ model, ...u })),
  items: browserItems,
  rejected: rejectedRows,
};

const template = readFileSync(join(import.meta.dirname, "dashboard-template.html"), "utf8");
const html = template.replace("/*__DATA__*/null", JSON.stringify(data).replace(/</g, "\\u003c"));
const file = join(outDir, "dashboard.html");
writeFileSync(file, html, "utf8");
console.log(`Dashboard: ${items.length} items, ${runs.length} runs → ${file}`);
