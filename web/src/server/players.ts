/** The Captain (child profile) inside a grown-up's account. One Captain per account for now. */
import { PlayerProfile } from '../../lib/schemas';
import { COLLECTIONS, GAME } from './config';
import { db } from './db';
import { changeAge, createPlayer } from './engine';

/** A stored profile, checked against the schema (null if missing or malformed). */
export function parsePlayer(raw: unknown, accountId: string): PlayerProfile | null {
  if (!raw) return null;
  const r = PlayerProfile.safeParse(raw);
  if (!r.success) {
    console.error(`Player ${accountId} does not match the schema: ${r.error.issues[0]?.message}`);
    return null;
  }
  // Bands can change (6–7 got its own band): a profile saved under an old rule moves to its age's band.
  const band = r.data.age ? GAME.ageBand(r.data.age) : r.data.ageBand;
  return band === r.data.ageBand ? r.data : { ...r.data, ageBand: band };
}

export async function getPlayer(accountId: string): Promise<PlayerProfile | null> {
  return parsePlayer(await db().get<unknown>(COLLECTIONS.players, accountId), accountId);
}

/** Creates the Captain, or updates name and age (age changes re-centre the skill levels). */
export async function upsertPlayer(accountId: string, heroName: string, age: number): Promise<PlayerProfile> {
  // In a transaction, so an answer saved at the same moment can't be overwritten with old skills.
  return db().transaction(async (tx) => {
    const existing = parsePlayer(await tx.get<unknown>(COLLECTIONS.players, accountId), accountId);
    let p = existing ? (existing.age !== age ? changeAge(existing, age) : existing) : createPlayer(accountId, age, heroName);
    p = { ...p, heroName, updatedAt: new Date().toISOString() };
    tx.set(COLLECTIONS.players, p.id, p);
    return p;
  });
}

/** What the browser may see about the Captain. Skill numbers stay on the server. */
export const publicPlayer = (p: PlayerProfile) => ({ heroName: p.heroName ?? null, age: p.age ?? null, ageBand: p.ageBand, roundsPlayed: p.roundsPlayed ?? 0 });
