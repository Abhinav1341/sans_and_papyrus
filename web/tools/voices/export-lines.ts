// Lists every sentence the game can speak, with the voice that speaks it, into lines.json.
// tools/voices/generate.py then records each one. Run: npx tsx tools/voices/export-lines.ts
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CHAPTERS, flatten } from '../../src/story';
import { isGate, isLine, isReward, isTitle } from '../../src/cinema/types';
import { titleSpeech, gateSpeech, rewardSpeech, endSpeech, fill } from '../../src/cinema/lines';
import { HERO_NAMES, UI_LINES, captainCall, collectibleLine } from '../../src/data/ui-lines';
import { COLLECTIBLES } from '../../src/story/collectibles';
import { spokenText, clipName } from '../../src/lib/voice-text';
import cast from '../../src/data/voice-cast.json';
import { toneFor, speakerExpr, type Tone } from '../../src/lib/tone';

type Line = { voice: string; text: string; say: string; tone: Tone; key: string; where: string };
const out = new Map<string, Line>();
const CAPTAIN_VOICES = ['you-a', 'you-b', 'you-c'];

function add(voice: string, text: string, where: string, tone: Tone = toneFor(voice, text)) {
  if (!(voice in cast.voices)) throw new Error(`Unknown voice ${voice} at ${where}`);
  const key = `${voice}|${clipName(voice, text, tone)}`;
  if (!out.has(key)) out.set(key, { voice, text, say: spokenText(text), tone, key, where });
}

/** A line, once per hero name if it uses {name}, and once per Captain voice if the Captain speaks.
 *  Its tone comes from the shot exactly as the game works it out (see src/lib/tone.ts). */
function addLine(speaker: string, raw: string, where: string, shot: { act?: { do: string }[]; tone?: Tone }) {
  const voices = speaker === 'you' ? CAPTAIN_VOICES : [speaker];
  const names = raw.includes('{name}') ? [...HERO_NAMES] : [''];
  const expr = speakerExpr(shot.act as never, speaker);
  for (const v of voices) for (const n of names) { const text = n ? fill(raw, n) : raw; add(v, text, where, toneFor(v, text, expr, shot.tone)); }
}

for (const ch of CHAPTERS) {
  flatten(ch).forEach((f, i) => {
    const where = `${ch.id}#${i}`;
    const s = f.shot;
    if (isTitle(s)) add('narrator', titleSpeech(s.title), where);
    else if (isGate(s)) for (const n of s.gate.ask.includes('{name}') ? HERO_NAMES : ['Aarav']) add('fizz', gateSpeech(s.gate, n), where);
    else if (isReward(s)) add('fizz', rewardSpeech(s.reward), where);
    else if (isLine(s)) {
      if (s.t) addLine(s.who ?? 'narrator', s.t, where, s);
      else if (s.n) addLine('narrator', s.n, where, s);
    }
  });
  for (const n of ch.recap.includes('{name}') ? HERO_NAMES : ['Aarav']) add('narrator', endSpeech(ch, n), `${ch.id}#end`);
}
for (const [k, text] of Object.entries(UI_LINES)) {
  if (k === 'voicePreview') for (const v of CAPTAIN_VOICES) add(v, text, `ui.${k}`);
  else add('narrator', text, `ui.${k}`);
}
for (const id of Object.keys(COLLECTIBLES)) add('narrator', collectibleLine(id), `ui.collectible.${id}`);
for (const n of HERO_NAMES) add('fizz', captainCall(n), 'ui.captainCall');

const lines = [...out.values()];
const file = join(__dirname, 'lines.json');
writeFileSync(file, JSON.stringify({ version: cast.version, lines }, null, 1));
const byVoice: Record<string, number> = {};
lines.forEach((l) => { byVoice[l.voice] = (byVoice[l.voice] || 0) + 1; });
console.log(`${lines.length} lines -> ${file}`);
console.log(byVoice);
