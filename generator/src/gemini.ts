/**
 * Thin wrapper around Gemini on Vertex AI: structured JSON calls validated with Zod, embeddings,
 * and token-usage tracking (for cost reporting on the dashboard).
 * The client reads GOOGLE_GENAI_USE_VERTEXAI, GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION from the environment.
 */
import { GoogleGenAI } from "@google/genai";
import { z } from "../../web/lib/schemas";

interface UsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  thoughtsTokenCount?: number;
}

/** The subset of the Gemini client the pipeline uses (lets tests pass a fake). */
export interface LlmClient {
  models: {
    generateContent(params: any): Promise<{ text?: string; usageMetadata?: UsageMetadata }>;
    embedContent(params: any): Promise<{ embeddings?: { values?: number[] }[] }>;
  };
}

export const createGeminiClient = (): LlmClient => new GoogleGenAI({});

/* ------------------------------------------------------------------ */
/* Usage tracking                                                      */
/* ------------------------------------------------------------------ */

export interface ModelUsage {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number; // billed as output tokens
}

export class UsageTracker {
  readonly byModel: Record<string, ModelUsage> = {};
  add(model: string, meta?: UsageMetadata) {
    const u = (this.byModel[model] ??= { calls: 0, inputTokens: 0, outputTokens: 0, thinkingTokens: 0 });
    u.calls++;
    u.inputTokens += meta?.promptTokenCount ?? 0;
    u.outputTokens += meta?.candidatesTokenCount ?? 0;
    u.thinkingTokens += meta?.thoughtsTokenCount ?? 0;
  }
  summary(): Record<string, ModelUsage> {
    return JSON.parse(JSON.stringify(this.byModel));
  }
  /** Approximate cost in USD for models with a known price; null if no model in use has a price. */
  estimateCost(prices: Record<string, { input: number; output: number } | undefined>): number | null {
    let total = 0, priced = false;
    for (const [model, u] of Object.entries(this.byModel)) {
      const p = prices[model];
      if (!p) continue;
      priced = true;
      total += (u.inputTokens * p.input + (u.outputTokens + u.thinkingTokens) * p.output) / 1_000_000;
    }
    return priced ? total : null;
  }
}

/* ------------------------------------------------------------------ */
/* Calls                                                               */
/* ------------------------------------------------------------------ */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Retries transient failures (rate limits, timeouts, 5xx) with exponential backoff. */
async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = String((err as Error)?.message ?? err);
      const transient = /429|RESOURCE_EXHAUSTED|5\d\d|UNAVAILABLE|DEADLINE|ECONNRESET|ETIMEDOUT|fetch failed/i.test(msg);
      if (!transient || i === attempts - 1) break;
      await sleep(1000 * 2 ** i + Math.random() * 500);
    }
  }
  const msg = String((lastError as Error)?.message ?? lastError);
  if (/404|NOT_FOUND/i.test(msg) && /model/i.test(msg)) {
    throw new Error(
      `${msg}\nThe model name may be wrong or not available to this project. Set GEMINI_GENERATOR_MODEL / ` +
        `GEMINI_GRADER_MODEL / GEMINI_CURATOR_MODEL / GEMINI_EMBEDDING_MODEL to a model listed in Vertex AI Model Garden.`
    );
  }
  throw lastError;
}

/** JSON Schema for Gemini's structured output, generated from a Zod schema. */
export function toGeminiSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

/**
 * Calls Gemini and returns output validated against `schema`.
 * If the JSON does not validate, retries once and tells the model what was wrong.
 */
export async function callJson<T>(
  ai: LlmClient,
  opts: { model: string; system: string; prompt: string; schema: z.ZodType<T>; temperature: number; usage?: UsageTracker }
): Promise<T> {
  const responseJsonSchema = toGeminiSchema(opts.schema);
  let prompt = opts.prompt;
  let lastProblem = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await withRetry(() =>
      ai.models.generateContent({
        model: opts.model,
        contents: prompt,
        config: {
          systemInstruction: opts.system,
          temperature: opts.temperature,
          responseMimeType: "application/json",
          responseJsonSchema,
        },
      })
    );
    opts.usage?.add(opts.model, res.usageMetadata);
    const raw = res.text ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      lastProblem = `Output was not valid JSON: ${raw.slice(0, 200)}`;
      prompt = `${opts.prompt}\n\nYour previous answer was not valid JSON. Return only JSON that matches the schema.`;
      continue;
    }
    const result = opts.schema.safeParse(parsed);
    if (result.success) return result.data;
    lastProblem = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    prompt = `${opts.prompt}\n\nYour previous answer had these problems: ${lastProblem}. Fix them and answer again.`;
  }
  throw new Error(`Gemini (${opts.model}) did not return valid output: ${lastProblem}`);
}

/** Embeds one text. Called once per text, since some embedding models accept a single input per request. */
export async function embed(ai: LlmClient, model: string, text: string, usage?: UsageTracker): Promise<number[]> {
  const res = await withRetry(() =>
    ai.models.embedContent({ model, contents: text, config: { taskType: "SEMANTIC_SIMILARITY", outputDimensionality: 768 } })
  );
  usage?.add(model);
  const values = res.embeddings?.[0]?.values;
  if (!values?.length) throw new Error(`Embedding model ${model} returned no values`);
  return values;
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
