'use client';
// Home: the two big choices (Play, Parent Corner), the Captain card and the story map.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSave, levelInfo } from '@/lib/store';
import { captainLook } from '@/art/looks';
import { faceSVG } from '@/art/portrait';
import { CHAPTERS, currentChapter } from '@/story';
import { say } from '@/lib/voice';
import { UI_LINES } from '@/data/ui-lines';
import { Button, GalaxyBg, IconButton, Icon, Svg } from '@/components/ui';
import { Logo } from '@/components/logo';
import { SettingsSheet } from '@/components/settings';
import { useGuard, useMusic } from '@/components/boot';

export default function HomePage() {
  const ok = useGuard('hero');
  const s = useSave();
  const router = useRouter();
  const [settings, setSettings] = useState(false);
  useMusic('menu');
  if (!ok || !s.hero) return <div className="screen-blank" />;

  const { level } = levelInfo(s);
  const next = currentChapter(s.done);
  const allDone = CHAPTERS.every((c) => s.done.includes(c.id));
  const resume = s.progress.chapter === next.id && s.progress.shot > 0;
  const worldChapters = next.world.chapters;
  const doneInWorld = worldChapters.filter((c) => s.done.includes(c.id)).length;
  const pct = Math.round((doneInWorld / Math.max(1, worldChapters.length)) * 100);

  return (
    <section className="screen home" aria-labelledby="home-h" data-screen="home">
      <GalaxyBg />
      <div className="topbar">
        <IconButton icon="gear" label="Settings" onClick={() => setSettings(true)} />
        <h2 id="home-h" className="sr-only">Home</h2>
        <IconButton icon="speaker" label="Read this to me" onClick={() => say('narrator', UI_LINES.homeIntro, { force: true })} />
      </div>
      <Logo tag="" />
      <button type="button" className="card hero-card" aria-label={`Captain ${s.hero.name}, level ${level}. Open profile.`} onClick={() => router.push('/profile')}>
        <Svg html={faceSVG(captainLook(s.hero.look), 'happy')} className="avatar-mini" />
        <span className="who">
          <strong>Captain {s.hero.name}</strong>
          <span className="muted">Level {level} · {next.world.label}</span>
          <span className="level-bar" aria-hidden="true"><span style={{ width: `${Math.max(6, pct)}%` }} /></span>
        </span>
        <Icon name="next" />
      </button>
      <div className="spacer" />
      <Button variant="sun" xl icon="play" onClick={() => router.push(`/story/${next.id}`)}>{allDone ? 'Play again' : resume ? 'Continue' : 'Play'}</Button>
      <p className="continue-line">{allDone ? 'World 2 is coming soon!' : `${next.world.label}: ${next.world.title} · ${next.title}`}</p>
      <Button variant="ghost" icon="map" onClick={() => router.push('/map')}>Story map</Button>
      <Button variant="ghost" icon="lock" sub="For grown-ups" className="parent-btn" onClick={() => router.push('/parent')}>Parent Corner</Button>
      {settings ? <SettingsSheet onClose={() => setSettings(false)} /> : null}
    </section>
  );
}
