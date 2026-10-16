// Plays a chapter like a film: scene by scene, shot by shot. Each shot runs its animation and its
// spoken line together; captions highlight the word being spoken. In movie mode the story moves
// on by itself; otherwise a tap moves on. A tap during a shot finishes it at once (never loses
// anything). Progress is saved at every shot, so a chapter resumes exactly where it stopped.
import gsap from 'gsap';
import { Engine } from './engine';
import { Director } from './director';
import { isGate, isLine, isReward, isTitle, type CastId, type LineShot, type Panel, type Scene, type Speaker, type TitleShot, type GateShot, type Transition } from './types';
import type { ChapterRef, FlatShot } from '@/story';
import { fill, titleSpeech, gateSpeech, rewardSpeech, endSpeech } from './lines';
import { store, type Hero } from '@/lib/store';
import { say, stopVoice, pauseVoice, preload, voiceOf, wordStarts, type Speech } from '@/lib/voice';
import { setAudioPaused } from '@/lib/audio';
import { playMusic, type Mood } from '@/lib/music';
import { sfx } from '@/lib/sfx';
import { COLLECTIBLES } from '@/story/collectibles';

export interface Caption { speaker: Speaker; text: string; words: string[]; idx: number }
export type Overlay =
  | { kind: 'title'; title: TitleShot['title'] }
  | { kind: 'gate'; gate: GateShot['gate'] }
  | { kind: 'reward'; id: string }
  | { kind: 'end' };

export interface UI {
  setCaption: (c: Caption | null) => void;
  setOverlay: (o: Overlay | null) => void;
  setInsert: (id: string | null) => void;
  setPanels: (p: Panel[] | null) => void;
  setWaiting: (w: boolean) => void;
}

const HOLD = { slow: 1.5, normal: 0.8, fast: 0.35 } as const;

export class Controller {
  readonly eng: Engine;
  private dir: Director;
  private idx = -1;
  private sceneIdx = -1;
  private tl: gsap.core.Timeline | null = null;
  private speech: Speech | null = null;
  private line: { speaker: Speaker; text: string } | null = null;
  private phase: 'idle' | 'running' | 'done' | 'overlay' | 'end' = 'idle';
  private token = 0;
  private destroyed = false;
  private paused = false;
  private skipping = false;
  private autoTimer = 0;
  private raf = 0;
  private startedAt = 0;
  private cover: HTMLDivElement;
  private overlayResolve: (() => void) | null = null;

  constructor(host: HTMLDivElement, private chapter: ChapterRef, private flat: FlatShot[], private hero: Hero, private ui: UI) {
    // The Captain's cape arrives in the prologue; from World 1 on it is always worn.
    const cape = store.get().items.includes('captain-badge') && chapter.world.id !== 'prologue';
    this.eng = new Engine(host, { look: hero.look, cape });
    this.eng.calm = store.get().settings.calm || matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.dir = new Director(this.eng, () => this.skipping, { insert: (id) => this.ui.setInsert(id) });
    this.cover = document.createElement('div');
    this.cover.className = 'trans-cover';
    this.cover.innerHTML = '<div class="iris-hole"></div>';
    host.append(this.cover);
  }

  destroy() {
    this.destroyed = true;
    this.token++;
    this.clearShot();
    window.clearTimeout(this.autoTimer);
    cancelAnimationFrame(this.raf);
    stopVoice();
    if (this.paused) { setAudioPaused(false); pauseVoice(false); }
    gsap.killTweensOf(this.cover);
    this.cover.remove();
    this.eng.destroy();
  }

  get heroName() { return this.hero.name; }
  private text(t: string) { return fill(t, this.hero.name); }
  private voice(sp: Speaker) { return voiceOf(sp, this.hero.voice); }
  private hold(extra = 0) { return (HOLD[store.get().settings.speed] + extra) * 1000; }
  private movie() { return store.get().settings.movie; }

  /* ---------- start / resume ---------- */
  start(at: number) {
    at = Math.max(0, Math.min(at, this.flat.length - 1));
    if (at > 0) {
      // Rebuild the scene as it was at this shot by fast-forwarding silently through earlier shots.
      const fs = this.flat[at];
      this.setupScene(fs.scene, fs.sceneIndex);
      let mood: Mood | undefined = fs.scene.mood;
      for (let k = at - fs.shotIndex; k < at; k++) {
        const sh = this.flat[k].shot;
        if (!isLine(sh)) continue;
        if (sh.mood) mood = sh.mood;
        const tl = this.dir.build(sh, true);
        tl.progress(1, false);
        tl.kill();
      }
      this.eng.settle();
      playMusic(mood ?? 'playful');
    }
    this.preloadFrom(at);
    this.goto(at);
  }

