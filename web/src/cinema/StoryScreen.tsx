'use client';
// The story player screen: the film stage plus a quiet HUD, captions and story cards.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { store, useSaveSelector } from '@/lib/store';
import { chapterById, flatten, nextChapter, isUnlocked, type ChapterRef } from '@/story';
import { COLLECTIBLES, CREW_NAMES } from '@/story/collectibles';
import { COLLECTIBLE_ART } from '@/art/icons';
import { captainLook, CREW, CREW_IDS, type CrewId } from '@/art/looks';
import { faceSVG, fizzFaceSVG, fizzSVG } from '@/art/portrait';
import { stopVoice } from '@/lib/voice';
import { useGuard } from '@/components/boot';
import { Button, IconButton, Icon, Svg } from '@/components/ui';
import { SettingsSheet } from '@/components/settings';
import { BonusRound } from '@/components/bonus-round';
import { Controller, type Caption, type Overlay } from './controller';
import { fill } from './lines';
import { Insert } from './inserts';
import { Panels } from './panels';
import type { CastId, Panel, Speaker } from './types';

const SPEAKER_COLOR: Record<string, string> = { you: 'var(--c-you)', ro: 'var(--c-ro)', meera: 'var(--c-meera)', kiki: 'var(--c-kiki)', bunty: 'var(--c-bunty)', fizz: 'var(--c-fizz)', narrator: 'var(--c-narrator)' };

export function StoryScreen({ chapterId }: { chapterId: string }) {
  const ok = useGuard('hero');
  const router = useRouter();
  const chapter = chapterById(chapterId);
  const allowed = ok && !!chapter && isUnlocked(chapter.id, store.get().done);
  useEffect(() => { if (ok && chapter && !isUnlocked(chapter.id, store.get().done)) router.replace('/map'); }, [ok, chapter, router]);
  if (!allowed || !chapter) return <div className="screen-blank" />;
  return <Player key={chapter.id} chapter={chapter} />;
}

function startIndex(chapterId: string): number {
  const q = new URLSearchParams(window.location.search).get('shot');
  if (q !== null && /^\d+$/.test(q)) return Number(q);
  const p = store.get().progress;
  return p.chapter === chapterId ? p.shot : 0;
}

