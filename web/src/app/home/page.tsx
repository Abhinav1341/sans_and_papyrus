'use client';
// Home: an "episode poster" for the next chapter (the world it happens in, its title and teaser,
// and Play), the Captain with their level and chapter dots, the crew waiting, and the quieter
// ways out (story map, Captain page, install, Parent Corner). No streaks, timers or pressure.
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSave, levelInfo } from '@/lib/store';
import { captainLook, CREW_IDS } from '@/art/looks';
import { faceSVG, crewLook, fizzSVG } from '@/art/portrait';
import { CHAPTERS, currentChapter } from '@/story';
import { say } from '@/lib/voice';
import { UI_LINES } from '@/data/ui-lines';
import { Button, GalaxyBg, IconButton, Icon, Svg } from '@/components/ui';
import { SettingsSheet } from '@/components/settings';
import { InstallButton } from '@/components/install';
import { episodePosterSVG } from '@/components/episode-art';
import { useGuard, useMusic } from '@/components/boot';
import { fill } from '@/cinema/lines';

export default function HomePage() {
  const ok = useGuard('hero');
  const s = useSave();
  const router = useRouter();
  const [settings, setSettings] = useState(false);
  useMusic('menu');
  const next = currentChapter(s.done);
  const poster = useMemo(() => episodePosterSVG(next.world, `ep-${next.id}`), [next]);
  if (!ok || !s.hero) return <div className="screen-blank" />;

  const { level } = levelInfo(s);
  const allDone = CHAPTERS.every((c) => s.done.includes(c.id));
  const resume = s.progress.chapter === next.id && s.progress.shot > 0;
  const chapters = next.world.chapters;
  const doneHere = chapters.filter((c) => s.done.includes(c.id)).length;
  const number = Math.min(chapters.length, chapters.findIndex((c) => c.id === next.id) + 1);
  const name = s.hero.name;
  const play = () => router.push(`/story/${next.id}`);

  return (
    <section className="screen home2" aria-labelledby="home-h" data-screen="home">
      <GalaxyBg />
      <div className="topbar">
        <IconButton icon="gear" label="Settings" onClick={() => setSettings(true)} />
        <h2 id="home-h" className="home-mark">Party Galaxy</h2>
        <IconButton icon="speaker" label="Read this to me" onClick={() => say('narrator', UI_LINES.homeIntro, { force: true })} />
      </div>

      <button type="button" className="captain-strip" aria-label={`Captain ${name}, level ${level}. Open your Captain page.`} onClick={() => router.push('/profile')}>
        <span className="captain-face"><Svg html={faceSVG(captainLook(s.hero.look, { cape: s.items.includes('captain-badge') }), 'happy')} /></span>
        <span className="captain-who">
          <strong>Captain {name}</strong>
          <span className="captain-level"><Icon name="star" /> Level {level}</span>
        </span>
        <Icon name="next" />
      </button>

      <article className="episode" aria-labelledby="ep-title">
        <div className="episode-art"><Svg html={poster} /></div>
        <span className="episode-fizz" aria-hidden="true"><Svg html={fizzSVG('excited', 'homefz')} /></span>
        <div className="episode-crew" aria-label="Your crew is ready">
          {CREW_IDS.map((id) => <span key={id} className="crew-face"><Svg html={faceSVG(crewLook(id), 'happy')} /></span>)}
          <span className="crew-face you"><Svg html={faceSVG(captainLook(s.hero.look), 'grin')} /></span>
        </div>
        <div className="episode-body">
          <p className="episode-where">{next.world.label}: {next.world.title}</p>
          <h3 id="ep-title" className="episode-title">{allDone ? 'You finished the Candy Nebula!' : next.title}</h3>
          <p className="episode-teaser">{allDone ? 'World 2 is coming soon. Play any chapter again from the story map.' : fill(next.teaser, name)}</p>
          <div className="episode-dots" role="img" aria-label={`Chapter ${number} of ${chapters.length} in ${next.world.title}`}>
            {chapters.map((c, i) => <span key={c.id} className={s.done.includes(c.id) ? 'done' : i === number - 1 && !allDone ? 'now' : ''} />)}
            <small>{allDone ? `${doneHere} of ${chapters.length}` : `Chapter ${number} of ${chapters.length}`}</small>
          </div>
          <Button variant="sun" xl icon="play" onClick={play}>{allDone ? 'Play again' : resume ? 'Keep watching' : 'Play'}</Button>
        </div>
      </article>

      <div className="home-tiles">
        <button type="button" className="home-tile" onClick={() => router.push('/map')}>
          <Icon name="map" /><span>Story map</span>
        </button>
        <button type="button" className="home-tile" onClick={() => router.push('/profile')}>
          <Icon name="user" /><span>My Captain</span>
        </button>
      </div>
      <InstallButton />
      <button type="button" className="parent-link" onClick={() => router.push('/parent')}>
        <Icon name="lock" /><span>Parent Corner</span><small>For grown-ups</small>
      </button>
      {settings ? <SettingsSheet onClose={() => setSettings(false)} /> : null}
    </section>
  );
}
