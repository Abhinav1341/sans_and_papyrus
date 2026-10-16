# Party Galaxy

A mobile-first anime story game for children aged 6–10, built with Next.js. The story plays like a
cartoon film: wide establishing shots, close-ups, camera moves, full-body animated characters,
anime effects, and a different recorded voice for every character plus the storyteller.

The crew is five children (the Captain, Ro, Meera, Kiki and Bunty) and Fizz, the host. Every
chapter opens on the world itself before it meets the characters: the Party Galaxy's eight worlds,
a fly-down through candy-floss clouds, and sky views of the Candy Nebula with a board-game path
that joins every place in the story. Birds, butterflies, bubbles, balloons and shooting stars keep
every place moving.
Tasks ("Bonus rounds") appear as gates in the story: 3–5 situations and puzzles picked for the Captain (see Backend).

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
- `?debug=1` exposes the story player and the sound state to automated checks.

## Play it on a phone

- **Sound:** phones only allow sound after a real tap, so the first tap anywhere starts the sound
  (and wakes it again after a phone call or switching apps). On iPhone the game asks for "playback"
  sound, so it can be heard even when the ringer switch is on silent.
- **Install the app:** the home screen and Settings have **Install the app**. On Android (Chrome,
  Edge, Samsung Internet) it opens the browser's install prompt. On iPhone and iPad it shows the two
  taps in Safari (Share, then Add to Home Screen). Once installed, the game opens full screen.
- Installing needs the game's **https** address (for example the Cloud Run link). To test on a phone
  over Wi-Fi, run `npm run dev` and open `http://<this computer's IP>:3000` on the phone: the game and
  its sound work there, but browsers only offer installing on https.
- The service worker (`public/sw.js`, production builds only) caches the game and the voice clips
  that have been heard, so the game reopens quickly and keeps playing offline.

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
  - Actions can be timed to the voice: `atWord: n` starts an action when the nth word of the line is
    spoken (`at` is then an offset from that word), and `toWord: m` makes it last until word m. The
    gumball in chapter 1 leaves Kiki's hand on "pops", hits the tree, rock and cloud as each is
    named, and lands on her head on "head".
  - Power moments use `fx: { kind: 'aura' }` (a glow round the character) and
    `fx: { kind: 'power', name, color, icon }` (an anime banner, art in `src/cinema/powers.ts`).
  - Inserts are full-screen close-ups (`src/cinema/inserts.tsx`), for example `hands` (the crew's
    hands stacking, seen from above) and `knot` (Ro's arm tying itself in a bow).
    `wafer1`–`wafer3` show Kiki's bites out of the raft, switched on each spoken "crunch".
  - Manga panels (`panels`) take up to five faces; `lolli` puts a lollipop at a face's mouth (chapter 4
    shows all five children licking at once this way, since five side by side don't fit a phone screen).
  - `ride` with `behind: true` is a piggyback (the rider is drawn behind the carrier).
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
- Chapter 2, the Jelly Bean Bounce, is a long course over a pudding sea (positions in
  `src/cinema/sets/candy-layout.ts`): 17 beans, the Big Gap, three sinking beans and candy-cane poles
  Ro swings on. The crew meets two crises (the Big Gap, the sinking beans), each with its own bonus
  round, and crosses them together.

## Voices

Every line has a recorded clip in `public/voices/v1/`.
- The voices were generated offline with the open Kokoro-82M model (Apache-2.0).
- `src/data/voice-cast.json` sets who sounds like what:
  - the storyteller is a calm adult man;
  - the children are adult voices raised a few semitones and spread apart in pitch;
  - Fizz has a light robot shimmer.
- The Captain's voice is picked by the child (Bright, Bold or Soft).
- Captions highlight each word as it is spoken.
- **Lines are acted, not read.** Each line has a tone (excited, shout, question, worried, sad,
  bold...), taken from the shot's `tone`, else the speaker's face in that shot, else the words
  (`src/lib/tone.ts`). The recorder bends the line's pitch, melody, speed and loudness for its tone
  with the WORLD vocoder (`tones` in `voice-cast.json`), keeping the word timings.

After changing a line or a voice setting, record again. Only new or changed clips are recorded.
A clip's file name comes from its voice, that voice's settings and the words it speaks, so browsers
can cache clips forever and never play an old recording.

- **Capitals are for captions only.** The voice engine spells all-caps words out ("IT" became
  "I-T", "OWN" became "O-W-N"), so the voices read them as normal words; captions keep the capitals.
- **The crew's laugh** (sound `laugh`) is a recording of the crew's own voices laughing together, made by
  `tools/voices/laugh.py` into `public/sfx/crew-laugh.mp3`. Run it again after changing a crew voice.
- **Fizz's songs are sung.** Lines listed in `tools/voices/songs.json` (with a melody: one note per
  word, chords and tempo) are made by `tools/voices/sing.py`: a robot vocoder sings the spoken lyric
  on the melody over a small disco band, and the caption words light up on the beat. After changing
  a melody, run `generate.py --songs --force`.

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
gcloud run deploy sans-and-papyrus --source . --project project-b87959c5-a26a-49fe-adf --region asia-south1 \
  --allow-unauthenticated --min-instances 0 --max-instances 3 \
  --update-env-vars GOOGLE_CLOUD_PROJECT=project-b87959c5-a26a-49fe-adf,GOOGLE_CLOUD_LOCATION=global,GOOGLE_GENAI_USE_VERTEXAI=true,SESSION_SECRET=<your secret>
