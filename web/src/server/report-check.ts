/**
 * A code check on every AI-written parent note, after Gemini writes it and before a parent reads it.
 * Parents must never see a label, a diagnosis, a score or a comparison with other children, however the
 * model phrases it. A note that fails is rewritten once with the problems named; if it fails again, the
 * plain report is used instead.
 */
import type { ParentReport } from '../../lib/schemas';

/** [pattern, why it is not allowed]. Matched case-insensitively on whole words. */
const BANNED: [RegExp, string][] = [
  [/\b(diagnos\w*|disorder\w*|syndrome|adhd|autis\w*|dyslexi\w*|depress\w*|anxiety|anxious|trauma\w*|therap\w*|symptom\w*|clinical\w*)\b/i, 'medical or diagnostic word'],
  [/\b(lazy|naughty|stubborn|aggressive|selfish|rude|weak|slow learner|problem child|immature|careless|attention.seeking|defiant)\b/i, 'label for the child'],
  [/\b(low|poor|lacks?|lacking|no) (empathy|self.control|confidence|social skills|focus|attention)\b/i, 'label for the child'],
  [/\b(bad|poor|terrible|hopeless) at\b/i, 'label for the child'],
  [/\b(fail\w*|wrong answers?|mistakes?|incorrect\w*)\b/i, 'grading word (children are never graded)'],
  [/\b(scor(e|es|ed|ing)|marks?|grades?|percent\w*|percentile|rank\w*)\b|\d+\s*(%|points?)/i, 'score or number talk'],
  [/\b(behind|below|above|ahead of) (average|others|other children|other kids|peers|age|their age|the class)\b/i, 'comparison with other children'],
  [/\b(compared (to|with)|than other (children|kids)|normal for (their|his|her) age|not normal)\b/i, 'comparison with other children'],
  [/\b(worr(y|ied|ying)|concern\w*|alarm\w*|red flag\w*|warning sign\w*)\b/i, 'alarming word'],
];

/** Every string a parent will read in the note. */
const texts = (r: ParentReport) => [r.summary, ...r.strengths, ...r.growingAreas, ...r.habits, ...r.tryAtHome, ...(r.thinkingSkills ? [r.thinkingSkills] : [])];

/** The problems in a note, as short phrases ("score or number talk: \"points\""). Empty when it is fine. */
export function checkReport(r: ParentReport): string[] {
  const problems = new Set<string>();
  for (const t of texts(r))
    for (const [re, why] of BANNED) {
      const m = t.match(re);
      if (m) problems.add(`${why}: "${m[0]}"`);
    }
  return [...problems];
}
