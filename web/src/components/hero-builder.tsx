'use client';
// Make your Captain. The Captain's name comes from a picker: the story speaks it in recorded voices,
// and it is the only name the server sees. The child's own name is optional and stays on this
// device; only the Parent Corner shows it. The child also picks one of three voices; the Captain
// speaks in it throughout the story.
import { useEffect, useMemo, useState } from 'react';
import type { VoiceId } from '@/lib/voice';
import { useRouter } from 'next/navigation';
import { store, cleanChildName, CHILD_NAME_MAX, type VoiceChoice } from '@/lib/store';
import { SKINS, HAIR_COLORS, HAIR_STYLES, EYE_COLORS, OUTFITS, captainLook, type Look } from '@/art/looks';
import { figureSVG } from '@/art/figure';
import { faceSVG } from '@/art/portrait';
import { say, VOICE_LABELS } from '@/lib/voice';
import { sfx } from '@/lib/sfx';
import { HERO_NAMES, UI_LINES, captainCall } from '@/data/ui-lines';
import { Button, GalaxyBg, IconButton, Svg, Icon, toast } from './ui';
import { pushHero, useGuard, useMusic } from './boot';

const HAIR_LABEL: Record<string, string> = { short: 'Short', spiky: 'Spiky', bob: 'Bob', ponytail: 'Ponytail', braid: 'Braid', curly: 'Curly', bun: 'Bun', long: 'Long' };
const VOICES: VoiceChoice[] = ['a', 'b', 'c'];
const AGES = [6, 7, 8, 9, 10, 11, 12, 13, 14];
type Draft = { name: string; childName: string; look: Look; voice: VoiceChoice; age: number | null };

function savedDraft(): Draft {
  const h = store.get().hero;
  return h ? { name: h.name, childName: h.childName ?? '', look: { ...h.look }, voice: h.voice, age: h.age ?? null } : { name: HERO_NAMES[0], childName: '', voice: 'a', age: null, look: { skin: SKINS[3], hair: 'spiky', hairColor: HAIR_COLORS[0], eyes: EYE_COLORS[0], outfit: OUTFITS[2] } };
}

