# Question generator

Offline pipeline that grows the game's question bank. It runs on your laptop and writes to Firestore;
the game (in `../web`) only reads Firestore. This folder is never deployed.

**Flow:** each situation is built on a research construct (`src/constructs.ts`: emotion understanding, intent-reading,
perspective taking, coping, reappraisal, moral vs conventional rules, duty reasoning, life skills) → A writes it
(Gemini 3.8 Flash) → code checks hard rules → code rejects near-duplicates (embeddings) → B grades blind (Gemini 3.6 Flash)
→ code checks the grading and the category → C, the Satori-lens judge (Gemini 3.8 Flash), checks safety and eight principles
(honest consequences, feelings stay real, show don't preach, room for dilemmas, no shaming, not a therapist, real for Indian
children, construct visible) → items are saved as **drafts** → people approve them (`bank:review-*`) before any child sees them.

**Shared schema:** `../web/lib/schemas.ts` is the single source of truth for both the game and the generator.

## Setup

```
npm install
```
Needs the repo-root `.env` (GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION, GOOGLE_GENAI_USE_VERTEXAI)
and `gcloud auth application-default login`.

## Commands

```
npm run bank:upload-seeds                      # seeds/ → Firestore "seedItems"
npm run bank:expand -- --count 10 --kind mixed # pilot run
npm run bank:expand -- --kind situation --competency socialAwareness --count 30 --concurrency 3
npm run bank:expand -- --kind puzzle --domain math --count 12
npm run bank:dashboard                         # output/dashboard.html: runs, funnel, coverage, costs, item browser
npm run bank:export                            # output/bank-readable.md: every item as a readable document
npm run bank:review-export                     # drafts → output/review/review-<date>.md (readable) + .csv (decisions)
npm run bank:review-apply -- --file <csv>      # approve/reject; situations need 2 reviewers, puzzles 1 (--dry-run to preview)
```

Options: `--count`, `--kind situation|puzzle|mixed`, `--band 8-10|11-14|any`, `--competency`, `--domain`,
`--concurrency`, `--local-only` (skip Firestore).

## Where things go

| What | Where |
| --- | --- |
| Hand-written seeds | `seeds/*.json` and Firestore `seedItems` |
| Accepted items | Firestore `generatedItems` |
| Rejected items, with stage and reasons | Firestore `rejectedItems` |
| Run summaries (counts, tokens, cost) | Firestore `pipelineRuns` |
| Readable copy of every run | `output/run-*.json` |

Models can be overridden with `GEMINI_GENERATOR_MODEL`, `GEMINI_GRADER_MODEL`, `GEMINI_CURATOR_MODEL` and
`GEMINI_EMBEDDING_MODEL` in `.env`.
