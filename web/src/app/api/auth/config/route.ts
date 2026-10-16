// Public sign-in settings for the browser (read at runtime, so no rebuild is needed to turn Google on).
import { ok } from '@/server/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  return ok({ googleClientId: process.env.GOOGLE_CLIENT_ID ?? null });
}
