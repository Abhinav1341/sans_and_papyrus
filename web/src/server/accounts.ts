/**
 * Grown-up accounts: email + password, Google, or guest (for trying the game, e.g. judges).
 * Passwords are hashed with scrypt and a per-account salt; the plain password is never stored.
 * Children never have accounts of their own: a child is a Captain inside a grown-up's account.
 */
import { randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { COLLECTIONS } from './config';
import { db } from './db';
import { HttpError } from './http';

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export interface Account {
  id: string;
  type: 'email' | 'google' | 'guest';
  email?: string;
  passwordHash?: string;
  googleSub?: string;
  createdAt: string;
  lastSignInAt: string;
}

/** What the browser may see about an account. */
export const publicAccount = (a: Account) => ({ type: a.type, email: a.email ?? null });

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

async function checkPassword(password: string, stored: string): Promise<boolean> {
  const [alg, saltB64, hashB64] = stored.split('$');
  if (alg !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length);
  return timingSafeEqual(actual, expected);
}

const normEmail = (e: string) => e.trim().toLowerCase();
const now = () => new Date().toISOString();

async function touch(a: Account): Promise<Account> {
  const updated = { ...a, lastSignInAt: now() };
  await db().set(COLLECTIONS.accounts, a.id, updated);
  return updated;
}

export async function getAccount(id: string): Promise<Account | null> {
  return db().get<Account>(COLLECTIONS.accounts, id);
}

export async function signUpWithEmail(emailRaw: string, password: string): Promise<Account> {
  const email = normEmail(emailRaw);
  const [existing] = await db().where<Account>(COLLECTIONS.accounts, 'email', email, { limit: 1 });
  if (existing) throw new HttpError(409, 'An account with this email already exists. Try signing in.');
  const a: Account = { id: randomUUID(), type: 'email', email, passwordHash: await hashPassword(password), createdAt: now(), lastSignInAt: now() };
  await db().set(COLLECTIONS.accounts, a.id, a);
  return a;
}

export async function signInWithEmail(emailRaw: string, password: string): Promise<Account> {
  const [a] = await db().where<Account>(COLLECTIONS.accounts, 'email', normEmail(emailRaw), { limit: 1 });
  // Same message whether the email or the password is wrong, so emails can't be probed.
  if (!a?.passwordHash || !(await checkPassword(password, a.passwordHash))) throw new HttpError(401, 'That email and password don’t match.');
  return touch(a);
}

/**
 * Google sign-in. The browser gets an access token from Google Identity Services; we ask Google who it
 * belongs to and check it was issued to our own client id before trusting it.
 */
export async function signInWithGoogle(accessToken: string): Promise<Account> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new HttpError(503, 'Google sign-in is not set up on this server yet.');
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
  if (!res.ok) throw new HttpError(401, 'Google sign-in failed. Please try again.');
  const info = (await res.json()) as { aud?: string; azp?: string; sub?: string; email?: string; email_verified?: string | boolean };
  if ((info.aud !== clientId && info.azp !== clientId) || !info.sub) throw new HttpError(401, 'Google sign-in failed. Please try again.');

  const [bySub] = await db().where<Account>(COLLECTIONS.accounts, 'googleSub', info.sub, { limit: 1 });
  if (bySub) return touch(bySub);
  const email = info.email && (info.email_verified === true || info.email_verified === 'true') ? normEmail(info.email) : undefined;
  if (email) {
    // Link Google to an existing email account with the same verified address.
    const [byEmail] = await db().where<Account>(COLLECTIONS.accounts, 'email', email, { limit: 1 });
    if (byEmail) return touch({ ...byEmail, googleSub: info.sub });
  }
  const a: Account = { id: randomUUID(), type: 'google', email, googleSub: info.sub, createdAt: now(), lastSignInAt: now() };
  await db().set(COLLECTIONS.accounts, a.id, a);
  return a;
}

export async function createGuest(): Promise<Account> {
  const a: Account = { id: randomUUID(), type: 'guest', createdAt: now(), lastSignInAt: now() };
  await db().set(COLLECTIONS.accounts, a.id, a);
  return a;
}

/** Removes the account and everything stored for its Captain (events and rounds in pages, not one by one). */
export async function deleteAccountAndData(accountId: string): Promise<void> {
  const d = db();
  await Promise.all([d.delWhere(COLLECTIONS.events, 'playerId', accountId), d.delWhere(COLLECTIONS.rounds, 'playerId', accountId)]);
  await Promise.all([d.del(COLLECTIONS.reports, accountId), d.del(COLLECTIONS.players, accountId)]);
  await d.del(COLLECTIONS.accounts, accountId);
}
