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
/** Asks Google who an access token belongs to, and checks it was issued to our own client id. */
async function verifyGoogle(accessToken: string): Promise<{ sub: string; email?: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new HttpError(503, 'Google sign-in is not set up on this server yet.');
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
  if (!res.ok) throw new HttpError(401, 'Google sign-in failed. Please try again.');
  const info = (await res.json()) as { aud?: string; azp?: string; sub?: string; email?: string; email_verified?: string | boolean };
  if ((info.aud !== clientId && info.azp !== clientId) || !info.sub) throw new HttpError(401, 'Google sign-in failed. Please try again.');
  const verified = info.email_verified === true || info.email_verified === 'true';
  return { sub: info.sub, email: info.email && verified ? normEmail(info.email) : undefined };
}

export async function signInWithGoogle(accessToken: string): Promise<Account> {
  const info = await verifyGoogle(accessToken);
  const [bySub] = await db().where<Account>(COLLECTIONS.accounts, 'googleSub', info.sub, { limit: 1 });
  if (bySub) return touch(bySub);
  const email = info.email;
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

/**
 * "Save progress": a guest attaches an email + password or a Google login to the account they are
 * already playing on. The account id stays the same, so the Captain, skills and reports all carry over.
 * Fails if that email or Google login already belongs to another account (sign in to that one instead).
 */
export async function upgradeGuest(
  accountId: string,
  how: { method: 'email'; email: string; password: string } | { method: 'google'; accessToken: string },
): Promise<Account> {
  const guest = await getAccount(accountId);
  if (!guest) throw new HttpError(401, 'Please sign in again.');
  if (guest.type !== 'guest') throw new HttpError(400, 'This account is already saved.');
  const taken = 'That login already has its own account. Sign in to it instead (this guest’s progress stays on the guest).';
  let upgraded: Account;
  if (how.method === 'email') {
    const email = normEmail(how.email);
    const [existing] = await db().where<Account>(COLLECTIONS.accounts, 'email', email, { limit: 1 });
    if (existing) throw new HttpError(409, taken);
    upgraded = { ...guest, type: 'email', email, passwordHash: await hashPassword(how.password), lastSignInAt: now() };
  } else {
    const info = await verifyGoogle(how.accessToken);
    const [bySub] = await db().where<Account>(COLLECTIONS.accounts, 'googleSub', info.sub, { limit: 1 });
    const [byEmail] = info.email ? await db().where<Account>(COLLECTIONS.accounts, 'email', info.email, { limit: 1 }) : [];
    if (bySub || byEmail) throw new HttpError(409, taken);
    upgraded = { ...guest, type: 'google', googleSub: info.sub, email: info.email, lastSignInAt: now() };
  }
  await db().set(COLLECTIONS.accounts, guest.id, upgraded);
  return upgraded;
}

/** Removes the account and everything stored for its Captain (events and rounds in pages, not one by one). */
export async function deleteAccountAndData(accountId: string): Promise<void> {
  const d = db();
  await Promise.all([d.delWhere(COLLECTIONS.events, 'playerId', accountId), d.delWhere(COLLECTIONS.rounds, 'playerId', accountId)]);
  await Promise.all([d.del(COLLECTIONS.reports, accountId), d.del(COLLECTIONS.players, accountId)]);
  await d.del(COLLECTIONS.accounts, accountId);
}
