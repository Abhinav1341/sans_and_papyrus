import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { body, handle, HttpError, ok, requireAccount } from '@/server/http';
import { getPlayer, publicPlayer, upsertPlayer } from '@/server/players';

export const dynamic = 'force-dynamic';

const Body = z.object({
  heroName: z.string().trim().min(1).max(24),
  age: z.number().int().min(6, 'Captains are 6 to 14 years old.').max(14, 'Captains are 6 to 14 years old.'),
});

export const GET = handle(async (req: NextRequest) => {
  const p = await getPlayer(requireAccount(req));
  if (!p) throw new HttpError(404, 'No Captain yet.');
  return ok({ player: publicPlayer(p) });
});

export const PUT = handle(async (req: NextRequest) => {
  const id = requireAccount(req);
  const { heroName, age } = await body(req, Body);
  const p = await upsertPlayer(id, heroName, age);
  return ok({ player: publicPlayer(p) });
});
