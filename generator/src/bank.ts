/**
 * Where items live. Seeds and generated items are always kept apart:
 *   seeds      → generator/seeds/seed-*.json (source of truth) and the Firestore "seedItems" collection
 *   generated  → Firestore "generatedItems" (accepted) and "rejectedItems" (rejected, with reasons)
 *   every run  → a JSON copy in generator/output/run-<id>.json for review in git
 * The game only reads Firestore; it never needs these files.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Firestore } from "@google-cloud/firestore";
import { Situation, type CurationResult, type GeneratedSituation, type GradeResult } from "../../web/lib/schemas";
import { PIPELINE_CONFIG } from "./config";
import type { ModelUsage } from "./gemini";

export type Stage = "generator" | "rules" | "duplicate" | "grader" | "category" | "curator" | "schema";

export interface Target {
  kind: "situation" | "puzzle";
  ageBand: "8-10" | "11-14";
  competency?: Situation["primaryCompetencies"][number];
  domain?: NonNullable<Situation["puzzle"]>["domain"];
  /** Difficulty the generator was asked for (1–4); the grader's own rating is stored on the item. */
  difficulty: number;
  /** Situations: the research construct the item is built on (see constructs.ts). */
  construct?: string;
}

/** An accepted item as stored: a normal bank item plus its embedding and how the pipeline judged it. */
export type GeneratedRecord = Situation & {
  embedding: number[];
  pipeline: {
    runId: string;
    target: Target;
    models: { generator: string; grader: string; curator: string; embedding: string };
    grade: Pick<GradeResult, "rationale" | "solvedOptionId">;
    curation: CurationResult;
    maxSimilarity: number;
    mostSimilarId?: string;
  };
  /** Human review (scripts/review.ts). The item goes live only when enough different people approve it. */
  review?: {
    approvals: { reviewer: string; note?: string; at: string }[];
    rejection?: { reviewer: string; note: string; at: string };
  };
};

/** A rejected candidate, kept so the team can see why things fail and tune the prompts. */
export interface RejectedRecord {
  id: string;
  runId: string;
  target: Target;
  stage: Stage;
  reasons: string[];
  candidate?: GeneratedSituation;
  grade?: GradeResult;
  curation?: CurationResult;
  maxSimilarity?: number;
  mostSimilarId?: string;
  createdAt: string;
}

export interface RunSummary {
  runId: string;
  startedAt: string;
  finishedAt: string;
  requested: number;
  accepted: number;
  rejectedByStage: Partial<Record<Stage, number>>;
  /** Accepted items per category this run, e.g. { "situation:socialAwareness": 4, "puzzle:math": 2 }. */
  acceptedByCategory: Record<string, number>;
  models: GeneratedRecord["pipeline"]["models"];
  usage: Record<string, ModelUsage>;
  /** Approximate; null when none of the models used has a price in config. */
  estimatedCostUsd: number | null;
}

const SEEDS_DIR = join(import.meta.dirname, "..", "seeds");
// seed-situations-research.json: research-based seeds, "draft" until a person approves them (scripts/build-research-seeds.ts)
const SEED_FILES = ["seed-situations.json", "seed-puzzles.json", "seed-situations-research.json"];

/** Seeds from generator/seeds, validated against the schema. */
export function loadSeeds(): Situation[] {
  return SEED_FILES.flatMap((f) => JSON.parse(readFileSync(join(SEEDS_DIR, f), "utf8")) as unknown[]).map((s) =>
    Situation.parse(s)
  );
}

/* ------------------------------------------------------------------ */
/* Local run files                                                     */
/* ------------------------------------------------------------------ */

export function writeRunFile(
  outDir: string,
  run: { summary: RunSummary; accepted: GeneratedRecord[]; rejected: RejectedRecord[] }
): string {
  mkdirSync(outDir, { recursive: true });
  const path = join(outDir, `run-${run.summary.runId}.json`);
  // Embeddings are long and not useful to read, so the local copy stores them separately.
  const readable = { ...run, accepted: run.accepted.map(({ embedding, ...rest }) => rest) };
  writeFileSync(path, JSON.stringify(readable, null, 2), "utf8");
  writeFileSync(
    join(outDir, `run-${run.summary.runId}.embeddings.json`),
    JSON.stringify(Object.fromEntries(run.accepted.map((r) => [r.id, r.embedding]))),
    "utf8"
  );
  return path;
}

/** Accepted items from earlier local runs (used for duplicate checks when Firestore is off). */
export function loadLocalGenerated(outDir: string): GeneratedRecord[] {
  if (!existsSync(outDir)) return [];
  const items: GeneratedRecord[] = [];
  for (const f of readdirSync(outDir).filter((f) => /^run-.*(?<!\.embeddings)\.json$/.test(f))) {
    const run = JSON.parse(readFileSync(join(outDir, f), "utf8"));
    const embPath = join(outDir, f.replace(/\.json$/, ".embeddings.json"));
    const embs: Record<string, number[]> = existsSync(embPath) ? JSON.parse(readFileSync(embPath, "utf8")) : {};
    for (const a of run.accepted ?? []) if (embs[a.id]) items.push({ ...a, embedding: embs[a.id] });
  }
  return items;
}

/** Seed embeddings are cached on disk so each run doesn't re-embed the whole seed bank. */
export function loadEmbeddingCache(outDir: string): Record<string, number[]> {
  const p = join(outDir, ".seed-embeddings.json");
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {};
}
export function saveEmbeddingCache(outDir: string, cache: Record<string, number[]>) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, ".seed-embeddings.json"), JSON.stringify(cache), "utf8");
}

/* ------------------------------------------------------------------ */
/* Firestore                                                           */
/* ------------------------------------------------------------------ */

export class FirestoreBank {
  readonly db: Firestore;
  constructor(projectId = process.env.GOOGLE_CLOUD_PROJECT) {
    this.db = new Firestore({ projectId, ignoreUndefinedProperties: true });
  }
  private col(name: keyof typeof PIPELINE_CONFIG.collections) {
    return this.db.collection(PIPELINE_CONFIG.collections[name]);
  }

  async loadGenerated(): Promise<GeneratedRecord[]> {
    const snap = await this.col("generated").get();
    return snap.docs.map((d) => d.data() as GeneratedRecord);
  }
  async loadByStatus(status: Situation["status"]): Promise<GeneratedRecord[]> {
    const snap = await this.col("generated").where("status", "==", status).get();
    return snap.docs.map((d) => d.data() as GeneratedRecord);
  }
  async saveReview(id: string, status: Situation["status"], review: NonNullable<GeneratedRecord["review"]>) {
    await this.col("generated").doc(id).update({ status, review });
  }
  async saveAccepted(r: GeneratedRecord) {
    await this.col("generated").doc(r.id).set(r);
  }
  async saveRejected(r: RejectedRecord) {
    await this.col("rejected").doc(r.id).set(r);
  }
  async saveRun(s: RunSummary) {
    await this.col("runs").doc(s.runId).set(s);
  }
  async uploadSeeds(seeds: Situation[]) {
    const batch = this.db.batch();
    for (const s of seeds) batch.set(this.col("seeds").doc(s.id), s);
    await batch.commit();
  }
}
