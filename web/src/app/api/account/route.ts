// Deletes the grown-up's account and every record of their Captain (right to erasure).
import type { NextRequest } from 'next/server';
import { deleteAccountAndData } from '@/server/accounts';
import { handle, requireAccount, withoutSession } from '@/server/http';

export const DELETE = handle(async (req: NextRequest) => {
  const id = requireAccount(req);
  await deleteAccountAndData(id);
  return withoutSession({ deleted: true });
});