  private setupScene(scene: Scene, index: number) {
    this.dir.setupScene(scene);
    this.eng.host.classList.remove('letterbox');
    this.sceneIdx = index;
    this.ui.setInsert(null);
    this.ui.setPanels(null);
    const ids = scene.cast.map((p) => p.id).filter((id) => id !== 'you');
    if (ids.some((id) => !store.get().seen.includes(id))) store.update((s) => { ids.forEach((id) => { if (!s.seen.includes(id)) s.seen.push(id); }); });
  }

  /** Starts downloading the voices for the next few lines. */
  private preloadFrom(i: number) {
    const lines: { voice: ReturnType<typeof voiceOf>; text: string }[] = [];
    for (let k = i; k < Math.min(this.flat.length, i + 8); k++) {
      const sh = this.flat[k].shot;
      if (isLine(sh)) {
        const t = sh.t ?? sh.n;
        if (t) lines.push({ voice: this.voice(sh.t ? (sh.who ?? 'narrator') : 'narrator'), text: this.text(t) });
      } else if (isTitle(sh)) lines.push({ voice: 'narrator', text: titleSpeech(sh.title) });
      else if (isGate(sh)) lines.push({ voice: 'fizz', text: gateSpeech(sh.gate, this.hero.name) });
      else if (isReward(sh)) lines.push({ voice: 'fizz', text: rewardSpeech(sh.reward) });
    }
    preload(lines);
  }

  /* ---------- playing shots ---------- */
  private clearShot() {
    window.clearTimeout(this.autoTimer);
    cancelAnimationFrame(this.raf);
    if (this.tl) { this.skipping = true; this.tl.progress(1, false); this.tl.kill(); this.skipping = false; this.tl = null; }
    this.speech?.stop();
    this.speech = null;
    this.eng.speaker = null;
  }

  private async goto(i: number) {
    const my = ++this.token;
    this.clearShot();
    if (this.destroyed) return;
    if (i >= this.flat.length) { this.complete(); return; }
    this.idx = i;
    store.update((s) => { s.progress = { chapter: this.chapter.id, shot: i }; });
    this.ui.setWaiting(false);
    if (i % 4 === 0) this.preloadFrom(i + 1);
    const fs = this.flat[i];
    if (fs.sceneIndex !== this.sceneIdx) {
      const first = this.sceneIdx === -1;
      const trans: Transition = first ? 'cut' : fs.scene.trans ?? 'fade';
      await this.coverWith(trans);
      if (my !== this.token) return;
      this.ui.setCaption(null);
      this.setupScene(fs.scene, fs.sceneIndex);
      playMusic(fs.scene.mood ?? 'playful');
      this.reveal(trans);
    }
    const shot = fs.shot;
    if (isTitle(shot)) return this.showOverlay({ kind: 'title', title: shot.title }, 'narrator', titleSpeech(shot.title), my);
    if (isGate(shot)) { sfx('drumroll'); return this.showOverlay({ kind: 'gate', gate: shot.gate }, 'fizz', gateSpeech(shot.gate, this.hero.name), my); }
    if (isReward(shot)) {
      const id = shot.reward;
      const c = COLLECTIBLES[id];
      if (c) store.update((s) => { const list = c.kind === 'power' ? s.powers : s.items; if (!list.includes(id)) list.push(id); });
      sfx('fanfare');
      return this.showOverlay({ kind: 'reward', id }, 'fizz', rewardSpeech(id), my);
    }
    if (isLine(shot)) return this.playLine(shot, my);
  }

  private async playLine(shot: LineShot, my: number) {
    this.phase = 'running';
    this.startedAt = performance.now();
    if (shot.insert !== undefined) this.ui.setInsert(shot.insert);
    else this.ui.setInsert(null);
    this.ui.setPanels(shot.panels ?? null);
    if (shot.mood) playMusic(shot.mood);
    const trans = shot.trans && shot.trans !== 'cut' ? shot.trans : null;
    if (trans) { await this.coverWith(trans); if (my !== this.token) return; }

    const raw = shot.t ?? shot.n;
    const speaker: Speaker = shot.t ? (shot.who ?? 'narrator') : 'narrator';
    const text = raw ? this.text(raw) : '';
    this.line = text ? { speaker, text } : null;
    if (!text) this.ui.setCaption(null);

    let lineDone: () => void = () => {};
    const linePromise = new Promise<void>((r) => { lineDone = r; });
    if (!text) lineDone();

    const tl = this.dir.build(this.cueWords(shot, speaker, text), false);
    this.tl = tl;
    if (text) tl.call(() => {
      if (my !== this.token) return;
      if (this.skipping) { this.showCaptionFull(); lineDone(); return; }
      this.speak(speaker, text).then(() => lineDone());
    }, [], shot.lineAt ?? 0.25);
    const tlPromise = new Promise<void>((r) => tl.eventCallback('onComplete', () => r()));
    if (trans) this.reveal(trans);
    if (this.paused) tl.pause(); else tl.play();
    if (tl.duration() === 0) tl.progress(1, false);

    await Promise.all([tlPromise, linePromise]);
    if (my !== this.token || this.destroyed) return;
    this.finishShot(shot, !!text);
  }

