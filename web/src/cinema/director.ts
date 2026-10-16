// The director turns screenplay shots into GSAP timelines on the stage. The same timelines run
// silently (no sounds or particles) to fast-forward when a chapter is resumed half-way.
import gsap from 'gsap';
import type { Engine, ActorSnap } from './engine';
import { KidActor } from './actor';
import type { Action, CastId, Ease, Fx, LineShot, Scene } from './types';
import { sfx } from '@/lib/sfx';
import { POSE_HEIGHT, type PoseName } from '@/art/poses';
import { widthFor } from './actor';

const EASE: Record<Ease, string> = { linear: 'none', in: 'power2.in', out: 'power2.out', inOut: 'sine.inOut', back: 'back.out(1.6)', bounce: 'bounce.out', elastic: 'elastic.out(1, 0.5)' };
const SPEED = { run: 430, walk: 170, tiptoe: 110, fly: 320, fall: 300, climb: 120 } as const;

type Sim = Map<CastId, ActorSnap>;
const clone = (m: Sim): Sim => new Map([...m].map(([k, v]) => [k, { ...v }]));

/** Where everyone will be after these actions (used to aim camera moves at the end of a shot). */
export function simulate(start: Sim, acts: Action[] = [], viewHalfW = 260, viewX = 0): { end: Sim; from: Map<Action, ActorSnap | undefined> } {
  const sim = clone(start);
  const from = new Map<Action, ActorSnap | undefined>();
  const sorted = [...acts].sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
  for (const a of sorted) {
    const who = 'who' in a ? (a.who as CastId | null) : null;
    const s = who ? sim.get(who) : undefined;
    from.set(a, s ? { ...s } : undefined);
    if (!s) continue;
    switch (a.do) {
      case 'move': s.x = a.to; if (a.y !== undefined) s.y = a.y; break;
      case 'enter': s.x = a.to; if (a.y !== undefined) s.y = a.y; s.visible = true; s.lift = 0; break;
      case 'exit': s.x = a.to === 'left' ? viewX - viewHalfW - 300 : a.to === 'right' ? viewX + viewHalfW + 300 : s.x; s.visible = false; break;
      case 'jump': if (a.to !== undefined) s.x = a.to; if (a.y !== undefined) s.y = a.y; s.lift = 0; break;
      case 'fall': s.lift = 0; s.visible = true; break;
      case 'lift': s.lift = a.to; break;
      case 'place': s.x = a.x; if (a.y !== undefined) s.y = a.y; if (a.s !== undefined) s.s = a.s; if (a.lift !== undefined) s.lift = a.lift; break;
      case 'show': s.visible = true; break;
      case 'hide': s.visible = false; break;
      case 'face': s.face = a.dir; break;
      case 'scale': s.s = a.s; break;
      case 'pose': s.height = s.full * (POSE_HEIGHT[a.pose] ?? 1); s.hw = widthFor(s.widths, a.pose); break;
      case 'cycle': s.height = s.full * ((a.cycle && POSE_HEIGHT[a.cycle as 'paddle']) || 1); s.hw = widthFor(s.widths, a.cycle ?? 'stand'); break;
      default: break;
    }
  }
  return { end: sim, from };
}

export class Director {
  /** `quiet` is true while a shot is being skipped, so its sounds and particles do not all fire at once. */
  constructor(private eng: Engine, private quiet: () => boolean = () => false, private hooks: { insert?: (id: string | null) => void } = {}) {}

  /** Loads a scene's set and cast and frames the opening shot. */
  setupScene(scene: Scene) {
    const eng = this.eng;
    eng.loadSet(scene.set);
    for (const p of scene.cast) eng.addActor(p);
    eng.setSpeedlines(false); eng.setMotion(false); eng.setFallLines(false); eng.setVignette(false);
    eng.setBackdrop(null);
    if (scene.tint) eng.setTint(scene.tint.color, scene.tint.opacity ?? 0.35); else eng.setTint(null);
    const set = eng.set!;
    const c = eng.frameFor(scene.cam || { wide: set.w / 2 });
    gsap.killTweensOf(eng.cam);
    eng.cam.x = c.x; eng.cam.y = c.y; eng.cam.zoom = c.zoom;
    eng.settle();
  }

