/**
 * Schemas for the value-education situation game.
 *
 * - The bank holds two kinds of item:
 *     situation: social-emotional choices scored on the five CASEL competencies (the core of the game)
 *     puzzle:    maths, reasoning or vocabulary questions with one correct answer (secondary, ~1 in 4 items)
 * - Children are never shown scores. All measurements only steer which
 *   item comes next and feed the parent report.
 * - The same Zod schemas validate Gemini's structured output and type the
 *   Firestore documents.
 */
import { z } from "zod";

/** Re-exported so the question generator (../../generator) uses this exact Zod instance. */
export { z };

/* ------------------------------------------------------------------ */
/* Shared building blocks                                              */
/* ------------------------------------------------------------------ */

export const COMPETENCIES = [
  "selfAwareness",            // recognising one's own feelings
  "selfManagement",           // handling feelings: calming down, patience
  "socialAwareness",          // empathy, seeing how others feel
  "relationshipSkills",       // sharing, cooperating, resolving conflict, seeking help
  "responsibleDecisionMaking" // consequences, honesty, fairness
] as const;

export const Competency = z.enum(COMPETENCIES);
export type Competency = z.infer<typeof Competency>;

export const PUZZLE_DOMAINS = ["math", "reasoning", "vocabulary"] as const;
export const PuzzleDomain = z.enum(PUZZLE_DOMAINS);
export type PuzzleDomain = z.infer<typeof PuzzleDomain>;

export const ItemKind = z.enum(["situation", "puzzle"]);
export type ItemKind = z.infer<typeof ItemKind>;

/** 6-7: short, plain stories with three choices for the youngest players (they also get the easiest 8-10 items). */
export const AgeBand = z.enum(["6-7", "8-10", "11-14"]);
export type AgeBand = z.infer<typeof AgeBand>;

/** How strongly an option reflects each competency: -2 (works against it) to +2 (shows it well). */
const CompetencyScore = z.number().int().min(-2).max(2);

export const CompetencyScores = z.object({
  selfAwareness: CompetencyScore,
  selfManagement: CompetencyScore,
  socialAwareness: CompetencyScore,
  relationshipSkills: CompetencyScore,
  responsibleDecisionMaking: CompetencyScore,
});
export type CompetencyScores = z.infer<typeof CompetencyScores>;

/** Free-form value tags, e.g. "honesty", "kindness", "fairness". */
export const ValueTag = z.string().min(2).max(30);

/* ------------------------------------------------------------------ */
/* Item bank (situations and puzzles)                                  */
/* ------------------------------------------------------------------ */

export const Option = z.object({
  id: z.string(),                       // "a", "b", "c", "d"
  text: z.string().min(1).max(160),
  scores: CompetencyScores.optional(),  // set by B; required on situations, optional on puzzles
  consequence: z.string().min(5).max(160), // one-line in-story outcome, shown after the choice
  /** Weaker options: what Fizz says after this choice, why it didn't help (the effect on others or the situation),
   *  so the child can try again knowing more. Used only once the item's whys are approved (whyApproved). */
  why: z.string().min(5).max(200).optional(),
});
export type Option = z.infer<typeof Option>;

export const Hint = z.object({
  text: z.string().min(5).max(140),     // nudges thinking, never points to an answer
});

/** Extra fields that only puzzles have. */
export const PuzzleDetails = z.object({
  domain: PuzzleDomain,
  correctOptionId: z.string(),
  explanation: z.string().min(5).max(240), // gentle worked answer, shown after any choice
  /** Maths only: an arithmetic expression whose value is the correct answer, e.g. "12 / 4".
   *  The pipeline evaluates it in code and rejects the puzzle if it does not match. */
  computation: z.string().max(80).optional(),
});
export type PuzzleDetails = z.infer<typeof PuzzleDetails>;

