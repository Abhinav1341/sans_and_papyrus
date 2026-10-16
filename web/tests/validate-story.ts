// Checks the whole screenplay against the engine's catalogues before anything ships:
// sets and their elements, cast, poses, cycles, expressions, props, sounds, effects, inserts,
// rewards, line lengths and hard words (for readers aged 6-10), and that every actor an action
// or camera refers to is on stage.
// Run: npx tsx tests/validate-story.ts
import { WORLDS, CHAPTERS, flatten } from '../src/story';
import { COLLECTIBLES } from '../src/story/collectibles';
import { getSet, SET_IDS } from '../src/cinema/sets';
import { POSE_NAMES, CYCLE_NAMES } from '../src/art/poses';
import { EXPRS } from '../src/art/face';
import { FIZZ_EXPRS } from '../src/art/portrait';
import { PROPS } from '../src/cinema/props';
import { SOUND_IDS } from '../src/lib/sfx';
import { MOODS } from '../src/lib/music';
import { INSERT_IDS } from '../src/cinema/inserts';
import { isGate, isLine, isReward, isTitle, type Action, type Frame, type Fx } from '../src/cinema/types';

const CAST = new Set(['you', 'ro', 'meera', 'kiki', 'bunty', 'fizz']);
// Kid-friendly language: a line is read aloud and shown as a caption, so it stays short and plain.
const MAX_WORDS = 15, LONG_WORDS = 12;
const HARD_WORDS = /(behold|contestants?|magnificent|cruel(lest)?|mayhem|samples?|invitations?|competitions?|souvenirs?|furthermore|however|therefore|absolutely|definitely|apparently|extraordinary|ridiculous|ingredients?|technically|honestly)/i;
const SPEAKERS = new Set([...CAST, 'narrator']);
const EMOTES = new Set(['!', '?', 'sweat', 'note', 'anger', 'dots', 'heart', 'idea', 'zzz', 'sparkle', 'gloom', 'blush']);
const BACKDROPS = new Set(['rays', 'sparkle', 'gloom', 'dots', 'speed', 'hearts', 'shock', 'flat']);
const TRANS = new Set(['cut', 'fade', 'white', 'iris', 'wipe']);
const poses = new Set<string>(POSE_NAMES), cycles = new Set<string>(CYCLE_NAMES), exprs = new Set<string>(EXPRS), fizzExprs = new Set<string>(FIZZ_EXPRS);
const sounds = new Set<string>(SOUND_IDS), moods = new Set<string>(MOODS), inserts = new Set(INSERT_IDS);

const errors: string[] = [];
const warns: string[] = [];
let shots = 0, lines = 0, gates = 0, rewards = 0, actions = 0;

