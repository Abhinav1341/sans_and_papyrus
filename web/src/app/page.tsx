'use client';
// Splash: the logo for a moment, then home (the guard there sends new players to sign in).
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GalaxyBg } from '@/components/ui';
import { Logo } from '@/components/logo';

export default function Splash() {
  const router = useRouter();
  useEffect(() => {
    router.prefetch('/home');
    const t = window.setTimeout(() => router.replace('/home'), 1300);
    return () => window.clearTimeout(t);
  }, [router]);
  return (
    <section className="screen splash" aria-label="Loading Party Galaxy" data-screen="splash">
      <GalaxyBg />
      <Logo />
      <div className="loader" role="progressbar" aria-label="Loading" />
    </section>
  );
}