export const Situation = z
  .object({
    id: z.string(),
    kind: ItemKind,
    title: z.string().min(3).max(60),
    text: z.string().min(10).max(700),
    ageBand: AgeBand,
    readingLevel: z.number().int().min(1).max(5),   // 1 = very simple words
    wordCount: z.number().int().positive(),
    expectedTimeSec: z.number().positive(),         // reading + thinking time for the age band
    difficulty: z.number().int().min(1).max(5),     // overall, set by B
    primaryCompetencies: z.array(Competency).max(2), // story-wrapped puzzles may also carry one
    valueTags: z.array(ValueTag).max(5),
    options: z.array(Option).min(3).max(4),
    hint: Hint.optional(),                           // only some items have one
    puzzle: PuzzleDetails.optional(),                // present only when kind = "puzzle"
    /** A genuine dilemma: more than one option is an okay choice. The game says so ("Both could work")
     *  and the choice is recorded but never moves skill levels. Set by the judge, confirmed by reviewers. */
    openChoice: z.boolean().optional(),
    /** A person approved the options' "why" lines (generator: npm run bank:whys, then the why review). */
    whyApproved: z.boolean().optional(),

    // Provenance and curation
    source: z.enum(["seed", "generated"]),
    seedIds: z.array(z.string()).default([]),        // seeds that inspired a generated item
    status: z.enum(["active", "rejected", "draft"]),
    similarIds: z.array(z.string()).default([]),     // precomputed nearest neighbours (for variety)
    createdAt: z.string(),                           // ISO timestamp
  })
  .superRefine((s, ctx) => {
    if (s.kind === "situation") {
      if (s.primaryCompetencies.length < 1)
        ctx.addIssue({ code: "custom", path: ["primaryCompetencies"], message: "A situation needs at least one competency" });
      s.options.forEach((o, i) => {
        if (!o.scores)
          ctx.addIssue({ code: "custom", path: ["options", i, "scores"], message: "Situation options need CASEL scores" });
      });
      if (s.puzzle)
        ctx.addIssue({ code: "custom", path: ["puzzle"], message: "Only puzzles have puzzle details" });
    } else {
      if (!s.puzzle) {
        ctx.addIssue({ code: "custom", path: ["puzzle"], message: "A puzzle needs puzzle details" });
      } else if (!s.options.some((o) => o.id === s.puzzle!.correctOptionId)) {
        ctx.addIssue({ code: "custom", path: ["puzzle", "correctOptionId"], message: "correctOptionId must match an option" });
      }
    }
  });
export type Situation = z.infer<typeof Situation>;

/* ------------------------------------------------------------------ */
/* Generator pipeline: Gemini structured outputs                       */
/* ------------------------------------------------------------------ */

/** A: generator output. No scores yet; B adds them. */
export const GeneratedSituation = z.object({
  kind: ItemKind,
  title: z.string().min(3).max(60),
  text: z.string().min(10).max(700),
  ageBand: AgeBand,
  primaryCompetencies: z.array(Competency).max(2),
  valueTags: z.array(ValueTag).max(5),
  options: z
    .array(
      z.object({
        id: z.string(),
        text: z.string().min(1).max(160),
        consequence: z.string().min(5).max(160),
      })
    )
    .min(3)
    .max(4),
  hint: Hint.optional(),
  puzzle: PuzzleDetails.optional(),
});
export type GeneratedSituation = z.infer<typeof GeneratedSituation>;

/** B: grader output. B never sees what A was aiming for.
 *  For puzzles, optionScores may be empty; B also solves the puzzle independently. */
export const GradeResult = z.object({
  optionScores: z.array(z.object({ optionId: z.string(), scores: CompetencyScores })),
  difficulty: z.number().int().min(1).max(5),
  readingLevel: z.number().int().min(1).max(5),
  expectedTimeSec: z.number().positive(),
  solvedOptionId: z.string().optional(), // puzzles only: B's own answer, must match A's correctOptionId
  rationale: z.string().max(400),
});
export type GradeResult = z.infer<typeof GradeResult>;

