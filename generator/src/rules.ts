/**
 * Hard rules checked in code, before and after the AI stages. They are free, instant and 100% consistent,
 * so anything checkable lives here rather than in a prompt.
 */
import type { Competency, CompetencyScores, GeneratedSituation, GradeResult } from "../../web/lib/schemas";
import { PIPELINE_CONFIG } from "./config";

export const countWords = (s: string) => (s.trim().match(/\S+/g) ?? []).length;

/** Words that should never appear in content for 8–14-year-olds. Matched as whole words. */
const BANNED = [
  "kill", "killed", "killing", "suicide", "suicidal", "self-harm", "blood", "bleeding", "knife", "gun", "guns",
  "drugs", "drunk", "alcohol", "beer", "cigarette", "cigarettes", "vape", "sex", "sexy", "porn", "naked",
  "abuse", "abused", "die", "died", "dead", "hate", "stupid", "idiot", "ugly", "fat",
];
const BANNED_RE = new RegExp(`\\b(${BANNED.map((w) => w.replace(/[-]/g, "\\-")).join("|")})\\b`, "i");

/** Consequence lines show outcomes in the story; they never grade the child. */
const JUDGING_RE = /\b(wrong|incorrect|bad choice|you failed|shame on you|good job|correct answer)\b/i;

/* ------------------------------------------------------------------ */
/* Safe arithmetic evaluator for maths puzzles                         */
/* ------------------------------------------------------------------ */

/**
 * Evaluates + - * / ( ) with numbers and ceil/floor/round. No eval(): a tiny recursive-descent parser,
 * so model output can never run as code.
 */
export function evaluateArithmetic(expr: string): number {
  const tokens = expr.match(/\d+(?:\.\d+)?|[a-z]+|[-+*/()]/gi);
  if (!tokens || tokens.join("") !== expr.replace(/\s+/g, "")) throw new Error(`Unsupported characters in "${expr}"`);
  let i = 0;
  const peek = () => tokens[i];
  const next = () => tokens[i++];
  const FUNCS: Record<string, (x: number) => number> = { ceil: Math.ceil, floor: Math.floor, round: Math.round };

  const factor = (): number => {
    const t = next();
    if (t === undefined) throw new Error("Unexpected end of expression");
    if (t === "-") return -factor();
    if (t === "(") {
      const v = expression();
      if (next() !== ")") throw new Error("Missing )");
      return v;
    }
    if (/^[a-z]+$/i.test(t)) {
      const fn = FUNCS[t.toLowerCase()];
      if (!fn || next() !== "(") throw new Error(`Unknown function ${t}`);
      const v = expression();
      if (next() !== ")") throw new Error("Missing )");
      return fn(v);
    }
    const n = Number(t);
    if (Number.isNaN(n)) throw new Error(`Bad number ${t}`);
    return n;
  };
  const term = (): number => {
    let v = factor();
    while (peek() === "*" || peek() === "/") v = next() === "*" ? v * factor() : v / factor();
    return v;
  };
  const expression = (): number => {
    let v = term();
    while (peek() === "+" || peek() === "-") v = next() === "+" ? v + term() : v - term();
    return v;
  };
  const value = expression();
  if (i !== tokens.length) throw new Error(`Unexpected "${peek()}"`);
  if (!Number.isFinite(value)) throw new Error("Result is not a finite number");
  return value;
}

/** Pulls the number out of an option like "₹600", "5 days" or "4.75". Null if there isn't exactly one. */
export function optionNumber(text: string): number | null {
  const nums = text.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/g);
  return nums && nums.length === 1 ? Number(nums[0]) : null;
}

/* ------------------------------------------------------------------ */
/* Stage checks                                                        */
/* ------------------------------------------------------------------ */

