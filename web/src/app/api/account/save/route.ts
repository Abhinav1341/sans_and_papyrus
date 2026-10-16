// "Save progress": turns the current guest account into an email or Google account, keeping all play.
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { publicAccount, upgradeGuest } from '@/server/accounts';
import { GAME } from '@/server/config';
import { body, handle, requireAccount, withSession } from '@/server/http';
import { clientIp, limit } from '@/server/limits';

const Body = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('email'),
    email: z.string().trim().email('Please enter a valid email address.').max(200),
    password: z.string().min(8, 'Use a password of at least 8 characters.').max(200),
  }),
  z.object({ method: z.literal('google'), accessToken: z.string().min(10).max(4096) }),
]);

export const POST = handle(async (req: NextRequest) => {
  const id = requireAccount(req);
  limit(`signup:${clientIp(req)}`, GAME.limits.signUpPerIp);
  const account = await upgradeGuest(id, await body(req, Body));
  return withSession({ account: publicAccount(account) }, account.id); // a fresh 30-day session for the saved account
});
