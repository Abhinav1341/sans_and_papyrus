/**
 * Bank expansion: A generates → code checks rules → duplicate check by embedding → B grades blind →
 * code checks the grading and the category → C curates → accepted items are stored apart from the seeds.
 */
import { createHash, randomBytes } from "node:crypto";
import {
  COMPETENCIES, CurationResult, GeneratedSituation, GradeResult, PUZZLE_DOMAINS, PUZZLE_EVERY_N_ITEMS,
  Situation, z, type AgeBand, type Competency, type PuzzleDomain,
} from "../../web/lib/schemas";
import { PIPELINE_CONFIG as CFG } from "./config";
import { CONSTRUCTS, constructById } from "./constructs";
import { UsageTracker, callJson, cosine, embed, type LlmClient } from "./gemini";
import {
  CURATOR_SYSTEM, GENERATOR_SYSTEM, GRADER_SYSTEM, NAMES, SETTINGS, curatorPrompt, generatorPrompt, graderPrompt, pickRandom,
} from "./prompts";
import { checkCandidate, checkCategory, checkGrade, countWords } from "./rules";
import {
  loadEmbeddingCache, loadLocalGenerated, loadSeeds, saveEmbeddingCache, writeRunFile,
  type FirestoreBank, type GeneratedRecord, type RejectedRecord, type RunSummary, type Stage, type Target,
} from "./bank";

export interface ExpandOptions {
  count: number;
  kind: "situation" | "puzzle" | "mixed";
  ageBand: AgeBand | "any";
  competency?: Competency;
  domain?: PuzzleDomain;
  concurrency: number;
  /** Also learn from draft seeds (a new band before its seeds are approved). Output is still a draft for review. */
  draftExamples?: boolean;
}

export interface ExpandDeps {
  ai: LlmClient;
  store?: FirestoreBank; // omit to run without Firestore (local files only)
  outDir: string;
  log?: (line: string) => void;
}

type BankEntry = { id: string; title: string; embedding: number[]; kind: string; competencies: string[]; construct?: string };

/** The construct a seed was built on, from the constructs' own seed lists. */
const seedConstruct = (id: string) => CONSTRUCTS.find((c) => c.seedIds.includes(id))?.id;

const embedText = (x: { title: string; text: string; options: { text: string }[] }) =>
  `${x.title}. ${x.text} Options: ${x.options.map((o) => o.text).join(" / ")}`;

/** The judge's output: the shared curation shape, with the Satori principles required rather than optional. */
export const JudgeResult = CurationResult.extend({
  principles: CurationResult.shape.principles.unwrap(),
  originalPlot: z.boolean(),
  openChoice: z.boolean(),
});

