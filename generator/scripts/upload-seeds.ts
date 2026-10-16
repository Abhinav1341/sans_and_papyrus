/**
 * Uploads the hand-written seeds from seeds/ to the Firestore "seedItems" collection.
 * Safe to re-run: each seed is written under its own id.
 *
 * Usage (from the generator folder):  npm run bank:upload-seeds
 */
import { FirestoreBank, loadSeeds } from "../src/bank";
import { PIPELINE_CONFIG } from "../src/config";
import { join } from "node:path";
import { loadEnv } from "../src/env";

loadEnv(join(import.meta.dirname, ".."));
const seeds = loadSeeds();
await new FirestoreBank().uploadSeeds(seeds);
console.log(`Uploaded ${seeds.length} seeds to Firestore collection "${PIPELINE_CONFIG.collections.seeds}".`);

// Firestore keeps network connections open; exit explicitly once the work is done.
process.exit(0);
