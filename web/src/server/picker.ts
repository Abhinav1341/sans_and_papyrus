/**
 * The AI picker: code builds a safe shortlist, Gemini Flash-Lite chooses one item from it and says why.
 * Gemini can only choose among items that already passed every rule. If it is slow, fails, or answers
 * with something off the list, the top-ranked candidate is used instead, so a child never waits long.
 */
import { PickerOutput, type PlayerProfile } from '../../lib/schemas';
import { GAME } from './config';
import { categoryOf, type Candidate, type PickerInfo } from './engine';
import { geminiJson } from './gemini';

const LABEL: Record<string, string> = {
  selfAwareness: 'self-awareness', selfManagement: 'self-management', socialAwareness: 'social awareness',
  relationshipSkills: 'relationship skills', responsibleDecisionMaking: 'responsible decision-making',
  math: 'maths', reasoning: 'reasoning', vocabulary: 'vocabulary',
};
const catLabel = (cat: string) => LABEL[cat.split(':')[1]] ?? cat;

const SYSTEM = `You choose the next item in a gentle, story-based value-education game for children aged 8 to 14.
Children are never graded; items help them practise social-emotional skills (the CASEL competencies)
and, now and then, a small maths, reasoning or vocabulary puzzle.

From the shortlist, choose the ONE item that best helps this child right now:
- keep the child in a comfortable stretch: not too easy, never discouraging;
- after a struggle or a hint, choose something more manageable;
- favour variety and the skills that are still growing, without drilling one skill;
- every shortlisted item is already safe and age-appropriate.

Reply with the item's id and one short, warm reason a parent could read (max 25 words, no jargon, no scores).`;

export function describeChild(p: PlayerProfile, lastStruggled: boolean): string {
  const casel = ['selfAwareness', 'selfManagement', 'socialAwareness', 'relationshipSkills', 'responsibleDecisionMaking'] as const;
  const sorted = [...casel].sort((a, b) => p.skills[b] - p.skills[a]);
  const time = p.timeRatioAvg < 0.6 ? 'often answers quickly' : p.timeRatioAvg > 2 ? 'takes their time' : 'reads and answers at a steady pace';
  const hints = p.helpSeeking.hintsUsed
    ? `uses hints ${p.helpSeeking.thoughtfulUses >= p.helpSeeking.reflexUses ? 'thoughtfully' : 'quickly, often before reading fully'}`
    : 'has not used hints yet';
  return [
    `Age band ${p.ageBand}${p.age ? `, age ${p.age}` : ''}; ${p.totalPlayed} items played.`,
    `Strongest: ${LABEL[sorted[0]]}, ${LABEL[sorted[1]]}. Still growing: ${LABEL[sorted[4]]}, ${LABEL[sorted[3]]}.`,
    `Recent categories: ${(p.recentCategories ?? []).slice(-4).map(catLabel).join(', ') || 'none yet'}.`,
    `The child ${time} and ${hints}.`,
    lastStruggled ? 'They found the last item hard or used a hint on it.' : '',
  ].filter(Boolean).join('\n');
}

/** `ai: false` takes the code's top choice at once (used for a round's first item, while the child waits). */
export async function pickNext(p: PlayerProfile, candidates: Candidate[], lastStruggled: boolean, { ai = true } = {}): Promise<PickerInfo> {
  const shortlistIds = candidates.map((c) => c.item.id);
  const fallback = (): PickerInfo => ({
    shortlistIds,
    chosenId: candidates[0].item.id,
    reason: candidates[0].item.kind === 'puzzle'
      ? 'A short puzzle for some variety.'
      : `A ${catLabel(categoryOf(candidates[0].item))} story pitched just above the current level.`,
    source: 'fallback',
  });
  if (!ai || candidates.length === 1 || !GAME.aiEnabled) return fallback();

  const list = candidates.map((c, i) => ({
    id: c.item.id,
    rank: i + 1,
    kind: c.item.kind,
    focus: catLabel(categoryOf(c.item)),
    difficulty: c.item.difficulty,
    fitsLevel: Math.abs(c.rating - c.target) <= 100 ? 'good fit' : c.rating > c.target ? 'harder' : 'easier',
    title: c.item.title,
    story: c.item.text.slice(0, 160),
  }));
  try {
    const out = await geminiJson({
      model: GAME.models.picker,
      system: SYSTEM,
      prompt: `Child:\n${describeChild(p, lastStruggled)}\n\nShortlist (rank 1 is the code's own best guess):\n${JSON.stringify(list, null, 1)}`,
      schema: PickerOutput,
      temperature: 0.4,
      timeoutMs: GAME.pickerTimeoutMs,
    });
    if (!shortlistIds.includes(out.situationId)) return fallback();
    return { shortlistIds, chosenId: out.situationId, reason: out.reason.trim().slice(0, 200), source: 'ai' };
  } catch (err) {
    console.warn(`AI picker unavailable, using code fallback: ${(err as Error).message}`);
    return fallback();
  }
}
