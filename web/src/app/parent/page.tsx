'use client';
// Parent Corner: behind a press-and-hold gate. Shows a growth report written by Gemini from the
// Captain's bonus-round play (aggregated signals only), and lets the grown-up sign out or erase everything.
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { store, useSave } from '@/lib/store';
import { sfx } from '@/lib/sfx';
import { Button, GalaxyBg, IconButton, Svg, toast } from '@/components/ui';
import { api, type PublicAccount } from '@/lib/api';
import { deleteAccount, fetchMe, saveGuestWithEmail, saveGuestWithGoogle, signOut } from '@/lib/auth';
import { GOOGLE_G } from '@/art/icons';
import { useGuard, useMusic } from '@/components/boot';
import { SkillShape, type ShapeAxis } from '@/components/skill-shape';
import { HERO_NAMES } from '@/data/ui-lines';

const HOLD_MS = 3000;
const C = 2 * Math.PI * 88;

interface HoldState { raf: number; start: number; ring: SVGCircleElement | null; onOpen: () => void }

function holdStop(h: HoldState) {
  cancelAnimationFrame(h.raf);
  h.ring?.setAttribute('stroke-dashoffset', String(C));
}

function holdBegin(h: HoldState) {
  h.start = performance.now();
  cancelAnimationFrame(h.raf);
  const tick = () => {
    const p = Math.min(1, (performance.now() - h.start) / HOLD_MS);
    h.ring?.setAttribute('stroke-dashoffset', String(C * (1 - p)));
    if (p >= 1) { holdStop(h); sfx('chime'); h.onOpen(); return; }
    h.raf = requestAnimationFrame(tick);
  };
  h.raf = requestAnimationFrame(tick);
}

function HoldGate({ onOpen }: { onOpen: () => void }) {
  const hold = useRef<HoldState>({ raf: 0, start: 0, ring: null, onOpen });
  useEffect(() => {
    const h = hold.current;
    h.onOpen = onOpen;
    return () => cancelAnimationFrame(h.raf);
  }, [onOpen]);
  const begin = () => holdBegin(hold.current);
  const stop = () => holdStop(hold.current);
  return (
    <div className="stack hold-gate">
      <p style={{ fontWeight: 800, fontSize: 20 }}>This area is for grown-ups.</p>
      <button type="button" className="hold-btn" aria-label="Grown-ups: press and hold for 3 seconds"
        onPointerDown={(e) => { e.preventDefault(); begin(); }} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); begin(); } }} onKeyUp={stop}
        onContextMenu={(e) => e.preventDefault()}>
        <svg className="ring" viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="10" />
          <circle ref={(el) => { hold.current.ring = el; }} cx="100" cy="100" r="88" fill="none" stroke="#ffd36e" strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C} />
        </svg>
        <span>Press<br />and hold</span>
      </button>
      <p className="muted">Press and hold the circle for 3 seconds.</p>
    </div>
  );
}

interface ParentReport { summary: string; strengths: string[]; growingAreas: string[]; habits: string[]; tryAtHome: string[]; thinkingSkills?: string }
type ReportState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'no-captain' }
  | { status: 'too-early'; itemsPlayed: number; needed: number }
  | { status: 'ready'; report: ParentReport; createdAt: string; source: 'ai' | 'fallback'; stats: { itemsPlayed: number; roundsPlayed: number };
      shape?: { social: ShapeAxis[]; thinking: ShapeAxis[] | null } };

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return <div className="card"><p style={{ fontWeight: 800 }}>{title}</p><ul className="report-list">{items.map((t, i) => <li key={i}>{t}</li>)}</ul></div>;
}

/**
 * The server writes the report about the Captain ("Captain Aarav", "Aarav"): it never sees the
 * child's own name. On this device the report names the child instead, when a grown-up added one.
 */
