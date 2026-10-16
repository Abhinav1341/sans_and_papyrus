/**
 * Gemini on Vertex AI: one structured-JSON call, validated with Zod, with an optional time limit.
 * Reads GOOGLE_GENAI_USE_VERTEXAI, GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION from the environment.
 */
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

let client: GoogleGenAI | null = null;
const ai = () => (client ??= new GoogleGenAI({}));

export class GeminiTimeout extends Error {}

function schemaFor(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

export async function geminiJson<T>(opts: {
  model: string;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  temperature?: number;
  timeoutMs?: number;
}): Promise<T> {
  const call = ai().models.generateContent({
    model: opts.model,
    contents: opts.prompt,
    config: {
      systemInstruction: opts.system,
      temperature: opts.temperature ?? 0.3,
      responseMimeType: 'application/json',
      responseJsonSchema: schemaFor(opts.schema),
    },
  });
  const res = opts.timeoutMs
    ? await Promise.race([
        call,
        new Promise<never>((_, reject) => setTimeout(() => reject(new GeminiTimeout(`${opts.model} took longer than ${opts.timeoutMs} ms`)), opts.timeoutMs)),
      ])
    : await call;
  const parsed = opts.schema.safeParse(JSON.parse(res.text ?? ''));
  if (!parsed.success) throw new Error(`${opts.model} returned invalid output: ${parsed.error.issues[0]?.message}`);
  return parsed.data;
}