function Player({ chapter }: { chapter: ChapterRef }) {
  const router = useRouter();
  const flat = useMemo(() => flatten(chapter), [chapter]);
  const stageRef = useRef<HTMLDivElement>(null);
  const ctl = useRef<Controller | null>(null);
  const [caption, setCaption] = useState<Caption | null>(null);
  const [captionOn, setCaptionOn] = useState(false);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [insert, setInsert] = useState<string | null>(null);
  const [panels, setPanels] = useState<Panel[] | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [paused, setPaused] = useState(false);
  const movie = useSaveSelector((s) => s.settings.movie);
  const voiceOn = useSaveSelector((s) => s.settings.voice);
  const calm = useSaveSelector((s) => s.settings.calm);
  const hero = store.get().hero!;

  useEffect(() => {
    const host = stageRef.current;
    if (!host) return;
    // A cleared caption keeps its last line while the band fades out (see .captions.off).
    const showCaption = (cap: Caption | null) => { if (cap) setCaption(cap); setCaptionOn(!!cap); };
    const c = new Controller(host, chapter, flat, store.get().hero!, { setCaption: showCaption, setOverlay, setInsert, setPanels, setWaiting });
    ctl.current = c;
    // Test hook (?debug=1): lets automated checks read the camera and actors.
    if (new URLSearchParams(window.location.search).get('debug') === '1') (window as unknown as { __pg?: Controller }).__pg = c;
    c.start(startIndex(chapter.id));
    return () => { c.destroy(); ctl.current = null; };
  }, [chapter, flat]);

  useEffect(() => { ctl.current?.movieChanged(); }, [movie]);
  useEffect(() => {
    if (!overlay) return;
    const t = window.setTimeout(() => document.querySelector<HTMLElement>('.story [data-autofocus]')?.focus({ preventScroll: true }), 80);
    return () => window.clearTimeout(t);
  }, [overlay]);
  useEffect(() => { ctl.current?.setCalm(calm); }, [calm]);

  const pause = (p: boolean) => { setPaused(p); ctl.current?.setPaused(p); };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('.sheet')) return;
      if (e.key === 'Escape') { e.preventDefault(); pause(true); return; }
      const target = e.target as HTMLElement;
      if (target.closest('button, a, input')) return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); ctl.current?.tap(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const leave = (path: string) => { stopVoice(); router.push(path); };
  const toggleVoice = () => store.update((s) => { s.settings.voice = !s.settings.voice; });
  const toggleMovie = () => store.update((s) => { s.settings.movie = !s.settings.movie; });

  return (
    <section className="story" aria-label={`${chapter.world.title}: ${chapter.title}`} data-screen="story">
      <h2 className="sr-only">{chapter.world.label}: {chapter.title}</h2>
      <div className="stage" ref={stageRef} onClick={() => ctl.current?.tap()} aria-hidden="true" />
      {insert ? <Insert id={insert} skin={hero.look.skin} outfit={hero.look.outfit} /> : null}
      {panels ? <Panels panels={panels} hero={hero.look} /> : null}
      <div className="story-hud" onClick={(e) => e.stopPropagation()}>
        <IconButton icon="pause" label="Pause" onClick={() => pause(true)} />
        <div className="ep-chip">{chapter.world.label} · {chapter.title}</div>
        <div className="right">
          <IconButton icon="replay" label="Hear this line again" onClick={() => ctl.current?.hearAgain()} />
          <IconButton icon={voiceOn ? 'voice' : 'mute'} label={voiceOn ? 'Read to me is on' : 'Read to me is off'} on={voiceOn} onClick={toggleVoice} />
          <IconButton icon="film" label={movie ? 'Movie mode is on' : 'Movie mode is off'} on={movie} onClick={toggleMovie} />
        </div>
      </div>
      <Captions caption={caption} on={captionOn} heroName={hero.name} waiting={waiting} onTap={() => ctl.current?.tap()} />
      {overlay ? <OverlayCard overlay={overlay} chapter={chapter} heroName={hero.name} onDone={() => ctl.current?.overlayDone()} onLeave={leave} /> : null}
      {paused ? (
        <SettingsSheet title="Paused" onClose={() => pause(false)}
          top={<Button variant="sun" icon="play" data-autofocus onClick={() => pause(false)}>Keep playing</Button>}
          extra={<>
            <Button variant="ghost" icon="map" onClick={() => leave('/map')}>Story map</Button>
            <Button variant="ghost" icon="home" onClick={() => leave('/home')}>Home</Button>
          </>} />
      ) : null}
    </section>
  );
}

function speakerName(sp: Speaker, heroName: string) {
  if (sp === 'narrator') return 'Storyteller';
  if (sp === 'you') return `Captain ${heroName}`;
  return CREW_NAMES[sp] || sp;
}

function Captions({ caption, on, heroName, waiting, onTap }: { caption: Caption | null; on: boolean; heroName: string; waiting: boolean; onTap: () => void }) {
  if (!caption) return <div className="captions empty" aria-hidden="true" />;
  const narr = caption.speaker === 'narrator';
  return (
    <div className={`captions${narr ? ' narr' : ''}${on ? '' : ' off'}`} onClick={on ? onTap : undefined} aria-hidden={on ? undefined : true}>
      <div className="who" style={{ color: SPEAKER_COLOR[caption.speaker] }}>
        {narr ? <Icon name="book" /> : null}{speakerName(caption.speaker, heroName)}
      </div>
      <p className="line" aria-live="polite">
        {caption.words.map((w, i) => <span key={i} className={i === caption.idx ? 'w on' : i < caption.idx ? 'w said' : 'w'}>{w} </span>)}
      </p>
      {waiting && on ? <span className="tap-next" aria-hidden="true"><Icon name="down" /></span> : null}
    </div>
  );
}

