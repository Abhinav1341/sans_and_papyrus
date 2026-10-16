import { handle, withoutSession } from '@/server/http';

export const POST = handle(async () => withoutSession({ signedIn: false }));
