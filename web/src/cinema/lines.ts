// Spoken text for story moments outside the shots (title cards, bonus rounds, rewards, chapter
// ends). tools/voices records exactly these strings, so keep every spoken sentence here.
import type { Chapter, GateShot, TitleShot } from './types';
import { rewardLine } from '@/data/ui-lines';

export const fill = (text: string, name: string) => text.replaceAll('{name}', name);

const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
export const titleSpeech = (t: TitleShot['title']) => `${cap(t.ep)}. ${t.name}.`;
export const gateSpeech = (g: GateShot['gate'], name: string) => `Bonus round! ${fill(g.ask, name)}`;
export const rewardSpeech = (id: string) => rewardLine(id);
export const endSpeech = (ch: Pick<Chapter, 'recap'>, name: string) => `Chapter complete! ${fill(ch.recap, name)}`;
