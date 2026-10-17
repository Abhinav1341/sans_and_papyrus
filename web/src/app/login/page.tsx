'use client';
// Sign in. A grown-up signs in; then they hand the phone to their young Captain.
// Real accounts on the game's server: email + password, Google, or a guest account for trying the game.
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { store, useHydrated } from '@/lib/store';
import { signInAsGuest, signInWithEmail, signInWithGoogle } from '@/lib/auth';
import type { PublicPlayer } from '@/lib/api';
import { GOOGLE_G } from '@/art/icons';
import { Button, GalaxyBg, Icon, Svg, toast } from '@/components/ui';
import { Logo } from '@/components/logo';
import { pushHero, useMusic } from '@/components/boot';

export default function LoginPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  useMusic('menu');

  const done = async (method: string, player: PublicPlayer | null) => {
    store.update((s) => {
      s.auth = { signedIn: true, method };
      // A Captain set up on another device brings its age along.
      if (s.hero && !s.hero.age && player?.age) s.hero.age = player.age;
    });
    if (!player) await pushHero().catch(() => {});
    router.replace(store.get().hero ? '/home' : '/hero');
  };
  const run = async (method: string, go: () => Promise<{ player: PublicPlayer | null }>) => {
    if (busy) return;
    setBusy(true);
    try { const r = await go(); await done(method, r.player); }
    catch (e) { toast((e as Error).message || 'Sign-in failed. Please try again.'); }
    finally { setBusy(false); }
  };

  return (
    <section className="screen login" aria-labelledby="login-h" data-screen="login">
      <GalaxyBg />
      <Logo tag="" />
      <h2 className="sr-only">Grown-up sign in</h2>
      <div className="card stack">
        <p className="grownup-note" id="login-h"><Icon name="grownup" /><span><strong>Grown-ups, please sign in. </strong>Then hand the phone to your young captain!</span></p>
        <button type="button" className="btn btn-white btn-block" disabled={!hydrated || busy}
          onClick={() => run('google', signInWithGoogle)}>
          <Svg html={GOOGLE_G} />Sign in with Google
        </button>
        {/* Visible without scrolling on a phone: the quickest way in for anyone just trying the game. */}
        <Button variant="ghost" icon="play" sub="No sign-up needed" disabled={!hydrated || busy} onClick={() => run('guest', signInAsGuest)}>
          Play as a guest
        </Button>
        <div className="divider">or use email</div>
        <form className="stack" noValidate onSubmit={(e) => { e.preventDefault(); void run('email', () => signInWithEmail(email, password, mode)); }}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" inputMode="email" placeholder="grown-up@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" variant="sun" icon="mail" disabled={!hydrated || busy}>{mode === 'signin' ? 'Sign in' : 'Create account'}</Button>
          <button type="button" className="linkish" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
            {mode === 'signin' ? 'New here? Create a grown-up account' : 'Already have an account? Sign in'}
          </button>
        </form>
      </div>
      <p className="legal">No ads. No purchases. No real names: only what helps the game fit your child. <Link href="/privacy">Privacy</Link> · <Link href="/how-it-works">How it works</Link></p>
    </section>
  );
}
