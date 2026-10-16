// The stage: one SVG holding the set (parallax layers), the actors and screen effects, filmed by a
// camera. GSAP drives the camera, actors and set elements; this file renders them every frame.
// Kid rules: no camera shake, no flashes (glows fade slowly), calm mode removes busy effects.
import gsap from 'gsap';
import { getSet, type SetDef } from './sets';
import { Actor, FizzActor, KidActor, NS, lyingSide } from './actor';
import type { Backdrop, CastId, Frame, Placement } from './types';
import { CREW, captainLook, type CrewId, type Look } from '@/art/looks';
import type { PoseName } from '@/art/poses';
import { POWER_ICONS, auraMarkup, type PowerIcon } from './powers';

export interface CamState { x: number; y: number; zoom: number }
export interface ElState { node: SVGGElement; ax: number; ay: number; x: number; y: number; rot: number; scale: number; opacity: number; last: string }
/** `lying`: 0 standing; -1 or 1 lying down (the body then stretches out to one side of the feet, see `bodyX`). */
export interface ActorSnap { x: number; y: number; lift: number; s: number; height: number; full: number; face: 1 | -1; visible: boolean; hw: number; widths: { narrow: number; wide: number; lie: number }; lying: number }

const f1 = (n: number) => Math.round(n * 10) / 10;
/** The middle of a body, side to side. Lying down, it is not over the feet: the body lies out to one side. */
export const bodyX = (a: ActorSnap) => a.x + a.lying * a.face * 0.49 * a.full * a.s;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
/** Subjects sit a little above the middle so subtitles never cover faces. */
const CAPTION_SHIFT = 70;

export class Engine {
  readonly host: HTMLDivElement;
  readonly svg: SVGSVGElement;
  readonly fx: HTMLDivElement;
  private defs: SVGDefsElement;
  private skyRect: SVGRectElement;
  private backG: SVGGElement;
  private backdropG: SVGGElement;
  private worldG: SVGGElement;
  private shadowsG: SVGGElement;
  private actorsG: SVGGElement;
  private frontG: SVGGElement;
  private screenG: SVGGElement;
  private tintRect: SVGRectElement;
  private speedG: SVGGElement;
  private motionG: SVGGElement;
  private fallG: SVGGElement;
  private vignette: SVGRectElement;
  private glowRect: SVGRectElement;
  private whiteRect: SVGRectElement;
  VW = 462;
  set: SetDef | null = null;
  private layers: { g: SVGGElement; p: number; last: string }[] = [];
  private worldLast = '';
  readonly els = new Map<string, ElState>();
  readonly actors = new Map<CastId, Actor>();
  cam: CamState = { x: 500, y: 500, zoom: 1 };
  track: { who: CastId; lead: number } | null = null;
  clock = 0;
  paused = false;
  calm = false;
  speaker: { who: CastId; level: () => number } | null = null;
  private hero: { look: Look; cape: boolean };
  private backdropStyle: Backdrop | null = null;
  private motionDir = 1;
  private ro: ResizeObserver;
  private readonly tick: (time: number, deltaMs: number) => void;
  private destroyed = false;

