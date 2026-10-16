import type { Metadata, Viewport } from 'next';
import { Baloo_2, Nunito } from 'next/font/google';
import { AppBoot } from '@/components/boot';
import { Toaster } from '@/components/ui';
import './globals.css';
import './cinema.css';

const baloo = Baloo_2({ subsets: ['latin'], weight: ['500', '700', '800'], variable: '--font-baloo', display: 'swap' });
const nunito = Nunito({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-nunito', display: 'swap' });

export const metadata: Metadata = {
  title: 'Party Galaxy',
  description: 'Party Galaxy: an anime adventure where you lead a crew through a galaxy of silly game worlds.',
  applicationName: 'Party Galaxy',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#120E2B',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${baloo.variable} ${nunito.variable}`}>
      <body>
        {/* Space backdrop outside the phone frame (desktop only) */}
        <div className="backdrop" aria-hidden="true"><div className="backdrop-stars" /></div>
        {/* The phone: every screen lives inside this frame, portrait on every device */}
        <main className="device" id="device" aria-label="Party Galaxy">
          {children}
          <Toaster />
        </main>
        {/* Shown on phones held sideways */}
        <div className="rotate-hint" role="alert">
          <div className="rotate-phone" aria-hidden="true" />
          <p>Turn your phone upright to play!</p>
        </div>
        <AppBoot />
      </body>
    </html>
  );
}
