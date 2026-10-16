'use client';
// Calls to the game's own backend (/api/*). The session lives in an httpOnly cookie, so nothing
// secret is ever kept in page scripts or localStorage.

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/${path}`, {
      method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
      headers: init.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(0, 'No connection. Check the internet and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? 'Something went wrong. Please try again.');
  return data as T;
}

export interface PublicAccount { type: 'email' | 'google' | 'guest'; email: string | null }
export interface PublicPlayer { heroName: string | null; age: number | null; ageBand: '8-10' | '11-14'; roundsPlayed: number }
export interface Me { signedIn: boolean; account?: PublicAccount; player?: PublicPlayer | null }

/** An item as the server sends it: no scores and no answers. */
export interface RoundItem {
  id: string;
  kind: 'situation' | 'puzzle';
  title: string;
  text: string;
  options: { id: string; text: string; voice: string | null }[];
  hint: string | null;
  expectedTimeSec: number;
  /** Spoken versions of the question and the hint (/api/voice URLs). */
  voice: { q: string | null; hint: string | null };
}
