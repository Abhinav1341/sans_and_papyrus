/**
 * Spoken bonus rounds: Google Cloud Text-to-Speech (Chirp 3 HD) reads each item aloud.
 * Only bank text is ever spoken (never text sent by the browser), so cost is bounded by the bank.
 * Each clip is made once: kept in memory, stored in Firestore for every server instance, and served
 * under a URL that changes when the text or voice changes, so browsers can cache it forever.
 */
import { createHash } from 'node:crypto';
import { GoogleAuth } from 'google-auth-library';
import type { Competency, Situation } from '../../lib/schemas';
import { COLLECTIONS, GAME } from './config';
import { db, isOffline } from './db';

export type Speaker = 'narrator' | 'fizz';

/** Parts of an item that can be spoken. `o.<id>` is an option, `c.<id>` its consequence, `w.<id>` its why. */
export type VoicePart = 'q' | 'hint' | 'x' | `o.${string}` | `c.${string}` | `w.${string}`;

/** Said when a round ends. Fixed text (no child's name), so it is one shared clip. */
export const DONE_LINE = 'Brilliant work, Captain! The crew says thank you.';
/** Fizz says this before a genuine dilemma (an open choice): more than one answer is okay. One shared clip. */
export const OPEN_LINE = 'Both could work. Which feels right to you?';
/** Fizz says this after a weak choice: the child picks again (only the first choice is measured). */
export const TRY_LINE = "Let's try another way.";
/** After two weak choices on one item, Fizz shows the most helpful option. */
export const GUIDE_LINE = "Let's try this one together.";
/**
 * Fizz's "why" after a weak choice, when the item has no approved why of its own: one gentle line about the
 * skill the choice missed most. Never "wrong" or "bad": what the choice did, so the next try can do better.
 */
export const WHY_LINES: Record<Competency, string> = {
  selfAwareness: 'Hmm. That choice skipped noticing your own feelings first.',
  selfManagement: 'Hmm. That choice came from a big feeling, before stopping to think.',
  socialAwareness: "Hmm. That choice didn't notice how the other person was feeling.",
  relationshipSkills: 'Hmm. That choice made it harder to get along together.',
  responsibleDecisionMaking: 'Hmm. That choice could make things harder later on.',
};
/** Fizz names the skill after a strong choice: what the child did, never who they are, and no score. */
export const SKILL_LINES: Record<Competency, string> = {
  selfAwareness: 'You noticed your own feelings. That is a real skill.',
  selfManagement: 'You stayed calm and chose carefully. That is a real skill.',
  socialAwareness: 'You noticed how someone else felt. That is a real skill.',
  relationshipSkills: 'You found a way to work it out together. That is a real skill.',
  responsibleDecisionMaking: 'You thought about what happens next. That is a real skill.',
};

/** Lines that are the same for every item and child, so each is one shared clip (`/api/voice?part=<key>`). */
export const SHARED_LINES: Record<string, { text: string; speaker: Speaker }> = {
  done: { text: DONE_LINE, speaker: 'narrator' },
  open: { text: OPEN_LINE, speaker: 'fizz' },
  try: { text: TRY_LINE, speaker: 'fizz' },
  guide: { text: GUIDE_LINE, speaker: 'fizz' },
  ...Object.fromEntries(Object.entries(WHY_LINES).map(([k, text]) => [`why.${k}`, { text, speaker: 'fizz' as const }])),
  ...Object.fromEntries(Object.entries(SKILL_LINES).map(([k, text]) => [`skill.${k}`, { text, speaker: 'fizz' as const }])),
};

/** What a part says, and who says it. Null when the item has no such part. */
export function partText(item: Situation, part: string): { text: string; speaker: Speaker } | null {
  if (part === 'q') return { text: `${item.title}. ${item.text}`, speaker: 'narrator' };
  if (part === 'hint') return item.hint ? { text: item.hint.text, speaker: 'fizz' } : null;
  if (part === 'x') return item.kind === 'puzzle' && item.puzzle ? { text: item.puzzle.explanation, speaker: 'narrator' } : null;
  const [kind, id] = part.split('.');
  const option = item.options.find((o) => o.id === id);
  if (!option) return null;
  if (kind === 'o') return { text: option.text, speaker: 'narrator' };
  if (kind === 'c') return { text: option.consequence, speaker: 'narrator' };
  if (kind === 'w') return item.whyApproved && option.why ? { text: option.why, speaker: 'fizz' } : null;
  return null;
}

