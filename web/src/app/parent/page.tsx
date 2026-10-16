'use client';
// Parent Corner: behind a press-and-hold gate. The analysis itself is intentionally blank for now.
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { store, useSave } from '@/lib/store';
import { sfx } from '@/lib/sfx';
import { Button, GalaxyBg, IconButton, toast } from '@/components/ui';
import { useGuard, useMusic } from '@/components/boot';

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

function Placeholder({ title }: { title: string }) {
  return <div className="placeholder-card"><div><strong>{title}</strong>Coming soon</div></div>;
}

export default function ParentPage() {
  const ok = useGuard('hero');
  const s = useSave();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
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
          <div className="card"><p style={{ fontWeight: 800 }}>Captain {s.hero?.name}</p><p className="muted">Learning insights will appear here.</p></div>
          <Placeholder title="This week" />
          <Placeholder title="Skills that are growing" />
          <Placeholder title="What helps" />
          <Placeholder title="Talk-about cards" />
          <Placeholder title="Reports from your child’s therapist" />
          <Button variant="ghost" onClick={() => { store.update((st) => { st.auth = { signedIn: false, method: null }; }); router.replace('/login'); }}>Sign out</Button>
          <Button variant="ghost" onClick={() => {
            if (armed) { store.reset(); toast('All data deleted'); router.replace('/login'); } else setArmed(true);
          }}>Delete all data on this device</Button>
          {armed ? <p className="muted" style={{ textAlign: 'center' }} role="status">Tap “Delete all data” once more to confirm.</p> : null}
        </div>
      )}
    </section>
  );
}