/** C: curator output. Dedup by embedding similarity happens in code before or after this call. */
export const CurationResult = z.object({
  accept: z.boolean(),
  safe: z.boolean(),                 // nothing frightening, harmful or age-inappropriate
  fitsGame: z.boolean(),             // matches the style and purpose of the seed bank
  hintIsNudge: z.boolean().optional(), // hint guides thinking without giving the answer
  explanationIsKind: z.boolean().optional(), // puzzles: the walkthrough is gentle, never shaming
  reasons: z.array(z.string()).max(5),
  originalPlot: z.boolean().optional(), // not a seed example's plot retold with new names or setting
  openChoice: z.boolean().optional(),   // situations: more than one option is a genuinely okay choice
  // The Satori-lens judge: one verdict per principle (optional so items judged before it still load)
  principles: z.object({
    honestConsequences: z.object({ pass: z.boolean(), note: z.string().max(200) }), // believable, not sugar-coated or catastrophic
    feelingsStayReal: z.object({ pass: z.boolean(), note: z.string().max(200) }),   // no "don't be sad", no erased feelings
    showNotPreach: z.object({ pass: z.boolean(), note: z.string().max(200) }),      // no lectures or morals
    certaintyFits: z.object({ pass: z.boolean(), note: z.string().max(200) }),      // one best answer only where there really is one
    noShaming: z.object({ pass: z.boolean(), note: z.string().max(200) }),          // no option or consequence shames the chooser
    notATherapist: z.object({ pass: z.boolean(), note: z.string().max(200) }),      // no diagnosis or medical advice; big worries → trusted adult
    realForIndianChildren: z.object({ pass: z.boolean(), note: z.string().max(200) }), // culturally real, no stereotypes
    constructVisible: z.object({ pass: z.boolean(), note: z.string().max(200) }),   // the research idea clearly shows (pass if none given)
  }).optional(),
});
export type CurationResult = z.infer<typeof CurationResult>;

/* ------------------------------------------------------------------ */
/* Player profile (hidden from the child)                              */
/* ------------------------------------------------------------------ */

/** Elo-style level per skill; starts at 1000. CASEL and puzzle skills never mix. */
export const SkillLevels = z.object({
  // CASEL competencies (situations)
  selfAwareness: z.number(),
  selfManagement: z.number(),
  socialAwareness: z.number(),
  relationshipSkills: z.number(),
  responsibleDecisionMaking: z.number(),
  // Puzzle domains
  math: z.number(),
  reasoning: z.number(),
  vocabulary: z.number(),
});
export type SkillLevels = z.infer<typeof SkillLevels>;

