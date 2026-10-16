'use client';
// Story map: the ring of eight worlds and every chapter (finished, next, locked).
import { useRouter } from 'next/navigation';
import { useSave } from '@/lib/store';
import { WORLDS, currentChapter, isUnlocked } from '@/story';
import { worldPlanetInner, worldPlanetSVG } from '@/art/planets';
import { ICON } from '@/art/icons';
import { say } from '@/lib/voice';
import { UI_LINES } from '@/data/ui-lines';
import { GalaxyBg, IconButton, Svg, Icon } from '@/components/ui';
import { useGuard, useMusic } from '@/components/boot';

function ring() {
  const kinds = WORLDS.filter((w) => w.kind !== 'prologue');
  let s = '<svg viewBox="0 0 360 180" aria-hidden="true"><ellipse cx="180" cy="90" rx="160" ry="62" fill="none" stroke="#c9b6ff" stroke-opacity=".4" stroke-width="3" stroke-dasharray="6 8"/><circle cx="180" cy="90" r="20" fill="#7B61FF"/><circle cx="180" cy="90" r="9" fill="#ffd36e" class="pulse"/>';
  kinds.forEach((w, i) => {
    const a = (i / kinds.length) * Math.PI * 2 - Math.PI / 2;
    const x = 180 + 160 * Math.cos(a), y = 90 + 62 * Math.sin(a);
    s += `<g transform="translate(${(x - 22).toFixed(1)} ${(y - 22).toFixed(1)}) scale(.44)">${worldPlanetInner(w.kind, !!w.locked, `ring${i}`)}</g>`;
  });
  return s + '</svg>';
}

export default function MapPage() {
  const ok = useGuard('hero');
  const s = useSave();
  const router = useRouter();
  useMusic('menu');
  if (!ok) return <div className="screen-blank" />;
  const next = currentChapter(s.done);
  return (
    <section className="screen map" aria-labelledby="map-h" data-screen="map">
      <GalaxyBg />
      <div className="topbar">
        <IconButton icon="back" label="Back to home" onClick={() => router.push('/home')} />
        <h2 id="map-h">Story Map</h2>
        <IconButton icon="speaker" label="Read this to me" onClick={() => say('narrator', UI_LINES.mapIntro, { force: true })} />
      </div>
      <Svg html={ring()} className="galaxy-ring" />
      {WORLDS.map((w) => (
        <div key={w.id} className={`world-card${w.locked ? ' locked' : ''}`}>
          <div className="head">
            <Svg html={worldPlanetSVG(w.kind, !!w.locked, `card-${w.id}`)} className="planet" />
            <div><p className="muted">{w.label}</p><h3>{w.title}</h3>{w.locked ? <p className="muted">Coming soon</p> : null}</div>
          </div>
          {!w.locked ? (
            <div className="chapter-list">
              {w.chapters.map((c, i) => {
                const done = s.done.includes(c.id);
                const open = isUnlocked(c.id, s.done);
                const isNext = c.id === next.id && !done;
                return (
                  <button key={c.id} type="button" className={`chapter-btn${done ? ' done' : ''}${isNext ? ' next' : ''}`} disabled={!open}
                    aria-label={`Chapter ${i + 1}: ${c.title}${done ? ', finished' : ''}${!open ? ', locked' : ''}`}
                    onClick={() => router.push(`/story/${c.id}`)}>
                    <span className="num" dangerouslySetInnerHTML={{ __html: done ? ICON.check : !open ? ICON.lock : String(i + 1) }} />
                    <span className="ttl">{c.title}<small>{c.teaser}</small></span>
                    {open ? <Icon name="play" /> : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ))}
    </section>
  );
}
