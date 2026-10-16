'use client';
// Sign in. A grown-up signs in; then they hand the phone to their young Captain.
// UI only for now: Google sign-in and email sign-in both continue into the game.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { store, useHydrated } from '@/lib/store';
import { signInWithEmail, signInWithGoogle } from '@/lib/auth';
import { GOOGLE_G } from '@/art/icons';
import { Button, GalaxyBg, Icon, Svg, toast } from '@/components/ui';
import { Logo } from '@/components/logo';
import { useMusic } from '@/components/boot';

export default function LoginPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  useMusic('menu');

  const done = (method: string) => {
    store.update((s) => { s.auth = { signedIn: true, method }; });
    router.replace(store.get().hero ? '/home' : '/hero');
  };

  return (
    <section className="screen login" aria-labelledby="login-h" data-screen="login">
      <GalaxyBg />
      <Logo tag="" />
      <h2 className="sr-only">Grown-up sign in</h2>
      <div className="card stack">
        <p className="grownup-note" id="login-h"><Icon name="grownup" /><span><strong>Grown-ups, please sign in. </strong>Then hand the phone to your young captain!</span></p>
        <button type="button" className="btn btn-white btn-block" disabled={!hydrated}
          onClick={async () => { try { await signInWithGoogle(); done('google'); } catch { toast('Google sign-in is not connected yet'); } }}>
          <Svg html={GOOGLE_G} />Sign in with Google
        </button>
        <div className="divider">or</div>
        <form className="stack" noValidate onSubmit={async (e) => { e.preventDefault(); await signInWithEmail(email, password, mode); done('email'); }}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" inputMode="email" placeholder="grown-up@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" variant="sun" icon="mail" disabled={!hydrated}>{mode === 'signin' ? 'Sign in' : 'Create account'}</Button>
          <button type="button" className="linkish" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
            {mode === 'signin' ? 'New here? Create a grown-up account' : 'Already have an account? Sign in'}
          </button>
        </form>
      </div>
      <p className="legal">No ads. No purchases. Play stays on this device.</p>
    </section>
  );
}
