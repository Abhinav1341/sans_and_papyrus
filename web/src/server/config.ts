/**
 * Every tunable number for the game backend, in one place.
 * Change values here to adjust how rounds feel; nothing else needs editing.
 */
export const GAME = {
  models: {
    picker: process.env.GEMINI_PICKER_MODEL ?? 'gemini-3.5-flash-lite', // fast: the child is waiting
    report: process.env.GEMINI_REPORT_MODEL ?? 'gemini-3.8-flash',      // quality: parents read it
  },
  /** GAME_AI=off skips Gemini (tests, offline development): code picks items and writes a plain report. */
  get aiEnabled() { return process.env.GAME_AI !== 'off'; }, // read on use, so tests can switch it
  /** If the AI picker hasn't answered by then, code picks the top candidate instead. */
  pickerTimeoutMs: 3500,

  /** Items per bonus round, by the Captain's age. */
  roundSize(age: number): number {
    return age <= 8 ? 3 : age <= 10 ? 4 : 5;
  },
  /** The question bank's age bands. Ages 6–7 use the 8–10 band's easiest items. */
  ageBand(age: number): '8-10' | '11-14' {
    return age <= 10 ? '8-10' : '11-14';
  },
  /** Starting skill level for every skill, from age. Matches item difficulty via itemRating(). */
  initialSkill(age: number): number {
    const table: Record<number, number> = { 6: 820, 7: 850, 8: 900, 9: 960, 10: 1020, 11: 960, 12: 1020, 13: 1080, 14: 1140 };
    return table[Math.min(14, Math.max(6, Math.round(age)))];
  },
  /** An item's difficulty (1–4) on the same scale as skills: 1 → 850, 2 → 1000, 3 → 1150, 4 → 1300. */
  itemRating(difficulty: number): number {
    return 700 + 150 * difficulty;
  },

  /**
   * Stepping up: an 8–10 player who has outgrown their band (level at or above this) may also get the
   * gentlest 11–14 items (difficulty up to `maxDifficulty`). Older-band difficulty is counted
   * `bandOffset` higher for them (two steps), and own-band items win ties by `preferOwnBand`.
   */
  stepUp: { fromLevel: 1260, minAge: 8, maxDifficulty: 2, bandOffset: 300, preferOwnBand: 0.3 },

  /** Elo-style learning rate for skill updates. */
  kFactor: 28,
  /** Aim slightly above the child's level so rounds stretch them a little. */
  stretch: 40,
  /** After a hint or a weak answer, the next item gets this much easier; after a strong one, harder. */
  easeAfterStruggle: -110,
  liftAfterSuccess: 40,

  /** Responses faster than this share of the expected time count as rushed; slower than `slow` as long. */
  rushedRatio: 0.35,
  slowRatio: 3,

  /** A hint opened after this share of the expected time counts as thoughtful help-seeking. */
  thoughtfulHintShare: 0.3,
  /** Asking for help is a strength: a thoughtful hint lifts relationship skills by this much. */
  helpSeekingBoost: 5,

  /** Variety. */
  recentWindow: 30,       // items a child shouldn't see again soon
  shortlistSize: 5,
  maxPuzzlesPerRound: 1,

  /** Item bank cache in memory (the bank changes only when the generator runs). */
  bankCacheMs: 5 * 60 * 1000,

  /** Bonus-round voices (Google Cloud Text-to-Speech, Chirp 3 HD). The story itself uses recorded clips. */
  tts: {
    voices: {
      narrator: process.env.TTS_NARRATOR_VOICE ?? 'en-IN-Chirp3-HD-Charon', // calm storyteller
      fizz: process.env.TTS_FIZZ_VOICE ?? 'en-IN-Chirp3-HD-Puck',           // Fizz gives the hints
    },
    speakingRate: 0.95,   // a touch slower for young listeners
    timeoutMs: 8000,
    memoryClips: 300,     // per instance; every clip is also stored in Firestore
  },

  /** Parent report: regenerate after this many new answers, or when older than this. */
  reportMinEvents: 3,
  reportRefreshEvents: 3,
  reportMaxAgeMs: 24 * 60 * 60 * 1000,
  /** "Refresh" on the Parent Corner writes a new report at most this often. */
  reportRefreshCooldownMs: 60 * 1000,

  /**
   * Request limits per server instance (Cloud Run runs at most a few). Generous enough for a classroom
   * sharing one internet address, tight enough to stop scripts creating accounts or spending Gemini calls.
   */
  limits: {
    guestPerIp: { max: 40, windowMs: 60 * 60 * 1000 },
    signUpPerIp: { max: 10, windowMs: 60 * 60 * 1000 },
    signInPerIp: { max: 30, windowMs: 10 * 60 * 1000 },
    signInPerEmail: { max: 8, windowMs: 10 * 60 * 1000 },
    roundsPerAccount: { max: 40, windowMs: 10 * 60 * 1000 },
    reportsPerAccount: { max: 20, windowMs: 10 * 60 * 1000 },
  },
} as const;

export const COLLECTIONS = {
  accounts: 'accounts',
  players: 'players',
  rounds: 'rounds',
  events: 'playEvents',
  reports: 'parentReports',
  seeds: 'seedItems',
  generated: 'generatedItems',
  voiceClips: 'voiceClips',
} as const;