```

The Cloud Run service account needs the **Cloud Datastore User** and **Vertex AI User** roles.

This builds the `Dockerfile` (a Next.js standalone server on port 8080) and gives you an https link.

## Backend (bonus rounds, accounts, parent report)

The game's backend runs inside this Next.js app (route handlers in `src/app/api/`, logic in `src/server/`).
It reads the question bank that `generator/` writes to Firestore (`seedItems` + `generatedItems`).

- **Accounts (grown-ups only):** email + password (scrypt-hashed), Google sign-in, or **Play as a guest**.
  The session is a signed, httpOnly cookie. Children never type an email; a Captain lives inside the account.
- **The Captain's age** (picked in the Captain builder) sets the question band (8–10 or 11–14), the starting
  level and the round size (3 items up to age 8, 4 for 9–10, 5 for 11+). Ages 6–7 get the easiest 8–10 items.
- **Bonus rounds:** each story gate opens a round. For every item, code builds a shortlist (right band and
  level, no recent repeats or near-duplicates, varied categories, gentle focus on growing skills, about one
  puzzle per round) and **Gemini 3.5 Flash-Lite picks one** with a reason. If Gemini is slow or off, code picks.
  Each answer updates Elo-style skill levels from the option's CASEL scores, the time taken and hint use.
  Children never see scores, timers or "wrong"; every choice shows its consequence and the story goes on.
- **Parent Corner:** a growth report written by **Gemini 3.8 Flash** from aggregated play (cached, refreshed
  after new play). "Delete all data" erases the account and every record of play on the server.
- **Tuning:** every number (round sizes, starting levels, learning rate, variety rules) is in `src/server/config.ts`.

### Settings (environment variables)

| Variable | Needed | What it does |
| --- | --- | --- |
| `GOOGLE_CLOUD_PROJECT` | yes | Project with Firestore and Vertex AI |
| `GOOGLE_CLOUD_LOCATION` | yes | `global` |
| `GOOGLE_GENAI_USE_VERTEXAI` | yes | `true` |
| `SESSION_SECRET` | yes in production | 32+ random characters that sign sign-in cookies (the server refuses sign-ins without it in production) |
| `TTS_NARRATOR_VOICE` | optional | Cloud Text-to-Speech voice that reads bonus rounds (default `en-IN-Chirp3-HD-Charon`) |
| `TTS_FIZZ_VOICE` | optional | Voice for Fizz's hints (default `en-IN-Chirp3-HD-Puck`) |
| `GOOGLE_CLIENT_ID` | optional | OAuth web client id; turns on "Sign in with Google" |
| `GAME_AI` | optional | `off` skips Gemini (code picker, plain report) |

For local development, put these in `web/.env.local` and run `gcloud auth application-default login` once.

### Tests

```
npm run test:backend   # whole backend flow on an in-memory database with the real seed bank (no cloud needed)
```

### Still to do before a public launch

- Verifiable parental consent before a child's data is stored (DPDP Act s.9, COPPA).
- Worlds 2–8 are locked ("coming soon"); story progress itself still stays on the device (localStorage).

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
