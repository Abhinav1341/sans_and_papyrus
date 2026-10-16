'use client';
// Sign-in for grown-ups. Accounts live on the game's server (Firestore); the browser only holds an
// httpOnly session cookie. Children never type an email: a grown-up signs in, or plays as a guest.
// Verifiable parental consent (DPDP Act s.9, COPPA) is still required before a public launch.
import { api, type Me, type PublicAccount, type PublicPlayer } from './api';

type SignInResult = { account: PublicAccount; player: PublicPlayer | null };

export function signInWithEmail(email: string, password: string, mode: 'signin' | 'signup' = 'signin'): Promise<SignInResult> {
  return api<SignInResult>(mode === 'signup' ? 'auth/signup' : 'auth/signin', { body: { email, password } });
}

export function signInAsGuest(): Promise<SignInResult> {
  return api<SignInResult>('auth/guest', { body: {} });
}

export function fetchMe(): Promise<Me> {
  return api<Me>('auth/me');
}

export async function signOut(): Promise<void> {
  await api('auth/signout', { body: {} }).catch(() => {});
}

export async function deleteAccount(): Promise<void> {
  await api('account', { method: 'DELETE' });
}

/* ---------- Google Identity Services ---------- */

interface TokenResponse { access_token?: string; error?: string }
interface GoogleOAuth2 {
  initTokenClient(cfg: { client_id: string; scope: string; callback: (r: TokenResponse) => void; error_callback?: (e: { type: string }) => void }): { requestAccessToken(): void };
}
declare global {
  interface Window { google?: { accounts?: { oauth2?: GoogleOAuth2 } } }
}

let gisLoading: Promise<void> | null = null;
function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return (gisLoading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { gisLoading = null; reject(new Error('Could not reach Google. Check the internet and try again.')); };
    document.head.appendChild(s);
  }));
}

/** Opens Google's sign-in popup, then lets the server check the token and sign the grown-up in. */
export async function signInWithGoogle(): Promise<SignInResult> {
  const { googleClientId } = await api<{ googleClientId: string | null }>('auth/config');
  if (!googleClientId) throw new Error('Google sign-in is not connected yet. Use email, or play as a guest.');
  await loadGis();
  const accessToken = await new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts!.oauth2!.initTokenClient({
      client_id: googleClientId,
      scope: 'openid email',
      callback: (r) => (r.access_token ? resolve(r.access_token) : reject(new Error('Google sign-in was cancelled.'))),
      error_callback: () => reject(new Error('Google sign-in was cancelled.')),
    });
    client.requestAccessToken();
  });
  return api<SignInResult>('auth/google', { body: { accessToken } });
}
