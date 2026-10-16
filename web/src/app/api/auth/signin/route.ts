import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { publicAccount, signInWithEmail } from '@/server/accounts';
import { GAME } from '@/server/config';
import { body, handle, withSession } from '@/server/http';
import { clientIp, limit } from '@/server/limits';
import { getPlayer, publicPlayer } from '@/server/players';

const Body = z.object({ email: z.string().trim().min(3, 'Please enter your email.').max(200), password: z.string().min(1, 'Please enter your password.').max(200) });

export const POST = handle(async (req: NextRequest) => {
  limit(`signin:${clientIp(req)}`, GAME.limits.signInPerIp);
  const { email, password } = await body(req, Body);
  limit(`signin:${email.toLowerCase()}`, GAME.limits.signInPerEmail); // slows password guessing on one account
  const account = await signInWithEmail(email, password);
  const player = await getPlayer(account.id);
  return withSession({ account: publicAccount(account), player: player ? publicPlayer(player) : null }, account.id);
});
