import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { body, handle, ok, requireAccount } from '@/server/http';
import { nextItem } from '@/server/rounds';

const Body = z.object({ roundId: z.string().min(1).max(80) });

export const POST = handle(async (req: NextRequest) => {
  const id = requireAccount(req);
  const { roundId } = await body(req, Body);
  return ok(await nextItem(id, roundId));
});