const voiceName = (s: Speaker) => GAME.tts.voices[s];
/** Identifies one clip: changes whenever the words, the voice or its pace change. */
export const clipHash = (speaker: Speaker, text: string) =>
  createHash('sha256').update(`${voiceName(speaker)}|${GAME.tts.speakingRate}|${text}`).digest('hex').slice(0, 24);

/** The URL the browser fetches for one part of an item. */
export function voiceUrl(item: Situation, part: VoicePart): string | null {
  if (isOffline()) return null; // offline: the browser's own voice reads it
  const p = partText(item, part);
  return p ? `/api/voice?item=${encodeURIComponent(item.id)}&part=${encodeURIComponent(part)}&v=${clipHash(p.speaker, p.text)}` : null;
}
export const sharedVoiceUrl = (key: string): string | null => {
  if (isOffline()) return null;
  const l = SHARED_LINES[key];
  return `/api/voice?part=${encodeURIComponent(key)}&v=${clipHash(l.speaker, l.text)}`;
};
export const doneVoiceUrl = () => sharedVoiceUrl('done');
export const openVoiceUrl = () => sharedVoiceUrl('open');

/* ---------- synthesis ---------- */

let auth: GoogleAuth | null = null;

/** Fetches the Google access token ahead of time, so the first clip doesn't wait for sign-in. */
export async function warmTts(): Promise<void> {
  if (isOffline()) return;
  auth ??= new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  await (await auth.getClient()).getAccessToken();
}

async function synthesize(speaker: Speaker, text: string): Promise<Buffer> {
  auth ??= new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const client = await auth.getClient();
  const name = voiceName(speaker);
  const res = await client.request<{ audioContent?: string }>({
    url: 'https://texttospeech.googleapis.com/v1/text:synthesize',
    method: 'POST',
    // Local sign-ins (gcloud user credentials) need a project to bill; Cloud Run's service account doesn't.
    headers: process.env.GOOGLE_CLOUD_PROJECT ? { 'x-goog-user-project': process.env.GOOGLE_CLOUD_PROJECT } : undefined,
    data: {
      input: { text },
      voice: { languageCode: name.split('-').slice(0, 2).join('-'), name },
      audioConfig: { audioEncoding: 'MP3', sampleRateHertz: 24000, speakingRate: GAME.tts.speakingRate },
    },
    timeout: GAME.tts.timeoutMs,
  });
  if (!res.data.audioContent) throw new Error('Text-to-Speech returned no audio.');
  return Buffer.from(res.data.audioContent, 'base64');
}

/* ---------- cache: memory → Firestore → synthesize ---------- */

interface StoredClip { audio: Buffer | Uint8Array; voice: string; text: string; createdAt: string }

const memory = new Map<string, Buffer>();
const inFlight = new Map<string, Promise<Buffer>>();

function remember(key: string, audio: Buffer) {
  memory.set(key, audio);
  while (memory.size > GAME.tts.memoryClips) memory.delete(memory.keys().next().value as string);
}

/** The MP3 for a line, made at most once per text and voice across all instances. */
export function clip(speaker: Speaker, text: string): Promise<Buffer> {
  const key = clipHash(speaker, text);
  const hit = memory.get(key);
  if (hit) return Promise.resolve(hit);
  let p = inFlight.get(key);
  if (!p) {
    p = (async () => {
      const stored = await db().get<StoredClip>(COLLECTIONS.voiceClips, key);
      if (stored?.audio) return Buffer.from(stored.audio);
      const audio = await synthesize(speaker, text);
      await db().set<StoredClip>(COLLECTIONS.voiceClips, key, { audio, voice: voiceName(speaker), text, createdAt: new Date().toISOString() });
      return audio;
    })()
      .then((audio) => { remember(key, audio); return audio; })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, p);
  }
  return p;
}
