/**
 * Settings for the bank-expansion pipeline (A generate → rule checks → B grade → dedup → C curate).
 * Model names can be overridden with environment variables when Google releases or retires models.
 */
export const PIPELINE_CONFIG = {
  models: {
    generator: process.env.GEMINI_GENERATOR_MODEL ?? "gemini-3.8-flash", // A: newest Flash; good writing at volume
    grader: process.env.GEMINI_GRADER_MODEL ?? "gemini-3.6-flash",       // B: a different model version from A, so it judges A's work independently
    curator: process.env.GEMINI_CURATOR_MODEL ?? "gemini-3.8-flash",     // C: careful safety and fit review
    embedding: process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001",
  },
  temperature: { generator: 1.0, grader: 0.2, curator: 0.2 },

  /**
   * Approximate prices in USD per million tokens, used only for cost estimates on the dashboard.
   * Thinking tokens are billed as output. Models without a price here are counted but not costed.
   */
  pricesPerMillionUsd: {
    "gemini-3.8-flash": { input: 0.75, output: 3.75 },
    "gemini-3.5-flash-lite": { input: 0.3, output: 2.5 },
  } as Record<string, { input: number; output: number } | undefined>,

  /** Category check: A's target competency must be among the grader's top N competencies for the best option. */
  categoryTopN: 2,

  /** Maximum words in the situation text (options are counted separately). */
  maxTextWords: { "8-10": 70, "11-14": 110 } as const,

  /** Cosine similarity above this counts as a near-duplicate of something already in the bank. */
  duplicateThreshold: 0.92,
  /** Items above this similarity are stored as neighbours, so the game can avoid serving them back to back. */
  neighbourThreshold: 0.8,
  maxNeighbours: 3,

  /** Situations whose best and worst options differ by less than this total score are too flat to teach anything. */
  minScoreSpread: 3,

  /** Seed examples shown to the generator for each new item. */
  examplesPerPrompt: 3,

  collections: {
    seeds: "seedItems",          // hand-written seeds, uploaded by scripts/upload-seeds.ts
    generated: "generatedItems", // accepted generated items, ready for the game
    rejected: "rejectedItems",   // rejected candidates with reasons (useful for the demo and for tuning)
    runs: "pipelineRuns",        // one summary document per run
  },
} as const;
