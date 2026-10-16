import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { publicAccount, signInWithGoogle } from '@/server/accounts';
import { GAME } from '@/server/config';
import { body, handle, withSession } from '@/server/http';
import { clientIp, limit } from '@/server/limits';
import { getPlayer, publicPlayer } from '@/server/players';

const Body = z.object({ accessToken: z.string().min(10).max(4096) });

export const POST = handle(async (req: NextRequest) => {
  limit(`signin:${clientIp(req)}`, GAME.limits.signInPerIp);
  const { accessToken } = await body(req, Body);
  const account = await signInWithGoogle(accessToken);
  const player = await getPlayer(account.id);
  return withSession({ account: publicAccount(account), player: player ? publicPlayer(player) : null }, account.id);
});
