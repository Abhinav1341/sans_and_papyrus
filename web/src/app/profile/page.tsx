'use client';
// Profile: the Captain, their level (chapters played), powers, treasures and the crew they have met.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSave, levelInfo } from '@/lib/store';
import { captainLook, CREW, type CrewId } from '@/art/looks';
import { figureSVG } from '@/art/figure';
import { faceSVG, fizzFaceSVG } from '@/art/portrait';
import { COLLECTIBLE_ART } from '@/art/icons';
import { COLLECTIBLES, CREW_BIOS, CREW_NAMES, FUTURE_POWERS } from '@/story/collectibles';
import { CHAPTERS } from '@/story';
import { say } from '@/lib/voice';
import { UI_LINES, collectibleLine } from '@/data/ui-lines';
import { Button, GalaxyBg, IconButton, Sheet, Svg } from '@/components/ui';
import { useGuard, useMusic } from '@/components/boot';

const CREW_ORDER = ['ro', 'meera', 'kiki', 'bunty', 'fizz'] as const;

export default function ProfilePage() {
  const ok = useGuard('hero');
  const s = useSave();
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  useMusic('menu');
  if (!ok || !s.hero) return <div className="screen-blank" />;

  const { level, chaptersDone } = levelInfo(s);
  const powerIds = Object.keys(COLLECTIBLES).filter((k) => COLLECTIBLES[k].kind === 'power');
  const itemIds = Object.keys(COLLECTIBLES).filter((k) => COLLECTIBLES[k].kind === 'item');
  const ownedPowers = powerIds.filter((k) => s.powers.includes(k)).length;
  const ownedItems = itemIds.filter((k) => s.items.includes(k)).length;
  const cape = s.items.includes('captain-badge');

  const tile = (id: string, owned: boolean) => {
    const c = COLLECTIBLES[id];
    return (
      <button key={id} type="button" className={`collect${owned ? '' : ' locked'}`} aria-label={owned ? `${c.name}: ${c.desc}` : 'Not found yet'}
        onClick={() => { if (!owned) { say('narrator', UI_LINES.lockedItem, { force: true }); return; } say('narrator', collectibleLine(id), { force: true }); setOpen(id); }}>
        <Svg html={owned ? COLLECTIBLE_ART[id] : COLLECTIBLE_ART.locked} className="art" />
        <span className="nm">{owned ? c.name : '???'}</span>
      </button>
    );
  };

  const detail = open ? COLLECTIBLES[open] : null;
  return (
    <section className="screen profile" aria-labelledby="prof-h" data-screen="profile">
      <GalaxyBg />
      <div className="topbar">
        <IconButton icon="back" label="Back to home" onClick={() => router.push('/home')} />
        <h2 className="sr-only">Profile</h2>
        <IconButton icon="speaker" label="Read this to me" onClick={() => say('narrator', UI_LINES.profileIntro, { force: true })} />
      </div>
      <div className="profile-hero">
        <Svg html={figureSVG(captainLook(s.hero.look, { cape }), 'grin', 'hips')} className="avatar-big" />
        <h2 id="prof-h">Captain {s.hero.name}</h2>
        <span className="badge-level">Level {level}</span>
        <p className="muted" style={{ marginTop: 8 }}>{chaptersDone} of {CHAPTERS.length} chapters played</p>
      </div>
      <Button variant="ghost" icon="user" onClick={() => router.push('/hero/edit')}>Change my look</Button>
      <div className="section-title">Powers <small>{ownedPowers} found</small></div>
      <div className="grid-3">
        {powerIds.map((k) => tile(k, s.powers.includes(k)))}
        {FUTURE_POWERS.map((f) => (
          <div key={f.world} className="collect locked" role="img" aria-label={`${f.name}, locked`}>
            <Svg html={COLLECTIBLE_ART.locked} className="art" /><span className="nm">{f.name}</span>
          </div>
        ))}
      </div>
      <div className="section-title">Treasures <small>{ownedItems} of {itemIds.length}</small></div>
      <div className="grid-3">{itemIds.map((k) => tile(k, s.items.includes(k)))}</div>
      <div className="section-title">Crew</div>
      <div className="crew-list">
        {CREW_ORDER.map((id) => {
          const met = s.seen.includes(id);
          const art = !met ? '<svg viewBox="0 0 10 10"><rect width="10" height="10" fill="#2a2163"/></svg>' : id === 'fizz' ? fizzFaceSVG('happy', 'crewfz') : faceSVG(CREW[id as CrewId], 'happy');
          return (
            <div key={id} className="crew-row">
              <Svg html={art} className="face" />
              <div><strong>{met ? CREW_NAMES[id] : '???'}</strong><p>{met ? CREW_BIOS[id] : 'Not met yet'}</p></div>
            </div>
          );
        })}
      </div>
      {detail && open ? (
        <Sheet title={detail.name} onClose={() => setOpen(null)}>
          <div className="stack" style={{ textAlign: 'center', alignItems: 'center' }}>
            <Svg html={COLLECTIBLE_ART[open]} className="sheet-art" />
            <p style={{ fontWeight: 800, fontSize: 20 }}>{detail.desc}</p>
            <p className="muted">{detail.kind === 'power' ? 'Captain power' : 'Treasure'}</p>
          </div>
        </Sheet>
      ) : null}
    </section>
  );
}