const chapterIds = new Set<string>();
for (const ch of CHAPTERS) {
  if (chapterIds.has(ch.id)) errors.push(`duplicate chapter id ${ch.id}`);
  chapterIds.add(ch.id);
  for (const k of ['title', 'teaser', 'recap'] as const) if (!ch[k]) errors.push(`${ch.id}: missing ${k}`);
  if (!ch.scenes.length) errors.push(`${ch.id}: no scenes`);
  const first = ch.scenes[0]?.shots[0];
  if (!first || !isTitle(first)) warns.push(`${ch.id}: does not open with a title card`);
  const sceneIds = new Set<string>();
  for (const sc of ch.scenes) {
    const at0 = `${ch.id}/${sc.id}`;
    if (sceneIds.has(sc.id)) errors.push(`${at0}: duplicate scene id`);
    sceneIds.add(sc.id);
    if (!SET_IDS.includes(sc.set)) { errors.push(`${at0}: unknown set ${sc.set}`); continue; }
    const set = getSet(sc.set);
    const els = new Set(Object.keys(set.els || {}));
    if (sc.mood && !moods.has(sc.mood)) errors.push(`${at0}: unknown mood ${sc.mood}`);
    if (sc.trans && !TRANS.has(sc.trans)) errors.push(`${at0}: unknown transition ${sc.trans}`);
    // Who is on stage and visible, tracked through the scene.
    const visible = new Map<string, boolean>();
    for (const p of sc.cast) {
      if (!CAST.has(p.id)) errors.push(`${at0}: unknown cast ${p.id}`);
      if (visible.has(p.id)) errors.push(`${at0}: ${p.id} placed twice`);
      visible.set(p.id, !p.hidden);
      if (p.x < -400 || p.x > set.w + 400) errors.push(`${at0}: ${p.id} placed off the set (x ${p.x})`);
      if (p.pose && !poses.has(p.pose)) errors.push(`${at0}: ${p.id} unknown pose ${p.pose}`);
      if (p.cycle && !cycles.has(p.cycle)) errors.push(`${at0}: ${p.id} unknown cycle ${p.cycle}`);
      if (p.expr && !(p.id === 'fizz' ? fizzExprs : exprs).has(p.expr)) errors.push(`${at0}: ${p.id} unknown expression ${p.expr}`);
      if (p.prop && !(p.prop in PROPS)) errors.push(`${at0}: ${p.id} unknown prop ${p.prop}`);
    }
    const checkWho = (where: string, id: string | undefined | null, needVisible = false) => {
      if (!id) return;
      if (!visible.has(id)) errors.push(`${where}: ${id} is not in this scene`);
      else if (needVisible && !visible.get(id)) warns.push(`${where}: ${id} is hidden at this point`);
    };
    const checkFrame = (where: string, f: Frame) => {
      if ('full' in f) (Array.isArray(f.full) ? f.full : [f.full]).forEach((id) => checkWho(where, id, true));
      else if ('medium' in f) (Array.isArray(f.medium) ? f.medium : [f.medium]).forEach((id) => checkWho(where, id, true));
      else if ('close' in f) checkWho(where, f.close, true);
      else if ('xclose' in f) checkWho(where, f.xclose, true);
      else if ('low' in f) checkWho(where, f.low, true);
      else if ('el' in f) { if (!els.has(f.el)) errors.push(`${where}: camera on unknown element ${f.el}`); }
      else if ('wide' in f) { if (f.wide < 0 || f.wide > set.w) warns.push(`${where}: wide shot centred off the set`); }
    };
    const checkFx = (where: string, fx: Fx) => {
      switch (fx.kind) {
        case 'backdrop': if (fx.style && !BACKDROPS.has(fx.style)) errors.push(`${where}: unknown backdrop ${fx.style}`); break;
        case 'burst': case 'sparkle': case 'splash': if ('who' in fx && fx.who) checkWho(where, fx.who); if ('el' in fx && fx.el && !els.has(fx.el)) errors.push(`${where}: fx on unknown element ${fx.el}`); break;
        case 'dust': case 'hearts': case 'notes': checkWho(where, fx.who); break;
        default: break;
      }
    };
    sc.shots.forEach((sh, i) => {
      shots++;
      const at = `${ch.id}/${sc.id}#${i}`;
      const kinds = [isTitle(sh), isGate(sh), isReward(sh)].filter(Boolean).length;
      if (kinds > 1) errors.push(`${at}: more than one of title/gate/reward`);
      if (isTitle(sh)) { if (!sh.title.ep || !sh.title.name || !sh.title.sub) errors.push(`${at}: title needs ep, name and sub`); return; }
      if (isGate(sh)) { gates++; for (const k of ['id', 'title', 'ask'] as const) if (!sh.gate[k]) errors.push(`${at}: gate missing ${k}`); if (!CAST.has(sh.gate.by)) errors.push(`${at}: gate asked by unknown ${sh.gate.by}`); return; }
      if (isReward(sh)) { rewards++; if (!COLLECTIBLES[sh.reward]) errors.push(`${at}: unknown reward ${sh.reward}`); return; }
      if (!isLine(sh)) return;
      if (sh.t && sh.n) errors.push(`${at}: both dialogue and narration`);
      if (sh.t && !sh.who) errors.push(`${at}: dialogue without a speaker`);
      if (sh.who && !SPEAKERS.has(sh.who)) errors.push(`${at}: unknown speaker ${sh.who}`);
      if (sh.who && sh.who !== 'narrator' && !visible.has(sh.who)) warns.push(`${at}: ${sh.who} speaks but is not in the scene (voice off-screen)`);
      if (sh.mood && !moods.has(sh.mood)) errors.push(`${at}: unknown mood ${sh.mood}`);
      if (sh.trans && !TRANS.has(sh.trans)) errors.push(`${at}: unknown transition ${sh.trans}`);
      if (sh.insert && !inserts.has(sh.insert)) errors.push(`${at}: unknown insert ${sh.insert}`);
      for (const p of sh.panels || []) {
        if (!CAST.has(p.who)) errors.push(`${at}: panel for unknown ${p.who}`);
        if (!(p.who === 'fizz' ? fizzExprs : exprs).has(p.expr)) errors.push(`${at}: panel ${p.who} unknown expression ${p.expr}`);
        if (p.bg && !BACKDROPS.has(p.bg)) errors.push(`${at}: panel unknown background ${p.bg}`);
      }
      const text = sh.t ?? sh.n;
      if (text) {
        lines++;
        const words = text.split(/\s+/).filter((w) => /[A-Za-z0-9{]/.test(w)).length;
        if (words > MAX_WORDS) errors.push(`${at}: ${words} words (keep lines to ${MAX_WORDS} words or fewer for young readers)`);
        else if (words > LONG_WORDS) warns.push(`${at}: ${words} words (a long line for young readers)`);
        const hard = text.match(HARD_WORDS);
        if (hard) warns.push(`${at}: "${hard[0]}" is a hard word for ages 6-10`);
      } else if (!sh.act?.length && !sh.insert && !sh.panels) warns.push(`${at}: an empty shot`);
      if (sh.cam) {
        // Someone who arrives during this shot (enters, drops in, appears) may be framed from the start.
        const arriving = (sh.act || []).filter((a) => a.do === 'enter' || a.do === 'fall' || a.do === 'show').map((a) => ('who' in a ? (a.who as string) : ''));
        const before = new Map(visible);
        arriving.forEach((id) => { if (visible.has(id)) visible.set(id, true); });
        checkFrame(`${at} cam`, sh.cam);
        before.forEach((v, k) => visible.set(k, v));
      }
      // Actions in time order, tracking visibility.
      const acts: Action[] = [...(sh.act || [])].sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
      for (const a of acts) {
        actions++;
        const w = `${at} ${a.do}`;
        if ('who' in a && a.do !== 'track') checkWho(w, a.who as string);
        switch (a.do) {
          case 'pose': if (!poses.has(a.pose)) errors.push(`${w}: unknown pose ${a.pose}`); if (a.who === 'fizz') warns.push(`${w}: Fizz has no poses`); break;
          case 'move': case 'jump': case 'enter': if ('then' in a && a.then && !poses.has(a.then)) errors.push(`${w}: unknown pose ${a.then}`); if (a.do === 'enter') visible.set(a.who, true); break;
          case 'cycle': if (a.cycle && !cycles.has(a.cycle)) errors.push(`${w}: unknown cycle ${a.cycle}`); break;
          case 'expr': if (!(a.who === 'fizz' ? fizzExprs : exprs).has(a.expr)) errors.push(`${w}: ${a.who} has no expression ${a.expr}`); break;
          case 'emote': if (!EMOTES.has(a.emote)) errors.push(`${w}: unknown emote ${a.emote}`); break;
          case 'prop': if (a.prop && !(a.prop in PROPS)) errors.push(`${w}: unknown prop ${a.prop}`); break;
          case 'show': case 'fall': visible.set(a.who, true); break;
          case 'hide': case 'exit': visible.set(a.who, false); break;
          case 'ride': if (a.on && !els.has(a.on) && !CAST.has(a.on)) errors.push(`${w}: ride on unknown ${a.on}`); if (a.on && CAST.has(a.on)) checkWho(w, a.on); break;
          case 'el': if (!els.has(a.el)) errors.push(`${w}: unknown element ${a.el} in set ${sc.set}`); break;
          case 'cam': checkFrame(w, a.to); break;
          case 'track': if (a.who) checkWho(w, a.who); break;
          case 'fx': checkFx(w, a.fx); break;
          case 'sfx': if (!sounds.has(a.snd)) errors.push(`${w}: unknown sound ${a.snd}`); break;
          case 'stretch': if (a.who !== 'ro') warns.push(`${w}: only Ro stretches`); break;
          default: break;
        }
      }
      if (sh.move) checkFrame(`${at} move`, sh.move);
    });
  }
}

import { CHAPTER_IDS } from '../src/story/ids';
if (CHAPTER_IDS.join() !== CHAPTERS.map((c) => c.id).join()) errors.push(`src/story/ids.ts does not match the chapters: ${CHAPTERS.map((c) => c.id).join(', ')}`);
const given = new Set(CHAPTERS.flatMap((c) => flatten(c).map((f) => f.shot)).filter(isReward).map((s) => s.reward));
for (const id of Object.keys(COLLECTIBLES)) if (!given.has(id)) errors.push(`collectible ${id} is never given in the story`);

console.log(`worlds ${WORLDS.length}, playable chapters ${CHAPTERS.length}, shots ${shots}, spoken lines ${lines}, actions ${actions}, task gates ${gates}, rewards ${rewards}`);
warns.forEach((w) => console.log('WARN ', w));
errors.forEach((e) => console.log('ERROR', e));
console.log(errors.length ? `FAILED with ${errors.length} error(s)` : 'OK: the screenplay is valid');
process.exit(errors.length ? 1 : 0);
