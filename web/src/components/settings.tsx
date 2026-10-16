'use client';
// Settings: universal comfort options for every child (never named after a condition).
// Read to me, sounds, music, calm mode, movie mode, pause length and the three-part sound mixer.
import { useSave, store, type Settings, type Speed } from '@/lib/store';
import { applyVolumes } from '@/lib/audio';
import { stopVoice } from '@/lib/voice';
import { sfx } from '@/lib/sfx';
import { Icon, Switch, Sheet } from './ui';
import type { IconName } from '@/art/icons';
import type { ReactNode } from 'react';

type BoolKey = 'voice' | 'sound' | 'music' | 'calm' | 'movie';

function set(fn: (s: Settings) => void) {
  store.update((s) => fn(s.settings));
  applyVolumes();
  document.documentElement.classList.toggle('calm', store.get().settings.calm);
}

function Row({ icon, label, sub, k }: { icon: IconName; label: string; sub: string; k: BoolKey }) {
  const v = useSave().settings[k];
  return (
    <div className="setting-row">
      <div className="lbl"><Icon name={icon} /><span>{label}<small>{sub}</small></span></div>
      <Switch label={label} checked={v} onChange={(on) => { set((s) => { s[k] = on; }); if (k === 'voice' && !on) stopVoice(); }} />
    </div>
  );
}

function Slider({ label, k }: { label: string; k: keyof Settings['vol'] }) {
  const v = useSave().settings.vol[k];
  return (
    <label className="slider-row">
      <span>{label}</span>
      <input className="slider" type="range" min={0} max={100} step={10} value={Math.round(v * 100)} aria-label={`${label} volume`}
        onChange={(e) => set((s) => { s.vol[k] = Number(e.target.value) / 100; })}
        onPointerUp={() => { if (k === 'sfx') sfx('pop'); }} />
    </label>
  );
}

export function SettingsContent({ extra }: { extra?: ReactNode }) {
  const speed = useSave().settings.speed;
  const speeds: [Speed, string][] = [['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast']];
  return (
    <div>
      <Row icon="voice" label="Read to me" sub="Every line is read out loud" k="voice" />
      <Row icon="film" label="Play like a movie" sub="The story moves on by itself" k="movie" />
      <Row icon="speaker" label="Sounds" sub="Gentle game sounds" k="sound" />
      <Row icon="music" label="Music" sub="Soft music in the story" k="music" />
      <Row icon="moon" label="Calm mode" sub="Less movement on screen" k="calm" />
      <div className="setting-row stacked">
        <div className="lbl"><Icon name="speed" /><span>Story speed<small>How long the story waits after each line</small></span></div>
        <div className="seg" role="group" aria-label="Story speed">
          {speeds.map(([v, l]) => (
            <button key={v} type="button" aria-pressed={speed === v} onClick={() => { sfx('tap'); set((s) => { s.speed = v; }); }}>{l}</button>
          ))}
        </div>
      </div>
      <div className="setting-row stacked">
        <div className="lbl"><Icon name="sliders" /><span>Sound levels</span></div>
        <Slider label="Voices" k="voice" />
        <Slider label="Music" k="music" />
        <Slider label="Sounds" k="sfx" />
      </div>
      {extra ? <div className="stack" style={{ marginTop: 20 }}>{extra}</div> : null}
    </div>
  );
}

export function SettingsSheet({ onClose, title = 'Settings', extra, top }: { onClose: () => void; title?: string; extra?: ReactNode; top?: ReactNode }) {
  return (
    <Sheet title={title} onClose={onClose}>
      {top ? <div className="stack" style={{ marginBottom: 16 }}>{top}</div> : null}
      <SettingsContent extra={extra} />
    </Sheet>
  );
}
