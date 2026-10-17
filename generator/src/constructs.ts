/**
 * Research constructs that generated situations are built on. Each target names one construct, so variety
 * follows child-development research instead of chance, and every item can be traced to its idea.
 * The `brief` tells the writer how to make the construct visible in a situation; `seedIds` are the
 * hand-written seeds built on it (used as examples once a person has approved them).
 */
import type { Competency } from "../../web/lib/schemas";

export interface Construct {
  id: string;
  name: string;
  source: string;
  competencies: Competency[];
  bands: ("8-10" | "11-14")[];
  brief: string;
  seedIds: string[];
  /** A genuine dilemma: more than one okay answer, so the choice never moves skill levels. */
  openChoice?: boolean;
}

export const CONSTRUCTS: Construct[] = [
  {
    id: "pons-hidden",
    name: "Hidden feelings",
    source: "Pons, Harris & de Rosnay, Test of Emotion Comprehension (hiding emotions)",
    competencies: ["socialAwareness", "selfAwareness"],
    bands: ["8-10", "11-14"],
    brief: "Someone shows one feeling on the outside (a laugh, \"I don't care\") while a clue shows they feel something else. The best options notice the clue and respond gently; one option takes the outside feeling at face value.",
    seedIds: ["rsit-13", "rsit-01"],
  },
  {
    id: "pons-mixed",
    name: "Mixed feelings",
    source: "Pons, Harris & de Rosnay, Test of Emotion Comprehension (mixed emotions)",
    competencies: ["selfAwareness"],
    bands: ["8-10", "11-14"],
    brief: "One event brings two feelings at once (proud and nervous, excited and sad). The best option names both feelings; others hide one or deny it.",
    seedIds: ["rsit-17", "rsit-01"],
  },
  {
    id: "pons-desire",
    name: "Different wishes, different feelings",
    source: "Pons et al. TEC (desire-based emotion); Selman social-informational perspective taking (about ages 5-9)",
    competencies: ["socialAwareness"],
    bands: ["8-10", "11-14"],
    brief: "The same news makes the child happy but another character unhappy because they wanted something else. The best option asks about or allows for the other person's wish.",
    seedIds: ["rsit-06"],
  },
  {
    id: "dodge-ambiguous",
    name: "Accident or on purpose?",
    source: "Dodge social information processing: ambiguous provocation and hostile attribution bias",
    competencies: ["socialAwareness", "selfManagement"],
    bands: ["8-10", "11-14"],
    brief: "Someone's action causes a small harm, and the text leaves their intent genuinely unclear (never reveal it in the situation). One option assumes hostility and hits back, one checks first, one stays calm and gives the benefit of the doubt. The consequence of checking reveals a believable innocent reason.",
    seedIds: ["rsit-05", "rsit-12"],
  },
  {
    id: "selman-third-party",
    name: "Seeing a conflict from outside",
    source: "Selman third-party perspective taking (about ages 10-15)",
    competencies: ["socialAwareness", "relationshipSkills"],
    bands: ["11-14"],
    brief: "Two other people are in conflict and each wants the child on their side. The best option considers how it looks to both and helps them talk; others take a side, avoid it or carry tales.",
    seedIds: ["rsit-11"],
  },
  {
    id: "gross-body-cues",
    name: "Noticing body signals first",
    source: "Gross process model of emotion regulation (noticing the feeling before responding)",
    competencies: ["selfAwareness", "selfManagement"],
    bands: ["8-10", "11-14"],
    brief: "Describe the body signals of a strong feeling (hot face, tight fists, fluttery tummy) without naming the feeling. The best option notices the feeling and calms it before acting; others act on it straight away or push it down.",
    seedIds: ["rsit-02", "rsit-10"],
  },
  {
    id: "reappraisal",
    name: "Changing an unhelpful thought",
    source: "Cognitive reappraisal development from childhood to adolescence (Willner et al. 2022)",
    competencies: ["selfManagement", "selfAwareness"],
    bands: ["8-10", "11-14"],
    brief: "A setback triggers an unhelpful thought (\"I'm just bad at this\", \"everyone hates me\"), quoted in the text. The best option checks or reframes the thought; others believe it and give up, or hide the problem.",
    seedIds: ["rsit-16", "rsit-03"],
  },
  {
    id: "compas-coping",
    name: "Coping by engaging, not escaping",
    source: "Compas control-based coping: problem-solving and adapting vs disengagement",
    competencies: ["selfManagement"],
    bands: ["8-10", "11-14"],
    brief: "A stressful or disappointing situation the child can't fully control. Include one problem-solving option, one adapting option (reframe, accept, find the good part) and one escaping option (avoid, sulk, ignore). More than one engaging option can be good.",
    seedIds: ["rsit-03", "rsit-22"],
  },
  {
    id: "inhibition-delay",
    name: "Waiting when it's hard",
    source: "Inhibitory control and delay of gratification (Diamond 2013, executive functions)",
    competencies: ["selfManagement", "responsibleDecisionMaking"],
    bands: ["8-10"],
    brief: "Something tempting is right there, and the child has been asked to wait. Options include giving in, a smart way to wait (distraction, asking for an alternative), and owning up after a slip.",
    seedIds: ["rsit-04"],
  },
  {
    id: "turiel-moral-convention",
    name: "When someone's wellbeing beats a rule",
    source: "Turiel social domain theory (moral vs conventional rules)",
    competencies: ["responsibleDecisionMaking", "socialAwareness"],
    bands: ["8-10", "11-14"],
    brief: "A conventional rule (be quiet, stay in line, don't use phones) conflicts with someone's wellbeing or fairness. The best option protects the person while still respecting adults (tell the teacher); others stick to the rule and ignore the harm.",
    seedIds: ["rsit-07", "rsit-20"],
  },
  {
    id: "honesty-repair",
    name: "Owning up and making it right",
    source: "WHO life skills (decision making); repair after a mistake",
    competencies: ["responsibleDecisionMaking", "relationshipSkills"],
    bands: ["8-10", "11-14"],
    brief: "The child made a mistake, broke something or found something that isn't theirs, and nobody saw. The best option tells the truth and helps fix it; others hide it or blame someone else.",
    seedIds: ["rsit-08"],
  },
  {
    id: "assertive-communication",
    name: "Saying it clearly, not angrily",
    source: "WHO life skills: effective communication (assertive, not aggressive or passive)",
    competencies: ["relationshipSkills", "selfManagement"],
    bands: ["8-10", "11-14"],
    brief: "Someone treats the child unfairly (takes credit, cuts in, breaks a promise). Include an aggressive option, a passive option, and a calm, clear assertive option. Talking privately to a trusted adult can also be good.",
    seedIds: ["rsit-18"],
  },
  {
    id: "inclusion-upstander",
    name: "Standing with someone left out",
    source: "WHO life skills (empathy); inclusion of children who are different; upstander responses",
    competencies: ["socialAwareness", "responsibleDecisionMaking"],
    bands: ["8-10", "11-14"],
    brief: "A child who is new, different (language, disability, way of talking) or left out is being excluded or teased. Include an option to include them, an option to speak up calmly, and an option to tell a trusted adult. Never confront adults.",
    seedIds: ["rsit-15"],
  },
  {
    id: "help-seeking",
    name: "Reaching for help",
    source: "WHO life skills (coping with stress); help-seeking through a trusted adult",
    competencies: ["relationshipSkills", "responsibleDecisionMaking"],
    bands: ["8-10", "11-14"],
    brief: "The child or a friend faces something bigger than a bad day (stuck for a long time, very worried, something feels unsafe). The best options involve a trusted grown-up; others keep it secret or make light of it. Never describe symptoms, illness or self-harm.",
    seedIds: ["rsit-14"],
  },
  {
    id: "duty-community",
    name: "Family duty and what I want",
    source: "Ethic of Community in Indian children's moral reasoning (Pandya and colleagues)",
    competencies: ["responsibleDecisionMaking", "relationshipSkills"],
    bands: ["8-10", "11-14"],
    brief: "A family or community duty (a function, helping a grandparent, minding a younger sibling) clashes with something the child wants. This is a dilemma: more than one option can be okay, especially options that talk to the family and find a way to honour both.",
    seedIds: ["rsit-21", "rsit-09"],
    openChoice: true,
  },
  {
    id: "online-safety",
    name: "Staying safe online",
    source: "Online safety (VS-DIGI in the design set): personal information and trusted adults",
    competencies: ["responsibleDecisionMaking"],
    bands: ["8-10", "11-14"],
    brief: "Someone online (a stranger in a game, an unknown number) asks for personal details or to keep a secret. The best option shares nothing and tells a trusted adult. No frightening outcomes: consequences stay mild.",
    seedIds: ["rsit-19"],
  },
  {
    id: "peer-pressure",
    name: "Saying no to the group",
    source: "Resisting peer influence in early adolescence; WHO life skills (decision making)",
    competencies: ["responsibleDecisionMaking", "relationshipSkills"],
    bands: ["11-14"],
    brief: "Friends push the child to do something unkind, unfair or against a rule. Include going along, a firm no, and a no that offers the group a better alternative.",
    seedIds: [],
  },
  {
    id: "fair-sharing",
    name: "Sharing and taking turns fairly",
    source: "Fairness and turn-taking in middle childhood (values: fairness, turn-taking)",
    competencies: ["relationshipSkills", "responsibleDecisionMaking"],
    bands: ["8-10"],
    brief: "Something limited must be shared (one swing, the last slice, a single bat). Include grabbing, giving up sadly, and a fair way that works for both.",
    seedIds: [],
  },
];

export const constructById = (id: string | undefined) => CONSTRUCTS.find((c) => c.id === id);
