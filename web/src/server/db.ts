/**
 * A tiny document-store interface over Firestore. The game logic only uses these calls, so tests
 * can swap in the in-memory version and run the whole flow without Google Cloud.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Firestore } from '@google-cloud/firestore';

/** Reads and writes inside a transaction: all reads first, writes are applied together at the end. */
export interface Tx {
  get<T>(collection: string, id: string): Promise<T | null>;
  set<T extends object>(collection: string, id: string, data: T): void;
}

export interface Db {
  get<T>(collection: string, id: string): Promise<T | null>;
  set<T extends object>(collection: string, id: string, data: T): Promise<void>;
  del(collection: string, id: string): Promise<void>;
  /** Documents whose `field` equals `value`, newest first when `orderBy` is given. */
  where<T>(collection: string, field: string, value: string, opts?: { limit?: number; orderBy?: string }): Promise<T[]>;
  all<T>(collection: string): Promise<T[]>;
  /** Deletes every document whose `field` equals `value`, in pages. Returns how many were deleted. */
  delWhere(collection: string, field: string, value: string): Promise<number>;
  /**
   * Runs `fn` atomically: if another request changes a document it read, it is retried, so two requests
   * can never both act on the same state (e.g. a double-tapped answer). `fn` must have no other side effects.
   */
  transaction<R>(fn: (tx: Tx) => Promise<R>): Promise<R>;
}

class FirestoreDb implements Db {
  private fs = new Firestore({ projectId: process.env.GOOGLE_CLOUD_PROJECT, ignoreUndefinedProperties: true });
  async get<T>(c: string, id: string) {
    const snap = await this.fs.collection(c).doc(id).get();
    return snap.exists ? (snap.data() as T) : null;
  }
  async set<T extends object>(c: string, id: string, data: T) {
    await this.fs.collection(c).doc(id).set(data);
  }
  async del(c: string, id: string) {
    await this.fs.collection(c).doc(id).delete();
  }
  async where<T>(c: string, field: string, value: string, opts: { limit?: number; orderBy?: string } = {}) {
    // Filter in Firestore, sort in memory: avoids needing composite indexes. Without a sort, the limit
    // is applied by Firestore, so lookups like "the account with this email" read one document.
    let q = this.fs.collection(c).where(field, '==', value);
    if (opts.limit && !opts.orderBy) q = q.limit(opts.limit);
    const snap = await q.get();
    let rows = snap.docs.map((d) => d.data() as T);
    if (opts.orderBy) {
      const k = opts.orderBy;
      rows = rows.sort((a, b) => String((b as Record<string, unknown>)[k]).localeCompare(String((a as Record<string, unknown>)[k])));
    }
    return opts.limit ? rows.slice(0, opts.limit) : rows;
  }
  async all<T>(c: string) {
    const snap = await this.fs.collection(c).get();
    return snap.docs.map((d) => d.data() as T);
  }
  async delWhere(c: string, field: string, value: string) {
    let n = 0;
    for (;;) {
      // select() reads only document names, not their data.
      const snap = await this.fs.collection(c).where(field, '==', value).select().limit(400).get();
      if (snap.empty) return n;
      const batch = this.fs.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      n += snap.size;
    }
  }
  transaction<R>(fn: (tx: Tx) => Promise<R>) {
    return this.fs.runTransaction((t) =>
      fn({
        get: async <T>(c: string, id: string) => {
          const snap = await t.get(this.fs.collection(c).doc(id));
          return snap.exists ? (snap.data() as T) : null;
        },
        set: (c, id, data) => { t.set(this.fs.collection(c).doc(id), data); },
      })
    );
  }
}

/** In-memory store for tests and local experiments. */
export class MemoryDb implements Db {
  readonly data = new Map<string, Map<string, unknown>>();
  private col(c: string) {
    if (!this.data.has(c)) this.data.set(c, new Map());
    return this.data.get(c)!;
  }
  async get<T>(c: string, id: string) {
    const v = this.col(c).get(id);
    return v === undefined ? null : (structuredClone(v) as T);
  }
  async set<T extends object>(c: string, id: string, data: T) {
    this.col(c).set(id, structuredClone(data));
  }
  async del(c: string, id: string) {
    this.col(c).delete(id);
  }
  async where<T>(c: string, field: string, value: string, opts: { limit?: number; orderBy?: string } = {}) {
    let rows = [...this.col(c).values()].filter((d) => (d as Record<string, unknown>)[field] === value) as T[];
    if (opts.orderBy) {
      const k = opts.orderBy;
      rows = rows.sort((a, b) => String((b as Record<string, unknown>)[k]).localeCompare(String((a as Record<string, unknown>)[k])));
    }
    return structuredClone(opts.limit ? rows.slice(0, opts.limit) : rows);
  }
  async all<T>(c: string) {
    return structuredClone([...this.col(c).values()]) as T[];
  }
  async delWhere(c: string, field: string, value: string) {
    let n = 0;
    for (const [id, d] of this.col(c)) if ((d as Record<string, unknown>)[field] === value) { this.col(c).delete(id); n++; }
    return n;
  }
  // Transactions run one at a time, and their writes land only if `fn` succeeds, like Firestore's.
  private queue: Promise<unknown> = Promise.resolve();
  transaction<R>(fn: (tx: Tx) => Promise<R>): Promise<R> {
    const run = async () => {
      const writes: [string, string, unknown][] = [];
      const out = await fn({ get: (c, id) => this.get(c, id), set: (c, id, data) => { writes.push([c, id, data]); } });
      for (const [c, id, data] of writes) this.col(c).set(id, structuredClone(data));
      return out;
    };
    const p = this.queue.then(run, run);
    this.queue = p.catch(() => {});
    return p;
  }
}

/**
 * Offline mode, for running the game on a laptop with no Google Cloud access (for example a teammate without
 * gcloud): when no GOOGLE_CLOUD_PROJECT is set outside production, the game uses an in-memory database loaded
 * with the seed questions from generator/seeds, Gemini is off (code picks) and the browser reads aloud.
 * Nothing is saved: a restart starts fresh. Production always uses Firestore (and fails loudly without a project).
 */
export const isOffline = () => process.env.NODE_ENV !== 'production' && !process.env.GOOGLE_CLOUD_PROJECT?.trim();

function offlineDb(): MemoryDb {
  const m = new MemoryDb();
  const dir = join(process.cwd(), '..', 'generator', 'seeds');
  let n = 0;
  if (existsSync(dir))
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.json') && f.startsWith('seed-'))) {
      for (const item of JSON.parse(readFileSync(join(dir, f), 'utf8')) as { id: string }[]) {
        // Every seed, including drafts, so there is plenty to play with locally. Never used in production.
        void m.set('seedItems', item.id, { ...item, status: 'active' });
        n++;
      }
    }
  console.warn(`Offline mode (no GOOGLE_CLOUD_PROJECT): in-memory database with ${n} seed questions, Gemini off, browser voices. Nothing is saved.`);
  return m;
}

let instance: Db | null = null;
export function db(): Db {
  return (instance ??= isOffline() ? offlineDb() : new FirestoreDb());
}
/** Tests only: replace the database. */
export function setDb(d: Db) {
  instance = d;
}
