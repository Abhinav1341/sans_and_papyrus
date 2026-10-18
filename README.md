# Sans & Papyrus: Party Galaxy

A story game for children aged 6–14 that practises social-emotional skills. The story pauses at bonus
rounds where the child answers short situations and puzzles; Gemini picks the next item for each child,
and a Parent Corner shows a growth report. Built for the Google Cloud AI Builder Cup 2026.

Live: https://sans-and-papyrus-101035943757.asia-south1.run.app

## What's where

| Folder | What it is | Details |
| --- | --- | --- |
| `web/` | The game (Next.js) and its backend, deployed to Cloud Run | [web/README.md](web/README.md) |
| `generator/` | Offline pipeline that writes the question bank to Firestore (runs on a laptop, never deployed) | [generator/README.md](generator/README.md) |
| `web/lib/schemas.ts` | Data shapes shared by both | |

## Run it locally

```
cd web
npm install
npm run dev
```

Open http://localhost:3000. Settings go in `web/.env.local` (see web/README.md); run
`gcloud auth application-default login` once.

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
stay as drafts until a person approves them; approved items
reach the live game within 5 minutes. The steps are in generator/README.md.