  /** Builds (paused) the timeline for one shot. */
  build(shot: LineShot, silent: boolean): gsap.core.Timeline {
    const eng = this.eng;
    // Stop any camera move left over from before. This must happen now, not inside the timeline:
    // killing camera tweens at time 0 would also kill this shot's own camera moves.
    gsap.killTweensOf(eng.cam);
    const tl = gsap.timeline({ paused: true });
    const start = eng.snapshot();
    // The opening framing sees instant changes made at the first moment (someone placed or
    // shown elsewhere), so the camera never frames where a character used to be.
    const instant = (shot.act || []).filter((a) => (a.at ?? 0) === 0 && a.atWord === undefined && (a.do === 'place' || a.do === 'show' || a.do === 'face' || a.do === 'hide' || a.do === 'pose' || a.do === 'cycle'));
    const opening = instant.length ? simulate(start, instant).end : start;
    const startCam = shot.cam ? eng.clamped(eng.frameFor(shot.cam, opening)) : eng.clamped();
    const halfW = eng.VW / (2 * startCam.zoom);
    const { end, from } = simulate(start, shot.act, halfW, startCam.x);
    // Everyone is back in the picture at the start of a shot...
    tl.call(() => { for (const a of eng.actors.values()) a.alpha = 1; }, [], 0);
    if (shot.cam) {
      const c = eng.frameFor(shot.cam, opening);
      tl.call(() => { eng.track = null; eng.cam.x = c.x; eng.cam.y = c.y; eng.cam.zoom = c.zoom; }, [], 0);
      // ...except someone a close shot is not about who would be sliced by the frame edge, unless
      // they speak or act in this shot.
      const busy = new Set<string>((shot.act || []).flatMap((a) => ('who' in a && a.who ? [a.who as string] : [])));
      if (shot.who) busy.add(shot.who);
      const out = eng.intruders(shot.cam, c, opening).filter((id) => !busy.has(id));
      if (out.length) tl.call(() => { for (const id of out) { const a = eng.actors.get(id); if (a) a.alpha = 0; } }, [], 0);
    }
    if (shot.move) {
      const c = eng.frameFor(shot.move, end);
      tl.to(eng.cam, { x: c.x, y: c.y, zoom: c.zoom, duration: shot.moveDur ?? 3, ease: 'sine.inOut' }, 0.02);
    }
    for (const a of shot.act || []) this.add(tl, a, from.get(a), startCam, halfW, end, silent);
    return tl;
  }