  /** Turns `atWord` cues into times, so an action lands exactly on a spoken word ("...THREE!"). */
  private cueWords(shot: LineShot, speaker: Speaker, text: string): LineShot {
    if (!text || !shot.act?.some((a) => a.atWord !== undefined)) return shot;
    const starts = wordStarts(this.voice(speaker), text);
    const lineAt = shot.lineAt ?? 0.25;
    return { ...shot, act: shot.act.map((a) => (a.atWord === undefined ? a : { ...a, at: lineAt + (starts[Math.min(a.atWord, starts.length - 1)] ?? 0) + 0.04 })) };
  }

  private finishShot(shot: LineShot, hasText: boolean) {
    this.phase = 'done';
    this.eng.speaker = null;
    this.showCaptionFull();
    window.clearTimeout(this.autoTimer);
    if (this.paused) return;
    if (!hasText) { this.autoTimer = window.setTimeout(() => this.next(), 120 + (shot.hold ?? 0) * 1000); return; }
    if (this.movie()) this.autoTimer = window.setTimeout(() => this.next(), this.hold(shot.hold));
    else this.ui.setWaiting(true);
  }

  private speak(speaker: Speaker, text: string): Promise<void> {
    const sp = say(this.voice(speaker), text);
    this.speech = sp;
    const who = speaker !== 'narrator' && this.eng.actors.has(speaker as CastId) ? (speaker as CastId) : null;
    this.ui.setCaption({ speaker, text, words: sp.words, idx: -1 });
    sp.ready.then(() => {
      if (this.speech !== sp) return;
      if (who) this.eng.speaker = { who, level: () => sp.level() };
      let last = -2;
      const loop = () => {
        if (this.speech !== sp) return;
        const i = sp.wordIndex();
        if (i !== last) { last = i; this.ui.setCaption({ speaker, text, words: sp.words, idx: i }); }
        this.raf = requestAnimationFrame(loop);
      };
      loop();
    });
    return sp.done.then(() => { if (this.speech === sp) { cancelAnimationFrame(this.raf); this.eng.speaker = null; } });
  }

  private showCaptionFull() {
    if (!this.line) return;
    cancelAnimationFrame(this.raf);
    const words = this.line.text.split(/\s+/).filter(Boolean);
    this.ui.setCaption({ speaker: this.line.speaker, text: this.line.text, words, idx: -1 });
  }

  next() {
    if (this.destroyed || this.phase === 'overlay' || this.phase === 'end') return;
    sfx('tap');
    this.goto(this.idx + 1);
  }

  /** A tap on the film: finish the shot if it is still playing, otherwise move on. */
  tap() {
    if (this.destroyed || this.paused) return;
    if (this.phase === 'running') {
      if (performance.now() - this.startedAt < 250) return; // ignore accidental double taps
      this.skipping = true;
      this.tl?.progress(1, false);
      this.skipping = false;
      this.speech?.stop();
      return;
    }
    if (this.phase === 'done') this.next();
  }

  hearAgain() {
    // While a line is still playing it is already being heard; it can be replayed once it ends.
    if (!this.line || this.paused || this.phase !== 'done') return;
    window.clearTimeout(this.autoTimer);
    this.ui.setWaiting(false);
    const line = this.line;
    this.speak(line.speaker, line.text).then(() => {
      if (this.line !== line) return;
      this.showCaptionFull();
      if (this.phase === 'done' && !this.paused) {
        if (this.movie()) this.autoTimer = window.setTimeout(() => this.next(), this.hold());
        else this.ui.setWaiting(true);
      }
    });
  }

