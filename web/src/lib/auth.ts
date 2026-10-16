// Sign-in: UI only for now.
// Later: Google Identity Services or Firebase Authentication on Google Cloud.
// The account belongs to a grown-up (parent or guardian); children never type an email.
// Verifiable parental consent (DPDP Act s.9, COPPA) is required before any child data leaves the device.

export async function signInWithGoogle(): Promise<{ ok: boolean; provider: 'google' }> {
  // TODO: replace with Google Identity Services / Firebase Auth popup.
  return { ok: true, provider: 'google' };
}

export async function signInWithEmail(_email: string, _password: string, mode: 'signin' | 'signup' = 'signin'): Promise<{ ok: boolean; provider: 'email'; mode: string }> {
  // TODO: replace with Firebase Auth email/password (sign in or sign up).
  return { ok: true, provider: 'email', mode };
}