export function HeroBuilder({ editing }: { editing: boolean }) {
  const router = useRouter();
  const ok = useGuard('auth');
  useMusic('menu');
  const [edited, setDraft] = useState<Draft | null>(null);
  // Until the child changes something, the draft is the saved Captain (or a starting look).
  const draft = edited ?? (ok ? savedDraft() : null);

  useEffect(() => {
    if (!ok) return;
    const t = window.setTimeout(() => { if (store.get().settings.voice) say('narrator', editing ? UI_LINES.builderEdit : UI_LINES.builderIntro); }, 600);
    return () => window.clearTimeout(t);
  }, [ok, editing]);

  const key = draft ? JSON.stringify(draft.look) : '';
  const preview = useMemo(() => (key ? figureSVG(captainLook(JSON.parse(key) as Look, { cape: store.get().items.includes('captain-badge') }), 'happy', 'wave') : ''), [key]);
  if (!ok || !draft) return <div className="screen-blank" />;

  const setLook = (patch: Partial<Look>) => { sfx('pop'); setDraft({ ...draft, look: { ...draft.look, ...patch } }); };
  const swatch = (c: string, label: string, on: boolean, pick: () => void) => (
    <button key={c} type="button" className="swatch" style={{ background: c }} aria-label={label} aria-pressed={on} onClick={pick} />
  );

  const save = async () => {
    const typed = draft.childName.trim();
    const childName = typed ? cleanChildName(typed) : null;
    if (typed && !childName) { toast('Names can use letters, spaces, dots, hyphens and apostrophes'); document.getElementById('child-name')?.focus(); return; }
    if (!draft.age) { toast('Grown-ups: please pick the Captain’s age'); document.getElementById('age-row')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    store.update((s) => { s.hero = { name: draft.name, look: { ...draft.look }, voice: draft.voice, age: draft.age!, ...(childName ? { childName } : {}) }; });
    sfx('fanfare');
    // The server uses the age to pitch bonus rounds; the game still works offline if this fails.
    pushHero().catch(() => toast('Saved on this device. Bonus rounds will sync when you are online.'));
    router.replace(editing ? '/profile' : '/home');
  };

  return (
    <section className="screen builder" aria-labelledby="hero-h" data-screen="hero">
      <GalaxyBg />
      <div className="topbar">
        {editing ? <IconButton icon="back" label="Back" onClick={() => router.replace('/profile')} /> : <span className="slot" />}
        <h2 id="hero-h">{editing ? 'Change your look' : 'Make your Captain'}</h2>
        <IconButton icon="speaker" label="Read this to me" onClick={() => say('narrator', editing ? UI_LINES.builderEdit : UI_LINES.builderIntro, { force: true })} />
      </div>
      <div className="builder-preview" aria-label={`Preview: Captain ${draft.name}`} role="img">
        <Svg html={preview} className="figure" />
        <span className="plate">Captain {draft.name}</span>
      </div>

      <div>
        <h3><label htmlFor="child-name">Your name</label> <small className="muted">(optional: only grown-ups see it, in the Parent Corner)</small></h3>
        <div className="field">
          <input id="child-name" type="text" autoComplete="off" autoCapitalize="words" autoCorrect="off" spellCheck={false}
            maxLength={CHILD_NAME_MAX} placeholder="Type your name" value={draft.childName}
            onChange={(e) => setDraft({ ...draft, childName: e.target.value })} />
        </div>
      </div>

      <div>
        <h3>Captain name <small className="muted">(the story calls you this)</small></h3>
        <div className="chip-row" role="group" aria-label="Captain name">
          {HERO_NAMES.map((n) => (
            <button key={n} type="button" className="chip" aria-pressed={draft.name === n}
              onClick={() => { sfx('pop'); setDraft({ ...draft, name: n }); say('fizz', captainCall(n), { force: true }); }}>{n}</button>
          ))}
        </div>
      </div>

      <div id="age-row">
        <h3>Age <small className="muted">(grown-ups: this sets how hard bonus rounds start)</small></h3>
        <div className="chip-row" role="group" aria-label="Age">
          {AGES.map((a) => (
            <button key={a} type="button" className="chip" aria-pressed={draft.age === a}
              onClick={() => { sfx('pop'); setDraft({ ...draft, age: a }); }}>{a}</button>
          ))}
        </div>
      </div>

      <div>
        <h3>Voice</h3>
        <div className="voice-row" role="group" aria-label="Voice">
          {VOICES.map((v) => (
            <button key={v} type="button" className="voice-opt" aria-pressed={draft.voice === v}
              onClick={() => { sfx('pop'); setDraft({ ...draft, voice: v }); say(`you-${v}` as VoiceId, UI_LINES.voicePreview, { force: true }); }}>
              <Icon name="voice" />{VOICE_LABELS[`you-${v}` as VoiceId]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3>Skin</h3>
        <div className="swatches" role="group" aria-label="Skin">{SKINS.map((c, i) => swatch(c, `Skin tone ${i + 1}`, draft.look.skin === c, () => setLook({ skin: c })))}</div>
      </div>
      <div>
        <h3>Hair</h3>
        <div className="tiles" role="group" aria-label="Hair">
          {HAIR_STYLES.map((st) => (
            <button key={st} type="button" className="tile" data-style={st} aria-label={`${HAIR_LABEL[st]} hair`} aria-pressed={draft.look.hair === st} onClick={() => setLook({ hair: st })}>
              <Svg html={faceSVG(captainLook({ ...draft.look, hair: st }), 'happy')} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3>Hair colour</h3>
        <div className="swatches" role="group" aria-label="Hair colour">{HAIR_COLORS.map((c, i) => swatch(c, `Hair colour ${i + 1}`, draft.look.hairColor === c, () => setLook({ hairColor: c })))}</div>
      </div>
      <div>
        <h3>Eyes</h3>
        <div className="swatches" role="group" aria-label="Eyes">{EYE_COLORS.map((c, i) => swatch(c, `Eye colour ${i + 1}`, draft.look.eyes === c, () => setLook({ eyes: c })))}</div>
      </div>
      <div>
        <h3>Outfit</h3>
        <div className="swatches" role="group" aria-label="Outfit">{OUTFITS.map((c, i) => swatch(c, `Outfit colour ${i + 1}`, draft.look.outfit === c, () => setLook({ outfit: c })))}</div>
      </div>
      <Button variant="sun" xl icon="check" onClick={() => { void save(); }}>{editing ? 'Save my Captain' : 'I’m ready!'}</Button>
    </section>
  );
}