function crewFaces(heroLook: Parameters<typeof captainLook>[0]) {
  return (
    <div className="crew-faces" aria-hidden="true">
      <Svg html={faceSVG(captainLook(heroLook), 'happy')} />
      {CREW_IDS.map((id) => <Svg key={id} html={faceSVG(CREW[id], 'happy')} />)}
    </div>
  );
}

function OverlayCard({ overlay, chapter, heroName, onDone, onLeave }: { overlay: Overlay; chapter: ChapterRef; heroName: string; onDone: () => void; onLeave: (p: string) => void }) {
  const heroLook = store.get().hero!.look;
  if (overlay.kind === 'title') {
    const t = overlay.title;
    return (
      <div className="title-card" role="button" tabIndex={0} aria-label={`${t.ep}. ${t.name}. ${t.sub}. Tap to start.`}
        onClick={onDone} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDone(); } }} data-autofocus>
        <div className="tc-stripes" aria-hidden="true" />
        <div className="tc-inner">
          <span className="tc-ep">{t.ep}</span>
          <h1>{t.name}</h1>
          <p className="tc-sub">{t.sub}</p>
          {crewFaces(heroLook)}
          <p className="tc-tap">Tap to start</p>
        </div>
      </div>
    );
  }
  if (overlay.kind === 'gate') {
    const g = overlay.gate;
    const asker: CastId = g.by;
    const askerArt = asker === 'fizz' ? fizzFaceSVG('excited', 'gatefz') : asker === 'you' ? faceSVG(captainLook(heroLook), 'determined') : faceSVG(CREW[asker as CrewId], 'determined');
    return (
      <div className="gate" role="dialog" aria-modal="true" aria-label={`Bonus round: ${g.title}`}>
        <div className="gate-spots" aria-hidden="true" />
        <div className="gate-banner">BONUS ROUND!</div>
        <Svg html={fizzSVG('excited', 'gatefz2')} className="gate-fizz" />
        <div className="gate-card">
          <div className="ask"><Svg html={askerArt} className="face" /><p>{fill(g.ask, heroName)}</p></div>
        </div>
        <BonusRound gateId={g.id} title={g.title} heroName={heroName} onDone={onDone} />
      </div>
    );
  }
  if (overlay.kind === 'reward') {
    const c = COLLECTIBLES[overlay.id];
    if (!c) return null;
    return (
      <div className="reward" role="dialog" aria-modal="true" aria-label={`${c.kind === 'power' ? 'New power' : 'New treasure'}: ${c.name}`}>
        <div className="reward-card">
          <div className="reward-rays" aria-hidden="true" />
          <span className="kind">{c.kind === 'power' ? 'New power!' : 'New treasure!'}</span>
          <Svg html={COLLECTIBLE_ART[overlay.id]} className="icon" />
          <h2>{c.name}</h2>
          <p>{c.desc}</p>
          <Button variant="sun" icon="check" onClick={onDone} data-autofocus>{c.kind === 'power' ? 'Awesome!' : 'Keep it!'}</Button>
          <p className="muted small">Saved to your profile</p>
        </div>
      </div>
    );
  }
  const nxt = nextChapter(chapter.id);
  return (
    <div className="chapter-end" role="dialog" aria-label="Chapter complete">
      <span className="stamp">Chapter complete</span>
      <h2>{chapter.title}</h2>
      {crewFaces(heroLook)}
      <p className="recap">{fill(chapter.recap, heroName)}</p>
      <div className="stack end-actions">
        {nxt ? <Button variant="sun" xl icon="play" onClick={() => onLeave(`/story/${nxt.id}`)} data-autofocus>Next chapter</Button>
          : <p className="soon">World 2 is coming soon!</p>}
        <Button variant="ghost" icon="map" onClick={() => onLeave('/map')}>Story map</Button>
        <Button variant="ghost" icon="home" onClick={() => onLeave('/home')}>Rest here</Button>
      </div>
    </div>
  );
}
