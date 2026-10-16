'use client';
// A bonus round inside a story gate: 3–5 situations or puzzles chosen for this Captain.
// Every choice moves the story on; there are no scores, no timers on screen and no "wrong".
// The next item is fetched while the child reads the consequence, so there is no waiting.
// Lines are shown like story captions (name plate, word-by-word highlight) and read aloud by the
// server's Cloud Text-to-Speech voices: the Storyteller reads the story, Fizz gives the hints.
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError, type RoundItem } from '@/lib/api';
import { store, useSaveSelector } from '@/lib/store';
import { captionWords } from '@/lib/hash';
import { prefetch, read, stopReading, type Line, type Reading } from '@/lib/round-voice';
import { sfx } from '@/lib/sfx';
import { fizzFaceSVG } from '@/art/portrait';
import { pushHero } from './boot';
import { Button, Icon, Svg } from './ui';

type Feedback = { consequence: string; explanation: string | null; voice: { consequence: string | null; explanation: string | null; done: string | null } };
type Next = { done: boolean; number?: number; item?: RoundItem };
type Started = { roundId: string; size: number; number: number; item: RoundItem };
type Phase =
  | { at: 'intro' }
  | { at: 'age' }
  | { at: 'loading'; text: string }
  | { at: 'item'; item: RoundItem; number: number; hintOpen: boolean; picked?: string }
  | { at: 'feedback'; item: RoundItem; chosen: string; feedback: Feedback; number: number; last: boolean }
  | { at: 'done' }
  | { at: 'error'; message: string };

const AGES = [6, 7, 8, 9, 10, 11, 12, 13, 14];
const LETTERS = 'ABCDEF';
/** Milliseconds on the page clock (event handlers only, never during render). */
const clock = () => performance.now();

const questionLine = (item: RoundItem): Line => ({ text: `${item.title}. ${item.text}`, url: item.voice.q, speaker: 'narrator' });
const optionLines = (item: RoundItem): Line[] => item.options.map((o) => ({ text: o.text, url: o.voice, speaker: 'narrator' }));

/* ---------- reading aloud, with the word being spoken ---------- */

/** What is being read: `keys` name each line so the screen can light up the matching caption or button. */
type Now = { keys: string[]; line: number; word: number };