  setPaused(p: boolean) {
    if (p === this.paused) return;
    this.paused = p;
    this.eng.setPaused(p);
    setAudioPaused(p);
    pauseVoice(p);
    if (p) { this.tl?.pause(); window.clearTimeout(this.autoTimer); }
    else {
      if (this.phase === 'running') this.tl?.play();
      else if (this.phase === 'done' && this.movie()) this.autoTimer = window.setTimeout(() => this.next(), this.hold());
      else if (this.phase === 'done') this.ui.setWaiting(true);
    }
  }

  /** Movie mode switched on while waiting: carry on. */
  movieChanged() {
    if (this.phase === 'done' && !this.paused && this.movie()) { this.ui.setWaiting(false); this.autoTimer = window.setTimeout(() => this.next(), this.hold()); }
    if (this.phase === 'done' && !this.movie()) { window.clearTimeout(this.autoTimer); this.ui.setWaiting(true); }
  }

  setCalm(c: boolean) { this.eng.calm = c || matchMedia('(prefers-reduced-motion: reduce)').matches; }

  /* ---------- overlays: title cards, bonus rounds, rewards ---------- */
  private async showOverlay(o: Overlay, speaker: Speaker, speech: string, my: number) {
    this.phase = 'overlay';
    this.line = null;
    this.ui.setCaption(null);
    this.ui.setInsert(null);
    this.ui.setPanels(null);
    this.ui.setOverlay(o);
    const sp = say(this.voice(speaker), speech);
    this.speech = sp;
    const done = new Promise<void>((r) => { this.overlayResolve = r; });
    if (o.kind === 'title') {
      // Title cards move on by themselves in movie mode, after the name is read.
      sp.done.then(() => {
        if (my !== this.token || this.phase !== 'overlay') return;
        if (this.movie()) this.autoTimer = window.setTimeout(() => this.overlayDone(), 1400);
      });
    }
    await done;
    if (my !== this.token || this.destroyed) return;
    this.speech?.stop();
    this.ui.setOverlay(null);
    this.phase = 'idle';
    this.goto(this.idx + 1);
  }

  /** The button on a title card, bonus round ("Skip for now") or reward card. */
  overlayDone() {
    window.clearTimeout(this.autoTimer);
    const r = this.overlayResolve;
    this.overlayResolve = null;
    r?.();
  }

  private complete() {
    this.phase = 'end';
    this.line = null;
    this.ui.setCaption(null);
    this.ui.setInsert(null);
    this.ui.setPanels(null);
    store.update((s) => {
      if (!s.done.includes(this.chapter.id)) s.done.push(this.chapter.id);
      s.progress = { chapter: null, shot: 0 };
    });
    sfx('chime');
    playMusic('night');
    this.ui.setOverlay({ kind: 'end' });
    this.speech = say('narrator', endSpeech(this.chapter, this.hero.name));
  }

  /* ---------- transitions ---------- */
  private coverWith(kind: Transition): Promise<void> {
    if (kind === 'cut') return Promise.resolve();
    const el = this.cover;
    const k = this.eng.calm && (kind === 'iris' || kind === 'wipe') ? 'fade' : kind;
    el.className = `trans-cover on ${k}`;
    gsap.killTweensOf(el);
    const hole = el.firstElementChild as HTMLElement;
    gsap.killTweensOf(hole);
    return new Promise<void>((done) => {
      if (k === 'iris') {
        gsap.set(el, { opacity: 1, xPercent: 0 });
        gsap.fromTo(hole, { '--r': '75vmax' }, { '--r': '0vmax', duration: 0.6, ease: 'power2.in', onComplete: done });
      } else if (k === 'wipe') {
        gsap.set(el, { opacity: 1 });
        gsap.fromTo(el, { xPercent: -120 }, { xPercent: 0, duration: 0.45, ease: 'power2.inOut', onComplete: done });
      } else {
        gsap.set(el, { xPercent: 0 });
        gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: k === 'white' ? 0.7 : 0.35, ease: 'sine.inOut', onComplete: done });
      }
    });
  }

  private reveal(kind: Transition) {
    if (kind === 'cut') return;
    const el = this.cover;
    const hole = el.firstElementChild as HTMLElement;
    const done = () => { el.className = 'trans-cover'; };
    if (el.classList.contains('iris')) { gsap.fromTo(hole, { '--r': '0vmax' }, { '--r': '75vmax', duration: 0.7, ease: 'power2.out', onComplete: done }); return; }
    if (el.classList.contains('wipe')) { gsap.to(el, { xPercent: 120, duration: 0.5, ease: 'power2.inOut', onComplete: done }); return; }
    gsap.to(el, { opacity: 0, duration: el.classList.contains('white') ? 0.8 : 0.45, ease: 'sine.inOut', onComplete: done });
  }
}
