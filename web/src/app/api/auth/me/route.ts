import type { NextRequest } from 'next/server';
import { getAccount, publicAccount } from '@/server/accounts';
import { handle, ok, optionalAccount, withoutSession } from '@/server/http';
import { getPlayer, publicPlayer } from '@/server/players';

export const dynamic = 'force-dynamic';

export const GET = handle(async (req: NextRequest) => {
  const id = optionalAccount(req);
  if (!id) return ok({ signedIn: false });
  const account = await getAccount(id);
  if (!account) return withoutSession({ signedIn: false }); // account was deleted
  const player = await getPlayer(id);
  return ok({ signedIn: true, account: publicAccount(account), player: player ? publicPlayer(player) : null });
});
