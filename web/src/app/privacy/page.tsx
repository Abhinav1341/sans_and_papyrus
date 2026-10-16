// Privacy policy: public (no sign-in), linked from Google's sign-in screen and the login page.
// Keep it in step with what the server actually stores and sends (see src/server).
import type { Metadata } from 'next';
import Link from 'next/link';
import { GalaxyBg } from '@/components/ui';

export const metadata: Metadata = { title: 'Privacy · Party Galaxy' };

const CONTACT = 'abhineviackermen@gmail.com';

export default function PrivacyPage() {
  return (
    <section className="screen legal-page" aria-labelledby="privacy-h" data-screen="privacy">
      <GalaxyBg />
      <div className="topbar">
        <Link href="/" className="linkish">Back to the game</Link>
      </div>
      <h2 id="privacy-h">Privacy</h2>
      <p className="muted">Last updated 17 October 2026. Party Galaxy is a prototype built for the Google Cloud AI Builder Cup 2026.</p>

      <div className="card stack">
        <h3>The short version</h3>
        <ul className="report-list">
          <li>A grown-up signs in. Children never type an email or a real name.</li>
          <li>We keep only what helps the game fit the child and write the parent report.</li>
          <li>No ads, no purchases, and nothing is sold or shared for marketing.</li>
          <li>Grown-ups can delete everything at any time from the Parent Corner.</li>
        </ul>
      </div>

      <div className="card stack">
        <h3>What we store</h3>
        <ul className="report-list">
          <li><strong>The grown-up&rsquo;s account:</strong> an email address and a scrambled (hashed) password, or for Google sign-in the Google account ID and email address. We ask Google only for the email address, not contacts, photos or anything else. Guests get an account with no personal details.</li>
          <li><strong>The Captain:</strong> the in-game name the child chooses (please don&rsquo;t use a real name) and their age.</li>
          <li><strong>Bonus-round play:</strong> which answer was chosen, how long it took, whether a hint was used, and the skill levels the game works out from this.</li>
          <li><strong>On this device only:</strong> story progress, the Captain&rsquo;s look and settings, kept in the browser&rsquo;s local storage. One cookie keeps the grown-up signed in.</li>
        </ul>
      </div>

      <div className="card stack">
        <h3>How it is used</h3>
        <ul className="report-list">
          <li>To choose the next challenge. Google&rsquo;s Gemini AI sees the child&rsquo;s age and a short summary of their skills and recent play, never the account email.</li>
          <li>To write the Parent Corner report. Gemini sees the Captain&rsquo;s game name and a summary of their play, never raw answers or the account email.</li>
          <li>To read questions aloud with Google Cloud Text-to-Speech, which receives only the question text.</li>
          <li>Reports describe growth, never diagnose. Talk to a professional about any worries.</li>
        </ul>
      </div>

      <div className="card stack">
        <h3>Where it is kept, and for how long</h3>
        <p>Everything is stored and processed on Google Cloud (Cloud Run, Firestore, Vertex AI and Text-to-Speech) under Google Cloud&rsquo;s terms. We use no other services.</p>
        <p>Data is kept until a grown-up deletes it. &ldquo;Delete all data&rdquo; in the Parent Corner removes the account, the Captain and every record of play. Ending a guest session deletes that guest&rsquo;s data.</p>
      </div>

      <div className="card stack">
        <h3>Questions</h3>
        <p>Email <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
      </div>
    </section>
  );
}
