import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { body, handle, ok, requireAccount } from '@/server/http';
import { retryItem } from '@/server/rounds';

const Body = z.object({
  roundId: z.string().min(1).max(80),
  itemId: z.string().min(1).max(120),
  optionId: z.string().min(1).max(8),
});

/** POST /api/round/retry — "Try another way": the consequence of a second choice. Practice only; nothing is measured. */
export const POST = handle(async (req: NextRequest) => {
  const id = requireAccount(req);
  const b = await body(req, Body);
  return ok(await retryItem(id, b.roundId, b.itemId, b.optionId));
});
