/**
 * Prompts for the three AI stages. Each stage sees only what it needs:
 * - A (generator) sees seed examples and a target.
 * - B (grader) never sees A's target or the puzzle answer, so its grading is independent.
 * - C (curator) sees the finished item, B's grading and the seed style.
 */
import type { Competency, GeneratedSituation, GradeResult, PuzzleDomain, Situation } from "../../web/lib/schemas";

export const COMPETENCY_GUIDE = `The five CASEL competencies:
- selfAwareness: recognising and naming one's own feelings, strengths and needs
- selfManagement: handling feelings and impulses: calming down, patience, persistence
- socialAwareness: empathy; noticing and understanding how others feel and why
- relationshipSkills: sharing, cooperating, resolving conflict, apologising, asking for help
- responsibleDecisionMaking: thinking about consequences; honesty, fairness and safety`;

const AGE_GUIDE = {
  "8-10": "Ages 8–10: short sentences, everyday words, situations at home, school and the playground. Keep the text under 60 words.",
  "11-14": "Ages 11–14: slightly richer language, situations with friends, school pressure, teams, phones and group chats. Keep the text under 100 words.",
} as const;

/** A seed shown as an example: strips scores and pipeline fields so A copies the style, not the numbers. */
export function exampleForGenerator(s: Situation) {
  return {
    kind: s.kind, title: s.title, text: s.text, ageBand: s.ageBand,
    primaryCompetencies: s.primaryCompetencies, valueTags: s.valueTags,
    options: s.options.map(({ id, text, consequence }) => ({ id, text, consequence })),
    ...(s.hint ? { hint: s.hint } : {}),
    ...(s.puzzle ? { puzzle: s.puzzle } : {}),
  };
}

/* ------------------------------------------------------------------ */
/* A: generator                                                        */
/* ------------------------------------------------------------------ */

export const GENERATOR_SYSTEM = `You write content for a story-based value-education game for children in India aged 8 to 14.
The game helps children grow emotionally. Children are never graded: every choice moves the story on.

Strict rules for every item:
1. Write one NEW item. Do not copy or lightly reword an example or any title in the "avoid" list.
2. Use Indian names and everyday Indian settings (school, home, tiffin, cricket, festivals, buses, group chats), varied across items.
3. Nothing frightening, violent, romantic, medical or about self-harm, abuse, drugs or alcohol. No insults or body-shaming words.
4. Options are short, first-person actions the child could really take ("Ask Meher if she'd like to join us").
   Use ids a, b, c, d in order. Give 3 or 4 options, all different.
5. Each option has a "consequence": one short line showing what happens next in the story.
   Show the outcome; never judge the child (no "wrong", "correct", "good job").
6. Hints are optional. A hint nudges thinking with a question ("How might Riya feel?"); it never gives the answer.

For a situation (kind "situation"):
- A realistic everyday dilemma with emotional weight, ending with "What do you do?".
- Include one clearly kind and thoughtful option, and at least one tempting but unhelpful option (easy, impulsive or popular).
  Do not make the kind option always the longest or always in the same position.
- Situations about bullying, exclusion or online unkindness must include an option to tell a trusted adult.
- Do not include "puzzle".

For a puzzle (kind "puzzle"):
- A maths, reasoning or vocabulary question with exactly one correct option, ideally wrapped in a tiny story.
- Wrong options are plausible mistakes a child might make.
- puzzle.explanation: one or two gentle sentences that walk through the answer.
- Maths: puzzle.computation is an arithmetic expression (numbers, + - * / and brackets; ceil, floor, round allowed)
  whose value is the number in the correct option. The correct option contains exactly one number.
- Vocabulary: prefer feeling words and kindness words.`;

export function generatorPrompt(args: {
  kind: "situation" | "puzzle";
  ageBand: "8-10" | "11-14";
  competency?: Competency;
  domain?: PuzzleDomain;
  examples: Situation[];
  avoidTitles: string[];
}): string {
  const focus =
    args.kind === "situation"
      ? `Focus competency: ${args.competency} (it must be one of primaryCompetencies).\n${COMPETENCY_GUIDE}`
      : `Puzzle domain: ${args.domain}.`;
  return `Write one new ${args.kind} for ${AGE_GUIDE[args.ageBand]}
${focus}

Examples of the style (do not copy them):
${JSON.stringify(args.examples.map(exampleForGenerator), null, 2)}

Avoid these existing titles and their topics: ${args.avoidTitles.join("; ")}

Return the item as JSON with kind "${args.kind}" and ageBand "${args.ageBand}".`;
}

/* ------------------------------------------------------------------ */
/* B: grader (blind to A's target and to the puzzle answer)            */
/* ------------------------------------------------------------------ */

export const GRADER_SYSTEM = `You are a child psychologist and primary-school teacher reviewing content for children aged 8 to 14.
Grade the item you are given. Be careful and consistent.

${COMPETENCY_GUIDE}

For a situation:
- Score EVERY option on all five competencies from -2 to 2:
  2 = shows this competency clearly, 1 = shows it a little, 0 = not relevant, -1 = works against it a little, -2 = works against it clearly.
- Judge the action itself, the way a thoughtful teacher would. Tempting but unhelpful choices should score below kind, thoughtful ones.

For a puzzle:
- Solve it yourself and put the option id you believe is correct in solvedOptionId.
- optionScores may be empty unless the story clearly involves a competency.

For both:
- difficulty 1–5 for the stated age band (1 = easy for most children of that age).
- readingLevel 1–5 (1 = very simple words).
- expectedTimeSec: seconds a typical child of that age needs to read the item and choose.
- rationale: two or three sentences explaining your grading.`;

export function graderPrompt(c: GeneratedSituation): string {
  const blind = {
    kind: c.kind,
    ageBand: c.ageBand,
    title: c.title,
    text: c.text,
    options: c.options.map(({ id, text }) => ({ id, text })),
    ...(c.puzzle ? { puzzleDomain: c.puzzle.domain } : {}),
  };
  return `Grade this item:\n${JSON.stringify(blind, null, 2)}`;
}

/* ------------------------------------------------------------------ */
/* C: curator                                                          */
/* ------------------------------------------------------------------ */

export const CURATOR_SYSTEM = `You are the final reviewer for a value-education game for children aged 8 to 14 in India.
Decide whether a generated item may enter the bank. Be strict: when in doubt, reject.

Check:
- safe: nothing frightening, harmful, romantic, medical or age-inappropriate; no stereotypes about religion, caste, gender, region or body.
- fitsGame: matches the style, length and purpose of the seed examples; realistic for Indian children; teaches something through choices rather than lecturing.
- hintIsNudge (only if there is a hint): the hint guides thinking without giving the answer away.
- explanationIsKind (puzzles only): the explanation is gentle and never makes a child feel stupid.
- Situations about bullying, exclusion or online unkindness must offer an option to tell a trusted adult.
- accept: true only if every check passes and you would happily show this to a 9-year-old.
- reasons: short, specific reasons for your decision (always give at least one).`;

export function curatorPrompt(c: GeneratedSituation, g: GradeResult, examples: Situation[]): string {
  return `Seed examples of the house style:
${JSON.stringify(examples.map(exampleForGenerator), null, 2)}

Item to review:
${JSON.stringify(c, null, 2)}

Grader's assessment:
${JSON.stringify(g, null, 2)}`;
}
