// "How it works": the AI behind the bonus rounds, with measured numbers rather than claims.
// Public (no sign-in). The numbers come from src/data/ai-pipeline.json (generator: npm run bank:stats)
// and src/data/scoring-audit.json (web: npm run test:scoring -- --write); refresh both before deploying.
import type { Metadata } from 'next';
import Link from 'next/link';
import { GalaxyBg } from '@/components/ui';
import pipeline from '@/data/ai-pipeline.json';
import audit from '@/data/scoring-audit.json';
import s from './how.module.css';

export const metadata: Metadata = { title: 'How it works · Party Galaxy' };

const PRINCIPLE: Record<string, string> = {
  honestConsequences: 'believable consequences', feelingsStayReal: 'feelings stay real', showNotPreach: 'show, don’t preach',
  certaintyFits: 'one right answer only when there is one', noShaming: 'no shaming', notATherapist: 'not a therapist',
  realForIndianChildren: 'real for children in India', constructVisible: 'research idea visible', originalPlot: 'not a copy of a seed',
  fitsGame: 'fits the game', safe: 'safe', hintIsNudge: 'hint nudges, never tells', explanationIsKind: 'kind explanation',
};
const STAGE: Record<string, string> = { rules: 'Code rules', duplicate: 'Duplicate check', category: 'Grader disagreed', curator: 'Judge' };
const model = (m: string) => m.replace('gemini-', 'Gemini ').replace(/-preview$/, ' (preview)').replace(/-/g, ' ').replace(/\bflash\b/, 'Flash').replace(/\blite\b/, 'Lite').replace(/\bpro\b/, 'Pro');
const date = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

