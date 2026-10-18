# Sans & Papyrus: Party Galaxy

A story game for children aged 6–14 in India that grows social-emotional skills: noticing feelings, calming
down, seeing other people's side, getting along and making fair choices. The story plays like an animated film;
at story "gates" the crew needs the child's help, and a short bonus round of real-life situations and small
puzzles opens. Gemini picks each question for the child, a coach explains why a choice didn't help and guides
them to a better one, and grown-ups get a growth report.

Built for the **Google Cloud AI Builder Cup 2026** (theme: Sustainability & Social Impact).

**Live:** https://sans-and-papyrus-101035943757.asia-south1.run.app · **How the AI works (with real numbers):** `/how-it-works` on the live site

## What a child experiences

- **A story, not a quiz.** Seven playable chapters, voiced characters, captions that highlight each word, Calm
  mode and reduced-motion support. Bonus rounds sit inside the story at 10 gates, and each gate's questions fit
  what the crew is going through there.
- **Questions for their age.** Three bands (6–7, 8–10, 11–14). Ages 6–7 get very short stories with one main
  character, feelings said plainly and three choices; everything is read aloud.
- **Never "wrong", never graded.** Every choice shows what happens next in the story. After a choice that doesn't
  help, Fizz (the host) says *why* and the child tries another way until they find a helpful one; after two tries,
  Fizz shows the way. A good choice gets one line naming the skill it showed. Real dilemmas get "Both could work.
  Which feels right to you?" and are never scored.
- **Safe by design.** No ads, purchases, free text or real names; play as a guest with nothing to sign up for.

## How the AI works

| Where | Model | Job |
| --- | --- | --- |
| Writing questions (offline) | Gemini 3.8 Flash | Writes each situation on a named child-development research idea |
| Grading (offline) | Gemini 3.6 Flash | Scores every answer on the 5 CASEL skills **without** seeing the writer's aim |
| Judging (offline) | Gemini 3.1 Pro | Checks safety and 8 principles (believable consequences, no preaching, no shaming, not a copy…) |
| Duplicates (offline) | Gemini embeddings | Drops near-copies of existing questions |
| Choosing the next question (live) | Gemini 3.5 Flash-Lite | Picks from a code-built shortlist and writes a reason a parent can read |
| Parent report (live) | Gemini 3.8 Flash | Growth note from totals only; code blocks labels, diagnoses, scores and comparisons |
| Read aloud (live) | Cloud Text-to-Speech (Chirp 3 HD, Indian English) | Questions, consequences and Fizz's lines |

Three different models write, grade and judge every question, so no model marks its own work, and **a person
approves every question before a child sees it**. While a child plays, AI only *chooses* between checked
questions: it never writes anything a child reads. The judge was re-run over the whole bank and stops about a
third of drafts; whatever it stops is taken out of the game.

The adaptive engine (Elo-style skill levels per CASEL skill, time and hint use, variety and step-up rules) is
plain code, tested by simulated children for conflicts between its rules (`npm run test:scoring` in `web/`).

**Research basis.** Each situation is built on one of 18 research ideas, for example Pons & Harris's Test of
Emotion Comprehension (hidden and mixed feelings), Dodge's social information processing (accident or on
purpose?), Gross's emotion regulation, Selman's perspective taking, Turiel's moral vs conventional rules, and the
WHO life skills. The list with sources is in [`generator/src/constructs.ts`](generator/src/constructs.ts).

## What's where

| Folder | What it is | Details |
| --- | --- | --- |
| `web/` | The game (Next.js 16, React 19) and its backend, deployed to Cloud Run | [web/README.md](web/README.md) |
| `generator/` | Offline pipeline that writes, checks and reviews the question bank in Firestore (never deployed) | [generator/README.md](generator/README.md) |
| `web/lib/schemas.ts` | Data shapes (Zod) shared by both | |
| `cloudbuild.yaml` | Builds `web/` and deploys it from GitHub | |

**Google Cloud:** Cloud Run (asia-south1), Firestore, Vertex AI (Gemini), Cloud Text-to-Speech, Cloud Build.

## Run it locally

```
cd web
npm install
npm run dev
```

Open http://localhost:3000 (`?demo=1` skips sign-in). Settings go in `web/.env.local` (see web/README.md);
run `gcloud auth application-default login` once.

Checks, from `web/`:

```
npm test               # the screenplay against the engine
npm run test:backend   # the whole backend on an in-memory database (no cloud needed)
npm run test:scoring   # scoring rules and every question's scores checked for conflicts
npm run typecheck && npm run lint && npm run build
```

## Branches and releasing

- **`main`**: all work goes here. Pushing to `main` does **not** change the live site.
- **`deploy`**: the live site. Only Abhinav can push to it. Never commit to it directly.

To release what is on `main` (after checking it locally):

```
git push origin main:deploy
```

Cloud Build (trigger `deploy-game`, config in `cloudbuild.yaml`) builds `web/` and puts it live in about
5–8 minutes; progress is in the Cloud console under Cloud Build → History. Releases that only change
`generator/` don't rebuild the site.

To roll back: `git push --force origin <good-commit>:deploy`.

Don't run `gcloud run deploy` from a laptop: it skips GitHub and puts code live that isn't in the repo.

## Question bank

The questions live in Firestore, not in the repo, so they are **not** part of a release. Generated items
stay as drafts until a person approves them; approved items reach the live game within 5 minutes.
Anything the judge stops is kept out of the game. The steps (generate, review, the "why" lines, recording
audio) are in [generator/README.md](generator/README.md).

## Privacy

Grown-ups sign in (Google, email or guest); children never type an email or a real name. Gemini sees only the
child's age, the in-game name they picked and a summary of play, never raw answers or the account email. "Delete all data" in the Parent Corner
removes everything; ending a guest session deletes that guest's data. Full policy: `/privacy` on the live site.

## Team

Abhinav (backend, question generator, AI) and Sahil (game, story and animation).
