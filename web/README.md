# Party Galaxy

A mobile-first anime story game for children aged 6–10, built with Next.js. The story plays like a
cartoon film: wide establishing shots, close-ups, camera moves, full-body animated characters,
anime effects, and a different recorded voice for every character plus the storyteller.

The crew is five children (the Captain, Ro, Meera, Kiki and Bunty) and Fizz, the host. Every
chapter opens on the world itself before it meets the characters: the Party Galaxy's eight worlds,
a fly-down through candy-floss clouds, and sky views of the Candy Nebula with a board-game path
that joins every place in the story. Birds, butterflies, bubbles, balloons and shooting stars keep
every place moving.
Tasks ("Bonus rounds") appear as gates in the story. For now each one shows **Skip for now**.

On a laptop the game is shown inside a phone-shaped frame. On a phone it fills the screen.

## Where this sits in the repo

- `web/` (this folder) is the game: the frontend.
- `generator/` is the backend question generator. It writes situations and puzzles to Firestore.
- `web/lib/schemas.ts` is the shared data schema that both use. It belongs to the backend side, so
  change it together with the generator.

## Run it

```
cd web
npm install
npm run dev
```

Open http://localhost:3000.

Handy links for testing:
- `?demo=1` skips sign-in and makes a Captain.
- `?demo=all` also unlocks every chapter.
- `?movie=0` waits for a tap after each line.
- `/story/c-3?shot=12` jumps to a shot.

## Check it

```
npm test           # checks the whole screenplay against the engine (sets, poses, props, sounds...)
npm run typecheck
npm run lint
npm run build
```

## How the story is made

- `src/story/*.ts` holds the screenplay as data: chapters → scenes (a set and its cast) → shots.
  - Each shot can set the camera (`wide`, `full`, `medium`, `close`, `xclose`, `low`, an element, or exact).
  - It can choreograph actions: `move`, `jump`, `fall`, `enter`, `exit`, `pose`, `cycle`, `expr`, `emote`, `stretch`, `ride`, set-element tweens, camera moves and effects.
  - It can have the storyteller (`n`) or a character (`who` + `t`) speak.
  - Lines are written for children aged 6–10: 15 words at most (most are 12 or fewer), everyday
    words, present tense, sound words, and one refrain ("Nobody gets left behind"). `npm test`
    fails a line over 15 words and warns about long lines and hard words.
- `src/cinema/` is the engine:
  - `engine.ts`: the stage, camera, parallax and effects.
  - `actor.ts`: the jointed characters, blinking, lip-sync and props.
  - `director.ts`: turns shots into GSAP timelines.
  - `controller.ts`: plays shots in order, with captions, voices, pausing and resuming.
  - `sets/`: every place, drawn as layered SVG. `world.ts` holds the world views: `galaxy` (the
    eight worlds in a ring around Fizz's game board) and `vista` (the Candy Nebula from the sky).
    `kit.ts` has the ambient life (birds, butterflies, bubbles, shooting stars, balloons).
- `src/art/` holds the characters (faces, bodies, poses) and the UI art.
- Task gates are `{ gate: { id, title, ask, by } }` shots. The real tasks will plug in there.

## Voices

Every line has a recorded clip in `public/voices/v1/`.
- The voices were generated offline with the open Kokoro-82M model (Apache-2.0).
- `src/data/voice-cast.json` sets who sounds like what:
  - the storyteller is a calm adult man;
  - the children are adult voices raised a few semitones and spread apart in pitch;
  - Fizz has a light robot shimmer.
- The Captain's voice is picked by the child (Bright, Bold or Soft).
- Captions highlight each word as it is spoken.

After changing a line or a voice setting, record again. Only new or changed clips are recorded.
A clip's file name comes from its voice, that voice's settings and the text, so browsers can cache
clips forever and never play an old recording.

```
npm run voices:export
python -m venv .venv-voices && .venv-voices/Scripts/pip install -r tools/voices/requirements.txt
.venv-voices/Scripts/python tools/voices/generate.py --models <folder with kokoro-v1.0.onnx and voices-v1.0.bin>
```

The model files come from https://github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.1).

**Fallback:** if a clip is missing, the game uses the device's own speech voices, cast per character.

**Pronunciation:** names are respelled for the voices in `voice-cast.json` → `say`, for example Kiki → "Kee-kee" and Kabir → "Kabeer". Please correct any that sound wrong.

## Host on Google Cloud (Cloud Run)

```
gcloud run deploy party-galaxy --source . --region asia-south1 --allow-unauthenticated
```

This builds the `Dockerfile` (a Next.js standalone server on port 8080) and gives you an https link.

## UI-only for now

- **Sign in with Google and email:** no real accounts yet. `src/lib/auth.ts` marks where Google Identity Services or Firebase Auth plugs in. Accounts are for grown-ups, and parental consent comes first.
- **Parent Corner:** layout only, behind a 3-second press-and-hold.
- **Tasks:** each bonus round shows **Skip for now**, and the story carries on.
- **Worlds 2–8:** locked ("coming soon").
- **Saving:** progress stays on this device (localStorage).

## Child-safety choices

These follow the project's child-psychology rules.
- **Visual effects:**
  - no camera shake;
  - no flashes (glows fade slowly, nothing blinks faster than once a second);
  - Calm mode, and the device's reduced-motion setting, remove busy effects and stop the
    ambient life (birds, bubbles and shooting stars hold still).
- **Every line** is shown as a caption and can be heard again.
- **Pacing:**
  - Movie mode can be turned off, so the story waits for a tap.
  - Story speed and volume levels for voices, music and sounds are adjustable.
- **Rewards** come only from story progress, never from scores.
- **No ads, no purchases, no free text.** The child's name comes from a picker.

## Credits

- **Animation:** GSAP (free licence).
- **Fonts:** Baloo 2 and Nunito (SIL Open Font License), served by `next/font`.
- **Voices:** Kokoro-82M (Apache-2.0) through kokoro-onnx (MIT).
- **Art:** all art is drawn in code (SVG) for this project.
