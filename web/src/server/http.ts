/** Small helpers shared by the API routes. */
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { SESSION_COOKIE, createSessionValue, readSessionValue, sessionCookieOptions } from './session';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const ok = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init);

/** The signed-in account id, or a 401. */
export function requireAccount(req: NextRequest): string {
  const id = readSessionValue(req.cookies.get(SESSION_COOKIE)?.value);
  if (!id) throw new HttpError(401, 'Please sign in again.');
  return id;
}

export function optionalAccount(req: NextRequest): string | null {
  return readSessionValue(req.cookies.get(SESSION_COOKIE)?.value);
}

export async function body<T>(req: NextRequest, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, 'The request body must be JSON.');
  }
  const r = schema.safeParse(raw);
  if (!r.success) throw new HttpError(400, r.error.issues[0]?.message ?? 'Invalid request.');
  return r.data;
}

/** Wraps a route handler: known errors become JSON with their status; anything else is a logged 500. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
      console.error(err);
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
  };
}

/** A JSON response that also signs the browser in as `accountId`. */
export function withSession(data: unknown, accountId: string): NextResponse {
  const res = NextResponse.json(data);
  res.cookies.set(SESSION_COOKIE, createSessionValue(accountId), sessionCookieOptions);
  return res;
}

/** A JSON response that signs the browser out. */
export function withoutSession(data: unknown): NextResponse {
  const res = NextResponse.json(data);
  res.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions, maxAge: 0 });
  return res;
}
