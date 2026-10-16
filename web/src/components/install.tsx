'use client';
// "Install the app": puts Party Galaxy on the home screen so it opens full screen, like an app.
// Android and desktop Chrome/Edge offer a real install prompt (beforeinstallprompt). iPhone and iPad
// have no prompt, so a short picture guide shows the two taps in Safari. Installing needs the game's
// https address; on a plain http address browsers do not offer it, and the guide says so.
import { useState, useSyncExternalStore } from 'react';
import { Button, Sheet } from './ui';
import { sfx } from '@/lib/sfx';

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

let deferred: PromptEvent | null = null;
let justInstalled = false;
const subs = new Set<() => void>();
const notify = () => subs.forEach((f) => f());

// Listen as soon as this module loads (it is imported by the app shell), because the browser fires
// the prompt event once, early, and only to pages that are listening.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as PromptEvent; notify(); });
  window.addEventListener('appinstalled', () => { deferred = null; justInstalled = true; notify(); });
}

export type InstallKind = 'installed' | 'prompt' | 'ios' | 'manual';

function standalone() {
  return matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}
const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function kind(): InstallKind {
  if (justInstalled || standalone()) return 'installed';
  if (deferred) return 'prompt';
  if (isIOS()) return 'ios';
  return 'manual';
}

const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
/** Which install path this device has. 'installed' when already running as an app. */
export function useInstallKind(): InstallKind | null {
  return useSyncExternalStore(subscribe, kind, () => null);
}

/** Registers the service worker (production only, and only on https or localhost). */
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !window.isSecureContext) return;
  if (process.env.NODE_ENV !== 'production') return;
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return <li className="install-step"><span className="install-n" aria-hidden="true">{n}</span><span>{children}</span></li>;
}

const SHARE_ICON = <svg className="install-glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 11H5v9h14v-9h-1" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const ADD_ICON = <svg className="install-glyph" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="2.2" /><path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>;
const MENU_ICON = <svg className="install-glyph" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="2" fill="currentColor" /><circle cx="12" cy="12" r="2" fill="currentColor" /><circle cx="12" cy="19" r="2" fill="currentColor" /></svg>;

/** The guide for devices without an install prompt. */
export function InstallGuide({ onClose }: { onClose: () => void }) {
  const k = kind();
  // The guide only opens after a tap, so it always renders in the browser.
  const secure = typeof window === 'undefined' || window.isSecureContext;
  return (
    <Sheet title="Put the game on your home screen" onClose={onClose}>
      <p className="muted install-intro">Then it opens full screen with one tap, just like an app.</p>
      {k === 'ios' ? (
        <ol className="install-steps">
          <Step n={1}>In Safari, tap <b>Share</b> {SHARE_ICON} at the bottom of the screen.</Step>
          <Step n={2}>Scroll down and tap <b>Add to Home Screen</b> {ADD_ICON}</Step>
          <Step n={3}>Tap <b>Add</b>. Party Galaxy is now on your home screen.</Step>
        </ol>
      ) : (
        <ol className="install-steps">
          <Step n={1}>Open the browser menu {MENU_ICON} (top right in Chrome).</Step>
          <Step n={2}>Tap <b>Install app</b> or <b>Add to Home screen</b>.</Step>
          <Step n={3}>Tap <b>Install</b>. Party Galaxy is now on your home screen.</Step>
        </ol>
      )}
      {!secure ? <p className="install-note">Installing only works from the game&apos;s secure (https) address. This page was opened from a test address, so the option may be missing.</p> : null}
      <Button variant="sun" onClick={onClose}>Got it</Button>
    </Sheet>
  );
}

/** One button that does the right thing on every device. Hidden when the game is already installed. */
export function InstallButton({ variant = 'ghost', className = '' }: { variant?: 'ghost' | 'primary' | 'sun'; className?: string }) {
  const k = useInstallKind();
  const [guide, setGuide] = useState(false);
  if (!k || k === 'installed') return null;
  const onClick = async () => {
    if (k === 'prompt' && deferred) {
      const ev = deferred;
      deferred = null;
      await ev.prompt().catch(() => {});
      const choice = await ev.userChoice.catch(() => null);
      if (choice?.outcome === 'accepted') { justInstalled = true; sfx('chime'); }
      notify();
      return;
    }
    setGuide(true);
  };
  return (
    <>
      <Button variant={variant} icon="download" sub="Play full screen, like an app" className={`install-btn ${className}`} onClick={onClick}>Install the app</Button>
      {guide ? <InstallGuide onClose={() => setGuide(false)} /> : null}
    </>
  );
}