  constructor(host: HTMLDivElement, hero: { look: Look; cape: boolean }) {
    this.host = host;
    this.hero = hero;
    const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string> = {}) => {
      const n = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
      return n;
    };
    this.svg = el('svg', { class: 'stage-svg', 'aria-hidden': 'true', focusable: 'false', preserveAspectRatio: 'xMidYMid slice' });
    this.defs = el('defs');
    this.skyRect = el('rect', { x: '0', y: '0', width: '2000', height: '1000', fill: '#120e2b' });
    this.backG = el('g', { class: 'layers-back' });
    this.backdropG = el('g', { class: 'backdrop', opacity: '0' });
    this.worldG = el('g', { class: 'world' });
    this.shadowsG = el('g', { class: 'shadows' });
    this.actorsG = el('g', { class: 'actors' });
    this.worldG.append(this.shadowsG, this.actorsG);
    this.frontG = el('g', { class: 'layers-front' });
    this.screenG = el('g', { class: 'screen-fx' });
    this.tintRect = el('rect', { x: '0', y: '0', width: '2000', height: '1000', fill: '#000', opacity: '0' });
    this.vignette = el('rect', { x: '0', y: '0', width: '2000', height: '1000', fill: 'url(#cine-vignette)', opacity: '0' });
    this.speedG = el('g', { opacity: '0' });
    this.motionG = el('g', { opacity: '0' });
    this.fallG = el('g', { opacity: '0' });
    this.glowRect = el('rect', { x: '0', y: '0', width: '2000', height: '1000', fill: 'url(#cine-glow)', opacity: '0' });
    this.whiteRect = el('rect', { x: '0', y: '0', width: '2000', height: '1000', fill: '#fffaf0', opacity: '0' });
    this.screenG.append(this.tintRect, this.vignette, this.motionG, this.fallG, this.speedG, this.glowRect, this.whiteRect);
    this.svg.append(this.defs, this.skyRect, this.backG, this.backdropG, this.worldG, this.frontG, this.screenG);
    this.fx = document.createElement('div');
    this.fx.className = 'stage-fx';
    host.append(this.svg, this.fx);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
    this.tick = (_time, deltaMs) => this.onTick(Math.min(0.05, deltaMs / 1000));
    gsap.ticker.add(this.tick);
  }

  destroy() {
    this.destroyed = true;
    gsap.ticker.remove(this.tick);
    this.ro.disconnect();
    gsap.killTweensOf(this.cam);
    for (const a of this.actors.values()) gsap.killTweensOf(a);
    for (const e of this.els.values()) gsap.killTweensOf(e);
    this.svg.remove();
    this.fx.remove();
  }

  /* ---------- size ---------- */
  resize() {
    const r = this.host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.VW = Math.round((1000 * r.width) / r.height);
    this.svg.setAttribute('viewBox', `0 0 ${this.VW} 1000`);
    for (const rect of [this.skyRect, this.tintRect, this.vignette, this.glowRect, this.whiteRect]) rect.setAttribute('width', String(this.VW));
    this.buildScreenFx();
    this.layers.forEach((l) => { l.last = ''; });
    this.worldLast = '';
    if (this.backdropStyle) this.setBackdrop(this.backdropStyle);
    this.render();
  }

  private buildScreenFx() {
    const VW = this.VW, cx = VW / 2, cy = 430;
    let sp = '';
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2 + (i % 3) * 0.02;
      const r0 = 250 + ((i * 53) % 140);
      const w = 0.012 + ((i * 7) % 5) * 0.004;
      const x1 = cx + Math.cos(a) * r0, y1 = cy + Math.sin(a) * r0;
      const x2 = cx + Math.cos(a - w) * 1400, y2 = cy + Math.sin(a - w) * 1400;
      const x3 = cx + Math.cos(a + w) * 1400, y3 = cy + Math.sin(a + w) * 1400;
      sp += `<path d="M${f1(x1)} ${f1(y1)} L${f1(x2)} ${f1(y2)} L${f1(x3)} ${f1(y3)} Z" fill="#fff" opacity="${(0.55 + (i % 4) * 0.12).toFixed(2)}"/>`;
    }
    this.speedG.innerHTML = `<g data-spin="1">${sp}</g>`;
    let mo = '';
    for (let i = 0; i < 22; i++) {
      const y = 60 + ((i * 397) % 860), len = 120 + ((i * 131) % 260);
      mo += `<rect data-x="${(i * 211) % (VW + 400)}" y="${y}" width="${len}" height="${3 + (i % 3) * 2}" rx="2" fill="#fff" opacity="${(0.35 + (i % 4) * 0.15).toFixed(2)}"/>`;
    }
    this.motionG.innerHTML = mo;
    let fa = '';
    for (let i = 0; i < 30; i++) {
      const x = (i * 97 + 13) % VW, len = 90 + ((i * 71) % 200);
      fa += `<rect x="${x}" data-y="${(i * 271) % 1400}" width="${2 + (i % 3)}" height="${len}" rx="1.5" fill="#fff" opacity="${(0.3 + (i % 4) * 0.13).toFixed(2)}"/>`;
    }
    this.fallG.innerHTML = fa;
    this.defs.querySelector('#cine-fx-defs')?.remove();
    const d = document.createElementNS(NS, 'g');
    d.setAttribute('id', 'cine-fx-defs');
    d.innerHTML = `<radialGradient id="cine-vignette" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stop-color="#0b0820" stop-opacity="0"/><stop offset="1" stop-color="#0b0820" stop-opacity="0.85"/></radialGradient>`
      + `<radialGradient id="cine-glow" cx="0.5" cy="0.42" r="0.7"><stop offset="0" stop-color="#fffbe8" stop-opacity="0.95"/><stop offset="0.6" stop-color="#fff2c4" stop-opacity="0.35"/><stop offset="1" stop-color="#fff2c4" stop-opacity="0"/></radialGradient>`;
    this.defs.append(d);
  }

  /* ---------- set + cast ---------- */
  loadSet(id: string) {
    const set = getSet(id);
    this.set = set;
    this.clearActors();
    this.els.forEach((e) => gsap.killTweensOf(e));
    this.els.clear();
    this.backG.innerHTML = '';
    this.frontG.innerHTML = '';
    this.layers = [];
    this.defs.querySelector('#set-defs')?.remove();
    if (set.defs) {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('id', 'set-defs');
      g.innerHTML = set.defs;
      this.defs.append(g);
    }
    this.skyRect.setAttribute('fill', set.bg);
    for (const layer of set.layers) {
      const g = document.createElementNS(NS, 'g');
      g.innerHTML = layer.svg;
      (layer.front ? this.frontG : this.backG).append(g);
      // The ground plane (p = 1) shares the camera with the actors.
      this.layers.push({ g, p: layer.p, last: '' });
    }
    for (const [name, a] of Object.entries(set.els || {})) {
      const node = this.svg.querySelector(`[data-el="${name}"]`) as SVGGElement | null;
      if (!node) continue;
      this.els.set(name, { node, ax: a.x, ay: a.y, x: 0, y: 0, rot: a.init?.rot ?? 0, scale: a.init?.scale ?? 1, opacity: a.init?.opacity ?? 1, last: '' });
    }
    this.track = null;
    this.setBackdrop(null);
    this.worldLast = '';
  }

  private clearActors() {
    for (const a of this.actors.values()) { gsap.killTweensOf(a); a.clearEmote(); a.root.remove(); a.shadow.remove(); }
    this.actors.clear();
    for (const g of this.auras.values()) { gsap.killTweensOf(g); g.remove(); }
    this.auras.clear();
  }

  /* ---------- power-ups ---------- */
  private auras = new Map<CastId, SVGGElement>();
  private auraUid = 0;
  /** A glowing aura behind a character in their colour, following them; fades in and out gently. */
  setAura(who: CastId, color: string, on: boolean) {
    const old = this.auras.get(who);
    if (!on) {
      if (old) { this.auras.delete(who); gsap.to(old, { attr: { opacity: 0 }, duration: 0.6, onComplete: () => old.remove() }); }
      return;
    }
    if (old) old.remove();
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'aura');
    g.setAttribute('opacity', '0');
    g.innerHTML = auraMarkup(`aura${++this.auraUid}`, color);
    this.shadowsG.append(g);
    this.auras.set(who, g);
    this.placeAuras();
    gsap.to(g, { attr: { opacity: this.calm ? 0.6 : 1 }, duration: 0.5, ease: 'sine.out' });
  }
  private placeAuras() {
    for (const [who, g] of this.auras) {
      const a = this.actors.get(who);
      if (!a) continue;
      g.setAttribute('transform', `translate(${f1(a.x)} ${f1(a.y - a.lift)}) scale(${Math.round(a.s * 100) / 100})`);
      g.style.display = a.visible && a.alpha > 0.01 ? '' : 'none';
    }
  }
  /** An anime power banner: the power's icon and name on a slanted ribbon in its colour. */
  powerBanner(name: string, color: string, icon: PowerIcon) {
    const d = document.createElement('div');
    d.className = 'power-banner';
    d.style.setProperty('--c', color);
    d.innerHTML = `<div class="pb-ribbon"><span class="pb-icon">${POWER_ICONS[icon]}</span><span class="pb-name"></span></div>`;
    (d.querySelector('.pb-name') as HTMLElement).textContent = name;
    this.fx.append(d);
    window.setTimeout(() => d.remove(), 3200);
  }

  defaultScale(y: number) {
    if (!this.set) return 1;
    if (this.set.scale) return this.set.scale(y);
    return 1;
  }

  addActor(p: Placement): Actor {
    let a: Actor;
    if (p.id === 'fizz') a = new FizzActor();
    else if (p.id === 'you') a = new KidActor('you', captainLook(this.hero.look, { cape: this.hero.cape }));
    else a = new KidActor(p.id, CREW[p.id as CrewId]);
    a.x = p.x;
    a.y = p.y ?? this.set?.ground ?? 800;
    a.s = p.s ?? this.defaultScale(a.y);
    a.face = p.face ?? 1;
    a.flip = a.face;
    a.lift = p.lift ?? (p.id === 'fizz' ? 60 : 0);
    a.visible = !p.hidden;
    if (p.pose && p.id !== 'fizz') a.setPose(p.pose as PoseName);
    if (p.cycle) a.setCycle(p.cycle, this.clock);
    if (p.expr) a.setExpr(p.expr);
    if (p.prop) a.setProp(p.prop);
    if (p.look && a instanceof KidActor) a.setGaze(p.look);
    this.actors.set(p.id, a);
    this.shadowsG.append(a.shadow);
    this.actorsG.append(a.root);
    a.update(this.clock, 0, true);
    return a;
  }

  setCape(on: boolean) {
    this.hero = { ...this.hero, cape: on };
    const you = this.actors.get('you');
    if (you instanceof KidActor) you.setCape(on);
  }

  /* ---------- camera ---------- */
  snapshot(): Map<CastId, ActorSnap> {
    const m = new Map<CastId, ActorSnap>();
    for (const [id, a] of this.actors) m.set(id, { x: a.x, y: a.y, lift: a.lift, s: a.s, height: a.heightNow(), full: a.height, face: a.face, visible: a.visible, hw: a.halfWidth(), widths: a.widths(), lying: lyingSide(a.cycle ? null : a.pose) });
    return m;
  }

  /** The camera for a framing, adjusted so that nobody is cut in half by the edge of the screen. */
  frameFor(f: Frame, snap: Map<CastId, ActorSnap> = this.snapshot()): CamState {
    return this.cleanEdges(this.rawFrame(f, snap), f, snap);
  }

  /**
   * Film rule: the people a shot is about are fully on screen, and everyone else is either fully in
   * or fully out, never sliced by the frame edge. The camera first slides sideways as little as
   * possible; if that cannot work, group and wide shots pull back, close-ups tighten a little.
   */
  private cleanEdges(c: CamState, f: Frame, snap: Map<CastId, ActorSnap>): CamState {
    const W = this.set?.w ?? this.VW;
    const top = this.set?.top ?? 0, bottom = this.set?.bottom ?? (this.set?.h ?? 1000);
    const zMin = Math.max(0.7, 1000 / (bottom - top), this.VW / W);
    const listOf = (v: CastId | CastId[]) => (Array.isArray(v) ? v : [v]).filter((id) => snap.get(id)?.visible);
    let subjects: CastId[] = [];
    let req: [number, number][] = [];
    let zooms: number[];
    let maxShift = Infinity;
    const body = (id: CastId): [number, number] => { const a = snap.get(id)!; return [bodyX(a) - a.hw, bodyX(a) + a.hw]; };
    if ('full' in f || 'medium' in f) {
      subjects = listOf('full' in f ? f.full : f.medium);
      req = subjects.map(body);
      zooms = [1, 0.9, 0.8, 0.7];
    } else if ('close' in f || 'xclose' in f) {
      subjects = listOf('close' in f ? f.close : f.xclose);
      req = subjects.map((id) => { const a = snap.get(id)!; const h = Math.min(a.hw, 62 * a.s) * 0.92; return [a.x - h, a.x + h] as [number, number]; });
      zooms = [1, 1.12, 1.25, 0.9];
      maxShift = 0.3 * (this.VW / (2 * c.zoom));
    } else if ('low' in f) {
      subjects = listOf(f.low);
      req = subjects.map(body);
      zooms = [1, 0.9, 0.8];
    } else if ('el' in f) {
      const e = this.els.get(f.el);
      if (e) {
        let half = 70;
        try { const b = e.node.getBBox(); half = Math.max(Math.abs(b.x), Math.abs(b.x + b.width)) * e.scale; } catch { /* not rendered yet */ }
        half = Math.min(half, 0.85 * (this.VW / (2 * c.zoom)));
        req = [[e.ax + e.x - half, e.ax + e.x + half]];
      }
      zooms = [1, 0.9, 0.8];
    } else {
      // Wide and exact shots: whoever is already in the picture stays in it (whole), pulling back if needed.
      const hw0 = this.VW / (2 * Math.max(zMin, c.zoom));
      for (const [id, a] of snap) if (a.visible && Math.abs(a.x - c.x) < hw0) subjects.push(id);
      req = subjects.map(body);
      zooms = [1, 0.92, 0.85, 0.78, 0.7];
    }
    const skip = new Set(subjects);
    const others: [number, number][] = [];
    for (const [id, a] of snap) if (a.visible && !skip.has(id)) others.push([bodyX(a) - a.hw, bodyX(a) + a.hw]);
    if (!others.length && !req.length) return c;
    const m = 14, mi = 12, mo = 6; // margins: subjects and people fully inside keep clear of the edge; people outside stay just off it
    let fallback: { x: number; zoom: number; cuts: number } | null = null;
    for (const zf of zooms) {
      const zoom = Math.max(zMin, c.zoom * zf);
      if (zf !== 1 && Math.abs(zoom - c.zoom) < 1e-3) continue;
      const hw = this.VW / (2 * zoom);
      if (W <= hw * 2) return { ...c, zoom };
      let lo = hw, hi = W - hw;
      for (const [l, r] of req) { lo = Math.max(lo, r - hw + m); hi = Math.min(hi, l + hw - m); }
      if (maxShift < Infinity) { lo = Math.max(lo, c.x - maxShift); hi = Math.min(hi, c.x + maxShift); }
      if (lo > hi) continue;
      const cuts = (x: number) => others.filter(([l, r]) => !(r <= x - hw + mo || l >= x + hw - mo || (l >= x - hw + mi && r <= x + hw - mi))).length;
      const cands = [Math.min(hi, Math.max(lo, c.x)), lo, hi];
      for (const [l, r] of others) cands.push(l - hw + mo, r + hw - mo, r - hw + mi, l + hw - mi);
      const valid = cands.filter((x) => x >= lo - 0.01 && x <= hi + 0.01);
      const clean = valid.filter((x) => cuts(x) === 0).sort((a, b) => Math.abs(a - c.x) - Math.abs(b - c.x));
      if (clean.length) return { x: clean[0], y: c.y, zoom };
      if (zf === 1) {
        const best = valid.map((x) => ({ x, zoom, cuts: cuts(x) })).sort((a, b) => a.cuts - b.cuts || Math.abs(a.x - c.x) - Math.abs(b.x - c.x))[0];
        if (best) fallback = best;
      }
    }
    return fallback ? { x: fallback.x, y: c.y, zoom: fallback.zoom } : c;
  }

  private rawFrame(f: Frame, snap: Map<CastId, ActorSnap>): CamState {
    const H = this.set?.h ?? 1000;
    const W = this.set?.w ?? 1000;
    const ids = (v: CastId | CastId[]) => (Array.isArray(v) ? v : [v]).filter((id) => snap.has(id));
    const box = (list: CastId[], topFrac: number, botFrac: number) => {
      let minX = Infinity, maxX = -Infinity, top = Infinity, bot = -Infinity;
      for (const id of list) {
        const a = snap.get(id)!;
        const h = a.height * a.s;
        const feet = a.y - a.lift;
        minX = Math.min(minX, bodyX(a) - a.hw); maxX = Math.max(maxX, bodyX(a) + a.hw);
        top = Math.min(top, feet - h * topFrac); bot = Math.max(bot, feet - h * botFrac);
      }
      return { minX, maxX, top, bot };
    };
    if ('at' in f) return { x: f.at[0], y: f.at[1], zoom: f.at[2] };
    if ('wide' in f) return { x: f.wide, y: f.y ?? (f.zoom && f.zoom < 1 ? 450 : H / 2), zoom: f.zoom ?? 1 };
    if ('el' in f) {
      const e = this.els.get(f.el);
      const zoom = f.zoom ?? 2;
      return e ? { x: e.ax + e.x, y: e.ay + e.y + (f.dy ?? 0), zoom } : { x: W / 2, y: H / 2, zoom };
    }
    if ('full' in f || 'medium' in f) {
      const isFull = 'full' in f;
      const list = ids(isFull ? f.full : f.medium);
      if (!list.length) return { ...this.cam };
      const b = box(list, 1.02, isFull ? -0.02 : 0.38);
      const h = b.bot - b.top, w = b.maxX - b.minX;
      const zoom = clamp(Math.min((1000 * (isFull ? 0.6 : 0.56)) / h, (this.VW * 0.9) / w), 1, isFull ? 4 : 5);
      return { x: (b.minX + b.maxX) / 2 + (f.dx ?? 0), y: (b.top + b.bot) / 2 + CAPTION_SHIFT / zoom, zoom };
    }
    if ('close' in f || 'xclose' in f || 'low' in f) {
      const id = 'close' in f ? f.close : 'xclose' in f ? f.xclose : f.low;
      const a = snap.get(id);
      if (!a) return { ...this.cam };
      const h = a.height * a.s;
      // Heads are the same size sitting or standing, so close-ups zoom by standing height.
      const hz = a.full * a.s;
      const feet = a.y - a.lift;
      if ('low' in f) {
        const zoom = clamp((1000 * 0.78) / h, 1, 4);
        return { x: a.x + (f.dx ?? 0), y: feet - h * 0.44, zoom };
      }
      if ('xclose' in f) {
        const zoom = clamp(1000 / (hz * 0.24), 1, 9);
        return { x: a.x + 4 * a.face * a.s + (f.dx ?? 0), y: feet - h + hz * 0.27 + 18 / zoom, zoom };
      }
      const zoom = clamp(1000 / hz, 1, 7);
      return { x: a.x + 4 * a.face * a.s + (f.dx ?? 0), y: feet - h + hz * 0.32 + CAPTION_SHIFT / zoom, zoom };
    }
    return { ...this.cam };
  }

  /**
   * People a character shot is not about who would still be sliced by the frame edge. Like an anime
   * close-up, they step out of this one shot (and come back in the next).
   */
  intruders(f: Frame, c: CamState, snap: Map<CastId, ActorSnap>): CastId[] {
    let subjects: CastId[] = [];
    if ('full' in f) subjects = Array.isArray(f.full) ? f.full : [f.full];
    else if ('medium' in f) subjects = Array.isArray(f.medium) ? f.medium : [f.medium];
    else if ('close' in f) subjects = [f.close];
    else if ('xclose' in f) subjects = [f.xclose];
    else if ('low' in f) subjects = [f.low];
    else if (!('el' in f)) return [];
    const cc = this.clamped(c);
    const hw = this.VW / (2 * cc.zoom);
    const out: CastId[] = [];
    for (const [id, a] of snap) {
      if (!a.visible || subjects.includes(id)) continue;
      const l = bodyX(a) - a.hw, r = bodyX(a) + a.hw;
      const outside = r <= cc.x - hw + 6 || l >= cc.x + hw - 6, inside = l >= cc.x - hw + 12 && r <= cc.x + hw - 12;
      if (!outside && !inside) out.push(id);
    }
    return out;
  }

  /** The camera as it will actually be drawn (kept inside the set). */
  clamped(c: CamState = this.cam): CamState {
    const W = this.set?.w ?? this.VW, H = this.set?.h ?? 1000;
    const top = this.set?.top ?? 0, bottom = this.set?.bottom ?? H;
    // Never zoom out further than the drawn art allows.
    const zoom = Math.max(0.7, 1000 / (bottom - top), this.VW / W, c.zoom);
    const hw = this.VW / (2 * zoom), hh = 500 / zoom;
    const x = W <= hw * 2 ? W / 2 : clamp(c.x, hw, W - hw);
    const y = bottom - top <= hh * 2 ? (top + bottom) / 2 : clamp(c.y, top + hh, bottom - hh);
    return { x, y, zoom };
  }

  /** World point -> screen percentage (for HTML particles and words). */
  toScreen(wx: number, wy: number) {
    const c = this.clamped();
    return { x: (((wx - c.x) * c.zoom + this.VW / 2) / this.VW) * 100, y: (((wy - c.y) * c.zoom + 500) / 1000) * 100 };
  }

  /* ---------- per-frame render ---------- */
  private onTick(dt: number) {
    if (this.destroyed) return;
    if (this.paused) return;
    this.clock += dt;
    this.step(dt, false);
  }

  /** Advances follow-camera, rides and actors, then draws. `instant` snaps all smoothing. */
  step(dt: number, instant: boolean) {
    if (this.track) {
      const a = this.actors.get(this.track.who);
      if (a) {
        // Follow sideways and up/down (climbs); the clamp keeps flat sets steady vertically.
        const tx = a.x + this.track.lead * a.face;
        const ty = a.y - a.lift - a.heightNow() * a.s * 0.45 + CAPTION_SHIFT / Math.max(0.7, this.cam.zoom);
        const k = instant ? 1 : 1 - Math.exp(-dt * 3.5);
        this.cam.x += (tx - this.cam.x) * k;
        this.cam.y += (ty - this.cam.y) * k;
      }
    }
    for (const a of this.actors.values()) {
      if (a.ride) {
        if (a.ride.kind === 'el') {
          const e = this.els.get(a.ride.name);
          if (e) { a.x = e.ax + e.x + a.ride.dx; a.y = e.ay + e.y + a.ride.dy; }
        } else {
          const p = this.actors.get(a.ride.name as CastId);
          if (p) { a.x = p.x + a.ride.dx * p.face * p.s; a.y = p.y + (a.ride.behind ? -0.5 : 0.5); a.lift = p.lift + a.ride.dy * p.s; }
        }
      }
      a.speaking = !!this.speaker && this.speaker.who === a.id;
      a.speakLevel = a.speaking && this.speaker ? this.speaker.level() : 0;
      a.update(this.clock, dt, instant);
    }
    this.sortDepth();
    if (this.auras.size) this.placeAuras();
    this.render();
    this.animateScreenFx(dt);
  }

  private sortDepth() {
    const list = [...this.actors.values()];
    let sorted = true;
    for (let i = 1; i < list.length; i++) if (list[i].y < list[i - 1].y) { sorted = false; break; }
    if (sorted) {
      // DOM order might still differ from map order after moves; check the DOM directly.
      const kids = this.actorsG.children;
      for (let i = 1; i < kids.length; i++) {
        const a = this.actors.get(kids[i - 1].getAttribute('data-actor') as CastId);
        const b = this.actors.get(kids[i].getAttribute('data-actor') as CastId);
        if (a && b && b.y < a.y - 0.5) { sorted = false; break; }
      }
      if (sorted) return;
    }
    list.sort((a, b) => a.y - b.y).forEach((a) => this.actorsG.append(a.root));
  }

  render() {
    const c = this.clamped();
    const W = this.set?.w ?? this.VW, H = this.set?.h ?? 1000;
    for (const l of this.layers) {
      const zp = 1 + (c.zoom - 1) * l.p;
      const cx = W / 2 + (c.x - W / 2) * l.p;
      const cy = H / 2 + (c.y - H / 2) * l.p;
      const t = `translate(${f1(this.VW / 2)} 500) scale(${Math.round(zp * 10000) / 10000}) translate(${f1(-cx)} ${f1(-cy)})`;
      if (t !== l.last) { l.g.setAttribute('transform', t); l.last = t; }
    }
    const wt = `translate(${f1(this.VW / 2)} 500) scale(${Math.round(c.zoom * 10000) / 10000}) translate(${f1(-c.x)} ${f1(-c.y)})`;
    if (wt !== this.worldLast) { this.worldG.setAttribute('transform', wt); this.worldLast = wt; }
    for (const e of this.els.values()) {
      const t = `translate(${f1(e.ax + e.x)} ${f1(e.ay + e.y)}) rotate(${f1(e.rot)}) scale(${Math.round(e.scale * 1000) / 1000})`;
      const key = t + e.opacity;
      if (key !== e.last) { e.node.setAttribute('transform', t); e.node.setAttribute('opacity', String(Math.round(e.opacity * 100) / 100)); e.last = key; }
    }
  }

  /* ---------- screen effects ---------- */
  private fxTime = 0;
  private animateScreenFx(dt: number) {
    this.fxTime += dt;
    if (Number(this.speedG.getAttribute('opacity')) > 0.01) {
      const spin = this.speedG.firstElementChild as SVGGElement | null;
      spin?.setAttribute('transform', `rotate(${f1((this.fxTime * 6) % 360)} ${f1(this.VW / 2)} 430)`);
    }
    if (Number(this.motionG.getAttribute('opacity')) > 0.01) {
      const span = this.VW + 600;
      for (const r of Array.from(this.motionG.children)) {
        const base = Number(r.getAttribute('data-x'));
        const x = ((((base - this.fxTime * 1900 * this.motionDir) % span) + span) % span) - 300;
        r.setAttribute('x', String(f1(x)));
      }
    }
    if (Number(this.fallG.getAttribute('opacity')) > 0.01) {
      for (const r of Array.from(this.fallG.children)) {
        const base = Number(r.getAttribute('data-y'));
        const y = ((((base - this.fxTime * 1500) % 1400) + 1400) % 1400) - 300;
        r.setAttribute('y', String(f1(y)));
      }
    }
    if (this.backdropStyle === 'rays' || this.backdropStyle === 'speed') {
      const spin = this.backdropG.querySelector('[data-spin]');
      spin?.setAttribute('transform', `rotate(${f1((this.fxTime * (this.backdropStyle === 'rays' ? 8 : 4)) % 360)} ${f1(this.VW / 2)} 430)`);
    }
  }

  fade(node: SVGElement, to: number, dur = 0.35) {
    gsap.to(node, { attr: { opacity: to }, duration: this.calm ? Math.min(dur, 0.2) : dur, ease: 'sine.inOut', overwrite: true });
  }

  setSpeedlines(on: boolean) { this.fade(this.speedG, on && !this.calm ? 0.9 : 0, 0.3); }
  setMotion(on: boolean, dir: 'left' | 'right' = 'left') { this.motionDir = dir === 'left' ? 1 : -1; this.fade(this.motionG, on && !this.calm ? 0.85 : 0, 0.3); }
  setFallLines(on: boolean) { this.fade(this.fallG, on && !this.calm ? 0.8 : 0, 0.4); }
  setTint(color: string | null, opacity = 0.35) {
    if (color) this.tintRect.setAttribute('fill', color);
    this.fade(this.tintRect, color ? opacity : 0, 1.2);
  }
  setVignette(on: boolean) { this.fade(this.vignette, on ? 1 : 0, 0.8); }

  /** A soft warm glow that fades in and out (never a flash). */
  glow() {
    gsap.timeline().to(this.glowRect, { attr: { opacity: 0.7 }, duration: 0.5, ease: 'sine.out' }).to(this.glowRect, { attr: { opacity: 0 }, duration: 0.9, ease: 'sine.in' });
  }
  /** A slow fade to white and back, for magic moments (well under 3 changes per second). */
  whiteout(dur = 1.8) {
    gsap.timeline().to(this.whiteRect, { attr: { opacity: 1 }, duration: dur * 0.4, ease: 'sine.inOut' }).to(this.whiteRect, { attr: { opacity: 0 }, duration: dur * 0.45, ease: 'sine.inOut' }, `+=${dur * 0.15}`);
  }

  /** Anime reaction background behind the actors (hides the set). */
  setBackdrop(style: Backdrop | null, color?: string) {
    this.backdropStyle = style;
    if (!style) { this.fade(this.backdropG, 0, 0.25); return; }
    const VW = this.VW, cx = VW / 2, cy = 430;
    const col = color || { rays: '#ffd36e', sparkle: '#ffb7dc', gloom: '#3b3f8a', dots: '#8fc8ff', speed: '#7B61FF', hearts: '#ffb7dc', shock: '#c9b6ff', flat: '#ffd1e8' }[style];
    let inner = `<rect x="0" y="0" width="${VW}" height="1000" fill="${col}"/>`;
    if (style === 'rays' || style === 'speed') {
      let r = '';
      const n = style === 'rays' ? 18 : 48;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, w = style === 'rays' ? Math.PI / n / 1.2 : 0.02;
        r += `<path d="M${cx} ${cy} L${f1(cx + Math.cos(a - w) * 1400)} ${f1(cy + Math.sin(a - w) * 1400)} L${f1(cx + Math.cos(a + w) * 1400)} ${f1(cy + Math.sin(a + w) * 1400)} Z" fill="#fff" opacity="${style === 'rays' ? 0.35 : 0.7}"/>`;
      }
      inner += `<g data-spin="1">${r}</g>`;
    } else if (style === 'sparkle' || style === 'hearts') {
      for (let i = 0; i < 26; i++) {
        const x = (i * 137) % VW, y = (i * 263) % 1000, s = 10 + (i % 4) * 7;
        inner += style === 'sparkle'
          ? `<path class="tw" style="animation-delay:${(i % 7) * 0.4}s" d="M${x} ${y - s} Q${x + s * 0.2} ${y - s * 0.2} ${x + s} ${y} Q${x + s * 0.2} ${y + s * 0.2} ${x} ${y + s} Q${x - s * 0.2} ${y + s * 0.2} ${x - s} ${y} Q${x - s * 0.2} ${y - s * 0.2} ${x} ${y - s} Z" fill="#fff"/>`
          : `<path class="tw" style="animation-delay:${(i % 7) * 0.4}s" transform="translate(${x} ${y}) scale(${s / 10})" d="M0 6 C-8 -2 -12 -10 -6 -14 C-2 -16 0 -12 0 -10 C0 -12 2 -16 6 -14 C12 -10 8 -2 0 6 Z" fill="#fff" opacity=".8"/>`;
      }
    } else if (style === 'gloom') {
      for (let i = 0; i < 16; i++) inner += `<rect x="${(i * 61) % VW}" y="0" width="${3 + (i % 3) * 2}" height="${300 + (i * 97) % 500}" fill="#1c1f55" opacity=".5"/>`;
    } else if (style === 'dots') {
      for (let y = 20; y < 1000; y += 46) for (let x = (y / 46) % 2 ? 23 : 0; x < VW + 20; x += 46) inner += `<circle cx="${x}" cy="${y}" r="9" fill="#fff" opacity=".35"/>`;
    } else if (style === 'shock') {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        inner += `<path d="M${cx} ${cy} L${f1(cx + Math.cos(a - 0.12) * 1200)} ${f1(cy + Math.sin(a - 0.12) * 1200)} L${f1(cx + Math.cos(a) * 700)} ${f1(cy + Math.sin(a) * 700)} L${f1(cx + Math.cos(a + 0.12) * 1200)} ${f1(cy + Math.sin(a + 0.12) * 1200)} Z" fill="#fff" opacity=".4"/>`;
      }
    }
    this.backdropG.innerHTML = inner;
    this.fade(this.backdropG, 1, 0.2);
  }

  /* ---------- HTML particles and words ---------- */
  private addFx(cls: string, x: number, y: number, html = '', life = 1800, style: Record<string, string> = {}) {
    const d = document.createElement('div');
    d.className = cls;
    d.style.left = `${f1(x)}%`;
    d.style.top = `${f1(y)}%`;
    for (const [k, v] of Object.entries(style)) d.style.setProperty(k, v);
    d.innerHTML = html;
    this.fx.append(d);
    window.setTimeout(() => d.remove(), life);
    return d;
  }

  pointOf(who?: CastId, el?: string, part: 'head' | 'feet' | 'face' = 'face') {
    if (el) { const e = this.els.get(el); if (e) return this.toScreen(e.ax + e.x, e.ay + e.y); }
    if (who) {
      const a = this.actors.get(who);
      if (a) {
        if (part === 'feet') return this.toScreen(a.x, a.y - a.lift);
        if (part === 'head') { const h = a.headTop(); return this.toScreen(h.x, h.y); }
        const f = a.faceCenter(); return this.toScreen(f.x, f.y);
      }
    }
    return { x: 50, y: 42 };
  }

  word(text: string, x = 30 + Math.random() * 25, y = 20 + Math.random() * 12, color = '#ffd36e') {
    const d = this.addFx('sfx-word', x, y, '', 1800, { '--c': color });
    d.textContent = text;
    gsap.fromTo(d, { scale: 0.3, rotation: -14, opacity: 0 }, { scale: 1, rotation: -6, opacity: 1, duration: 0.45, ease: 'back.out(2.2)' });
    gsap.to(d, { opacity: 0, y: -16, duration: 0.4, delay: 1.3 });
  }

  burst(who?: CastId, el?: string) {
    const p = this.pointOf(who, el);
    const d = this.addFx('burst', p.x, p.y, '<svg viewBox="-60 -60 120 120"><path d="M0 -56 L12 -20 L48 -34 L26 -4 L58 14 L20 18 L28 54 L0 28 L-28 54 L-20 18 L-58 14 L-26 -4 L-48 -34 L-12 -20 Z" fill="#fff6c4" stroke="#ffb84d" stroke-width="5" stroke-linejoin="round"/></svg>', 900);
    gsap.fromTo(d, { scale: 0.2, opacity: 1 }, { scale: 1.2, opacity: 0, duration: 0.8, ease: 'power2.out' });
  }

  sparkle(who?: CastId, el?: string, n = 8) {
    const p = this.pointOf(who, el);
    const cols = ['#ffd36e', '#fff', '#ff9fcf', '#7fe6c9', '#8fc8ff'];
    for (let i = 0; i < (this.calm ? Math.min(3, n) : n); i++) {
      const d = this.addFx('sparkle', p.x + (Math.random() - 0.5) * 34, p.y + (Math.random() - 0.5) * 24, '<svg viewBox="0 0 24 24"><path d="M12 1l2.5 8.5L23 12l-8.5 2.5L12 23l-2.5-8.5L1 12l8.5-2.5z" fill="currentColor"/></svg>', 1900, { color: cols[i % cols.length] });
      d.style.animationDelay = `${(Math.random() * 0.5).toFixed(2)}s`;
    }
  }

  confetti() {
    if (this.calm) return;
    const cols = ['#ff9fcf', '#7fe6c9', '#ffd36e', '#8fc8ff', '#c9b6ff', '#ffb38a'];
    for (let i = 0; i < 40; i++) {
      const d = this.addFx('confetti', Math.random() * 100, -4, '', 4800, { background: cols[i % 6] });
      d.style.animationDelay = `${(Math.random() * 0.9).toFixed(2)}s`;
      d.style.animationDuration = `${(2.6 + Math.random() * 1.4).toFixed(2)}s`;
    }
  }

  sprinkles(dur = 3) {
    const cols = ['#ff9fcf', '#7fe6c9', '#ffd36e', '#8fc8ff', '#c9b6ff', '#ffffff'];
    const n = this.calm ? 14 : 48;
    for (let i = 0; i < n; i++) {
      const d = this.addFx('sprinkle', Math.random() * 100, -3, '', (dur + 2.5) * 1000, { background: cols[i % 6] });
      d.style.animationDelay = `${(Math.random() * dur).toFixed(2)}s`;
      d.style.transform = `rotate(${Math.floor(Math.random() * 180)}deg)`;
    }
  }

  dust(who: CastId) {
    const p = this.pointOf(who, undefined, 'feet');
    for (let i = 0; i < (this.calm ? 2 : 5); i++) {
      const d = this.addFx('dust', p.x + (i - 2) * 3, p.y, '', 900, { '--dx': `${(i - 2) * 14}px` });
      d.style.animationDelay = `${i * 0.03}s`;
    }
  }

  splash(who?: CastId, el?: string, color = '#7a4a2c') {
    const p = who ? this.pointOf(who, undefined, 'feet') : this.pointOf(undefined, el);
    for (let i = 0; i < (this.calm ? 3 : 9); i++) {
      this.addFx('drop-fx', p.x, p.y, '', 1100, { background: color, '--dx': `${Math.round((Math.random() - 0.5) * 160)}px`, '--dy': `${Math.round(-60 - Math.random() * 90)}px` });
    }
  }

  floaters(who: CastId, kind: 'hearts' | 'notes') {
    const p = this.pointOf(who, undefined, 'head');
    const svg = kind === 'hearts'
      ? '<svg viewBox="-12 -16 24 24"><path d="M0 6 C-8 -2 -12 -10 -6 -14 C-2 -16 0 -12 0 -10 C0 -12 2 -16 6 -14 C12 -10 8 -2 0 6 Z" fill="#ff7ab8"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M9 17.5V6l10-2v11.5" stroke="#ffd36e" stroke-width="2.4" fill="none"/><circle cx="6.5" cy="17.5" r="2.8" fill="#ffd36e"/><circle cx="16.5" cy="15.5" r="2.8" fill="#ffd36e"/></svg>';
    for (let i = 0; i < 4; i++) {
      const d = this.addFx('floater', p.x + (i - 1.5) * 6, p.y, svg, 2400);
      d.style.animationDelay = `${i * 0.25}s`;
    }
  }

  setPaused(p: boolean) { this.paused = p; }

  /** Instantly brings everything to rest (used after skipping or resuming). */
  settle() { this.step(0, true); }

}
