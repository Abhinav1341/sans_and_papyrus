import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { publicAccount, signUpWithEmail } from '@/server/accounts';
import { GAME } from '@/server/config';
import { body, handle, withSession } from '@/server/http';
import { clientIp, limit } from '@/server/limits';

const Body = z.object({
  email: z.string().trim().email('Please enter a valid email address.').max(200),
  password: z.string().min(8, 'Use a password of at least 8 characters.').max(200),
});

export const POST = handle(async (req: NextRequest) => {
  limit(`signup:${clientIp(req)}`, GAME.limits.signUpPerIp);
  const { email, password } = await body(req, Body);
  const account = await signUpWithEmail(email, password);
  return withSession({ account: publicAccount(account), player: null }, account.id);
});
