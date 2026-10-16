import type { NextRequest } from 'next/server';
import { deleteAccountAndData, getAccount } from '@/server/accounts';
import { handle, optionalAccount, withoutSession } from '@/server/http';

// Signing out of a guest account ends it: nobody could ever sign back in to it, so its data is
// deleted rather than left behind (the Parent Corner warns first and offers "Save progress").
export const POST = handle(async (req: NextRequest) => {
  const id = optionalAccount(req);
  if (id && (await getAccount(id))?.type === 'guest') await deleteAccountAndData(id);
  return withoutSession({ signedIn: false });
});