const newId = (kind: string) => `gen-${kind === "situation" ? "sit" : "pz"}-${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;

/**
 * Spreads requests across kinds, age bands and the least-covered competencies. Each situation is built on
 * the least-used research construct that fits its competency and age band (counting what this run plans too).
 */
function planTargets(opts: ExpandOptions, bank: BankEntry[]): Target[] {
  const coverage = (c: string) => bank.filter((b) => b.kind === "situation" && b.competencies.includes(c)).length;
  const constructUse = new Map<string, number>();
  for (const b of bank) if (b.construct) constructUse.set(b.construct, (constructUse.get(b.construct) ?? 0) + 1);
  const pickConstruct = (competency: Competency, band: AgeBand) => {
    const fits = CONSTRUCTS.filter((c) => c.competencies.includes(competency) && c.bands.includes(band));
    const best = [...fits].sort((a, b) => (constructUse.get(a.id) ?? 0) - (constructUse.get(b.id) ?? 0) || Math.random() - 0.5)[0];
    if (best) constructUse.set(best.id, (constructUse.get(best.id) ?? 0) + 1);
    return best?.id;
  };
  const competencies = opts.competency ? [opts.competency] : [...COMPETENCIES].sort((a, b) => coverage(a) - coverage(b));
  const domains = opts.domain ? [opts.domain] : [...PUZZLE_DOMAINS];
  const targets: Target[] = [];
  let s = 0, p = 0;
  const difficultyFor = (i: number, band: AgeBand) =>
    ({ "6-7": [1, 1, 2, 1, 2], "8-10": [1, 2, 3, 2, 3], "11-14": [2, 3, 4, 3, 4] })[band][Math.floor(i / 2) % 5];
  for (let i = 0; i < opts.count; i++) {
    const kind =
      opts.kind === "mixed" ? ((i + 1) % PUZZLE_EVERY_N_ITEMS === 0 ? "puzzle" : "situation") : opts.kind;
    const ageBand: AgeBand = opts.ageBand === "any" ? (i % 2 === 0 ? "8-10" : "11-14") : opts.ageBand;
    if (kind === "situation") {
      const competency = competencies[s++ % competencies.length];
      targets.push({ kind, ageBand, competency, difficulty: difficultyFor(i, ageBand), construct: pickConstruct(competency, ageBand) });
    } else {
      targets.push({ kind, ageBand, domain: domains[p++ % domains.length], difficulty: difficultyFor(i, ageBand) });
    }
  }
  return targets;
}

/** Seed examples closest to the target (its construct's own seeds first), with a little randomness so prompts vary. */
function pickExamples(seeds: Situation[], t: Target): Situation[] {
  const constructSeeds = constructById(t.construct)?.seedIds ?? [];
  const score = (s: Situation) =>
    (constructSeeds.includes(s.id) ? 6 : 0) +
    (s.kind === t.kind ? 10 : 0) +
    // Ages 6-7 are written very differently, so a 6-7 example beats a closer research idea from an older band.
    (s.ageBand === t.ageBand ? (t.ageBand === "6-7" ? 8 : 3) : 0) +
    (t.competency && s.primaryCompetencies.includes(t.competency) ? 2 : 0) +
    (t.domain && s.puzzle?.domain === t.domain ? 2 : 0) +
    Math.random();
  return [...seeds].sort((a, b) => score(b) - score(a)).slice(0, CFG.examplesPerPrompt);
}

async function pool<T>(items: T[], concurrency: number, fn: (item: T, index: number) => Promise<void>) {
  let next = 0;
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (next < items.length) {
      const i = next++;
      await fn(items[i], i);
    }
  });
  await Promise.all(workers);
}

export async function expandBank(opts: ExpandOptions, deps: ExpandDeps) {
  const log = deps.log ?? (() => {});
  const runId = `${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}-${randomBytes(2).toString("hex")}`;
  const startedAt = new Date().toISOString();
  const models = { ...CFG.models };
  const usage = new UsageTracker();

  // 1. Load the bank: seeds from the repo, earlier generated items from Firestore or local run files.
  const seeds = loadSeeds();
  const previous = deps.store ? await deps.store.loadGenerated() : loadLocalGenerated(deps.outDir);
  log(`Bank: ${seeds.length} seeds, ${previous.length} generated items`);

  // 2. Embeddings for duplicate checks (seed embeddings cached on disk).
  const cache = loadEmbeddingCache(deps.outDir);
  const bank: BankEntry[] = [];
  for (const s of seeds) {
    const key = `${models.embedding}:${s.id}:${createHash("sha1").update(embedText(s)).digest("hex").slice(0, 12)}`;
    cache[key] ??= await embed(deps.ai, models.embedding, embedText(s), usage);
    bank.push({ id: s.id, title: s.title, embedding: cache[key], kind: s.kind, competencies: s.primaryCompetencies, construct: seedConstruct(s.id) });
  }
  saveEmbeddingCache(deps.outDir, cache);
  for (const g of previous)
    bank.push({ id: g.id, title: g.title, embedding: g.embedding, kind: g.kind, competencies: g.primaryCompetencies, construct: g.pipeline?.target?.construct });

  // 3. Plan and process each candidate.
  const targets = planTargets(opts, bank);
  const accepted: GeneratedRecord[] = [];
  const rejected: RejectedRecord[] = [];

  const reject = async (t: Target, stage: Stage, reasons: string[], extra: Partial<RejectedRecord> = {}) => {
    const r: RejectedRecord = { id: newId(t.kind), runId, target: t, stage, reasons, createdAt: new Date().toISOString(), ...extra };
    rejected.push(r);
    await deps.store?.saveRejected(r);
    log(`  ${labels.get(t) ?? ""} ✗ rejected at ${stage}: ${reasons[0]}`);
  };

  const labels = new Map<Target, string>();
  await pool(targets, opts.concurrency, async (t, i) => {
    const label = `[${i + 1}/${targets.length}]`;
    labels.set(t, label);
    log(`${label} start: ${t.kind} ${t.ageBand} ${t.competency ?? t.domain}${t.construct ? ` · ${t.construct}` : ""}, difficulty ${t.difficulty}`);
    // Drafts never teach the generator, unless asked for a new band whose seeds are still being reviewed.
    const examples = pickExamples(seeds.filter((s) => s.status === "active" || (opts.draftExamples && s.ageBand === t.ageBand)), t);
    const avoidTitles = bank.map((b) => b.title).slice(-80);

    // A: generate
    let candidate: GeneratedSituation;
    try {
      candidate = await callJson(deps.ai, {
        usage, model: models.generator, system: GENERATOR_SYSTEM, schema: GeneratedSituation, temperature: CFG.temperature.generator,
        prompt: generatorPrompt({ ...t, construct: constructById(t.construct), examples, avoidTitles, setting: pickRandom(SETTINGS, 1)[0], names: pickRandom(NAMES, 3) }),
      });
    } catch (err) {
      return reject(t, "generator", [(err as Error).message]);
    }

    // Code: hard rules
    const ruleProblems = checkCandidate(candidate, t);
    if (t.kind === "situation" && t.competency && !candidate.primaryCompetencies.includes(t.competency))
      ruleProblems.push(`Asked to focus on ${t.competency}, but it is not a primary competency`);
    if (ruleProblems.length) return reject(t, "rules", ruleProblems, { candidate });

    // Code: near-duplicate check (before grading, so near-copies don't cost a grader call)
    const embedding = await embed(deps.ai, models.embedding, embedText(candidate), usage);
    const sims = bank.map((b) => ({ id: b.id, sim: cosine(embedding, b.embedding) })).sort((a, b) => b.sim - a.sim);
    const top = sims[0] ?? { id: undefined, sim: 0 };
    if (top.sim > CFG.duplicateThreshold)
      return reject(t, "duplicate", [`Too similar to ${top.id} (similarity ${top.sim.toFixed(3)})`], {
        candidate, maxSimilarity: top.sim, mostSimilarId: top.id,
      });

    // B: grade blind
    let grade: GradeResult;
    try {
      grade = await callJson(deps.ai, {
        usage, model: models.grader, system: GRADER_SYSTEM, schema: GradeResult, temperature: CFG.temperature.grader,
        prompt: graderPrompt(candidate),
      });
    } catch (err) {
      return reject(t, "grader", [(err as Error).message], { candidate, maxSimilarity: top.sim, mostSimilarId: top.id });
    }
    const gradeProblems = checkGrade(candidate, grade);
    if (gradeProblems.length)
      return reject(t, "grader", gradeProblems, { candidate, grade, maxSimilarity: top.sim, mostSimilarId: top.id });

    // Code: category check. B never saw A's target, so agreement is independent evidence the item is in the right category.
    if (t.kind === "situation" && t.competency) {
      const offCategory = checkCategory(candidate, grade, t.competency);
      if (offCategory)
        return reject(t, "category", [offCategory], { candidate, grade, maxSimilarity: top.sim, mostSimilarId: top.id });
    }


    // C: the Satori-lens judge (every principle must pass; a person still approves whatever it lets through)
    let curation: CurationResult;
    try {
      curation = await callJson(deps.ai, {
        usage, model: models.curator, system: CURATOR_SYSTEM, schema: JudgeResult, temperature: CFG.temperature.curator,
        prompt: curatorPrompt(candidate, grade, examples, constructById(t.construct)),
      });
    } catch (err) {
      return reject(t, "curator", [(err as Error).message], { candidate, grade });
    }
    const failedPrinciples = Object.entries(curation.principles ?? {}).filter(([, v]) => !v.pass).map(([k, v]) => `${k}: ${v.note}`);
    const passes =
      curation.accept && curation.safe && curation.fitsGame &&
      curation.hintIsNudge !== false && curation.explanationIsKind !== false && curation.originalPlot !== false &&
      failedPrinciples.length === 0;
    if (!passes)
      return reject(t, "curator", [...failedPrinciples, ...curation.reasons].slice(0, 6).concat(failedPrinciples.length || curation.reasons.length ? [] : ["Judge did not accept"]), {
        candidate, grade, curation, maxSimilarity: top.sim, mostSimilarId: top.id,
      });

    // Assemble and validate the final item.
    const scoresById = new Map(grade.optionScores.map((s) => [s.optionId, s.scores]));
    const item = {
      id: newId(t.kind),
      kind: candidate.kind,
      title: candidate.title,
      text: candidate.text,
      ageBand: candidate.ageBand,
      readingLevel: grade.readingLevel,
      wordCount: countWords(candidate.text) + candidate.options.reduce((n, o) => n + countWords(o.text), 0),
      expectedTimeSec: grade.expectedTimeSec,
      difficulty: grade.difficulty,
      primaryCompetencies: candidate.primaryCompetencies,
      valueTags: candidate.valueTags,
      options: candidate.options.map((o) => ({ ...o, ...(scoresById.get(o.id) ? { scores: scoresById.get(o.id) } : {}) })),
      ...(candidate.hint ? { hint: candidate.hint } : {}),
      ...(candidate.puzzle ? { puzzle: candidate.puzzle } : {}),
      ...(candidate.kind === "situation" && (curation.openChoice || constructById(t.construct)?.openChoice) ? { openChoice: true } : {}),
      source: "generated" as const,
      seedIds: examples.map((e) => e.id),
      status: "draft" as const, // a person approves it before any child sees it (scripts/review.ts)
      similarIds: sims.filter((s) => s.sim >= CFG.neighbourThreshold).slice(0, CFG.maxNeighbours).map((s) => s.id),
      createdAt: new Date().toISOString(),
    };
    const parsed = Situation.safeParse(item);
    if (!parsed.success)
      return reject(t, "schema", parsed.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`), { candidate, grade, curation });

    const record: GeneratedRecord = {
      ...parsed.data,
      embedding,
      pipeline: {
        runId, target: t, models,
        grade: { rationale: grade.rationale, solvedOptionId: grade.solvedOptionId },
        curation, maxSimilarity: top.sim, mostSimilarId: top.id,
      },
    };
    accepted.push(record);
    bank.push({ id: record.id, title: record.title, embedding, kind: record.kind, competencies: record.primaryCompetencies, construct: t.construct });
    await deps.store?.saveAccepted(record);
    log(`  ${label} ✓ passed all gates, saved as a draft for human review: "${record.title}" (asked difficulty ${t.difficulty}, graded ${record.difficulty})`);
  });

  // 4. Summary, stored in Firestore and as a local run file.
  const rejectedByStage: RunSummary["rejectedByStage"] = {};
  for (const r of rejected) rejectedByStage[r.stage] = (rejectedByStage[r.stage] ?? 0) + 1;
  const acceptedByCategory: Record<string, number> = {};
  for (const a of accepted) {
    const key = `${a.kind}:${a.pipeline.target.competency ?? a.pipeline.target.domain}`;
    acceptedByCategory[key] = (acceptedByCategory[key] ?? 0) + 1;
  }
  const summary: RunSummary = {
    runId, startedAt, finishedAt: new Date().toISOString(),
    requested: targets.length, accepted: accepted.length, rejectedByStage, acceptedByCategory, models,
    usage: usage.summary(), estimatedCostUsd: usage.estimateCost(CFG.pricesPerMillionUsd),
  };
  await deps.store?.saveRun(summary);
  const file = writeRunFile(deps.outDir, { summary, accepted, rejected });
  return { summary, accepted, rejected, file };
}
