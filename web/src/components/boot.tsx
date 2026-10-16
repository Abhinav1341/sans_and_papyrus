'use client';
// Runs once in the browser: audio unlock, settings, the voice manifest, and test/demo flags.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { store, useHydrated, useSave } from '@/lib/store';
import { applyVolumes, audioState, installAudioUnlock, onUnlock } from '@/lib/audio';
import { loadManifest, stopVoice } from '@/lib/voice';
import { playMusic, resumeWantedMusic, type Mood } from '@/lib/music';
import { CHAPTER_IDS } from '@/story/ids';
import { api } from '@/lib/api';
import { fetchMe, signInAsGuest } from '@/lib/auth';
import { registerServiceWorker } from './install';

let booted = false;
/** Idempotent start-up. Pages call it too, because child effects run before the layout's. */
export function boot() {
  if (booted || typeof window === 'undefined') return;
  booted = true;
  // Demo helpers for previews and tests:
  // ?demo=1 skips sign-in and makes a Captain; ?demo=all also finishes every chapter;
  // ?still=1 turns off motion and sound, ?movie=0 waits for a tap after every line (for screenshots).
  const q = new URLSearchParams(window.location.search);
  const demo = q.get('demo');
  if ((demo === '1' || demo === 'all') && !store.get().hero) {
    store.update((s) => {
      s.auth = { signedIn: true, method: 'demo' };
      s.hero = { name: 'Aarav', age: 9, voice: 'a', look: { skin: '#c98e62', hair: 'spiky', hairColor: '#1c1530', eyes: '#3f5fa8', outfit: '#ffd36e' } };
    });
  }
  if (demo === 'all') store.update((s) => { CHAPTER_IDS.forEach((id) => { if (!s.done.includes(id)) s.done.push(id); }); });
  if (q.get('still') === '1') store.update((s) => { s.settings.calm = true; s.settings.sound = false; s.settings.music = false; });
  if (q.get('movie') === '0') store.update((s) => { s.settings.movie = false; });
  if (q.get('debug') === '1') (window as unknown as { __pgAudio?: () => string }).__pgAudio = audioState;

  const apply = () => { document.documentElement.classList.toggle('calm', store.get().settings.calm); applyVolumes(); };
  apply();
  store.subscribe(apply);
  installAudioUnlock();
  onUnlock(() => { applyVolumes(); resumeWantedMusic(); });
  loadManifest();
  registerServiceWorker();
  void syncSession();
}

/** Tells the server about the Captain on this device (name and age), so bonus rounds fit them. */
export async function pushHero(): Promise<void> {
  const h = store.get().hero;
  if (h?.age) await api('player', { method: 'PUT', body: { heroName: h.name, age: h.age } });
}

/**
 * Keeps this device and the server in step. The server session (an httpOnly cookie) is the truth:
 * if it has ended, the device goes back to sign-in. Demo links get a guest session automatically.
 */
async function syncSession() {
  try {
    const me = await fetchMe();
    const local = store.get();
    if (!me.signedIn) {
      if (local.auth.method === 'demo') { await signInAsGuest(); await pushHero(); }
      else if (local.auth.signedIn) store.update((s) => { s.auth = { signedIn: false, method: null }; });
      return;
    }
    if (!local.auth.signedIn) store.update((s) => { s.auth = { signedIn: true, method: me.account?.type ?? 'email' }; });
    const serverAge = me.player?.age;
    if (local.hero && !local.hero.age && serverAge) store.update((s) => { if (s.hero) s.hero.age = serverAge; });
    else if (local.hero?.age && (!me.player || me.player.age !== local.hero.age || me.player.heroName !== local.hero.name)) await pushHero();
  } catch {
    // Offline or server unreachable: keep playing; bonus rounds will try again.
  }
}

export function AppBoot() {
  useEffect(() => { boot(); }, []);
  return null;
}

/** Background music for a screen. */
export function useMusic(mood: Mood) {
  useEffect(() => { playMusic(mood); }, [mood]);
}

/**
 * Sends the player to the right place: sign-in first, then the Captain builder.
 * Returns true when the screen may show.
 */
export function useGuard(need: 'auth' | 'hero'): boolean {
  const hydrated = useHydrated();
  const s = useSave();
  const router = useRouter();
  const ok = hydrated && s.auth.signedIn && (need === 'auth' || !!s.hero);
  const signedIn = s.auth.signedIn, hasHero = !!s.hero;
  useEffect(() => {
    if (!hydrated) return;
    boot();
    const st = store.get();
    if (!st.auth.signedIn) router.replace('/login');
    else if (need === 'hero' && !st.hero) router.replace('/hero');
  }, [hydrated, need, router, signedIn, hasHero]);
  useEffect(() => () => stopVoice(), []);
  return ok;
}
