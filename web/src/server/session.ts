/**
 * Sessions: a signed cookie holding the account id and an expiry. Signed with HMAC-SHA256 using
 * SESSION_SECRET, so it can't be forged; httpOnly, so page scripts can't read it.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'pg_session';
const MAX_AGE_S = 30 * 24 * 60 * 60;

let fallbackSecret: string | null = null;
function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  // In production every instance must share one secret: a random one per instance would make
  // sign-ins fail at random whenever Cloud Run sends a request to a different instance.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be set (32+ characters) in production. See the deploy command in web/README.md.');
  }
  if (!fallbackSecret) {
    fallbackSecret = randomBytes(32).toString('hex');
    console.error(
      'SESSION_SECRET is not set (or shorter than 32 characters). Using a temporary secret: sign-ins will reset ' +
        'whenever the server restarts. Set SESSION_SECRET in production.'
    );
  }
  return fallbackSecret;
}

const b64 = (s: string) => Buffer.from(s).toString('base64url');
const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url');

export function createSessionValue(accountId: string): string {
  const payload = b64(JSON.stringify({ a: accountId, e: Math.floor(Date.now() / 1000) + MAX_AGE_S }));
  return `${payload}.${sign(payload)}`;
}

export function readSessionValue(value: string | undefined | null): string | null {
  if (!value) return null;
  const [payload, sig] = value.split('.');
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const { a: accountId, e } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof accountId !== 'string' || typeof e !== 'number' || e < Date.now() / 1000) return null;
    return accountId;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: MAX_AGE_S,
};
