import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { body, handle, ok, requireAccount } from '@/server/http';
import { answerItem } from '@/server/rounds';

const Body = z.object({
  roundId: z.string().min(1).max(80),
  itemId: z.string().min(1).max(120),
  optionId: z.string().min(1).max(8),
  responseTimeMs: z.number().min(0).max(30 * 60 * 1000),
  hintOpened: z.boolean(),
  hintOpenedAtMs: z.number().min(0).max(30 * 60 * 1000).optional(),
});

export const POST = handle(async (req: NextRequest) => {
  const id = requireAccount(req);
  const b = await body(req, Body);
  return ok(await answerItem(id, b.roundId, b.itemId, b));
});
