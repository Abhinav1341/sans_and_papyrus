/**
 * Simple request limits, counted in memory on each server instance (fixed windows). Enough to stop a
 * script from creating thousands of guest accounts or spending Gemini calls; a shared store such as
 * Memorystore would make the limits exact across instances if the game ever runs on many.
 */
import type { NextRequest } from 'next/server';
import { HttpError } from './http';

const windows = new Map<string, { start: number; count: number }>();

/** Counts one request for `key`; throws 429 once `max` is reached within `windowMs`. */
export function limit(key: string, rule: { max: number; windowMs: number }): void {
  const now = Date.now();
  if (windows.size > 20_000) for (const [k, w] of windows) if (now - w.start >= rule.windowMs) windows.delete(k);
  const w = windows.get(key);
  if (!w || now - w.start >= rule.windowMs) { windows.set(key, { start: now, count: 1 }); return; }
  if (++w.count > rule.max) throw new HttpError(429, 'Lots of tries in a short time. Please wait a few minutes and try again.');
}

/** The caller's address. Cloud Run puts the real client first in X-Forwarded-For. */
export function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local';
}

/** Tests only. */
export function resetLimits() { windows.clear(); }
