import type { NextRequest } from 'next/server';
import { loadBank } from '@/server/bank';
import { handle, HttpError, requireAccount } from '@/server/http';
import { clip, DONE_LINE, partText } from '@/server/tts';

/** GET /api/voice?item=…&part=…&v=… — one spoken line of a bonus round, as MP3. */
export const GET = handle(async (req: NextRequest) => {
  requireAccount(req);
  const q = req.nextUrl.searchParams;
  const part = q.get('part') ?? '';
  let line: { text: string; speaker: 'narrator' | 'fizz' } | null;
  if (part === 'done') line = { text: DONE_LINE, speaker: 'narrator' };
  else {
    const item = (await loadBank()).byId.get(q.get('item') ?? '');
    line = item ? partText(item, part) : null;
  }
  if (!line) throw new HttpError(404, 'There is nothing to read here.');
  let audio: Buffer;
  try {
    audio = await clip(line.speaker, line.text);
  } catch (err) {
    console.warn(`Voice unavailable, the browser will use its own: ${(err as Error).message}`);
    throw new HttpError(503, 'The voice is resting. Please try again.');
  }
  return new Response(new Uint8Array(audio), {
    headers: {
      'Content-Type': 'audio/mpeg',
      // The URL carries a hash of the voice and the words, so this exact clip never changes.
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  });
});