function personalise(captain: string | undefined, childName: string | undefined): (text: string) => string {
  if (!childName) return (text) => text;
  const names = [...new Set([...HERO_NAMES, ...(captain ? [captain] : [])])].map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`\\b(?:Captain\\s+)?(?:${names.join('|')})\\b`, 'g');
  return (text) => text.replace(re, () => childName);
}

function Report({ captain, childName }: { captain?: string; childName?: string }) {
  const [state, setState] = useState<ReportState>({ status: 'loading' });
  const fetchReport = (refresh: boolean) =>
    api<ReportState>(`report${refresh ? '?refresh=1' : ''}`).then(setState).catch((e: Error) => setState({ status: 'error', message: e.message }));
  const load = (refresh = false) => { setState({ status: 'loading' }); void fetchReport(refresh); };
  useEffect(() => { void fetchReport(false); }, []);
  if (state.status === 'loading') return <div className="card" role="status"><p className="muted">Writing this week’s note…</p></div>;
  if (state.status === 'error') return <div className="card"><p className="muted">{state.message}</p><Button variant="ghost" onClick={() => load()}>Try again</Button></div>;
  if (state.status === 'no-captain') return <div className="card"><p className="muted">Set up the Captain (with their age) to start the report.</p></div>;
  if (state.status === 'too-early')
    return <div className="card"><p className="muted">The report starts after a few bonus-round choices ({state.itemsPlayed} of {state.needed} so far). Bonus rounds appear inside the story.</p></div>;
  const name = personalise(captain, childName);
  const r: ParentReport = {
    summary: name(state.report.summary),
    strengths: state.report.strengths.map(name),
    growingAreas: state.report.growingAreas.map(name),
    habits: state.report.habits.map(name),
    tryAtHome: state.report.tryAtHome.map(name),
    ...(state.report.thinkingSkills ? { thinkingSkills: name(state.report.thinkingSkills) } : {}),
  };
  return (
    <>
      <div className="card">
        <p style={{ fontWeight: 800 }}>This week</p>
        <p>{r.summary}</p>
        <p className="muted" style={{ fontSize: 14 }}>{state.stats.itemsPlayed} choices in {state.stats.roundsPlayed} bonus rounds · updated {new Date(state.createdAt).toLocaleDateString()}</p>
      </div>
      {state.shape ? (
        <div className="card shape-card">
          <p style={{ fontWeight: 800 }}>Their skill shape</p>
          <p className="muted" style={{ fontSize: 14 }}>How each skill has moved since they started. The dashed shape is where they began; tap a point to read it.</p>
          <SkillShape title="Feelings and friendships" axes={state.shape.social} />
          {state.shape.thinking ? <SkillShape title="Puzzles" axes={state.shape.thinking} /> : null}
        </div>
      ) : null}
      <List title="Strengths" items={r.strengths} />
      <List title="Skills that are growing" items={r.growingAreas} />
      <List title="How they approach choices" items={r.habits} />
      {r.thinkingSkills ? <div className="card"><p style={{ fontWeight: 800 }}>Thinking skills</p><p>{r.thinkingSkills}</p></div> : null}
      <List title="Try at home" items={r.tryAtHome} />
      <Button variant="ghost" icon="replay" onClick={() => load(true)}>Refresh the report</Button>
      <p className="muted" style={{ textAlign: 'center', fontSize: 14 }}>Written by AI from patterns in play, not a diagnosis. Talk to a professional about any worries.</p>
    </>
  );
}

