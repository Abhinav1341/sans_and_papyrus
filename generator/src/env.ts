/** Loads .env files for the generator scripts. Existing variables are not overwritten. */
import { existsSync } from "node:fs";
import { join } from "node:path";

export function loadEnv(generatorDir: string) {
  for (const f of [join(generatorDir, ".env"), join(generatorDir, "..", ".env"), join(generatorDir, "..", "web", ".env.local")]) {
    if (existsSync(f)) process.loadEnvFile(f);
  }
  process.env.GOOGLE_GENAI_USE_VERTEXAI ??= "true";
  process.env.GOOGLE_CLOUD_LOCATION ??= "global";
  if (!process.env.GOOGLE_CLOUD_PROJECT) {
    console.error("GOOGLE_CLOUD_PROJECT is not set. Add it to your .env file.");
    process.exit(1);
  }
}