export const PlayerProfile = z.object({
  id: z.string(),                    // anonymous id; no names or personal data from children
  ageBand: AgeBand,
  skills: SkillLevels,
  timeRatioAvg: z.number(),          // moving average of actual / expected time; ~1 is ideal
  helpSeeking: z.object({
    hintsOffered: z.number().int().nonnegative(),
    hintsUsed: z.number().int().nonnegative(),
    thoughtfulUses: z.number().int().nonnegative(), // opened after reading, on a harder item
    reflexUses: z.number().int().nonnegative(),     // opened instantly or on an easy item
  }),
  recentSituationIds: z.array(z.string()).max(30),  // excluded from the next shortlist
  itemsSinceLastPuzzle: z.number().int().nonnegative(), // picker keeps puzzles to ~1 in 4 items
  totalPlayed: z.number().int().nonnegative(),
  // Game backend fields (optional so older profiles still load):
  age: z.number().int().min(5).max(15).optional(),       // set by the grown-up; decides band and starting level
  heroName: z.string().max(24).optional(),              // from the game's name picker, never a real name
  startSkill: z.number().optional(),                    // starting level for this age, for growth reporting
  recentCategories: z.array(z.string()).max(10).optional(), // variety: last categories served
  roundsPlayed: z.number().int().nonnegative().optional(),
  // Running totals for the parent report, so it never has to read every play event:
  skillPlays: z.record(z.string(), z.number().int().nonnegative()).optional(), // items that moved each skill
  recentReasons: z.array(z.string()).max(5).optional(),   // the AI picker's last reasons, oldest first
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PlayerProfile = z.infer<typeof PlayerProfile>;

export const newPlayerProfile = (id: string, ageBand: AgeBand): PlayerProfile => {
  const now = new Date().toISOString();
  return {
    id,
    ageBand,
    skills: {
      selfAwareness: 1000,
      selfManagement: 1000,
      socialAwareness: 1000,
      relationshipSkills: 1000,
      responsibleDecisionMaking: 1000,
      math: 1000,
      reasoning: 1000,
      vocabulary: 1000,
    },
    timeRatioAvg: 1,
    helpSeeking: { hintsOffered: 0, hintsUsed: 0, thoughtfulUses: 0, reflexUses: 0 },
    recentSituationIds: [],
    itemsSinceLastPuzzle: 0,
    totalPlayed: 0,
    createdAt: now,
    updatedAt: now,
  };
};

/** Target mix: about one puzzle for every three or four situations. */
export const PUZZLE_EVERY_N_ITEMS = 4;

/* ------------------------------------------------------------------ */
/* Play events and the AI picker                                       */
/* ------------------------------------------------------------------ */

export const PickerDecision = z.object({
  shortlistIds: z.array(z.string()).min(1).max(5),
  chosenId: z.string(),
  reason: z.string().max(200),       // shown in the demo panel and used in parent reports
  source: z.enum(["ai", "fallback"]),
  latencyMs: z.number().int().nonnegative().optional(), // time spent asking Gemini (fallbacks after a timeout included); absent when Gemini wasn't asked
});
export type PickerDecision = z.infer<typeof PickerDecision>;

/** Gemini's structured output for the picker. */
export const PickerOutput = z.object({
  situationId: z.string(),
  reason: z.string().max(200),
});
export type PickerOutput = z.infer<typeof PickerOutput>;

export const PlayEvent = z.object({
  id: z.string(),
  playerId: z.string(),
  situationId: z.string(),
  kind: ItemKind,
  optionId: z.string(),
  correct: z.boolean().optional(),   // puzzles only; never shown to the child as right/wrong
  optionOrder: z.array(z.string()),  // order shown after shuffling, to check position bias
  responseTimeMs: z.number().int().nonnegative(),
  expectedTimeSec: z.number().positive(),
  timeRatio: z.number().nonnegative(), // (responseTimeMs / 1000) / expectedTimeSec
  hint: z.object({
    available: z.boolean(),
    opened: z.boolean(),
    openedAtMs: z.number().int().nonnegative().optional(), // ms after the item appeared
  }),
  picker: PickerDecision,            // how this item was chosen
  roundId: z.string().optional(),
  gateId: z.string().optional(),     // the story gate that opened the round
  performance: z.number().min(0).max(1).optional(), // 0–1: how well the choice showed the item's skills (not set for open choices)
  openChoice: z.boolean().optional(), // a dilemma: the choice was recorded, skills were not moved
  skillChanges: z.record(z.string(), z.number()).optional(),
  createdAt: z.string(),
});
export type PlayEvent = z.infer<typeof PlayEvent>;

/* ------------------------------------------------------------------ */
/* Parent report: Gemini structured output                             */
/* ------------------------------------------------------------------ */

/** Growth framing only: no labels such as "low empathy" or "bad at maths". */
export const ParentReport = z.object({
  summary: z.string().max(500),
  strengths: z.array(z.string().max(160)).max(3),
  growingAreas: z.array(z.string().max(160)).max(3),
  thinkingSkills: z.string().max(240).optional(), // one short line on maths, reasoning, vocabulary
  habits: z.array(z.string().max(160)).max(3),      // e.g. "takes time to think before choosing"
  tryAtHome: z.array(z.string().max(160)).max(3),   // simple conversation starters for parents
});
export type ParentReport = z.infer<typeof ParentReport>;

/* ------------------------------------------------------------------ */
/* Firestore collection names                                          */
/* ------------------------------------------------------------------ */

export const COLLECTIONS = {
  situations: "situations",          // holds both situations and puzzles (see `kind`)
  players: "players",
  playEvents: "playEvents",
  reports: "parentReports",
} as const;
