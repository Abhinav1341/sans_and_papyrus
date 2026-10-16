import type { NextRequest } from 'next/server';
import { GAME } from '@/server/config';
import { handle, ok, requireAccount } from '@/server/http';
import { limit } from '@/server/limits';
import { getReport } from '@/server/report';

export const dynamic = 'force-dynamic';

export const GET = handle(async (req: NextRequest) => {
  const id = requireAccount(req);
  limit(`report:${id}`, GAME.limits.reportsPerAccount);
  return ok(await getReport(id, req.nextUrl.searchParams.get('refresh') === '1'));
});
