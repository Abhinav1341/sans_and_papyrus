// What the voices actually say, and what each recorded clip is called.
// Shared by the game (playback and fallback speech) and tools/voices (recording), so both sides
// always agree. tools/voices/generate.py mirrors clipName exactly and checks it on every run.
import cast from '@/data/voice-cast.json';
import { fnv1a } from './hash';

const SAY = cast.say as Record<string, string>;
const escape = (k: string) => k.replace(/[.*+?^${}()|[\]\\']/g, '\\$&');
const SAY_RE = new RegExp(`\\b(${Object.keys(SAY).sort((a, b) => b.length - a.length).map(escape).join('|')})\\b`, 'g');

/**
 * What the voice actually reads: the caption, with
 *  - ALL-CAPS emphasis turned into normal words (the voice engine spells capitals out as letters:
 *    "PRESS IT" became "press I-T", "on its OWN" became "O-W-N"); captions keep their capitals;
 *  - names respelled so the voices pronounce them the Indian way;
 *  - music notes and markup removed.
 */
export function spokenText(text: string): string {
  return text
    .replace(/\b[A-Z][A-Z]+\b/g, (w) => w.charAt(0) + w.slice(1).toLowerCase())
    .replace(SAY_RE, (m) => SAY[m] || m)
    .replace(/[♪*_~]/g, '').replace(/\s+/g, ' ').trim();
}

type VoiceCfg = { model: string; semitones?: number; speed?: number; fx?: string };

/** Everything that changes how a voice sounds. A change gives every clip a new name. */
export function voiceSignature(voice: string): string {
  const v = (cast.voices as Record<string, VoiceCfg>)[voice];
  if (!v) return voice;
  return `${v.model}:${String(v.semitones ?? 0)}:${String(v.speed ?? 1)}:${v.fx ?? ''}`;
}

/** File name (without .mp3) of the clip for one line in one voice. It comes from what is spoken, so
 *  any change to the words or to how they are read gets a fresh recording. */
export function clipName(voice: string, text: string): string {
  return fnv1a(`${voice}|${voiceSignature(voice)}|${spokenText(text)}`);
}