  private add(tl: gsap.core.Timeline, a: Action, fromState: ActorSnap | undefined, cam: { x: number; y: number; zoom: number }, halfW: number, end: Map<CastId, ActorSnap>, silent: boolean) {
    const eng = this.eng;
    const at = a.at ?? 0;
    const actor = 'who' in a && a.who ? eng.actors.get(a.who as CastId) : undefined;
    const call = (fn: () => void, t = at) => { tl.call(fn, [], t); };
    const turn = (dir: 1 | -1, t: number) => {
      if (!actor) return;
      call(() => { actor.face = dir; }, t);
      tl.to(actor, { flip: dir, duration: 0.14, ease: 'sine.inOut' }, t);
    };

    switch (a.do) {
      case 'move': {
        if (!actor || !fromState) return;
        const gait = a.gait ?? 'walk';
        const dist = Math.abs(a.to - fromState.x);
        const dur = a.dur ?? Math.max(0.4, dist / SPEED[gait]);
        if (a.to !== fromState.x) turn(a.to > fromState.x ? 1 : -1, at);
        if (gait !== 'fly') call(() => actor.setCycle(gait, eng.clock));
        tl.to(actor, { x: a.to, y: a.y ?? fromState.y, duration: dur, ease: EASE[a.ease ?? (gait === 'fly' ? 'inOut' : 'linear')] }, at);
        call(() => { actor.setCycle(null, eng.clock); actor.setPose(a.then ?? 'stand'); }, at + dur);
        return;
      }
      case 'enter': {
        if (!actor || !fromState) return;
        const gait = a.gait ?? 'run';
        const off = 90 * fromState.s;
        let x0 = fromState.x, lift0 = 0;
        if (a.from === 'left') x0 = cam.x - halfW - off;
        else if (a.from === 'right') x0 = cam.x + halfW + off;
        else if (a.from === 'top') { x0 = a.to; lift0 = Math.max(400, (fromState.y - (cam.y - 500 / cam.zoom)) + 120); }
        else x0 = a.to;
        const y = a.y ?? fromState.y;
        call(() => { actor.visible = true; actor.x = x0; actor.y = y; actor.lift = lift0; });
        if (a.from === 'top' || gait === 'fall') {
          const dur = a.dur ?? 1.0;
          call(() => actor.setCycle('flail', eng.clock));
          tl.to(actor, { x: a.to, duration: dur, ease: 'none' }, at);
          tl.fromTo(actor, { lift: lift0 }, { lift: 0, duration: dur, ease: 'power2.in', immediateRender: false }, at);
          this.landing(tl, actor.id, at + dur, a.then ?? 'stand', silent);
          return;
        }
        const dir: 1 | -1 = a.to >= x0 ? 1 : -1;
        call(() => { actor.face = dir; actor.flip = dir; });
        const dur = a.dur ?? Math.max(0.5, Math.abs(a.to - x0) / SPEED[gait === 'fly' ? 'fly' : gait]);
        if (gait !== 'fly') call(() => actor.setCycle(gait, eng.clock));
        tl.fromTo(actor, { x: x0 }, { x: a.to, duration: dur, ease: gait === 'fly' ? 'sine.out' : 'none', immediateRender: false }, at);
        call(() => { actor.setCycle(null, eng.clock); actor.setPose(a.then ?? 'stand'); }, at + dur);
        return;
      }
      case 'exit': {
        if (!actor || !fromState) return;
        const gait = a.gait ?? 'run';
        if (a.to === 'top') {
          const dur = a.dur ?? 0.9;
          tl.to(actor, { lift: fromState.lift + 1400, duration: dur, ease: 'power2.in' }, at);
          call(() => { actor.visible = false; }, at + dur);
          return;
        }
        if (a.to === 'bottom') {
          const dur = a.dur ?? 0.9;
          call(() => actor.setCycle('flail', eng.clock));
          tl.to(actor, { y: fromState.y + 1300, duration: dur, ease: 'power2.in' }, at);
          call(() => { actor.setCycle(null, eng.clock); actor.visible = false; }, at + dur);
          return;
        }
        const x1 = a.to === 'left' ? cam.x - halfW - 120 * fromState.s : a.to === 'right' ? cam.x + halfW + 120 * fromState.s : fromState.x;
        const dur = a.dur ?? Math.max(0.5, Math.abs(x1 - fromState.x) / SPEED[gait]);
        turn(x1 >= fromState.x ? 1 : -1, at);
        if (gait !== 'fly') call(() => actor.setCycle(gait, eng.clock));
        tl.to(actor, { x: x1, duration: dur, ease: 'none' }, at);
        call(() => { actor.setCycle(null, eng.clock); actor.visible = false; }, at + dur);
        return;
      }
      case 'jump': {
        if (!actor || !fromState) return;
        const to = a.to ?? fromState.x;
        const h = a.h ?? 140;
        const dur = a.dur ?? 0.7;
        const y = a.y ?? fromState.y;
        if (to !== fromState.x) turn(to > fromState.x ? 1 : -1, at);
        call(() => { actor.setCycle(null, eng.clock); actor.setPose('crouch'); });
        const t0 = at + 0.14;
        call(() => actor.setPose('jump'), t0);
        tl.to(actor, { x: to, y, duration: dur, ease: 'none' }, t0);
        tl.to(actor, { lift: fromState.lift + h, duration: dur / 2, ease: 'power2.out' }, t0);
        tl.to(actor, { lift: 0, duration: dur / 2, ease: 'power2.in' }, t0 + dur / 2);
        this.landing(tl, actor.id, t0 + dur, a.then ?? 'stand', silent);
        return;
      }
      case 'hop': {
        if (!actor || !fromState) return;
        const n = a.n ?? 2, h = a.h ?? 34;
        for (let i = 0; i < n; i++) {
          const t = at + i * 0.34;
          tl.to(actor, { lift: fromState.lift + h, duration: 0.16, ease: 'power2.out' }, t);
          tl.to(actor, { lift: fromState.lift, duration: 0.16, ease: 'power2.in' }, t + 0.16);
          tl.to(actor, { sq: 0.12, duration: 0.05, yoyo: true, repeat: 1 }, t + 0.3);
        }
        return;
      }
      case 'fall': {
        if (!actor) return;
        const fromLift = a.from ?? 700;
        const dur = a.dur ?? 0.9;
        call(() => { actor.visible = true; actor.lift = fromLift; actor.setCycle('flail', eng.clock); });
        tl.fromTo(actor, { lift: fromLift }, { lift: 0, duration: dur, ease: 'power2.in', immediateRender: false }, at);
        const land = a.land ?? 'feet';
        this.landing(tl, actor.id, at + dur, land === 'splat' ? 'splat' : land === 'sit' ? 'sit' : 'stand', silent);
        return;
      }
      case 'lift': {
        if (!actor) return;
        tl.to(actor, { lift: a.to, duration: a.dur ?? 0.8, ease: EASE[a.ease ?? 'inOut'] }, at);
        return;
      }
      case 'pose': if (actor) call(() => { actor.setCycle(null, eng.clock); actor.setPose(a.pose); }); return;
      case 'cycle': if (actor) call(() => actor.setCycle(eng.calm && a.cycle === 'tremble' ? null : a.cycle, eng.clock)); return;
      case 'expr': if (actor) call(() => actor.setExpr(a.expr)); return;
      case 'face': turn(a.dir, at); return;
      case 'look': if (actor instanceof KidActor) call(() => actor.setGaze(a.gaze)); return;
      case 'emote': if (actor && !silent) call(() => { if (!this.quiet()) actor.emote(a.emote); }); return;
      case 'spin': {
        if (!actor) return;
        const turns = a.turns ?? 1, dur = a.dur ?? 0.6 * turns;
        tl.fromTo(actor, { rot: 0 }, { rot: 360 * turns, duration: dur, ease: 'power1.inOut', immediateRender: false }, at);
        call(() => { actor.rot = 0; }, at + dur);
        return;
      }
      case 'squash': if (actor) tl.to(actor, { sq: a.amt ?? 0.2, duration: 0.09, yoyo: true, repeat: 1, ease: 'power1.out' }, at); return;
      case 'stretch': if (actor instanceof KidActor) tl.to(actor, { stretch: a.len, duration: a.dur ?? 0.8, ease: a.len > actor.stretch ? 'power2.out' : 'back.in(1.4)' }, at); return;
      case 'prop': if (actor) call(() => actor.setProp(a.prop)); return;
      case 'show': if (actor) call(() => { actor.visible = true; }); return;
      case 'hide': if (actor) call(() => { actor.visible = false; }); return;
      case 'place': if (actor) call(() => { actor.x = a.x; if (a.y !== undefined) actor.y = a.y; if (a.s !== undefined) actor.s = a.s; if (a.lift !== undefined) actor.lift = a.lift; }); return;
      case 'scale': if (actor) tl.to(actor, { s: a.s, duration: a.dur ?? 0.5, ease: 'sine.inOut' }, at); return;
      case 'ride': {
        if (!actor) return;
        const on = a.on;
        call(() => {
          if (!on) { actor.ride = null; return; }
          const isActor = eng.actors.has(on as CastId);
          actor.ride = { kind: isActor ? 'actor' : 'el', name: on, dx: a.dx ?? 0, dy: a.dy ?? 0 };
        });
        return;
      }
      case 'cape': call(() => eng.setCape(a.on)); return;
      case 'mess': if (actor instanceof KidActor) call(() => actor.setMess(a.color)); return;
      case 'el': {
        const e = eng.els.get(a.el);
        if (!e) return;
        const vars: gsap.TweenVars = { duration: a.dur ?? 0.6, ease: EASE[a.ease ?? 'inOut'] };
        if (a.to.x !== undefined) vars.x = a.to.x;
        if (a.to.y !== undefined) vars.y = a.to.y;
        if (a.to.rot !== undefined) vars.rot = a.to.rot;
        if (a.to.scale !== undefined) vars.scale = a.to.scale;
        if (a.to.opacity !== undefined) vars.opacity = a.to.opacity;
        if (a.yoyo) { vars.yoyo = true; vars.repeat = a.yoyo * 2 - 1; }
        tl.to(e, vars, at);
        return;
      }
      case 'cam': {
        const c = eng.frameFor(a.to, end);
        call(() => { eng.track = null; });
        tl.to(eng.cam, { x: c.x, y: c.y, zoom: c.zoom, duration: a.dur ?? 1.2, ease: EASE[a.ease ?? 'inOut'] }, at);
        return;
      }
      case 'track': call(() => { eng.track = a.who ? { who: a.who, lead: a.lead ?? 60 } : null; }); return;
      case 'fx': call(() => this.fx(a.fx, silent)); return;
      case 'sfx': if (!silent) call(() => { if (!this.quiet()) sfx(a.snd); }); return;
      case 'insert': call(() => this.hooks.insert?.(a.id)); return;
    }
  }