export default function HowItWorksPage() {
  const g = pipeline.generation;
  const stopped = (k: string) => (g.rejectedByStage as Record<string, number>)[k] ?? 0;
  const j = pipeline.rejudge;
  const play = pipeline.play;
  const steps = [
    { who: 'Writer', m: pipeline.models.writer, what: 'Writes a new situation, built on a named idea from child-development research (for example "accident or on purpose?").' },
    { who: 'Code', what: 'Checks the rules: length, reading level, words not suitable for children, hints that give the answer away.', stop: stopped('rules') },
    { who: 'Code', m: pipeline.models.embedding, what: 'Compares it with every item already in the bank and drops near-copies.', stop: stopped('duplicate') },
    { who: 'Blind grader', m: pipeline.models.grader, what: 'Scores every answer on the five social-emotional skills without being told what the writer was aiming for.', stop: stopped('grader') },
    { who: 'Code', what: 'If the grader’s reading doesn’t match the writer’s aim, the item is out. Two models had to agree independently.', stop: stopped('category') },
    { who: 'Judge', m: pipeline.models.judge, what: 'A different, larger model reads it as a child psychologist would, against eight principles: believable consequences, feelings that stay real, no preaching, no shaming, and more.', stop: stopped('curator') },
    { who: 'People', what: 'A person reads and approves every question before any child can see it.' },
  ];

  return (
    <section className="screen legal-page" aria-labelledby="how-h" data-screen="how">
      <GalaxyBg />
      <div className="topbar">
        <Link href="/" className="linkish">Back to the game</Link>
      </div>
      <h2 id="how-h">How it works</h2>
      <p className={s.lead}>
        Three Gemini models write, grade and judge every question, each checking the others, and people approve it
        before a child sees it. While a child plays, AI only chooses between checked questions. It never writes
        anything a child reads.
      </p>

      <div className="card stack">
        <h3>Making a question: three AIs that check each other</h3>
        <ol className={s.steps}>
          {steps.map((st, i) => (
            <li key={i} className={s.step}>
              <span className={s.num} aria-hidden="true">{i + 1}</span>
              <div>
                <div className={s.who}>{st.who}{st.m ? <span className={s.model}>{model(st.m)}</span> : null}</div>
                <p>{st.what}</p>
                {st.stop ? <p className={s.stop}>Stopped {st.stop}</p> : null}
              </div>
            </li>
          ))}
        </ol>
        <div className={s.funnel} role="img" aria-label={`${g.accepted} of ${g.requested} written questions passed every check`}>
          <div className={s.bar}><span style={{ width: `${(100 * g.accepted) / Math.max(1, g.requested)}%` }} /></div>
          <p><strong>{g.accepted} of {g.requested}</strong> written questions passed every automatic check, for about ${g.costUsd} in AI costs.</p>
        </div>
      </div>

      <div className="card stack">
        <h3>Real things the checks stopped</h3>
        <ul className={s.examples}>
          {g.examples.map((e) => (
            <li key={e.stage}><span className={s.tag}>{STAGE[e.stage] ?? e.stage}</span><strong>{e.title}</strong><span>{e.reason}</span></li>
          ))}
        </ul>
      </div>

      {j ? (
        <div className="card stack">
          <h3>We checked the checker</h3>
          <p>
            Our first judge ran on the same model as the writer, and it let almost everything through. So we moved it to
            a different, larger model, <strong>{model(j.model)}</strong>, made it quote the weakest line before passing
            anything, and ran it again over the whole bank: <strong>{j.all.judged} questions</strong>, including the
            ones we wrote by hand.
          </p>
          <div className={s.stats}>
            <div><strong>{j.all.accepted}</strong><span>passed</span></div>
            <div><strong>{j.all.stopped}</strong><span>stopped and flagged for the reviewers</span></div>
            <div><strong>{j.seeds.stopped}</strong><span>of those were our own hand-written seeds</span></div>
          </div>
          {Object.keys(j.failedBy).length ? (
            <p className="muted">
              Most common reasons: {Object.entries(j.failedBy as Record<string, number>).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, n]) => `${PRINCIPLE[k] ?? k} (${n})`).join(', ')}.
            </p>
          ) : null}
          {j.quotes.length ? (
            <ul className={s.quotes}>
              {j.quotes.map((q, i) => <li key={i}><strong>{q.title}</strong> &middot; {PRINCIPLE[q.check] ?? q.check}<blockquote>{q.note}</blockquote></li>)}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="card stack">
        <h3>While a child plays</h3>
        <ul className="report-list">
          <li><strong>Choosing the next question.</strong> Code builds a shortlist of five checked questions that fit the child&rsquo;s level, avoid repeats and vary the topic. {model(pipeline.models.picker)} picks one and writes a one-line reason a parent can read. If it is slow, code picks instead, so a child never waits. {play.answers ? <>So far Gemini chose {play.aiPicks} of {play.answers} questions; code chose the rest, including the first of every round.</> : null}</li>
          <li><strong>Dilemmas are not scored.</strong> {audit.openChoices || j?.all.openChoice ? <>{j?.all.openChoice ?? audit.openChoices} questions are real dilemmas (family duty against a promise, for example). </> : null}Fizz tells the child &ldquo;Both could work. Which feels right to you?&rdquo; and the choice doesn&rsquo;t move any skill.</li>
          <li><strong>The parent note is checked by code.</strong> {model(pipeline.models.report)} writes it from totals, never raw answers. Before a parent sees it, code blocks labels, diagnoses, scores and comparisons with other children. A note that fails is rewritten once; if it fails again, the parent gets the plain version.</li>
          <li><strong>Read aloud.</strong> Google Cloud Text-to-Speech reads the checked question text, never anything typed in.</li>
        </ul>
      </div>

      <div className="card stack">
        <h3>The scoring is tested, not assumed</h3>
        <p>
          {audit.simulatedChildren} simulated children each played {audit.itemsPerChild} questions through the real game engine:
          some always chose the best answer, some the weakest, some guessed, rushed or asked for hints. {audit.ruleChecks} checks
          make sure the rules never contradict each other: best answers grow skills, rushing never pays, asking for help never
          costs, and dilemmas move nothing. <strong>{audit.ruleConflicts === 0 ? 'No conflicts.' : `${audit.ruleConflicts} conflicts.`}</strong>
        </p>
        <p className="muted">
          The same test checks every question&rsquo;s scores. It found that a best answer could lower a side skill when a weaker
          answer happened to score higher there, and we fixed the engine. {audit.itemsWithConflicts} of {audit.situations} questions
          show that conflict now.
        </p>
      </div>

      <p className="muted">Numbers as of {date(pipeline.asOf)}. <Link href="/privacy" className="linkish">Privacy</Link></p>
    </section>
  );
}