function useReader() {
  const [now, setNow] = useState<Now | null>(null);
  const cur = useRef<Reading | null>(null);
  useEffect(() => () => { stopReading(); }, []);
  const start = useCallback((parts: { key: string; line: Line }[], opts?: { force?: boolean }) => {
    const r = read(parts.map((p) => p.line), opts);
    cur.current = r;
    const keys = parts.map((p) => p.key);
    let raf = 0;
    const tick = () => {
      if (cur.current !== r) return;
      const line = r.line(), word = r.wordIndex();
      if (line >= keys.length) { setNow(null); return; }
      setNow((n) => (n && n.line === line && n.word === word && n.keys === keys ? n : { keys, line, word }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    void r.done.then(() => { cancelAnimationFrame(raf); if (cur.current === r) setNow(null); });
  }, []);
  const stop = useCallback(() => { cur.current = null; stopReading(); setNow(null); }, []);
  /** The word being spoken in the line named `key`, or -1. */
  const wordOf = (key: string) => (now && now.keys[now.line] === key ? now.word : -1);
  const reading = (key: string) => !!now && now.keys[now.line] === key;
  return { start, stop, wordOf, reading, busy: !!now };
}

function Words({ text, on, skip = 0 }: { text: string; on: number; skip?: number }) {
  // `skip`: spoken words before this text (the title is read first but shown separately).
  const at = on - skip;
  return <>{captionWords(text).map((w, i) => <span key={i} className={on >= 0 && i === at ? 'w on' : on >= 0 && i < at ? 'w said' : 'w'}>{w} </span>)}</>;
}

/* ---------- the round ---------- */

export function BonusRound({ gateId, title, heroName, onDone }: { gateId: string; title: string; heroName: string; onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>({ at: 'intro' });
  const [size, setSize] = useState<number | null>(null);
  const round = useRef<{ id: string; next: Promise<Next> | null }>({ id: '', next: null });
  const shownAt = useRef(0);
  const hintAt = useRef<number | null>(null);
  const voiceOn = useSaveSelector((s) => s.settings.voice);
  const r = useReader();
  /** The round is requested as soon as the gate opens, so it is usually ready when "Let's go" is tapped. */
  const early = useRef<Promise<Started> | null>(null);

  useEffect(() => {
    if (early.current || !store.get().hero?.age) return;
    const p = api<Started>('round/start', { body: { gateId } });
    p.then((res) => prefetch([res.item.voice.q]), () => {}); // errors are handled when "Let's go" is tapped
    early.current = p;
  }, [gateId]);

  useEffect(() => {
    const t = window.setTimeout(() => document.querySelector<HTMLElement>('.gate [data-autofocus]')?.focus({ preventScroll: true }), 80);
    return () => window.clearTimeout(t);
  }, [phase.at]);

  const show = useCallback((item: RoundItem, number: number) => {
    shownAt.current = clock();
    hintAt.current = null;
    setPhase({ at: 'item', item, number, hintOpen: false });
    r.start([{ key: 'q', line: questionLine(item) }]);
    prefetch([...item.options.map((o) => o.voice), item.voice.hint]);
  }, [r]);

  const fail = (e: unknown) => { r.stop(); setPhase({ at: 'error', message: (e as Error).message || 'Something went wrong.' }); };

  const start = async () => {
    if (!store.get().hero?.age) { setPhase({ at: 'age' }); return; }
    setPhase({ at: 'loading', text: 'Fizz is picking your first challenge…' });
    const pending = early.current;
    early.current = null;
    try {
      const res = await (pending ?? api<Started>('round/start', { body: { gateId } }));
      round.current = { id: res.roundId, next: null };
      setSize(res.size);
      show(res.item, res.number);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) { setPhase({ at: 'age' }); return; }
      if (e instanceof ApiError && e.status === 401) { fail(new Error('Please ask a grown-up to sign in again.')); return; }
      fail(e);
    }
  };

  const setAge = async (age: number) => {
    sfx('pop');
    store.update((s) => { if (s.hero) s.hero.age = age; });
    setPhase({ at: 'loading', text: 'Getting ready…' });
    try { await pushHero(); await start(); } catch (e) { fail(e); }
  };

  const choose = async (optionId: string) => {
    if (phase.at !== 'item' || phase.picked) return;
    r.stop();
    sfx('tap');
    setPhase({ ...phase, picked: optionId }); // the choice lights up at once, while the server saves it
    const { item, number } = phase;
    const responseTimeMs = Math.round(clock() - shownAt.current);
    try {
      const res = await api<{ feedback: Feedback; answered: number; size: number; done: boolean }>('round/answer', {
        body: {
          roundId: round.current.id, itemId: item.id, optionId, responseTimeMs,
          hintOpened: hintAt.current !== null,
          ...(hintAt.current !== null ? { hintOpenedAtMs: Math.round(hintAt.current - shownAt.current) } : {}),
        },
      });
      // Choose the next item (and fetch its voice) while the child hears what happened.
      round.current.next = res.done ? null : api<Next>('round/next', { body: { roundId: round.current.id } });
      round.current.next?.then((n) => prefetch([n.item?.voice.q]), () => {}); // errors handled when "Next" is pressed
      sfx(item.kind === 'puzzle' ? 'chime' : 'pop');
      const fb = res.feedback;
      setPhase({ at: 'feedback', item, chosen: optionId, feedback: fb, number, last: res.done });
      r.start([
        { key: 'c', line: { text: fb.consequence, url: fb.voice.consequence, speaker: 'narrator' } },
        ...(fb.explanation ? [{ key: 'x', line: { text: fb.explanation, url: fb.voice.explanation, speaker: 'narrator' as const } }] : []),
      ]);
      prefetch([fb.voice.done]);
    } catch (e) { fail(e); }
  };

  const next = async () => {
    r.stop();
    if (phase.at === 'feedback' && phase.last) {
      sfx('fanfare');
      setPhase({ at: 'done' });
      r.start([{ key: 'done', line: { text: 'Brilliant work, Captain! The crew says thank you.', url: phase.feedback.voice.done, speaker: 'narrator' } }]);
      return;
    }
    setPhase({ at: 'loading', text: 'Here comes the next one…' });
    try {
      const res = await (round.current.next ?? api<Next>('round/next', { body: { roundId: round.current.id } }));
      round.current.next = null;
      if (res.done || !res.item) { setPhase({ at: 'done' }); return; }
      show(res.item, res.number ?? 1);
    } catch (e) { fail(e); }
  };

  const openHint = (item: RoundItem) => {
    if (phase.at !== 'item' || !item.hint) return;
    hintAt.current = clock();
    sfx('pop');
    setPhase({ ...phase, hintOpen: true });
    r.start([{ key: 'hint', line: { text: item.hint, url: item.voice.hint, speaker: 'fizz' } }]);
  };

  const top = (itemTitle: string, n: number, replay?: () => void) => (
    <div className="round-top">
      <span className="round-title">{itemTitle}</span>
      {size ? (
        <div className="round-dots" role="img" aria-label={`Challenge ${n} of ${size}`}>
          {Array.from({ length: size }, (_, i) => <span key={i} className={i < n - 1 ? 'done' : i === n - 1 ? 'on' : ''} />)}
        </div>
      ) : null}
      {replay ? (
        <button type="button" className={`icon-btn round-replay${r.busy ? ' on' : ''}`} aria-label="Read this to me" title="Read this to me" onClick={replay}>
          <Icon name="speaker" />
        </button>
      ) : null}
    </div>
  );

  switch (phase.at) {
    case 'intro':
      return (
        <>
          <div className="gate-task">
            <h3>{title}</h3>
            <p>Captain {heroName}, the crew needs you!</p>
            <p className="muted">A few quick choices. There are no wrong turns: every choice moves the story on.</p>
          </div>
          <div className="gate-actions">
            <Button variant="sun" xl icon="play" onClick={() => { void start(); }} data-autofocus>Let’s go!</Button>
          </div>
        </>
      );
    case 'age':
      return (
        <div className="gate-task round-age">
          <h3>Grown-ups: how old is the Captain?</h3>
          <p className="muted">This sets how the challenges start. You can change it in the Captain builder.</p>
          <div className="chip-row" role="group" aria-label="Age">
            {AGES.map((a) => <button key={a} type="button" className="chip" onClick={() => { void setAge(a); }}>{a}</button>)}
          </div>
        </div>
      );
    case 'loading':
      // A skeleton of the round, so the screen already has its shape and Fizz says what is happening.
      return (
        <div className="round-item round-wait" role="status">
          <div className="round-top"><span className="round-title sk" aria-hidden="true">&nbsp;</span></div>
          <div className="round-caption">
            <div className="who" style={{ color: 'var(--c-fizz)' }}><Svg html={fizzFaceSVG('excited', 'waitfz')} className="face" />Fizz</div>
            <p className="line">{phase.text}</p>
            <div className="sk sk-line" aria-hidden="true" />
            <div className="sk sk-line short" aria-hidden="true" />
          </div>
          <div className="round-options" aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className="round-option sk" />)}</div>
        </div>
      );
    case 'item': {
      const { item, number, hintOpen, picked } = phase;
      const titleWords = captionWords(`${item.title}.`).length;
      const readAll = () => r.start([
        { key: 'q', line: questionLine(item) },
        ...optionLines(item).map((line, i) => ({ key: `o${i}`, line })),
      ], { force: true });
      return (
        <div className="round-item">
          {top(item.title, number, readAll)}
          <div className="round-caption" aria-live="polite">
            <div className="who" style={{ color: 'var(--c-narrator)' }}><Icon name="book" />Storyteller</div>
            <p className="line"><Words text={item.text} on={r.wordOf('q')} skip={titleWords} /></p>
          </div>
          <div className="round-options" role="group" aria-label="Your choice">
            {item.options.map((o, i) => (
              <button key={o.id} type="button" disabled={!!picked} aria-pressed={picked === o.id}
                className={`round-option${r.reading(`o${i}`) ? ' reading' : ''}${picked === o.id ? ' picked' : picked ? ' dim' : ''}`}
                onClick={() => { void choose(o.id); }} {...(i === 0 ? { 'data-autofocus': true } : {})}>
                <span className="num" aria-hidden="true">{LETTERS[i]}</span>
                <span className="ttl">{o.text}</span>
              </button>
            ))}
          </div>
          {item.hint ? (
            hintOpen ? (
              <div className="round-caption round-hint" role="note">
                <div className="who" style={{ color: 'var(--c-fizz)' }}><Svg html={fizzFaceSVG('happy', 'hintfz')} className="face" />Fizz</div>
                <p className="line"><Words text={item.hint} on={r.wordOf('hint')} /></p>
              </div>
            ) : (
              <button type="button" className="round-hint-btn" onClick={() => openHint(item)}>
                <Svg html={fizzFaceSVG('excited', 'hintbtn')} className="face" />
                <span>Need a hint? Ask Fizz</span>
              </button>
            )
          ) : null}
          {!voiceOn ? <p className="round-voice-off muted">Tap <Icon name="speaker" /> to hear it read aloud.</p> : null}
        </div>
      );
    }
    case 'feedback': {
      const { item, chosen, feedback, number, last } = phase;
      const replay = () => r.start([
        { key: 'c', line: { text: feedback.consequence, url: feedback.voice.consequence, speaker: 'narrator' } },
        ...(feedback.explanation ? [{ key: 'x', line: { text: feedback.explanation, url: feedback.voice.explanation, speaker: 'narrator' as const } }] : []),
      ], { force: true });
      return (
        <div className="round-item">
          {top(item.title, number, replay)}
          <div className="round-chosen"><Icon name="check" /><span>{item.options.find((o) => o.id === chosen)?.text}</span></div>
          <div className="round-caption">
            <div className="who" style={{ color: 'var(--c-narrator)' }}><Icon name="book" />Storyteller</div>
            <p className="line"><Words text={feedback.consequence} on={r.wordOf('c')} /></p>
            {feedback.explanation ? <p className="line round-explain"><Words text={feedback.explanation} on={r.wordOf('x')} /></p> : null}
          </div>
          <Button variant="sun" xl icon={last ? 'check' : 'next'} onClick={() => { void next(); }} data-autofocus>{last ? 'Finish' : 'Next'}</Button>
        </div>
      );
    }
    case 'done':
      return (
        <>
          <div className="gate-task round-done">
            <div className="round-stars" aria-hidden="true">{Array.from({ length: size ?? 3 }, (_, i) => <Icon key={i} name="star" />)}</div>
            <h3>Brilliant work, Captain {heroName}!</h3>
            <p>The crew says thank you.</p>
          </div>
          <div className="gate-actions"><Button variant="sun" xl icon="play" onClick={() => { r.stop(); onDone(); }} data-autofocus>Back to the story</Button></div>
        </>
      );
    case 'error':
      return (
        <>
          <div className="gate-task"><h3>Oh no, a space hiccup!</h3><p className="muted">{phase.message}</p></div>
          <div className="gate-actions stack">
            <Button variant="sun" icon="replay" onClick={() => { void start(); }} data-autofocus>Try again</Button>
            {/* Only a way out when the server can't be reached, so a network problem never traps a child here. */}
            <Button variant="ghost" icon="play" onClick={() => { r.stop(); onDone(); }}>Continue the story</Button>
          </div>
        </>
      );
  }
}