/** Checks a candidate straight from A (the generator). Returns reasons it fails; empty means it passes. */
export function checkCandidate(c: GeneratedSituation, target: { kind: string; ageBand: string }): string[] {
  const problems: string[] = [];

  if (c.kind !== target.kind) problems.push(`Asked for a ${target.kind}, got a ${c.kind}`);
  if (c.ageBand !== target.ageBand) problems.push(`Asked for ages ${target.ageBand}, got ${c.ageBand}`);

  const maxWords = PIPELINE_CONFIG.maxTextWords[c.ageBand];
  const words = countWords(c.text);
  if (words > maxWords) problems.push(`Text is ${words} words; the limit for ages ${c.ageBand} is ${maxWords}`);

  const ids = c.options.map((o) => o.id);
  if (ids.join(",") !== ["a", "b", "c", "d"].slice(0, ids.length).join(",")) problems.push(`Option ids must be a, b, c, d in order (got ${ids.join(", ")})`);
  const texts = c.options.map((o) => o.text.trim().toLowerCase());
  if (new Set(texts).size !== texts.length) problems.push("Two options have the same text");

  const allText = [c.title, c.text, c.hint?.text ?? "", c.puzzle?.explanation ?? "", ...c.options.flatMap((o) => [o.text, o.consequence])].join(" ");
  const banned = allText.match(BANNED_RE);
  if (banned) problems.push(`Contains a word not suitable for children: "${banned[1]}"`);

  for (const o of c.options) {
    if (JUDGING_RE.test(o.consequence)) problems.push(`Consequence for option ${o.id} judges the child instead of showing an outcome`);
  }

  if (c.kind === "situation") {
    if (c.puzzle) problems.push("A situation must not include puzzle details");
    if (c.primaryCompetencies.length < 1) problems.push("A situation needs at least one primary competency");
  } else {
    const p = c.puzzle;
    if (!p) {
      problems.push("A puzzle needs puzzle details");
    } else {
      const correct = c.options.find((o) => o.id === p.correctOptionId);
      if (!correct) problems.push(`correctOptionId "${p.correctOptionId}" does not match any option`);
      if (correct && c.hint && correct.text.length >= 3 && c.hint.text.toLowerCase().includes(correct.text.toLowerCase()))
        problems.push("The hint gives away the answer");
      if (p.domain === "math") {
        if (!p.computation) {
          problems.push("A maths puzzle needs a computation the code can check");
        } else if (correct) {
          try {
            const expected = evaluateArithmetic(p.computation);
            const shown = optionNumber(correct.text);
            if (shown === null) problems.push(`Correct option "${correct.text}" does not contain a single number`);
            else if (Math.abs(shown - expected) > 1e-9) problems.push(`Answer check failed: ${p.computation} = ${expected}, but the correct option says ${shown}`);
            const clashes = c.options.filter((o) => o.id !== correct.id && optionNumber(o.text) === expected);
            if (clashes.length) problems.push("Another option also has the correct number");
          } catch (err) {
            problems.push(`Computation "${p.computation}" could not be checked: ${(err as Error).message}`);
          }
        }
      }
    }
  }
  return problems;
}

const total = (s: CompetencyScores) => Object.values(s).reduce((a, b) => a + b, 0);

/** Checks B's grading against the candidate. */
export function checkGrade(c: GeneratedSituation, g: GradeResult): string[] {
  const problems: string[] = [];
  if (c.kind === "situation") {
    const graded = new Set(g.optionScores.map((s) => s.optionId));
    const missing = c.options.filter((o) => !graded.has(o.id)).map((o) => o.id);
    if (missing.length) problems.push(`Grader did not score options ${missing.join(", ")}`);
    const totals = g.optionScores.filter((s) => c.options.some((o) => o.id === s.optionId)).map((s) => total(s.scores));
    if (totals.length && Math.max(...totals) - Math.min(...totals) < PIPELINE_CONFIG.minScoreSpread)
      problems.push("Options are too similar in what they teach (score spread too small)");
    if (totals.length && Math.max(...totals) <= 0) problems.push("No option shows a positive way to handle the situation");
  } else if (c.puzzle && g.solvedOptionId !== c.puzzle.correctOptionId) {
    problems.push(`Grader solved the puzzle independently and chose "${g.solvedOptionId ?? "nothing"}", not "${c.puzzle.correctOptionId}". The puzzle may be ambiguous or wrong.`);
  }
  return problems;
}

/**
 * Situations: B grades blind, so its scores are an independent check on A's category.
 * The target competency must score at least 1 on the best option and be among its top competencies.
 * Returns a reason if the item is off-category, or null if it fits.
 */
export function checkCategory(c: GeneratedSituation, g: GradeResult, target: Competency): string | null {
  const graded = g.optionScores.filter((s) => c.options.some((o) => o.id === s.optionId));
  if (!graded.length) return "No grader scores to check the category against";
  const best = graded.reduce((a, b) => (total(b.scores) > total(a.scores) ? b : a)).scores;
  const ranked = (Object.entries(best) as [Competency, number][]).sort((a, b) => b[1] - a[1]);
  const cutoff = ranked[Math.min(PIPELINE_CONFIG.categoryTopN, ranked.length) - 1][1];
  if (best[target] >= 1 && best[target] >= cutoff) return null;
  const top = ranked.slice(0, 2).map(([k, v]) => `${k} (${v})`).join(", ");
  return `Off-category: aimed at ${target} (${best[target]}), but the grader found the best option mainly shows ${top}`;
}