  /** Touch-down: a little squash, a puff of dust, then the resting pose. */
  private landing(tl: gsap.core.Timeline, who: CastId, t: number, then: PoseName, silent: boolean) {
    const eng = this.eng;
    const actor = eng.actors.get(who);
    if (!actor) return;
    tl.call(() => {
      actor.setCycle(null, eng.clock);
      actor.setPose(then === 'splat' ? 'splat' : then === 'sit' ? 'sit' : 'land');
      if (!silent && !this.quiet()) { eng.dust(who); sfx(then === 'splat' ? 'splat' : 'thud'); }
    }, [], t);
    tl.to(actor, { sq: 0.18, duration: 0.08, yoyo: true, repeat: 1, ease: 'power1.out' }, t);
    if (then !== 'splat' && then !== 'sit') tl.call(() => actor.setPose(then), [], t + 0.2);
  }

  /** Effects: lasting ones always apply; one-off particles and glows are skipped when silent. */
  fx(f: Fx, silent: boolean) {
    const eng = this.eng;
    switch (f.kind) {
      case 'speedlines': eng.setSpeedlines(f.on); return;
      case 'motion': eng.setMotion(f.on, f.dir); return;
      case 'fall': eng.setFallLines(f.on); return;
      case 'tint': eng.setTint(f.color, f.opacity); return;
      case 'vignette': eng.setVignette(f.on); return;
      case 'backdrop': eng.setBackdrop(f.style, f.color); return;
      case 'letterbox': eng.host.classList.toggle('letterbox', f.on); return;
      default: break;
    }
    if (silent || this.quiet()) return;
    switch (f.kind) {
      case 'word': eng.word(f.text, f.x, f.y, f.color); return;
      case 'burst': eng.burst(f.who, f.el); return;
      case 'sparkle': eng.sparkle(f.who, f.el, f.n); return;
      case 'confetti': eng.confetti(); return;
      case 'sprinkles': eng.sprinkles(f.dur); return;
      case 'dust': eng.dust(f.who); return;
      case 'splash': eng.splash(f.who, f.el, f.color); return;
      case 'hearts': eng.floaters(f.who, 'hearts'); return;
      case 'notes': eng.floaters(f.who, 'notes'); return;
      case 'glow': eng.glow(); return;
      case 'whiteout': eng.whiteout(f.dur); return;
      default: return;
    }
  }
}