/** Guests: keep this Captain by attaching Google or an email to the account they are playing on. */
function GuestSave({ onSaved }: { onSaved: (a: PublicAccount) => void }) {
  const [busy, setBusy] = useState(false);
  const [withEmail, setWithEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const run = async (go: () => Promise<{ account: PublicAccount }>) => {
    if (busy) return;
    setBusy(true);
    try { onSaved((await go()).account); } catch (e) { toast((e as Error).message || 'Could not save. Please try again.'); } finally { setBusy(false); }
  };
  return (
    <div className="card stack guest-save">
      <p style={{ fontWeight: 800 }}>Playing as a guest</p>
      <p className="muted">This Captain&rsquo;s skills and reports are kept only while this browser stays signed in. Save them to an account to keep them, and to sign in on another device.</p>
      <button type="button" className="btn btn-white btn-block" disabled={busy} onClick={() => run(saveGuestWithGoogle)}>
        <Svg html={GOOGLE_G} />Save with Google
      </button>
      {withEmail ? (
        <form className="stack" noValidate onSubmit={(e) => { e.preventDefault(); void run(() => saveGuestWithEmail(email, password)); }}>
          <div className="field"><label htmlFor="save-email">Email</label>
            <input id="save-email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="field"><label htmlFor="save-pw">Password (8 or more characters)</label>
            <input id="save-pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button type="submit" variant="sun" icon="mail" disabled={busy}>Save with email</Button>
        </form>
      ) : (
        <button type="button" className="linkish" onClick={() => setWithEmail(true)}>Use an email and password instead</button>
      )}
    </div>
  );
}

export default function ParentPage() {
  const ok = useGuard('hero');
  const s = useSave();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const [account, setAccount] = useState<PublicAccount | null>(null);
  const [endArmed, setEndArmed] = useState(false);
  useEffect(() => { if (open) fetchMe().then((m) => setAccount(m.account ?? null)).catch(() => {}); }, [open]);
  const guest = account?.type === 'guest';
  useMusic('none');
  if (!ok) return <div className="screen-blank" />;
  return (
    <section className="screen parent" aria-labelledby="par-h" data-screen="parent">
      <GalaxyBg />
      <div className="topbar">
        <IconButton icon="back" label="Back to home" onClick={() => router.push('/home')} />
        <h2 id="par-h">Parent Corner</h2>
        <span className="slot" />
      </div>
      {!open ? <HoldGate onOpen={() => setOpen(true)} /> : (
        <div className="stack">
          <div className="card stack">
            <p style={{ fontWeight: 800 }}>{s.hero?.childName ?? `Captain ${s.hero?.name}`}{s.hero?.age ? `, age ${s.hero.age}` : ''}</p>
            {s.hero?.childName ? <p className="muted" style={{ fontSize: 14 }}>Plays as Captain {s.hero.name}. Your child&rsquo;s name stays on this device.</p> : <>
              <p className="muted" style={{ fontSize: 14 }}>The report uses the Captain&rsquo;s name. You can add your child&rsquo;s own name; it stays on this device.</p>
              <button type="button" className="linkish" style={{ alignSelf: 'flex-start' }} onClick={() => router.push('/hero/edit')}>Add your child&rsquo;s name</button>
            </>}
          </div>
          {guest ? <GuestSave onSaved={(a) => {
            setAccount(a);
            store.update((st) => { st.auth = { signedIn: true, method: a.type }; });
            toast('Progress saved. Sign in with it on any device.');
          }} /> : null}
          <Report captain={s.hero?.name} childName={s.hero?.childName} />
          <Button variant="ghost" onClick={async () => {
            if (guest && !endArmed) { setEndArmed(true); return; }
            await signOut(); store.update((st) => { st.auth = { signedIn: false, method: null }; }); router.replace('/login');
          }}>{guest ? 'End guest session' : 'Sign out'}</Button>
          {guest && endArmed ? <p className="muted" style={{ textAlign: 'center' }} role="status">Ending a guest session deletes this Captain&rsquo;s skills and reports from our server. Save progress above to keep them, or tap &ldquo;End guest session&rdquo; again.</p> : null}
          <Button variant="ghost" onClick={async () => {
            if (!armed) { setArmed(true); return; }
            try { await deleteAccount(); } catch (e) { toast((e as Error).message); return; }
            store.reset(); toast('All data deleted'); router.replace('/login');
          }}>Delete all data (this device and our server)</Button>
          {armed ? <p className="muted" style={{ textAlign: 'center' }} role="status">Tap “Delete all data” once more to confirm. This removes the account and every record of play.</p> : null}
        </div>
      )}
    </section>
  );
}
