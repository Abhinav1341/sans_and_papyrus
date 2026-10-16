// Guest play: a throwaway account so anyone (including judges) can try the game without signing up.
import type { NextRequest } from 'next/server';
import { createGuest, publicAccount } from '@/server/accounts';
import { GAME } from '@/server/config';
import { handle, withSession } from '@/server/http';
import { clientIp, limit } from '@/server/limits';

export const POST = handle(async (req: NextRequest) => {
  limit(`guest:${clientIp(req)}`, GAME.limits.guestPerIp);
  const account = await createGuest();
  return withSession({ account: publicAccount(account), player: null }, account.id);
});
