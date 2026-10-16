// How a line is spoken: its tone. The recording tool (tools/voices) bends each recorded line's pitch
// and energy for its tone (excited lines are higher and livelier, sad lines lower and slower), so
// lines sound acted instead of read. The game and the tool work the tone out the same way, from:
//   1. a tone written in the screenplay (`tone` on a shot), else
//   2. the speaker's face in that shot (an excited face gives an excited voice), else
//   3. the words: a question, an exclamation, shouting in capitals, trailing off "...".
// The tone is part of each clip's name, so a changed tone gets a fresh recording.

export type Tone =
  | 'plain' | 'story' | 'storyUp' | 'happy' | 'excited' | 'shout' | 'surprised' | 'question'
  | 'worried' | 'sad' | 'grumpy' | 'smug' | 'bold' | 'sleepy' | 'hesitant' | 'sing';

export const TONES: Tone[] = ['plain', 'story', 'storyUp', 'happy', 'excited', 'shout', 'surprised', 'question', 'worried', 'sad', 'grumpy', 'smug', 'bold', 'sleepy', 'hesitant', 'sing'];

/** The tone a facial expression suggests. */
const FROM_FACE: Record<string, Tone> = {
  excited: 'excited', laugh: 'excited', love: 'excited', sing: 'excited', yell: 'shout',
  grin: 'happy', happy: 'happy', wink: 'happy', dizzy: 'happy', tongue: 'happy', munch: 'happy',
  shock: 'surprised', scared: 'worried', worried: 'worried', sad: 'sad', cry: 'sad',
  grumpy: 'grumpy', anger: 'grumpy', smug: 'smug', determined: 'bold', sleepy: 'sleepy', closed: 'sleepy',
};

const words = (text: string) => text.split(/\s+/).filter((w) => /[A-Za-z]/.test(w));

/** The tone for one line. `voice` is the recording voice (narrator, fizz, ro, you-a...). */
export function toneFor(voice: string, text: string, expr?: string, explicit?: Tone): Tone {
  if (explicit) return explicit;
  if (text.includes('♪')) return 'sing';
  const t = text.trim();
  const ws = words(t);
  const caps = ws.filter((w) => w.replace(/[^A-Za-z]/g, '').length >= 2 && w === w.toUpperCase()).length;
  const shouting = ws.length > 0 && caps / ws.length >= 0.5;
  const asks = /\?["”’]?$/.test(t), exclaims = /!["”’]?$/.test(t), trails = /\.\.\.["”’]?$/.test(t) || /…$/.test(t);
  if (voice === 'narrator') return asks ? 'question' : exclaims || shouting ? 'storyUp' : 'story';
  const face = expr ? FROM_FACE[expr] : undefined;
  if (face) {
    if (asks && (face === 'happy' || face === 'bold' || face === 'smug')) return 'question';
    if (shouting && (face === 'happy' || face === 'excited' || face === 'bold')) return 'shout';
    if (exclaims && face === 'happy') return 'excited';
    return face;
  }
  if (shouting) return 'shout';
  if (asks) return 'question';
  if (exclaims) return 'excited';
  if (trails) return 'hesitant';
  return voice === 'fizz' ? 'happy' : 'plain';
}

/** The speaker's expression in a shot: the first expression change for them in the shot's actions. */
export function speakerExpr(acts: { do: string; who?: unknown; expr?: unknown }[] | undefined, speaker: string): string | undefined {
  for (const a of acts || []) if (a.do === 'expr' && a.who === speaker && typeof a.expr === 'string') return a.expr;
  return undefined;
}
