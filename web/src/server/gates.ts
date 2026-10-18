/**
 * What each story gate is about, so a bonus round fits its moment in the story: the crew shows a skill in
 * the story, and the child practises the same skill straight after (children learn more when the skill and
 * the story match). The shortlist favours items on these skills; the AI picker is told the moment.
 * Gates not listed here (or new ones) simply get no preference.
 */
import type { Competency } from '../../lib/schemas';

export interface GateFocus {
  moment: string;          // one line for the AI picker
  skills: Competency[];    // favoured situation skills
  riddle?: boolean;        // the story asks for a riddle: favour a puzzle
}

export const GATES: Record<string, GateFocus> = {
  'g-p-warmup': { moment: 'Fizz meets the new Captain for the first time.', skills: [] },
  'g-c1-power': { moment: 'The crew are getting used to new candy powers, some of them a bit scary.', skills: ['selfAwareness', 'selfManagement'] },
  'g-c2-bounce': { moment: 'Bunty is stuck to a jelly bean and needs the others to help him.', skills: ['relationshipSkills', 'socialAwareness'] },
  'g-c2-gap': { moment: 'The next bean is too far to jump alone; the crew must cross together.', skills: ['relationshipSkills', 'responsibleDecisionMaking'] },
  'g-c2-sink': { moment: 'The beans sink when stood on, so the crew must stay calm and think.', skills: ['selfManagement', 'responsibleDecisionMaking'] },
  'g-c3-raft': { moment: 'The raft is falling apart and Bunty must keep calm and fix it with the crew.', skills: ['selfManagement', 'relationshipSkills'] },
  'g-c3-rescue': { moment: 'Ro is stuck in a chocolate whirlpool and the crew must think clearly to save him.', skills: ['responsibleDecisionMaking', 'selfManagement'], riddle: true },
  'g-c4-garden': { moment: 'The crew search a giant garden for each other’s hidden stars.', skills: ['socialAwareness', 'selfAwareness'] },
  'g-c5-climb': { moment: 'The crew climb an icy mountain together, one step at a time.', skills: ['relationshipSkills', 'selfManagement'] },
  'g-c5-ladder': { moment: 'Ro’s arm becomes a wobbly ladder and everyone must climb it safely.', skills: ['responsibleDecisionMaking', 'relationshipSkills'], riddle: true },
};
