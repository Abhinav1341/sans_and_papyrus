import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { GAME } from '@/server/config';
import { body, handle, ok, requireAccount } from '@/server/http';
import { limit } from '@/server/limits';
import { startRound } from '@/server/rounds';

const Body = z.object({ gateId: z.string().min(1).max(80) });

export const POST = handle(async (req: NextRequest) => {
  const id = requireAccount(req);
  limit(`rounds:${id}`, GAME.limits.roundsPerAccount); // each round asks Gemini to pick items
  const { gateId } = await body(req, Body);
  return ok(await startRound(id, gateId));
});
