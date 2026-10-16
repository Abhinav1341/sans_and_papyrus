// WORLD 1: "The Candy Nebula". Five chapters, written as a screenplay for the cinema engine.
// Arc: Ro races ahead to win alone and finds that winning alone is empty; Bunty's "useless"
// Sticky Fingers (planted in chapter 1) saves the raft (chapter 3); Ro's toffee arm, first a joke,
// becomes the ladder that brings everyone up (chapter 5). Feelings in focus: excitement, pride,
// embarrassment, loneliness, joy. Shown through action, never explained as a lesson.
// Every chapter opens on the land itself (seen from the sky) before it meets the crew, so children
// always know where they are. Task gates are side quests: the story only opens the gate, then carries on.
// Language for ages 6-10: short lines read aloud, everyday words, present tense, sound words.
import type { World, Action, CastId } from '@/cinema/types';
import { BEAN_X, SINK_X, POLE_X, COURSE, BEAN_TOP, GUMBALL_TOP, SHIELD, LOLLI_X, PATH, SEATS } from '@/cinema/sets/candy-layout';

const EVENING = { color: '#5a3fa0', opacity: 0.32 };
const all = (ids: CastId[], fn: (id: CastId, i: number) => Action[]): Action[] => ids.flatMap(fn);
const KIDS: CastId[] = ['you', 'ro', 'meera', 'kiki', 'bunty'];
/** Who stands at which giant lollipop in chapter 4, left to right. */
const LINE: CastId[] = ['kiki', 'meera', 'you', 'bunty', 'ro'];

/** Where the gumball (radius 15) sits on Kiki's hair in chapter 1, from its spot at (1200, 560): her head top is 291 above her feet (715). */
const KIKI_HEAD_HIT = 715 - 291 - 15 + 4 - 560;

/** Landing in the candy-floss cloud: it squashes and puffs out, and the child sinks in, then bobs back up. */
const flossLand = (who: CastId, at: number): Action[] => [
  { do: 'el', el: 'floss', to: { scale: 0.92 }, dur: 0.1, yoyo: 1, at }, { do: 'el', el: 'flossfront', to: { scale: 0.9 }, dur: 0.1, yoyo: 1, at },
  { do: 'fx', fx: { kind: 'splash', who, color: '#ffd1e8' }, at }, { do: 'sfx', snd: 'squish', at },
  { do: 'lift', who, to: -38, dur: 0.16, ease: 'out', at: at + 0.02 }, { do: 'lift', who, to: 0, dur: 0.7, ease: 'elastic', at: at + 0.18 },
];

/* ---------- The Jelly Bean Bounce (chapter 2) ---------- */
const B = BEAN_X;
/** Where everyone stands past the finish line (Ro, who got there first, is under the arch). */
const FINISH = { bunty: 6430, you: 6535, meera: 6645, kiki: 6755, ro: 6865 } as const;
/** Where Kiki's hand is when she pops the gumballs (her spot at the edge of bean 15). */
const KIKI_POP = B[14] + 100;
const SHIELD_X = SHIELD.x, SHIELD_Y = SHIELD.top;
/** The top of Meera's head above her feet (Kiki stands on it). */
const MEERA_HEAD = 312;

/** How far Ro's toffee arm must stretch for his hand to reach a point `dist` in front of him (shoulder 27 + upper arm 40 + 36 per stretch). */
const reach = (dist: number) => Math.round(((dist - 67) / 36) * 10) / 10;

/** A bounce from bean to bean: the jump, and the bean dipping under the landing. */
function hop(who: CastId, to: number, at: number, bean?: string, o: { h?: number; dur?: number; y?: number } = {}): Action[] {
  const dur = o.dur ?? 0.6;
  const acts: Action[] = [{ do: 'jump', who, to, h: o.h ?? 140, dur, at, ...(o.y !== undefined ? { y: o.y } : {}) }];
  if (bean) acts.push({ do: 'el', el: bean, to: { scale: 0.93 }, dur: 0.1, yoyo: 1, at: at + 0.14 + dur });
  return acts;
}

/**
 * Ro, his toffee arm already hooked round a pole: he pulls himself to it (the arm shrinks as he
 * flies, so his hand stays on the pole), swings round it and flies on to `land`. Starts on the
 * spoken word `atWord` when given, else at `at` seconds.
 */
function swing(who: CastId, poleX: number, land: number, atWord?: number, at = 0, h = 240, dur = 0.95): Action[] {
  const t = (dt: number) => (atWord === undefined ? { at: at + dt } : { atWord, at: dt });
  return [
    { do: 'move', who, to: poleX - 103, gait: 'fly', ease: 'linear', dur: 0.3, then: 'stretchArm', ...t(0) },
    { do: 'stretch', who, len: 1, dur: 0.3, ease: 'linear', ...t(0) }, { do: 'lift', who, to: 40, dur: 0.3, ...t(0) },
    { do: 'fx', fx: { kind: 'word', text: 'ZOOM!', color: '#ff9b85' }, ...t(0) }, { do: 'sfx', snd: 'whoosh', ...t(0) },
    { do: 'fx', fx: { kind: 'motion', on: true, dir: 'left' }, ...t(0) }, { do: 'track', who, lead: 60, ...t(0) },
    { do: 'jump', who, to: land, h, dur, ...t(0.3) }, { do: 'spin', who, turns: 1, dur: 0.6, ...t(0.44) },
    { do: 'fx', fx: { kind: 'motion', on: false }, ...t(1.5) },
  ];
}

/** Someone lands on Meera's shield springboard. */
const boing = (at: number): Action[] => [
  { do: 'el', el: 'shieldboard', to: { scale: 0.85 }, dur: 0.08, yoyo: 1, at }, { do: 'sfx', snd: 'boing', at },
  { do: 'fx', fx: { kind: 'word', text: 'BOING!', color: '#ff9fcf' }, at },
];

/**
 * Kiki's gumball `i` arcs over from her hand and lands on sinking bean `i` exactly as the word is
 * spoken; the bean sinks away under it and the gumball floats in its place.
 */
function gumballDrop(i: number, x: number, word: number): Action[] {
  const el = `gs${i + 1}`;
  return [
    { do: 'el', el, to: { x: KIKI_POP - x, y: -420, scale: 0.45, opacity: 1 }, dur: 0.01, atWord: word, at: -0.52 },
    { do: 'el', el, to: { x: 0 }, dur: 0.48, ease: 'linear', atWord: word, at: -0.5 },
    { do: 'el', el, to: { y: 0, scale: 1 }, dur: 0.48, ease: 'in', atWord: word, at: -0.5 },
    { do: 'sfx', snd: 'pop', atWord: word, at: -0.5 },
    { do: 'sfx', snd: 'splash', atWord: word }, { do: 'fx', fx: { kind: 'splash', el, color: '#ff9fc8' }, atWord: word },
    { do: 'el', el: `k${i + 1}`, to: { y: 150 }, dur: 0.9, ease: 'in', atWord: word, at: 0.05 },
    { do: 'el', el, to: { scale: 1.08 }, dur: 0.12, yoyo: 1, atWord: word, at: 0.02 },
  ];
}

/** Hopping across the three floating gumballs (feet on their tops), then on along `after`. */
function stones(who: CastId, at: number, after: number[]): Action[] {
  const acts = SINK_X.flatMap((x, i) => hop(who, x, at + i * 0.8, undefined, { y: GUMBALL_TOP, h: 120 }));
  after.forEach((x, i) => acts.push(...hop(who, x, at + (SINK_X.length + i) * 0.8, undefined, { y: BEAN_TOP })));
  return acts;
}

export const candy: World = {
  id: 'candy',
  kind: 'candy',
  label: 'World 1',
  title: 'The Candy Nebula',
  chapters: [
    /* ======================= Chapter 1: Sweet Landing ======================= */
    {
      id: 'c-1',
      title: 'Sweet Landing',
      teaser: 'Jelly hills, gumdrop rocks, and five silly powers.',
      recap: 'Everyone got a candy power. Bunty got Sticky Fingers. Ro’s arm got tied in a bow.',
      scenes: [
        {
          // Falling through candy-floss clouds, then a tour of the land from the sky.
          id: 'c1-sky', set: 'vista', mood: 'wonder', cam: { at: [1800, 300, 0.9] },
          cast: [
            { id: 'kiki', x: 1700, y: 470, s: 0.5, cycle: 'float', expr: 'laugh' }, { id: 'ro', x: 1790, y: 420, s: 0.5, cycle: 'float', expr: 'grin' },
            { id: 'you', x: 1860, y: 500, s: 0.5, cycle: 'float', expr: 'happy' }, { id: 'meera', x: 1940, y: 450, s: 0.5, cycle: 'float', expr: 'shock' },
            { id: 'bunty', x: 1750, y: 545, s: 0.5, cycle: 'float', expr: 'love' },
          ],
          shots: [
            { title: { ep: 'WORLD 1', name: 'Sweet Landing', sub: 'The Candy Nebula · Chapter 1' } },
            {
              cam: { at: [1800, 300, 0.9] }, move: { at: [1800, 900, 0.9] }, moveDur: 7, act: [
                { do: 'move', who: 'kiki', to: 1680, y: 1070, gait: 'fly', dur: 7 }, { do: 'move', who: 'ro', to: 1800, y: 1020, gait: 'fly', dur: 7 },
                { do: 'move', who: 'you', to: 1880, y: 1100, gait: 'fly', dur: 7 }, { do: 'move', who: 'meera', to: 1960, y: 1050, gait: 'fly', dur: 7 },
                { do: 'move', who: 'bunty', to: 1740, y: 1140, gait: 'fly', dur: 7 }, { do: 'spin', who: 'bunty', turns: 1, dur: 2, at: 2 }, { do: 'sfx', snd: 'wind' },
              ], n: 'Down, down, down they float, through clouds of candy floss.', lineAt: 0.8,
            },
            {
              cam: { at: [400, 1356, 0.72] }, move: { at: [2600, 1356, 0.72] }, moveDur: 9,
              act: [...all(KIDS, (id) => [{ do: 'hide', who: id } as Action]), { do: 'sfx', snd: 'chime', at: 0.6 }],
              n: 'Below them is the Candy Nebula. Everything here is made of sweets!', lineAt: 0.8,
            },
            { cam: { el: 'river', zoom: 1.0, dy: -60 }, move: { el: 'river', zoom: 1.3, dy: -40 }, moveDur: 5, n: 'A chocolate river. Jelly hills. Lollipop trees as tall as houses!' },
            { cam: { el: 'peak', zoom: 0.75, dy: 300 }, move: { el: 'peak', zoom: 1.1, dy: 130 }, moveDur: 6, act: [{ do: 'sfx', snd: 'chime', at: 2.4 }, { do: 'fx', fx: { kind: 'sparkle', el: 'peak', n: 10 }, at: 2.6 }], n: 'And far away, on top of Sugar Mountain, something glows.' },
          ],
        },
        {
          id: 'c1-land', set: 'candyland', mood: 'playful', trans: 'white', cam: { wide: 560, zoom: 0.8 },
          cast: [
            { id: 'kiki', x: 380, hidden: true }, { id: 'ro', x: 470, hidden: true }, { id: 'you', x: 560, hidden: true },
            { id: 'bunty', x: 660, hidden: true }, { id: 'meera', x: 1020, y: 590, s: 1, hidden: true },
            { id: 'fizz', x: 520, lift: 230, hidden: true },
          ],
          shots: [
            {
              cam: { wide: 560, zoom: 0.8 }, act: [
                { do: 'enter', who: 'ro', from: 'top', to: 470, dur: 0.9 }, { do: 'enter', who: 'kiki', from: 'top', to: 380, dur: 0.9, at: 0.15 },
                { do: 'enter', who: 'you', from: 'top', to: 560, dur: 0.9, at: 0.3 }, { do: 'fall', who: 'bunty', from: 900, dur: 1.0, land: 'sit', at: 0.45 },
                ...([['ro', 0.9], ['kiki', 1.05], ['you', 1.2], ['bunty', 1.45]] as [CastId, number][]).flatMap(([id, t]) => flossLand(id, t)),
                { do: 'fx', fx: { kind: 'word', text: 'SPLOOSH!', color: '#ff9fcf' }, at: 1.0 },
              ], n: 'SPLOOSH! The crew lands in a big pink cloud of candy floss.', lineAt: 1.9,
            },
            { cam: { medium: 'kiki' }, act: [{ do: 'pose', who: 'kiki', pose: 'holdFront' }, { do: 'prop', who: 'kiki', prop: 'candyfloss' }, { do: 'expr', who: 'kiki', expr: 'love' }, { do: 'fx', fx: { kind: 'sparkle', who: 'kiki' } }], who: 'kiki', t: 'The grass is JELLY. The rocks are GUMDROPS. I live here now!' },
            {
              cam: { full: 'meera' }, act: [
                { do: 'enter', who: 'meera', from: 'top', to: 1020, dur: 0.9 }, { do: 'el', el: 'jellyhill', to: { scale: 1.06 }, dur: 0.18, yoyo: 3, at: 0.9 },
                { do: 'cycle', who: 'meera', cycle: 'tremble', at: 1.1 }, { do: 'expr', who: 'meera', expr: 'worried', at: 1.0 }, { do: 'sfx', snd: 'wobble', at: 1.0 },
              ], who: 'meera', t: 'Uh-oh. Something is wobbling under my feet...', lineAt: 1.4,
            },
            {
              cam: { full: 'meera' }, act: [
                { do: 'cycle', who: 'meera', cycle: 'bounce' }, { do: 'expr', who: 'meera', expr: 'laugh', at: 0.6 }, { do: 'el', el: 'jellyhill', to: { scale: 0.94 }, dur: 0.33, yoyo: 4 },
                { do: 'sfx', snd: 'boing', at: 0.3 }, { do: 'sfx', snd: 'boing', at: 1.0 }, { do: 'sfx', snd: 'boing', at: 1.7 },
              ], n: 'It’s a jelly hill! Meera bounces. Up... and down... and up.',
            },
            { cam: { medium: 'meera' }, act: [{ do: 'cycle', who: 'meera', cycle: null }, { do: 'pose', who: 'meera', pose: 'relaxed' }, { do: 'expr', who: 'meera', expr: 'happy' }], who: 'meera', t: 'Okay. Okay. That IS fun.' },
            {
              cam: { wide: 620, zoom: 0.78 }, act: [
                { do: 'jump', who: 'meera', to: 860, y: 716, h: 110, dur: 0.8, at: 0.1 },
                { do: 'show', who: 'fizz' }, { do: 'enter', who: 'fizz', from: 'right', to: 520, gait: 'fly', dur: 1.0 }, { do: 'lift', who: 'fizz', to: 230, dur: 0.01 },
                { do: 'expr', who: 'fizz', expr: 'excited' }, { do: 'fx', fx: { kind: 'sparkle', who: 'fizz', n: 10 }, at: 1.0 }, { do: 'sfx', snd: 'fanfare', at: 1.0 },
                { do: 'pose', who: 'bunty', pose: 'stand', at: 0.4 },
                ...all(['kiki', 'ro', 'you', 'bunty', 'meera'], (id, i) => [{ do: 'expr', who: id, expr: 'shock', at: 1.0 + i * 0.05 } as Action]),
              ], who: 'fizz', t: 'Hello, crew! It’s time for your CANDY POWERS!', lineAt: 1.1,
            },
            { cam: { close: 'fizz' }, act: [{ do: 'expr', who: 'fizz', expr: 'happy' }], who: 'fizz', t: 'Ro! TOFFEE STRETCH! You can stretch like warm toffee!' },
            {
              cam: { close: 'ro' }, act: [
                { do: 'pose', who: 'ro', pose: 'yay' }, { do: 'expr', who: 'ro', expr: 'grin' }, { do: 'sfx', snd: 'magic' },
                { do: 'fx', fx: { kind: 'aura', who: 'ro', color: '#ff9b85', on: true } }, { do: 'fx', fx: { kind: 'backdrop', style: 'rays', color: '#ff9b85' } },
                { do: 'fx', fx: { kind: 'power', name: 'Toffee Stretch', color: '#ff8f7e', icon: 'toffee' }, at: 0.2 }, { do: 'fx', fx: { kind: 'backdrop', style: null }, at: 2.2 },
              ], who: 'ro', t: 'Let’s GO!', lineAt: 0.9,
            },
            {
              cam: { full: 'ro' }, act: [
                { do: 'face', who: 'ro', dir: 1 }, { do: 'pose', who: 'ro', pose: 'stretchArm' }, { do: 'stretch', who: 'ro', len: 42, dur: 2.6, at: 0.3 },
                { do: 'cam', to: { el: 'lolli', zoom: 0.9, dy: -240 }, dur: 2.6, at: 0.3 }, { do: 'sfx', snd: 'stretch', at: 0.3 }, { do: 'sfx', snd: 'stretch', at: 1.3 },
                { do: 'fx', fx: { kind: 'word', text: 'BOINNNG!', color: '#ff9b85' }, at: 1.6 }, { do: 'fx', fx: { kind: 'motion', on: true, dir: 'left' }, at: 0.3 }, { do: 'fx', fx: { kind: 'motion', on: false }, at: 2.9 },
                { do: 'sfx', snd: 'clink', at: 2.9 }, { do: 'el', el: 'lolli', to: { rot: 3 }, dur: 0.12, yoyo: 2, at: 2.9 }, { do: 'fx', fx: { kind: 'aura', who: 'ro', color: '#ff9b85', on: false }, at: 2.9 },
              ], n: 'Ro reaches out. His arm goes on... and on... and on.', lineAt: 0.5,
            },
            { cam: { close: 'ro' }, act: [{ do: 'expr', who: 'ro', expr: 'dizzy' }, { do: 'emote', who: 'ro', emote: 'sweat', at: 0.2 }], who: 'ro', t: 'HOW DO I GET IT BACK?' },
            {
              cam: { full: 'ro' }, act: [
                { do: 'fx', fx: { kind: 'motion', on: true, dir: 'right' } }, { do: 'stretch', who: 'ro', len: 1, dur: 0.45 }, { do: 'sfx', snd: 'snap', at: 0.35 },
                { do: 'fx', fx: { kind: 'word', text: 'SNAP!', color: '#ffd36e' }, at: 0.4 }, { do: 'fx', fx: { kind: 'motion', on: false }, at: 0.5 },
                { do: 'spin', who: 'ro', turns: 1, dur: 0.5, at: 0.45 }, { do: 'pose', who: 'ro', pose: 'stand', at: 0.5 }, { do: 'expr', who: 'ro', expr: 'shock', at: 0.5 },
              ], n: 'SNAP! The arm springs back like a rubber band...', lineAt: 0.7,
            },
            { insert: 'knot', act: [{ do: 'sfx', snd: 'stretch', at: 0.2 }, { do: 'sfx', snd: 'pop', at: 1.15 }, { do: 'sfx', snd: 'boing', at: 1.4 }, { do: 'prop', who: 'ro', prop: 'bow', at: 1.2 }], n: '...and ties itself in a little bow.', lineAt: 0.2, hold: 0.6 },
            { cam: { close: 'ro' }, act: [{ do: 'pose', who: 'ro', pose: 'facepalm' }, { do: 'expr', who: 'ro', expr: 'worried' }, { do: 'emote', who: 'ro', emote: 'blush', at: 0.3 }], who: 'ro', t: 'Nobody saw that. Okay?' },
            { cam: { close: 'fizz' }, act: [{ do: 'expr', who: 'fizz', expr: 'excited' }], who: 'fizz', t: 'Kiki! GUMBALL POPPER!' },
            {
              cam: { full: 'kiki' }, act: [
                { do: 'face', who: 'kiki', dir: 1 }, { do: 'expr', who: 'kiki', expr: 'grin' }, { do: 'sfx', snd: 'magic' },
                { do: 'fx', fx: { kind: 'aura', who: 'kiki', color: '#ff7ab8', on: true } }, { do: 'fx', fx: { kind: 'power', name: 'Gumball Popper', color: '#ff7ab8', icon: 'gumball' }, at: 0.2 },
                { do: 'pose', who: 'kiki', pose: 'holdUp', at: 0.4 }, { do: 'prop', who: 'kiki', prop: 'gumball', at: 0.5 }, { do: 'fx', fx: { kind: 'sparkle', who: 'kiki', n: 10 }, at: 0.5 }, { do: 'sfx', snd: 'chime', at: 0.5 },
              ], who: 'kiki', t: 'Ooh, a button! What does THIS do?', lineAt: 1.0,
            },
            // The gumball leaves her hand on "pops" and hits the tree, the rock and the cloud exactly as each is named.
            {
              cam: { at: [600, 470, 0.72] }, act: [
                { do: 'fx', fx: { kind: 'aura', who: 'kiki', color: '#ff7ab8', on: false } }, { do: 'pose', who: 'kiki', pose: 'point' }, { do: 'pose', who: 'ro', pose: 'stand' },
                { do: 'el', el: 'gumball', to: { x: -717, y: -13, opacity: 1, scale: 1 }, dur: 0.01, atWord: 1, at: -0.02 }, { do: 'sfx', snd: 'pop', atWord: 1 },
                { do: 'cam', to: { at: [1300, 470, 0.72] }, atWord: 1, toWord: 7 },
                { do: 'el', el: 'gumball', to: { x: 94 }, ease: 'linear', atWord: 1, toWord: 7 },
                { do: 'el', el: 'gumball', to: { y: -260 }, ease: 'out', atWord: 1, toWord: 5 }, { do: 'el', el: 'gumball', to: { y: -108 }, ease: 'in', atWord: 5, toWord: 7 },
                { do: 'sfx', snd: 'bonk', atWord: 7 }, { do: 'el', el: 'tree', to: { rot: 4 }, dur: 0.12, yoyo: 2, atWord: 7 },
                { do: 'el', el: 'gumball', to: { x: 360 }, ease: 'linear', atWord: 7, toWord: 9 }, { do: 'el', el: 'gumball', to: { y: 70 }, ease: 'in', atWord: 7, toWord: 9 },
                { do: 'sfx', snd: 'bonk', atWord: 9 }, { do: 'el', el: 'rock', to: { scale: 0.9 }, dur: 0.1, yoyo: 1, atWord: 9 },
                { do: 'el', el: 'gumball', to: { x: 260 }, ease: 'linear', atWord: 9, toWord: 11 }, { do: 'el', el: 'gumball', to: { y: -230 }, ease: 'out', atWord: 9, toWord: 11 },
                { do: 'sfx', snd: 'boing', atWord: 11 }, { do: 'el', el: 'skycloud', to: { scale: 1.1 }, dur: 0.15, yoyo: 1, atWord: 11 },
                { do: 'el', el: 'gumball', to: { x: -400, y: -560 }, dur: 0.8, ease: 'out', atWord: 11, at: 0.05 },
              ], n: 'Kiki pops a gumball. It hits a tree, a rock, a cloud...', lineAt: 0.3,
            },
            // ...then it drops out of the sky and lands right on her head, on the word "head".
            {
              cam: { full: 'kiki' }, act: [
                { do: 'el', el: 'gumball', to: { x: -820, y: -720 }, dur: 0.01 }, { do: 'look', who: 'kiki', gaze: 'cam' },
                { do: 'el', el: 'gumball', to: { y: KIKI_HEAD_HIT }, ease: 'in', atWord: 2, toWord: 6 },
                { do: 'sfx', snd: 'bonk', atWord: 6 }, { do: 'fx', fx: { kind: 'burst', who: 'kiki' }, atWord: 6 }, { do: 'squash', who: 'kiki', amt: 0.2, atWord: 6 },
                { do: 'expr', who: 'kiki', expr: 'dizzy', atWord: 6 }, { do: 'pose', who: 'kiki', pose: 'stand', atWord: 6 },
                { do: 'el', el: 'gumball', to: { x: -660 }, dur: 0.7, ease: 'linear', atWord: 6, at: 0.04 }, { do: 'el', el: 'gumball', to: { y: -330 }, dur: 0.3, ease: 'out', atWord: 6, at: 0.04 },
                { do: 'el', el: 'gumball', to: { y: 150, opacity: 0 }, dur: 0.4, ease: 'in', atWord: 6, at: 0.34 },
                { do: 'fx', fx: { kind: 'word', text: 'BONK!', color: '#ff9fcf' }, atWord: 7 },
              ], n: '...and it drops right on Kiki’s head. BONK!', lineAt: 0.3,
            },
            { cam: { close: 'kiki' }, act: [{ do: 'look', who: 'kiki', gaze: 'fwd' }, { do: 'expr', who: 'kiki', expr: 'laugh' }, { do: 'pose', who: 'kiki', pose: 'cheer' }, { do: 'hop', who: 'kiki', n: 2 }], who: 'kiki', t: 'AGAIN!' },
            { cam: { close: 'fizz' }, act: [{ do: 'pose', who: 'kiki', pose: 'stand' }, { do: 'prop', who: 'kiki', prop: null }], who: 'fizz', t: 'Meera! CANDY SHIELD! Strong and shiny!' },
            {
              cam: { full: 'meera' }, act: [
                { do: 'expr', who: 'meera', expr: 'determined' }, { do: 'fx', fx: { kind: 'aura', who: 'meera', color: '#7fe6c9', on: true } }, { do: 'sfx', snd: 'magic' },
                { do: 'fx', fx: { kind: 'power', name: 'Candy Shield', color: '#5ccfae', icon: 'shield' }, at: 0.2 },
                { do: 'pose', who: 'meera', pose: 'holdUp', at: 0.5 }, { do: 'prop', who: 'meera', prop: 'shield', at: 0.6 }, { do: 'fx', fx: { kind: 'burst', who: 'meera' }, at: 0.6 }, { do: 'sfx', snd: 'chime', at: 0.6 },
                { do: 'pose', who: 'meera', pose: 'present', at: 1.2 }, { do: 'fx', fx: { kind: 'sparkle', who: 'meera', n: 10 }, at: 1.2 },
              ], who: 'meera', t: 'Finally! A power that makes sense.', lineAt: 1.3,
            },
            {
              cam: { at: [760, 560, 1.5] }, act: [
                { do: 'fx', fx: { kind: 'aura', who: 'meera', color: '#7fe6c9', on: false } }, { do: 'move', who: 'kiki', to: 660, gait: 'tiptoe', dur: 0.9 }, { do: 'move', who: 'bunty', to: 712, gait: 'tiptoe', dur: 0.6, at: 0.2 }, { do: 'face', who: 'bunty', dir: 1, at: 0.9 },
                { do: 'pose', who: 'kiki', pose: 'lick', at: 1.0 }, { do: 'pose', who: 'bunty', pose: 'lick', at: 1.1 }, { do: 'expr', who: 'kiki', expr: 'tongue', at: 1.0 }, { do: 'expr', who: 'bunty', expr: 'tongue', at: 1.1 },
              ], n: 'Her shield is round. It is shiny. It looks very, very lickable.', lineAt: 0.5,
            },
            { cam: { close: 'meera' }, act: [{ do: 'place', who: 'kiki', x: 380 }, { do: 'place', who: 'bunty', x: 660 }, { do: 'expr', who: 'meera', expr: 'grumpy' }, { do: 'emote', who: 'meera', emote: 'anger' }, { do: 'fx', fx: { kind: 'backdrop', style: 'gloom', color: '#5ccfae' } }, { do: 'fx', fx: { kind: 'backdrop', style: null }, at: 2.6 }], who: 'meera', t: 'Nobody. Licks. The shield.' },
            { cam: { close: 'fizz' }, act: [{ do: 'pose', who: 'kiki', pose: 'stand' }, { do: 'pose', who: 'bunty', pose: 'stand' }, { do: 'face', who: 'bunty', dir: 1 }, { do: 'expr', who: 'kiki', expr: 'grin' }, { do: 'expr', who: 'bunty', expr: 'grin' }], who: 'fizz', t: 'And Bunty! STICKY... FINGERS! Everything you touch gets sticky!' },
            {
              cam: { full: 'bunty' }, tone: 'sad', act: [
                { do: 'expr', who: 'bunty', expr: 'love' }, { do: 'fx', fx: { kind: 'aura', who: 'bunty', color: '#ffb38a', on: true } }, { do: 'sfx', snd: 'magic' },
                { do: 'fx', fx: { kind: 'power', name: 'Sticky Fingers', color: '#ff9b6a', icon: 'sticky' }, at: 0.2 },
                { do: 'pose', who: 'bunty', pose: 'reach', at: 0.9 }, { do: 'prop', who: 'bunty', prop: 'gumdrop', at: 1.2 }, { do: 'sfx', snd: 'squish', at: 1.2 },
                { do: 'fx', fx: { kind: 'aura', who: 'bunty', color: '#ffb38a', on: false }, at: 1.6 },
                { do: 'expr', who: 'bunty', expr: 'sad', at: 1.7 }, { do: 'pose', who: 'bunty', pose: 'slump', at: 1.8 }, { do: 'emote', who: 'bunty', emote: 'gloom', at: 1.9 }, { do: 'sfx', snd: 'sad', at: 1.9 },
              ], who: 'bunty', t: 'That’s it? That’s just... my normal hands.', lineAt: 2.0,
            },
            { cam: { wide: 620, zoom: 0.78 }, act: [{ do: 'sfx', snd: 'drumroll' }, { do: 'expr', who: 'fizz', expr: 'excited' }, { do: 'prop', who: 'bunty', prop: null }, { do: 'pose', who: 'bunty', pose: 'stand' }, { do: 'expr', who: 'bunty', expr: 'normal' }], who: 'fizz', t: 'And our Captain {name} gets...' },
            {
              cam: { low: 'you' }, mood: 'triumph', act: [
                { do: 'pose', who: 'you', pose: 'crouch' }, { do: 'expr', who: 'you', expr: 'determined' }, { do: 'face', who: 'you', dir: 1 },
                { do: 'fx', fx: { kind: 'aura', who: 'you', color: '#ffd36e', on: true } }, { do: 'sfx', snd: 'magic' },
                { do: 'fx', fx: { kind: 'backdrop', style: 'rays', color: '#ffd36e' }, at: 0.2 },
                { do: 'fx', fx: { kind: 'power', name: 'Sprinkle Shower', color: '#ff7ab8', icon: 'sprinkle' }, at: 0.3 },
              ], who: 'fizz', t: 'SPRINKLE... SHOWER!', lineAt: 0.6,
            },
            {
              cam: { at: [600, 330, 0.72] }, act: [
                { do: 'fx', fx: { kind: 'backdrop', style: null } },
                { do: 'jump', who: 'you', to: 560, h: 540, dur: 1.4, at: 0.1, then: 'cheer' }, { do: 'spin', who: 'you', turns: 1, dur: 0.6, at: 0.3 },
                { do: 'pose', who: 'you', pose: 'holdUp', at: 0.9 }, { do: 'fx', fx: { kind: 'burst', who: 'you' }, at: 0.92 },
                { do: 'fx', fx: { kind: 'sprinkles', dur: 3.5 }, at: 0.95 }, { do: 'sfx', snd: 'sparkle', at: 0.95 }, { do: 'sfx', snd: 'fanfare', at: 1.0 }, { do: 'fx', fx: { kind: 'confetti' }, at: 1.1 },
                ...all(['kiki', 'ro', 'bunty', 'meera'], (id, i) => [{ do: 'expr', who: id, expr: 'shock', at: 0.4 + i * 0.05 } as Action, { do: 'pose', who: id, pose: 'lookUp', at: 0.4 } as Action]),
              ], n: 'The Captain leaps up high and throws rainbow sprinkles everywhere!', lineAt: 0.3,
            },
            {
              cam: { wide: 620, zoom: 0.78 }, act: [
                { do: 'fx', fx: { kind: 'aura', who: 'you', color: '#ffd36e', on: false }, at: 1.2 }, { do: 'expr', who: 'you', expr: 'love' },
                { do: 'el', el: 'jellyhill', to: { scale: 1.1 }, dur: 0.25, yoyo: 3 }, { do: 'el', el: 'rock', to: { scale: 1.12 }, dur: 0.22, yoyo: 3, at: 0.3 }, { do: 'el', el: 'floss', to: { scale: 1.06 }, dur: 0.3, yoyo: 3, at: 0.15 },
                ...all(['kiki', 'ro', 'bunty', 'meera'], (id, i) => [{ do: 'pose', who: id, pose: 'stand' } as Action, { do: 'hop', who: id, n: 3, h: 46, at: 0.2 + i * 0.12 } as Action, { do: 'expr', who: id, expr: 'laugh', at: 0.2 } as Action]),
                { do: 'sfx', snd: 'boing', at: 0.2 }, { do: 'sfx', snd: 'boing', at: 0.6 }, { do: 'sfx', snd: 'boing', at: 1.0 },
              ], n: 'Everything the sprinkles touch turns bouncy and bright!',
            },
            { reward: 'sprinkle-shower' },
            { cam: { close: 'you' }, mood: 'playful', act: [{ do: 'pose', who: 'you', pose: 'stand' }, { do: 'expr', who: 'you', expr: 'grin' }, { do: 'look', who: 'you', gaze: 'cam' }], who: 'you', t: 'Sprinkles! Okay. I can work with sprinkles.' },
            { cam: { close: 'fizz' }, act: [{ do: 'expr', who: 'fizz', expr: 'happy' }, { do: 'look', who: 'you', gaze: 'fwd' }], who: 'fizz', t: 'And here is a map of the Candy Nebula, Captain!' },
            { reward: 'candy-map' },
            { cam: { medium: ['ro', 'meera'] }, act: [{ do: 'face', who: 'meera', dir: -1 }, { do: 'pose', who: 'meera', pose: 'hips' }, { do: 'expr', who: 'meera', expr: 'worried' }, { do: 'expr', who: 'ro', expr: 'dizzy' }, { do: 'pose', who: 'ro', pose: 'shrug' }], who: 'meera', t: 'Captain, these powers are a mess. We need to practise first.' },
            { gate: { id: 'g-c1-power', title: 'Power Practice', ask: 'Help everyone get used to their new candy powers!', by: 'meera' } },
            {
              cam: { wide: 600, zoom: 0.75 }, trans: 'wipe', act: [
                { do: 'pose', who: 'meera', pose: 'present' }, { do: 'cycle', who: 'kiki', cycle: 'hop' }, { do: 'cycle', who: 'bunty', cycle: 'dance' },
                { do: 'pose', who: 'ro', pose: 'stretchArm' }, { do: 'stretch', who: 'ro', len: 3, dur: 0.6, at: 0.3 }, { do: 'stretch', who: 'ro', len: 1, dur: 0.4, at: 1.2 },
                { do: 'expr', who: 'ro', expr: 'grin' }, { do: 'expr', who: 'kiki', expr: 'laugh' }, { do: 'expr', who: 'meera', expr: 'happy' }, { do: 'expr', who: 'bunty', expr: 'laugh' },
                { do: 'fx', fx: { kind: 'sparkle', who: 'you' }, at: 0.6 },
              ], n: 'After lots of practice, nobody gets tied in a bow. Mostly.',
            },
            { cam: { close: 'ro' }, act: [{ do: 'cycle', who: 'kiki', cycle: null }, { do: 'cycle', who: 'bunty', cycle: null }, { do: 'pose', who: 'ro', pose: 'shrug' }, { do: 'expr', who: 'ro', expr: 'grin' }, { do: 'emote', who: 'ro', emote: 'sweat', at: 0.3 }, { do: 'look', who: 'ro', gaze: 'cam' }], who: 'ro', t: 'Mostly.' },
          ],
        },
        {
          id: 'c1-evening', set: 'candyland', mood: 'night', trans: 'fade', tint: EVENING, cam: { at: [1130, 220, 1] },
          cast: [
            { id: 'kiki', x: 880, pose: 'sit', expr: 'munch', prop: 'candyfloss' },
            { id: 'you', x: 970, pose: 'sit', face: -1, expr: 'happy' }, { id: 'meera', x: 1060, pose: 'sit', face: -1, expr: 'happy' },
            { id: 'bunty', x: 1150, pose: 'sit', face: -1, expr: 'sleepy' },
            { id: 'ro', x: 1390, pose: 'hugKnees', face: -1, expr: 'normal', prop: 'bow' },
          ],
          shots: [
            { cam: { at: [1130, 220, 1] }, move: { wide: 1130, zoom: 0.72 }, moveDur: 5, act: [{ do: 'cycle', who: 'kiki', cycle: 'munch' }, { do: 'emote', who: 'bunty', emote: 'zzz', at: 3.4 }], n: 'Evening. The crew shares candy floss. Ro sits by himself.', lineAt: 1.4 },
            { cam: { close: 'ro' }, act: [{ do: 'fx', fx: { kind: 'vignette', on: true } }, { do: 'expr', who: 'ro', expr: 'determined' }], who: 'ro', t: 'Tomorrow, I win.' },
          ],
        },
      ],
    },

    /* ======================= Chapter 2: Jelly Bean Bounce ======================= */
    // A long course over a pudding sea: twenty beans, a Big Gap and three sinking beans. Ro races
    // ahead alone, swinging on candy-cane poles with his toffee arm. The crew gets past each crisis
    // together (a sprinkle shower, a shield springboard, gumball stepping stones) and bounces over
    // the finish line as one.
    {
      id: 'c-2',
      title: 'Jelly Bean Bounce',
      teaser: 'Bounce from bean to bean, past a Big Gap and sinking beans!',
      recap: 'Ro won the race alone. The crew crossed the Big Gap and the sinking beans together.',
      scenes: [
        {
          id: 'c2-morning', set: 'vista', mood: 'wonder', tint: { color: '#ffd9a0', opacity: 0.14 }, cam: { el: 'course', zoom: 0.9, dy: -300 },
          cast: [],
          shots: [
            { title: { ep: 'WORLD 1', name: 'Jelly Bean Bounce', sub: 'The Candy Nebula · Chapter 2' } },
            { cam: { el: 'course', zoom: 0.9, dy: -300 }, move: { el: 'course', zoom: 1.35, dy: -40 }, moveDur: 6, act: [{ do: 'fx', fx: { kind: 'sparkle', el: 'course', n: 8 }, at: 3.5 }, { do: 'sfx', snd: 'sparkle', at: 3.5 }], n: 'Morning comes to the Candy Nebula. Today is the very first game!' },
          ],
        },
        {
          id: 'c2-course', set: 'jellycourse', mood: 'race', trans: 'fade', cam: { wide: COURSE.booth, y: 400, zoom: 0.75 },
          cast: [
            { id: 'bunty', x: 100 }, { id: 'you', x: 175 }, { id: 'meera', x: 250 }, { id: 'kiki', x: 325 }, { id: 'ro', x: 400 },
            { id: 'fizz', x: COURSE.booth, y: 452, lift: 0, prop: 'mic' },
          ],
          shots: [
            { act: [{ do: 'expr', who: 'fizz', expr: 'excited' }, { do: 'fx', fx: { kind: 'sparkle', el: 'booth' } }, { do: 'sfx', snd: 'drum' }], who: 'fizz', t: 'GAME ONE! The Jelly Bean Bounce!' },
            // A tour of the course: beans, poles, the Big Gap, the sinking beans, the finish.
            {
              cam: { wide: 700, zoom: 0.72 }, move: { wide: 2700, zoom: 0.72 }, moveDur: 6,
              act: [...['b2', 'b4', 'b6', 'b8', 'b10'].map((el, i) => ({ do: 'el' as const, el, to: { scale: 1.08 }, dur: 0.25, yoyo: 1, at: 0.6 + i * 1.1 })), { do: 'el', el: 'pole1', to: { rot: 4 }, dur: 0.2, yoyo: 2, at: 1.6 }, { do: 'el', el: 'pole2', to: { rot: -4 }, dur: 0.2, yoyo: 2, at: 4.6 }],
              who: 'fizz', t: 'Bounce from bean to bean, all the way to the finish!',
            },
            { cam: { at: [COURSE.gapFrom, 560, 0.72] }, move: { at: [COURSE.gapTo, 560, 0.72] }, moveDur: 4, act: [{ do: 'sfx', snd: 'wobble', at: 1.2 }], who: 'fizz', t: 'Watch out for the Big Gap...' },
            {
              cam: { at: [SINK_X[0], 560, 0.72] }, move: { at: [SINK_X[2], 560, 0.72] }, moveDur: 4,
              act: SINK_X.flatMap((_, i) => [{ do: 'el', el: `k${i + 1}`, to: { y: 26 }, dur: 0.45, yoyo: 1, at: 0.5 + i * 1.1 } as Action, { do: 'sfx', snd: 'bubble', at: 0.5 + i * 1.1 } as Action]),
              who: 'fizz', t: '...and the sneaky sinking beans. BLOOP!',
            },
            { cam: { el: 'finish', zoom: 0.8, dy: -60 }, insert: 'stars3', act: [{ do: 'sfx', snd: 'sparkle', at: 0.2 }, { do: 'sfx', snd: 'sparkle', at: 0.8 }], who: 'fizz', t: 'The first one here wins three shiny Stars!', hold: 0.6 },
            { cam: { medium: ['kiki', 'ro'] }, act: [{ do: 'expr', who: 'ro', expr: 'determined' }, { do: 'face', who: 'ro', dir: -1 }, { do: 'fx', fx: { kind: 'backdrop', style: 'speed', color: '#ff9b85' } }], who: 'ro', t: 'Three Stars. Mine.' },
            { cam: { medium: ['kiki', 'ro'] }, act: [{ do: 'fx', fx: { kind: 'backdrop', style: null } }, { do: 'expr', who: 'kiki', expr: 'grin' }, { do: 'face', who: 'kiki', dir: 1 }], who: 'kiki', t: 'Not if I bounce ON you first!' },
            {
              cam: { wide: 250, zoom: 0.8 }, act: [
                ...all(KIDS, (id, i) => [{ do: 'face', who: id, dir: 1, at: i * 0.05 } as Action, { do: 'pose', who: id, pose: 'crouch', at: 0.2 + i * 0.07 } as Action, { do: 'expr', who: id, expr: 'determined', at: 0.2 } as Action]),
                { do: 'sfx', snd: 'drumroll' },
              ], n: 'Everyone crouches on the start line...',
            },
            { cam: { close: 'fizz' }, act: [{ do: 'fx', fx: { kind: 'word', text: 'READY?', color: '#8fc8ff' } }], who: 'fizz', t: 'Ready... set...' },
            {
              cam: { wide: 420, zoom: 0.72 }, act: [
                { do: 'fx', fx: { kind: 'word', text: 'GO!', color: '#7fe6c9' } }, { do: 'sfx', snd: 'ding' }, { do: 'fx', fx: { kind: 'speedlines', on: true } },
                ...hop('ro', B[0], 0.1, 'b1', { h: 130 }), ...hop('ro', B[1], 0.95, 'b2', { h: 130 }),
                ...hop('meera', B[0] - 30, 1.15, 'b1', { h: 150, dur: 0.75 }),
                ...all(['you', 'kiki', 'bunty'], (id) => [{ do: 'pose', who: id, pose: 'stand', at: 1.6 } as Action]),
                { do: 'fx', fx: { kind: 'speedlines', on: false }, at: 1.4 },
              ], who: 'fizz', t: 'GO!', lineAt: 0.05,
            },
            // Ro's arm needs something to hold: he hooks a candy-cane pole, pulls himself to it, swings round and flies on.
            {
              cam: { at: [1075, 560, 0.72] }, act: [
                { do: 'face', who: 'ro', dir: 1 }, { do: 'pose', who: 'ro', pose: 'stretchArm' }, { do: 'expr', who: 'ro', expr: 'determined' },
                { do: 'stretch', who: 'ro', len: reach(POLE_X[0] - B[1]), dur: 0.4, atWord: 1 }, { do: 'sfx', snd: 'stretch', atWord: 1 },
                { do: 'el', el: 'pole1', to: { rot: 5 }, dur: 0.12, yoyo: 2, atWord: 1, at: 0.4 }, { do: 'sfx', snd: 'clink', atWord: 1, at: 0.4 },
                ...swing('ro', POLE_X[0], B[4], 10),
              ], n: 'Ro hooks his toffee arm round a candy cane... and ZOOMS!', lineAt: 0.3,
            },
            // Kiki uses Meera's head as a springboard: she really lands on it, then bounces off.
            {
              cam: { at: [850, 520, 0.72] }, act: [
                ...hop('meera', B[1] - 10, 0.1, 'b2', { h: 140, dur: 0.7 }),
                ...hop('kiki', B[0] - 20, 0.25, 'b1', { h: 150, dur: 0.7 }),
                { do: 'expr', who: 'kiki', expr: 'laugh', at: 1.3 }, { do: 'face', who: 'kiki', dir: 1, at: 1.3 }, { do: 'pose', who: 'kiki', pose: 'crouch', at: 1.35 },
                { do: 'pose', who: 'kiki', pose: 'jump', at: 1.5 },
                { do: 'move', who: 'kiki', to: B[1] - 10, y: 716, gait: 'fly', ease: 'linear', dur: 0.56, then: 'crouch', at: 1.5 },
                { do: 'lift', who: 'kiki', to: 450, dur: 0.28, ease: 'out', at: 1.5 }, { do: 'lift', who: 'kiki', to: MEERA_HEAD, dur: 0.28, ease: 'in', at: 1.78 },
                { do: 'squash', who: 'meera', amt: 0.32, at: 2.06 }, { do: 'squash', who: 'kiki', amt: 0.2, at: 2.06 }, { do: 'expr', who: 'meera', expr: 'dizzy', at: 2.06 },
                { do: 'sfx', snd: 'boing', at: 2.06 }, { do: 'fx', fx: { kind: 'word', text: 'BOING!', color: '#9fe08a' }, at: 2.06 },
                // She stands on Meera's head for a moment (arms out, wobbling), then springs off it.
                { do: 'pose', who: 'kiki', pose: 'brace', at: 2.16 }, { do: 'squash', who: 'meera', amt: 0.18, at: 2.5 }, { do: 'sfx', snd: 'boing', at: 2.55 },
                { do: 'pose', who: 'kiki', pose: 'jump', at: 2.55 },
                { do: 'move', who: 'kiki', to: B[2] - 20, y: 715, gait: 'fly', ease: 'linear', dur: 0.72, then: 'land', at: 2.55 },
                { do: 'lift', who: 'kiki', to: 560, dur: 0.36, ease: 'out', at: 2.55 }, { do: 'lift', who: 'kiki', to: 0, dur: 0.36, ease: 'in', at: 2.91 },
                { do: 'squash', who: 'kiki', amt: 0.18, at: 3.27 }, { do: 'sfx', snd: 'thud', at: 3.27 }, { do: 'el', el: 'b3', to: { scale: 0.93 }, dur: 0.1, yoyo: 1, at: 3.27 },
                { do: 'pose', who: 'kiki', pose: 'stand', at: 3.5 },
              ], who: 'kiki', t: 'Coming through, Meera!', lineAt: 1.0,
            },
            { cam: { medium: 'meera' }, act: [{ do: 'pose', who: 'meera', pose: 'hips' }, { do: 'expr', who: 'meera', expr: 'grumpy' }, { do: 'emote', who: 'meera', emote: 'anger' }], who: 'meera', t: 'Hey! My head is NOT a trampoline!' },
            // Bunty lands wobbly, puts his hands down to steady himself, and his Sticky Fingers glue them to the bean.
            {
              cam: { at: [330, 540, 0.72] }, act: [
                { do: 'face', who: 'bunty', dir: 1 }, { do: 'expr', who: 'bunty', expr: 'grin' }, { do: 'cam', to: { at: [450, 540, 0.72] }, dur: 0.8, at: 0.2 },
                { do: 'jump', who: 'bunty', to: B[0] - 45, h: 170, dur: 0.8, at: 0.2, then: 'land' }, { do: 'el', el: 'b1', to: { scale: 0.93 }, dur: 0.1, yoyo: 1, at: 1.14 },
                { do: 'expr', who: 'bunty', expr: 'worried', at: 1.2 },
                { do: 'pose', who: 'bunty', pose: 'stuck', atWord: 8 }, { do: 'el', el: 'goo', to: { opacity: 1 }, dur: 0.15, atWord: 8, at: 0.12 }, { do: 'sfx', snd: 'squish', atWord: 8, at: 0.12 },
                { do: 'pose', who: 'bunty', pose: 'stuckPull', atWord: 11 }, { do: 'expr', who: 'bunty', expr: 'shock', atWord: 11 }, { do: 'emote', who: 'bunty', emote: '!', atWord: 11 },
                { do: 'el', el: 'goo', to: { scale: 1.25 }, dur: 0.25, yoyo: 1, atWord: 11 }, { do: 'sfx', snd: 'squish', atWord: 11 },
              ], n: 'Bunty lands all wobbly and puts his hands down. Uh-oh. They STICK!', lineAt: 1.3,
            },
            {
              cam: { full: 'bunty', dx: 55 }, tone: 'excited', act: [
                ...[0.3, 1.1, 1.9].flatMap((t) => [{ do: 'pose', who: 'bunty', pose: 'stuckPull', at: t } as Action, { do: 'pose', who: 'bunty', pose: 'stuck', at: t + 0.4 } as Action, { do: 'el', el: 'goo', to: { scale: 1.2 }, dur: 0.2, yoyo: 1, at: t } as Action]),
                { do: 'expr', who: 'bunty', expr: 'shock' }, { do: 'expr', who: 'bunty', expr: 'grin', at: 1.6 },
              ], who: 'bunty', t: 'My sticky fingers! I’m part of the jelly bean now!',
            },
            { cam: { low: 'you' }, act: [{ do: 'face', who: 'you', dir: 1 }, { do: 'pose', who: 'you', pose: 'stand' }, { do: 'expr', who: 'you', expr: 'determined' }], who: 'you', t: 'Hold on, Bunty! Nobody gets left behind!' },
            { gate: { id: 'g-c2-bounce', title: 'Jelly Bean Bounce', ask: 'Bunty is stuck to a jelly bean! Help the Captain get him free.', by: 'bunty' } },
            // The Captain's heroic Sprinkle Shower: a power-up, a leap, and sprinkles thrown from the top of the jump.
            {
              cam: { low: 'you' }, mood: 'triumph', act: [
                { do: 'pose', who: 'you', pose: 'crouch' }, { do: 'expr', who: 'you', expr: 'determined' },
                { do: 'fx', fx: { kind: 'aura', who: 'you', color: '#ffd36e', on: true } }, { do: 'sfx', snd: 'magic' },
                { do: 'fx', fx: { kind: 'backdrop', style: 'speed', color: '#ffb3d9' }, at: 0.2 },
                { do: 'fx', fx: { kind: 'power', name: 'Sprinkle Shower', color: '#ff7ab8', icon: 'sprinkle' }, at: 0.4 },
              ], who: 'you', t: 'Hang on, Bunty! SPRINKLE... SHOWER!', lineAt: 0.7,
            },
            {
              cam: { at: [400, 330, 0.72] }, act: [
                { do: 'fx', fx: { kind: 'backdrop', style: null } },
                { do: 'jump', who: 'you', to: 330, h: 560, dur: 1.5, at: 0.1 }, { do: 'spin', who: 'you', turns: 1, dur: 0.6, at: 0.3 },
                { do: 'pose', who: 'you', pose: 'holdUp', at: 0.95 }, { do: 'fx', fx: { kind: 'burst', who: 'you' }, at: 0.98 },
                { do: 'fx', fx: { kind: 'sprinkles', dur: 3 }, at: 1.0 }, { do: 'sfx', snd: 'sparkle', at: 1.0 }, { do: 'sfx', snd: 'fanfare', at: 1.05 }, { do: 'fx', fx: { kind: 'confetti' }, at: 1.1 },
                { do: 'fx', fx: { kind: 'sparkle', el: 'b1', n: 12 }, at: 1.9 }, { do: 'el', el: 'b1', to: { scale: 1.1 }, dur: 0.2, yoyo: 2, at: 1.9 },
                { do: 'fx', fx: { kind: 'aura', who: 'you', color: '#ffd36e', on: false }, at: 2.4 },
              ], n: 'The Captain leaps up high and throws a rainbow of sprinkles!', lineAt: 0.3,
            },
            {
              cam: { at: [480, 520, 0.72] }, act: [
                { do: 'el', el: 'b1', to: { scale: 1.12 }, dur: 0.18, yoyo: 2 }, { do: 'fx', fx: { kind: 'sparkle', el: 'b1', n: 10 } }, { do: 'sfx', snd: 'boing' },
                { do: 'pose', who: 'bunty', pose: 'stuckPull', at: 0.2 },
                { do: 'el', el: 'goo', to: { scale: 1.6, opacity: 0 }, dur: 0.3, at: 0.5 }, { do: 'sfx', snd: 'pop', at: 0.5 }, { do: 'expr', who: 'bunty', expr: 'love', at: 0.5 },
                { do: 'jump', who: 'bunty', to: B[3], h: 480, dur: 1.8, at: 0.45 }, { do: 'spin', who: 'bunty', turns: 2, dur: 1.4, at: 0.7 },
                { do: 'track', who: 'bunty', lead: 0, at: 0.5 }, { do: 'fx', fx: { kind: 'motion', on: true, dir: 'left' }, at: 0.6 }, { do: 'fx', fx: { kind: 'motion', on: false }, at: 2.3 },
                { do: 'el', el: 'b4', to: { scale: 0.92 }, dur: 0.1, yoyo: 1, at: 2.39 },
              ], who: 'bunty', t: 'I’M FLYING! I’M A BIRD! A STICKY BIRD!', lineAt: 0.6,
            },
            // Far ahead, Ro crosses the Big Gap alone on a candy-cane pole.
            {
              cam: { at: [3150, 540, 0.72] }, act: [
                { do: 'place', who: 'ro', x: B[9] - 20 }, { do: 'face', who: 'ro', dir: 1 }, { do: 'pose', who: 'ro', pose: 'stretchArm' }, { do: 'expr', who: 'ro', expr: 'grin' },
                { do: 'stretch', who: 'ro', len: reach(POLE_X[2] - (B[9] - 20)), dur: 0.45, at: 0.3 }, { do: 'sfx', snd: 'stretch', at: 0.3 },
                { do: 'el', el: 'pole3', to: { rot: 5 }, dur: 0.12, yoyo: 2, at: 0.75 }, { do: 'sfx', snd: 'clink', at: 0.75 },
                ...swing('ro', POLE_X[2], B[10], undefined, 1.1),
              ], n: 'Far ahead, Ro reaches the Big Gap. He doesn’t even slow down.', lineAt: 0.2,
            },
            // The crew bounces on together until the beans run out.
            {
              cam: { at: [2300, 540, 0.72] }, move: { at: [2700, 540, 0.72] }, moveDur: 3.6, trans: 'wipe', act: [
                { do: 'place', who: 'meera', x: B[7] }, { do: 'place', who: 'kiki', x: B[6] }, { do: 'place', who: 'you', x: B[5] }, { do: 'place', who: 'bunty', x: B[4] }, { do: 'place', who: 'ro', x: B[14] },
                ...all(KIDS.filter((k) => k !== 'ro'), (id) => [{ do: 'face', who: id, dir: 1 } as Action, { do: 'pose', who: id, pose: 'stand' } as Action, { do: 'expr', who: id, expr: 'happy' } as Action]),
                ...hop('meera', B[8], 0.2, 'b9'), ...hop('meera', B[9] - 60, 1.1, 'b10'),
                ...hop('kiki', B[7], 0.5, 'b8'), ...hop('kiki', B[8] + 55, 1.4, 'b9'),
                ...hop('you', B[6], 0.8, 'b7'), ...hop('you', B[8] - 55, 1.9, 'b9', { h: 190, dur: 0.8 }),
                ...hop('bunty', B[5], 1.1, 'b6'), ...hop('bunty', B[6], 2.0, 'b7'), ...hop('bunty', B[7], 2.9, 'b8'),
                ...[0.3, 1.2, 2.1, 3.0].map((t) => ({ do: 'sfx' as const, snd: 'boing' as const, at: t })),
              ], n: 'Boing, boing, boing! The crew bounces on... until the beans run out.', lineAt: 0.4,
            },
            { cam: { at: [COURSE.gapFrom + 240, 560, 0.72] }, move: { at: [COURSE.gapTo - 60, 560, 0.72] }, moveDur: 3, tone: 'surprised', act: [{ do: 'sfx', snd: 'wobble', at: 0.6 }], who: 'kiki', t: 'The next bean is SO far away!' },
            { cam: { medium: ['kiki', 'meera'] }, act: [{ do: 'face', who: 'meera', dir: -1 }, { do: 'expr', who: 'meera', expr: 'worried' }, { do: 'expr', who: 'kiki', expr: 'worried' }, { do: 'pose', who: 'meera', pose: 'hips' }], who: 'meera', t: 'Too far to jump. Even for you, Kiki.' },
            { gate: { id: 'g-c2-gap', title: 'The Big Gap', ask: 'The next bean is too far away! Help the crew get across the Big Gap.', by: 'meera' } },
            { cam: { medium: ['you', 'kiki'] }, act: [{ do: 'face', who: 'you', dir: 1 }, { do: 'emote', who: 'you', emote: 'idea' }, { do: 'pose', who: 'you', pose: 'point', at: 0.3 }, { do: 'expr', who: 'you', expr: 'grin' }, { do: 'expr', who: 'kiki', expr: 'normal' }], who: 'you', t: 'Meera! Your shield is round and bouncy. Like a trampoline!' },
            { cam: { close: 'meera' }, act: [{ do: 'face', who: 'meera', dir: -1 }, { do: 'pose', who: 'meera', pose: 'stand' }, { do: 'expr', who: 'meera', expr: 'grin' }], who: 'meera', t: 'A shield trampoline? Okay! Just NOT my head.' },
            // Meera turns her shield into a springboard; the Captain makes it extra springy.
            {
              cam: { at: [COURSE.gapFrom - 10, 560, 0.8] }, act: [
                { do: 'face', who: 'meera', dir: 1 }, { do: 'pose', who: 'meera', pose: 'reachDown', at: 0.2 }, { do: 'prop', who: 'meera', prop: null, at: 0.6 },
                { do: 'el', el: 'shieldboard', to: { opacity: 1, scale: 1 }, dur: 0.35, ease: 'back', at: 0.6 }, { do: 'sfx', snd: 'clink', at: 0.6 },
                { do: 'pose', who: 'meera', pose: 'stand', at: 1.0 },
                { do: 'fx', fx: { kind: 'sprinkles', dur: 1.6 }, at: 1.3 }, { do: 'sfx', snd: 'sparkle', at: 1.3 },
                { do: 'el', el: 'shieldboard', to: { scale: 1.15 }, dur: 0.2, yoyo: 2, at: 1.9 }, { do: 'fx', fx: { kind: 'sparkle', el: 'shieldboard', n: 10 }, at: 1.9 },
              ], n: 'Meera lays her shield flat. Sprinkles make it super springy!', lineAt: 0.3,
            },
            {
              cam: { at: [COURSE.gapFrom - 10, 520, 0.72] }, act: [
                { do: 'jump', who: 'kiki', to: SHIELD_X, y: SHIELD_Y, h: 110, dur: 0.5, at: 0.2 }, ...boing(0.84),
                { do: 'jump', who: 'kiki', to: B[10] - 55, y: 715, h: 560, dur: 1.5, at: 0.9 }, { do: 'spin', who: 'kiki', turns: 1, dur: 0.7, at: 1.2 }, { do: 'expr', who: 'kiki', expr: 'laugh', at: 0.9 },
                { do: 'track', who: 'kiki', lead: 0, at: 0.95 }, { do: 'el', el: 'b11', to: { scale: 0.92 }, dur: 0.1, yoyo: 1, at: 2.54 },
              ], who: 'kiki', t: 'Wheeee! Best trampoline EVER!', lineAt: 1.0,
            },
            {
              cam: { at: [3150, 420, 0.72] }, move: { at: [3900, 540, 0.72] }, moveDur: 4.4, act: [
                { do: 'jump', who: 'you', to: SHIELD_X, y: SHIELD_Y, h: 110, dur: 0.5, at: 0.1 }, ...boing(0.74),
                { do: 'jump', who: 'you', to: B[10] + 55, y: 715, h: 540, dur: 1.4, at: 0.8 }, { do: 'spin', who: 'you', turns: 1, dur: 0.6, at: 1.1 },
                { do: 'jump', who: 'bunty', to: SHIELD_X, y: SHIELD_Y, h: 160, dur: 0.7, at: 0.9 }, ...boing(1.74),
                { do: 'jump', who: 'bunty', to: B[11] - 60, y: 715, h: 560, dur: 1.5, at: 1.8 }, { do: 'spin', who: 'bunty', turns: 2, dur: 1.2, at: 2.0 }, { do: 'expr', who: 'bunty', expr: 'love', at: 1.8 },
                { do: 'jump', who: 'meera', to: SHIELD_X, y: SHIELD_Y, h: 90, dur: 0.4, at: 1.95 }, ...boing(2.49),
                { do: 'jump', who: 'meera', to: B[11] + 50, y: 715, h: 560, dur: 1.5, at: 2.55 }, { do: 'expr', who: 'meera', expr: 'laugh', at: 2.55 },
              ], n: 'Boing! Boing! BOING! One after another, they fly across the gap!', lineAt: 0.5,
            },
            {
              cam: { full: ['bunty', 'meera'] }, act: [
                { do: 'face', who: 'meera', dir: -1 }, { do: 'pose', who: 'meera', pose: 'holdUp', at: 0.6 },
                { do: 'el', el: 'shieldboard', to: { x: B[11] + 50 - SHIELD_X - 50, y: -250, rot: 720 }, dur: 0.9, ease: 'out', at: 0.2 }, { do: 'sfx', snd: 'whoosh', at: 0.2 },
                { do: 'el', el: 'shieldboard', to: { opacity: 0 }, dur: 0.05, at: 1.1 }, { do: 'prop', who: 'meera', prop: 'shield', at: 1.1 }, { do: 'sfx', snd: 'clink', at: 1.1 },
                { do: 'expr', who: 'meera', expr: 'smug', at: 1.4 }, { do: 'expr', who: 'bunty', expr: 'laugh', at: 1.4 },
              ], who: 'meera', t: 'Okay. A shield trampoline is fine. A HEAD trampoline is not.', lineAt: 1.5,
            },
            // Ro zips over the sinking beans on the last pole and lands at the finish, all alone.
            {
              cam: { at: [4995, 540, 0.72] }, act: [
                { do: 'place', who: 'ro', x: B[14] }, { do: 'face', who: 'ro', dir: 1 }, { do: 'pose', who: 'ro', pose: 'stretchArm' }, { do: 'expr', who: 'ro', expr: 'determined' },
                { do: 'stretch', who: 'ro', len: reach(POLE_X[3] - B[14]), dur: 0.5, at: 0.2 }, { do: 'sfx', snd: 'stretch', at: 0.2 },
                { do: 'el', el: 'pole4', to: { rot: -5 }, dur: 0.12, yoyo: 2, at: 0.7 }, { do: 'sfx', snd: 'clink', at: 0.7 },
                ...swing('ro', POLE_X[3], B[15], undefined, 1.0, 320, 1.15),
                ...hop('ro', B[16], 2.75, 'b17', { h: 150 }), ...hop('ro', FINISH.ro, 3.7, undefined, { h: 230, dur: 0.9 }),
                { do: 'sfx', snd: 'fanfare', at: 4.75 }, { do: 'fx', fx: { kind: 'confetti' }, at: 4.75 }, { do: 'fx', fx: { kind: 'word', text: 'FINISH!', color: '#ffd36e' }, at: 4.75 },
                { do: 'el', el: 'finish', to: { scale: 1.05 }, dur: 0.2, yoyo: 1, at: 4.75 },
              ], n: 'Ro swings right over the sinking beans... and lands at the finish!', lineAt: 0.3,
            },
            { cam: { low: 'ro' }, act: [{ do: 'pose', who: 'ro', pose: 'cheer' }, { do: 'expr', who: 'ro', expr: 'laugh' }, { do: 'fx', fx: { kind: 'backdrop', style: 'rays', color: '#ffd36e' } }, { do: 'fx', fx: { kind: 'backdrop', style: null }, at: 2.5 }], who: 'ro', t: 'FIRST! Three Stars for Ro!' },
            // The crew meets the sinking beans.
            {
              cam: { at: [4900, 540, 0.75] }, mood: 'race', trans: 'wipe', act: [
                { do: 'place', who: 'meera', x: B[13] - 60 }, { do: 'place', who: 'you', x: B[13] + 50 }, { do: 'place', who: 'kiki', x: KIKI_POP }, { do: 'place', who: 'bunty', x: B[14] + 10 },
                { do: 'prop', who: 'meera', prop: null }, ...all(['meera', 'you', 'kiki', 'bunty'], (id) => [{ do: 'face', who: id, dir: 1 } as Action, { do: 'pose', who: id, pose: 'stand' } as Action]),
                { do: 'expr', who: 'bunty', expr: 'grin' },
                ...hop('bunty', SINK_X[0] - 70, 0.3), { do: 'ride', who: 'bunty', on: 'k1', dx: -70, at: 1.05 },
                { do: 'el', el: 'k1', to: { y: 150 }, dur: 1.3, ease: 'in', atWord: 10 }, { do: 'cycle', who: 'bunty', cycle: 'flail', atWord: 10 }, { do: 'expr', who: 'bunty', expr: 'shock', atWord: 10 },
                { do: 'sfx', snd: 'gulp', atWord: 10 }, { do: 'fx', fx: { kind: 'splash', el: 'k1', color: '#ff9fc8' }, atWord: 10, at: 0.6 }, { do: 'sfx', snd: 'bubble', atWord: 10, at: 0.6 },
              ], n: 'Bunty hops onto the next bean... and it starts to SINK!', lineAt: 0.2,
            },
            {
              cam: { full: ['kiki', 'bunty'] }, act: [
                { do: 'face', who: 'kiki', dir: 1 }, { do: 'pose', who: 'kiki', pose: 'reachDown', at: 0.2 }, { do: 'expr', who: 'kiki', expr: 'determined' },
                { do: 'cycle', who: 'bunty', cycle: null }, { do: 'face', who: 'bunty', dir: -1 }, { do: 'pose', who: 'bunty', pose: 'holdUp', at: 0.2 }, { do: 'expr', who: 'bunty', expr: 'worried' },
                { do: 'ride', who: 'bunty', on: null, atWord: 4 }, { do: 'sfx', snd: 'slurp', atWord: 4 },
                { do: 'jump', who: 'bunty', to: B[14] + 10, y: 715, h: 160, dur: 0.6, atWord: 4 }, { do: 'mess', who: 'bunty', color: '#ff8fbf', atWord: 4 },
                { do: 'el', el: 'k1', to: { y: 0 }, dur: 1.4, ease: 'out', atWord: 4, at: 0.6 }, { do: 'pose', who: 'kiki', pose: 'stand', atWord: 4, at: 0.5 },
                { do: 'expr', who: 'bunty', expr: 'laugh', atWord: 4, at: 0.9 },
              ], who: 'kiki', t: 'Grab my hand, Bunty! Up you come!', lineAt: 0.4,
            },
            { cam: { medium: 'kiki' }, act: [{ do: 'face', who: 'kiki', dir: 1 }, { do: 'expr', who: 'kiki', expr: 'worried' }, { do: 'pose', who: 'kiki', pose: 'point' }], who: 'kiki', t: 'There are THREE sinking beans! How do we get across?' },
            { gate: { id: 'g-c2-sink', title: 'Sinking Beans', ask: 'These beans sink when you stand on them! Help the crew find a way across.', by: 'kiki' } },
            { cam: { medium: ['meera', 'you'] }, act: [{ do: 'emote', who: 'you', emote: 'idea' }, { do: 'pose', who: 'you', pose: 'point', at: 0.3 }, { do: 'expr', who: 'you', expr: 'grin' }, { do: 'expr', who: 'meera', expr: 'normal' }], who: 'you', t: 'Kiki! Gumballs float. Pop some onto the sinking beans!' },
            {
              cam: { low: 'kiki' }, act: [
                { do: 'prop', who: 'kiki', prop: 'gumball' }, { do: 'pose', who: 'kiki', pose: 'holdUp' }, { do: 'expr', who: 'kiki', expr: 'grin' },
                { do: 'fx', fx: { kind: 'aura', who: 'kiki', color: '#ff7ab8', on: true } }, { do: 'sfx', snd: 'magic' }, { do: 'fx', fx: { kind: 'backdrop', style: 'speed', color: '#ff9fcf' }, at: 0.2 },
              ], who: 'kiki', t: 'GUMBALL POPPER... times THREE!', lineAt: 0.5,
            },
            {
              cam: { at: [SINK_X[1], 520, 0.72] }, act: [
                { do: 'fx', fx: { kind: 'backdrop', style: null } },
                ...SINK_X.flatMap((x, i) => gumballDrop(i, x, i)),
              ], n: 'POP! POP! POP! Three giant gumballs land, and the beans sink away.', lineAt: 0.8,
            },
            {
              cam: { at: [5150, 520, 0.72] }, move: { at: [5820, 540, 0.72] }, moveDur: 5.4, act: [
                { do: 'fx', fx: { kind: 'aura', who: 'kiki', color: '#ff7ab8', on: false } }, { do: 'prop', who: 'kiki', prop: null }, { do: 'pose', who: 'kiki', pose: 'stand' },
                ...['gs1', 'gs2', 'gs3'].map((el, i) => ({ do: 'el' as const, el, to: { y: 6 }, dur: 0.6, yoyo: 4, ease: 'inOut' as const, at: i * 0.3 })),
                ...stones('kiki', 0.2, [B[15] - 30, B[16] - 30]),
                ...stones('bunty', 1.0, [B[15] + 50]),
                ...hop('you', B[14] + 40, 0.6), ...stones('you', 1.8, [B[15] - 50]),
                ...hop('meera', B[14] - 40, 1.4), ...stones('meera', 2.6, []),
                ...[0.94, 1.74, 2.54, 3.34].map((t) => ({ do: 'sfx' as const, snd: 'boing' as const, at: t })),
              ], n: 'The gumballs float like stepping stones. Hop, hop, hop, all the way!', lineAt: 0.5,
            },
            // The crew bounces over the finish line together, bean by bean.
            {
              cam: { at: [6050, 520, 0.72] }, move: { at: [6650, 540, 0.72] }, moveDur: 4.2, act: [
                { do: 'place', who: 'ro', x: FINISH.ro }, { do: 'face', who: 'ro', dir: -1 }, { do: 'pose', who: 'ro', pose: 'stand' },
                ...hop('kiki', FINISH.kiki, 0.2, undefined, { h: 240, dur: 1.0 }),
                ...hop('bunty', B[16], 0.4, 'b17'), ...hop('bunty', FINISH.bunty, 1.3, undefined, { h: 170, dur: 0.75 }),
                ...hop('you', B[16] - 20, 1.3, 'b17'), ...hop('you', FINISH.you, 2.2, undefined, { h: 190, dur: 0.8 }),
                ...hop('meera', B[15], 0.6, 'b16', { y: 715 }), ...hop('meera', B[16], 2.4, 'b17'), ...hop('meera', FINISH.meera, 3.3, undefined, { h: 210, dur: 0.85 }),
                { do: 'fx', fx: { kind: 'confetti' }, at: 4.4 }, { do: 'sfx', snd: 'cheer', at: 4.4 },
                ...all(['kiki', 'bunty', 'you', 'meera'], (id, i) => [{ do: 'pose', who: id, pose: 'cheer', at: 4.6 + i * 0.05 } as Action, { do: 'expr', who: id, expr: 'laugh', at: 4.4 } as Action, { do: 'pose', who: id, pose: 'stand', at: 5.5 } as Action]),
              ], n: 'Boing, boing, boing! The whole crew bounces over the finish line.', lineAt: 0.5,
            },
            {
              cam: { medium: ['kiki', 'ro'] }, mood: 'playful', act: [
                { do: 'face', who: 'kiki', dir: 1 }, { do: 'expr', who: 'kiki', expr: 'grumpy' }, { do: 'emote', who: 'kiki', emote: 'anger', at: 0.2 }, { do: 'pose', who: 'kiki', pose: 'hips', at: 0.3 },
              ], who: 'kiki', t: 'You didn’t even look back for Bunty.', lineAt: 0.5,
            },
            { cam: { close: 'ro' }, act: [{ do: 'expr', who: 'ro', expr: 'smug' }, { do: 'pose', who: 'ro', pose: 'shrug' }], who: 'ro', t: 'It’s a race! You’re supposed to race.' },
            { cam: { medium: ['bunty', 'you'] }, act: [{ do: 'face', who: 'you', dir: -1 }, { do: 'expr', who: 'you', expr: 'worried' }], who: 'you', t: 'Bunty, are you okay?' },
            { cam: { medium: ['bunty', 'you'] }, act: [{ do: 'expr', who: 'bunty', expr: 'love' }, { do: 'hop', who: 'bunty', n: 2 }, { do: 'expr', who: 'you', expr: 'happy' }], who: 'bunty', t: 'I was a jelly bean. Best. Day. Ever.' },
            {
              cam: { close: 'ro' }, mood: 'sad', act: [
                { do: 'fx', fx: { kind: 'tint', color: '#5a3fa0', opacity: 0.3 } }, { do: 'fx', fx: { kind: 'vignette', on: true } }, { do: 'prop', who: 'ro', prop: 'star' },
                { do: 'pose', who: 'ro', pose: 'holdFront' }, { do: 'expr', who: 'ro', expr: 'normal' }, { do: 'face', who: 'ro', dir: 1 },
              ], n: 'Ro holds his three Stars. The others laugh. He doesn’t look up.',
            },
          ],
        },
      ],
    },

    /* ======================= Chapter 3: The Chocolate River ======================= */
    {
      id: 'c-3',
      title: 'The Chocolate River',
      teaser: 'Wafer rafts, a hungry fish, and Bunty’s big moment.',
      recap: 'Bunty’s Sticky Fingers held the raft together, and the team won together.',
      scenes: [
        {
          id: 'c3-view', set: 'vista', mood: 'wonder', cam: { at: [1420, 1550, 1.0] },
          cast: [],
          shots: [
            { title: { ep: 'WORLD 1', name: 'The Chocolate River', sub: 'The Candy Nebula · Chapter 3' } },
            { cam: { at: [1420, 1550, 1.0] }, move: { at: [1150, 1390, 1.4] }, moveDur: 6, act: [{ do: 'sfx', snd: 'bubble', at: 1 }, { do: 'sfx', snd: 'bubble', at: 3.2 }], n: 'Next is the chocolate river. It starts at a waterfall cave.' },
          ],
        },
        {
          id: 'c3-river', set: 'river', mood: 'playful', trans: 'fade', cam: { wide: 900, zoom: 0.75 },
          cast: [
            { id: 'meera', x: 170, y: 700 }, { id: 'you', x: 250, y: 700 }, { id: 'kiki', x: 330, y: 700 }, { id: 'bunty', x: 410, y: 700 },
            { id: 'ro', x: 470, y: 700, face: -1 },
            { id: 'fizz', x: 980, y: 640, lift: 140 },
          ],
          shots: [
            { cam: { wide: 1000, zoom: 0.72 }, move: { wide: 3000, zoom: 0.72 }, moveDur: 5.5, act: [{ do: 'expr', who: 'fizz', expr: 'excited' }, { do: 'sfx', snd: 'drum' }], who: 'fizz', t: 'GAME TWO! Chocolate River Rafting!' },
            { cam: { medium: 'fizz' }, act: [{ do: 'expr', who: 'fizz', expr: 'smug' }], who: 'fizz', t: 'Paddle your raft to the cave. And do NOT eat the raft!' },
            { cam: { close: 'kiki' }, act: [{ do: 'expr', who: 'kiki', expr: 'shock' }, { do: 'emote', who: 'kiki', emote: '!' }, { do: 'fx', fx: { kind: 'backdrop', style: 'shock', color: '#ffe066' } }, { do: 'fx', fx: { kind: 'backdrop', style: null }, at: 3 }], who: 'kiki', t: 'Don’t eat the raft? That’s the hardest rule EVER.' },
            { cam: { medium: 'ro' }, act: [{ do: 'pose', who: 'ro', pose: 'hips' }, { do: 'expr', who: 'ro', expr: 'determined' }], who: 'ro', t: 'I’ll take my own raft. I’m faster alone.' },
            { cam: { medium: 'meera' }, act: [{ do: 'pose', who: 'meera', pose: 'present' }, { do: 'face', who: 'meera', dir: 1 }, { do: 'expr', who: 'meera', expr: 'worried' }], who: 'meera', t: 'Ro, the rafts are for teams.' },
            { cam: { close: 'ro' }, act: [{ do: 'expr', who: 'ro', expr: 'smug' }, { do: 'face', who: 'ro', dir: 1 }], who: 'ro', t: 'Then I’m a team of one.' },
            { cam: { close: 'bunty' }, act: [{ do: 'expr', who: 'bunty', expr: 'smug' }, { do: 'emote', who: 'bunty', emote: 'dots' }, { do: 'look', who: 'bunty', gaze: 'cam' }], who: 'bunty', t: 'That’s not how teams work, Ro.' },
            {
              cam: { wide: 650, zoom: 0.72 }, act: [
                { do: 'look', who: 'bunty', gaze: 'fwd' },
                { do: 'jump', who: 'ro', to: 560, h: 90, dur: 0.6 }, { do: 'ride', who: 'ro', on: 'raftro', dx: 0, dy: -12, at: 0.8 }, { do: 'prop', who: 'ro', prop: 'paddle', at: 0.8 },
                { do: 'cycle', who: 'ro', cycle: 'paddle', at: 0.9 }, { do: 'el', el: 'raftro', to: { x: 2580 }, dur: 6, ease: 'in', at: 1.0 }, { do: 'fx', fx: { kind: 'splash', el: 'raftro' }, at: 1.0 }, { do: 'sfx', snd: 'splash', at: 1.0 },
                { do: 'jump', who: 'bunty', to: 850, h: 120, dur: 0.7, at: 1.4 }, { do: 'jump', who: 'kiki', to: 780, h: 120, dur: 0.7, at: 1.6 },
                { do: 'jump', who: 'you', to: 710, h: 120, dur: 0.7, at: 1.8 }, { do: 'jump', who: 'meera', to: 640, h: 110, dur: 0.75, at: 2.0 },
                { do: 'ride', who: 'bunty', on: 'raft', dx: 90, dy: -12, at: 2.2 }, { do: 'ride', who: 'kiki', on: 'raft', dx: 20, dy: -12, at: 2.4 },
                { do: 'ride', who: 'you', on: 'raft', dx: -50, dy: -12, at: 2.6 }, { do: 'ride', who: 'meera', on: 'raft', dx: -120, dy: -12, at: 2.85 },
                { do: 'el', el: 'raft', to: { y: 10 }, dur: 0.3, yoyo: 1, at: 2.85 }, { do: 'sfx', snd: 'squish', at: 2.85 },
              ], n: 'Ro paddles off alone. Everyone else squeezes onto one big raft.', lineAt: 1.2,
            },
            {
              cam: { wide: 900, zoom: 0.8 }, act: [
                { do: 'prop', who: 'you', prop: 'paddle' }, { do: 'prop', who: 'meera', prop: 'paddle' }, { do: 'cycle', who: 'you', cycle: 'paddle' }, { do: 'cycle', who: 'meera', cycle: 'paddle' },
                { do: 'el', el: 'raft', to: { x: 900 }, dur: 7, ease: 'linear' }, { do: 'track', who: 'you', lead: 0 }, { do: 'expr', who: 'meera', expr: 'worried', at: 1 },
              ], who: 'meera', t: 'Is it just me, or is the raft getting... smaller?', lineAt: 1.4,
            },
            { cam: { close: 'kiki' }, act: [{ do: 'prop', who: 'kiki', prop: 'wafer' }, { do: 'cycle', who: 'kiki', cycle: 'munch' }, { do: 'expr', who: 'kiki', expr: 'munch' }, { do: 'sfx', snd: 'munch' }, { do: 'emote', who: 'kiki', emote: 'sweat', at: 1.2 }], n: 'Kiki is eating the raft.' },
            { cam: { close: 'kiki' }, act: [{ do: 'cycle', who: 'kiki', cycle: null }, { do: 'pose', who: 'kiki', pose: 'scared' }, { do: 'expr', who: 'kiki', expr: 'yell' }, { do: 'fx', fx: { kind: 'backdrop', style: 'speed', color: '#ffe066' } }, { do: 'fx', fx: { kind: 'backdrop', style: null }, at: 2.4 }], who: 'kiki', t: 'I’m SORRY! It’s REALLY good wafer!' },
            {
              cam: { wide: 1660, zoom: 0.78 }, act: [
                { do: 'track', who: null }, { do: 'el', el: 'raft', to: { rot: 3 }, dur: 0.18, yoyo: 4 }, { do: 'el', el: 'pieces', to: { x: 900, opacity: 1 }, dur: 0.01 },
                { do: 'el', el: 'pieces', to: { x: 960, y: 20 }, dur: 2.5, ease: 'out', at: 0.1 }, { do: 'fx', fx: { kind: 'splash', el: 'raft' } }, { do: 'sfx', snd: 'splash' },
                { do: 'cycle', who: 'you', cycle: null }, { do: 'cycle', who: 'meera', cycle: null }, { do: 'pose', who: 'meera', pose: 'scared' }, { do: 'pose', who: 'you', pose: 'scared' },
                { do: 'expr', who: 'meera', expr: 'shock' }, { do: 'expr', who: 'you', expr: 'shock' }, { do: 'expr', who: 'bunty', expr: 'shock' }, { do: 'emote', who: 'meera', emote: '!' },
              ], who: 'meera', t: 'It’s falling apart! We’re going to sink into the chocolate!', lineAt: 0.6,
            },
            { cam: { close: 'bunty' }, act: [{ do: 'expr', who: 'bunty', expr: 'determined' }, { do: 'emote', who: 'bunty', emote: 'idea' }, { do: 'sfx', snd: 'ding' }, { do: 'fx', fx: { kind: 'backdrop', style: 'rays', color: '#ffb38a' } }, { do: 'fx', fx: { kind: 'backdrop', style: null }, at: 3.4 }], who: 'bunty', t: 'Wait! My sticky fingers! I can glue the raft back together!' },
            { gate: { id: 'g-c3-raft', title: 'Fix the Raft', ask: 'The raft is falling apart! Help Bunty stick every piece back.', by: 'bunty' } },
            {
              cam: { wide: 1660, zoom: 0.8 }, act: [
                { do: 'pose', who: 'bunty', pose: 'crouch' }, { do: 'el', el: 'pieces', to: { opacity: 0 }, dur: 0.6, at: 0.4 }, { do: 'el', el: 'raft', to: { rot: 0, y: 0 }, dur: 0.4 },
                { do: 'fx', fx: { kind: 'glow' }, at: 0.5 }, { do: 'fx', fx: { kind: 'sparkle', el: 'raft', n: 12 }, at: 0.6 }, { do: 'sfx', snd: 'squish', at: 0.5 },
                { do: 'fx', fx: { kind: 'word', text: 'STICK!', color: '#ffb38a' }, at: 0.6 }, { do: 'pose', who: 'meera', pose: 'stand' }, { do: 'pose', who: 'you', pose: 'stand' },
                { do: 'expr', who: 'meera', expr: 'happy', at: 1 }, { do: 'expr', who: 'you', expr: 'happy', at: 1 }, { do: 'expr', who: 'kiki', expr: 'happy', at: 1 },
              ], n: 'Bunty’s sticky hands hold every piece in place. The raft is saved!',
            },
            { cam: { close: 'bunty' }, act: [{ do: 'pose', who: 'bunty', pose: 'cheer' }, { do: 'expr', who: 'bunty', expr: 'laugh' }, { do: 'hop', who: 'bunty', n: 2 }], who: 'bunty', t: 'STICKY FINGERS FOR THE WIN!' },
            {
              cam: { wide: 1720, zoom: 0.75 }, mood: 'triumph', act: [
                ...all(['you', 'meera', 'kiki', 'bunty'], (id, i) => [{ do: 'cycle', who: id, cycle: 'cheer', at: i * 0.08 } as Action, { do: 'expr', who: id, expr: 'laugh', at: i * 0.08 } as Action]),
                { do: 'sfx', snd: 'cheer' }, { do: 'el', el: 'fish', to: { opacity: 1 }, dur: 0.1, at: 0.8 }, { do: 'el', el: 'fish', to: { y: -300, rot: -40 }, dur: 0.6, ease: 'out', at: 0.8 },
                { do: 'el', el: 'fish', to: { y: 0, rot: 30 }, dur: 0.6, ease: 'in', at: 1.4 }, { do: 'fx', fx: { kind: 'splash', el: 'fish' }, at: 2.0 }, { do: 'sfx', snd: 'splash', at: 2.0 }, { do: 'el', el: 'fish', to: { opacity: 0 }, dur: 0.2, at: 2.0 },
              ], n: 'The crew cheers so loudly, a chocolate fish jumps up to see!',
            },
            {
              cam: { wide: 3050, zoom: 0.8 }, trans: 'fade', mood: 'sad', act: [
                ...all(['you', 'meera', 'kiki', 'bunty'], (id) => [{ do: 'cycle', who: id, cycle: null } as Action]),
                { do: 'ride', who: 'ro', on: null }, { do: 'cycle', who: 'ro', cycle: null }, { do: 'prop', who: 'ro', prop: null }, { do: 'place', who: 'ro', x: 3010, y: 700 },
                { do: 'pose', who: 'ro', pose: 'hugKnees' }, { do: 'face', who: 'ro', dir: -1 }, { do: 'expr', who: 'ro', expr: 'sad' }, { do: 'el', el: 'raftro', to: { opacity: 0 }, dur: 0.01 },
              ], n: 'At the cave, Ro is waiting. A chocolate fish ate his raft!',
            },
            { cam: { close: 'ro' }, act: [{ do: 'expr', who: 'ro', expr: 'cry' }, { do: 'emote', who: 'ro', emote: 'gloom' }, { do: 'sfx', snd: 'sad' }], who: 'ro', t: '...It ate my paddle too.' },
            {
              cam: { wide: 2900, zoom: 0.75 }, mood: 'playful', act: [
                { do: 'el', el: 'raft', to: { x: 2050 }, dur: 2.2, ease: 'out' }, { do: 'cycle', who: 'you', cycle: 'paddle' }, { do: 'cycle', who: 'meera', cycle: 'paddle' },
                { do: 'cycle', who: 'you', cycle: null, at: 2.2 }, { do: 'cycle', who: 'meera', cycle: null, at: 2.2 },
                { do: 'place', who: 'fizz', x: 3150, y: 700, lift: 260, at: 0.1 }, { do: 'expr', who: 'fizz', expr: 'excited', at: 0.1 },
                { do: 'fx', fx: { kind: 'confetti' }, at: 2.3 }, { do: 'sfx', snd: 'fanfare', at: 2.3 },
              ], who: 'fizz', t: 'Bunty’s raft wins three Stars! Teamwork wins!', lineAt: 2.3,
            },
            { cam: { medium: ['you', 'ro'] }, act: [{ do: 'face', who: 'you', dir: 1 }, { do: 'pose', who: 'you', pose: 'present' }, { do: 'expr', who: 'you', expr: 'happy' }, { do: 'expr', who: 'ro', expr: 'sad' }], who: 'you', t: 'Ro, hop on. There’s room.' },
            {
              cam: { wide: 2880, zoom: 0.78 }, mood: 'night', act: [
                { do: 'pose', who: 'ro', pose: 'stand' }, { do: 'expr', who: 'ro', expr: 'normal' }, { do: 'jump', who: 'ro', to: 2050 + 760 + 160, h: 80, dur: 0.7, at: 0.4 },
                { do: 'ride', who: 'ro', on: 'raft', dx: 160, dy: -12, at: 1.2 }, { do: 'face', who: 'ro', dir: -1, at: 1.3 }, { do: 'pose', who: 'ro', pose: 'reach', at: 1.6 },
                { do: 'face', who: 'bunty', dir: 1, at: 1.4 }, { do: 'pose', who: 'bunty', pose: 'reach', at: 1.7 }, { do: 'expr', who: 'bunty', expr: 'happy', at: 1.7 }, { do: 'expr', who: 'ro', expr: 'closed', at: 2.2 },
                { do: 'el', el: 'raft', to: { x: 1700 }, dur: 6, ease: 'inOut', at: 2.6 },
              ], n: 'Ro climbs on. He says nothing. But he holds Bunty’s sticky hand.', lineAt: 0.8,
            },
            { reward: 'wafer-paddle' },
          ],
        },
      ],
    },

    /* ======================= Chapter 4: Don't Lick the Lollipop ======================= */
    {
      id: 'c-4',
      title: 'Don’t Lick the Lollipop',
      teaser: 'The hardest game in the whole galaxy.',
      recap: 'Everybody licked at once. Nobody won, and everybody laughed.',
      scenes: [
        {
          id: 'c4-view', set: 'vista', mood: 'wonder', tint: { color: '#ffb36e', opacity: 0.12 }, cam: { el: 'garden', zoom: 0.9, dy: -250 },
          cast: [],
          shots: [
            { title: { ep: 'WORLD 1', name: 'Don’t Lick the Lollipop', sub: 'The Candy Nebula · Chapter 4' } },
            { cam: { el: 'garden', zoom: 0.9, dy: -250 }, move: { el: 'garden', zoom: 1.4, dy: -60 }, moveDur: 6, n: 'In the afternoon, the crew comes to a garden of giant lollipops.' },
          ],
        },
        {
          id: 'c4-garden', set: 'garden', mood: 'sneaky', trans: 'fade', cam: { wide: 1230, zoom: 0.75 },
          cast: [
            { id: 'kiki', x: 1070 }, { id: 'meera', x: 1150 }, { id: 'you', x: 1230, y: 730 },
            { id: 'bunty', x: 1310, face: -1 }, { id: 'ro', x: 1390, face: -1 },
            { id: 'fizz', x: 1230, y: 650, lift: 260 },
          ],
          shots: [
            { act: [{ do: 'expr', who: 'fizz', expr: 'excited' }, { do: 'sfx', snd: 'drum' }, { do: 'fx', fx: { kind: 'speedlines', on: true } }, { do: 'fx', fx: { kind: 'speedlines', on: false }, at: 2.8 }], who: 'fizz', t: 'GAME THREE! Don’t. Lick. The. Lollipop!' },
            { cam: { close: 'fizz' }, act: [{ do: 'expr', who: 'fizz', expr: 'smug' }], who: 'fizz', t: 'Stand next to a giant lollipop. Whoever lasts longest without licking wins!' },
            { cam: { close: 'kiki' }, act: [{ do: 'expr', who: 'kiki', expr: 'scared' }, { do: 'emote', who: 'kiki', emote: 'sweat' }, { do: 'fx', fx: { kind: 'backdrop', style: 'gloom', color: '#3b3f8a' } }, { do: 'fx', fx: { kind: 'backdrop', style: null }, at: 3.6 }], who: 'kiki', t: 'This is a trap! It’s the HARDEST game in the whole galaxy.' },
            {
              cam: { wide: 1260, zoom: 0.7 }, act: [
                ...LINE.map((id, i) => ({ do: 'move' as const, who: id, to: LOLLI_X[i] + 55, gait: 'walk' as const, at: i * 0.08 })),
                ...LINE.map((id) => ({ do: 'face' as const, who: id, dir: -1 as const, at: 3.0 })),
                ...LINE.map((id) => ({ do: 'pose' as const, who: id, pose: 'armsCrossed' as const, at: 3.2 })),
                { do: 'lift', who: 'fizz', to: 420, dur: 1.5 },
              ], n: 'Ten seconds. The lollipops smell of mango and strawberry.', lineAt: 1.6,
            },
            { cam: { medium: 'bunty' }, act: [{ do: 'expr', who: 'bunty', expr: 'sleepy' }, { do: 'emote', who: 'bunty', emote: 'sweat', at: 0.6 }], who: 'bunty', t: 'I am fine. I am totally fine.' },
            { cam: { xclose: 'kiki' }, act: [{ do: 'expr', who: 'kiki', expr: 'worried' }, { do: 'emote', who: 'kiki', emote: 'sweat', at: 0.3 }], n: 'Thirty seconds. Kiki is sweating.' },
            { cam: { close: 'kiki' }, act: [{ do: 'expr', who: 'kiki', expr: 'tongue' }, { do: 'cycle', who: 'kiki', cycle: 'tremble' }, { do: 'fx', fx: { kind: 'backdrop', style: 'shock', color: '#ffe066' } }, { do: 'fx', fx: { kind: 'backdrop', style: null }, at: 2.6 }], who: 'kiki', t: 'My tongue is moving on its OWN!' },
            { cam: { low: 'ro' }, act: [{ do: 'cycle', who: 'kiki', cycle: null }, { do: 'expr', who: 'ro', expr: 'determined' }, { do: 'fx', fx: { kind: 'vignette', on: true } }], n: 'Sixty seconds. Ro has not moved at all.' },
            { cam: { close: 'ro' }, act: [{ do: 'fx', fx: { kind: 'backdrop', style: 'speed', color: '#ff9b85' } }, { do: 'fx', fx: { kind: 'backdrop', style: null }, at: 3.2 }], who: 'ro', t: 'I can win this. I just have to want it more.' },
            {
              cam: { wide: 1260, zoom: 0.7 }, act: [
                { do: 'fx', fx: { kind: 'vignette', on: false } }, { do: 'sfx', snd: 'wind' },
                ...[1, 2, 3, 4, 5].map((n, i) => ({ do: 'el' as const, el: `lp${n}`, to: { rot: 9 }, dur: 1.4, ease: 'inOut' as const, at: 0.4 + i * 0.06 })),
                ...LINE.map((id) => ({ do: 'expr' as const, who: id, expr: 'shock' as const, at: 1.6 })),
              ], n: 'Then the wind blows. The lollipops sway closer... closer... CLOSER...',
            },
            {
              panels: [{ who: 'kiki', expr: 'tongue', bg: 'hearts' }, { who: 'ro', expr: 'tongue', bg: 'hearts' }, { who: 'meera', expr: 'tongue', bg: 'hearts' }],
              act: [
                { do: 'sfx', snd: 'slurp', at: 0.5 }, { do: 'fx', fx: { kind: 'word', text: 'SLURP!', color: '#ff9fcf' }, at: 0.5 },
                ...LINE.map((id) => ({ do: 'pose' as const, who: id, pose: 'lick' as const })),
                ...LINE.map((id) => ({ do: 'expr' as const, who: id, expr: 'tongue' as const })),
              ], n: 'Everybody licks at exactly the same time!',
            },
            {
              cam: { wide: 1260, zoom: 0.7 }, mood: 'playful', act: [
                ...[1, 2, 3, 4, 5].map((n) => ({ do: 'el' as const, el: `lp${n}`, to: { rot: 0 }, dur: 1.2 })),
                ...(['kiki', 'meera', 'you', 'bunty'] as CastId[]).map((id, i) => ({ do: 'cycle' as const, who: id, cycle: 'laugh' as const, at: i * 0.1 })),
                ...(['kiki', 'meera', 'you', 'bunty'] as CastId[]).map((id, i) => ({ do: 'expr' as const, who: id, expr: 'laugh' as const, at: i * 0.1 })),
                { do: 'pose', who: 'ro', pose: 'stand' }, { do: 'expr', who: 'ro', expr: 'shock' },
              ], who: 'kiki', t: 'WE ALL LOST!', lineAt: 0.6,
            },
            { cam: { medium: 'meera' }, act: [{ do: 'emote', who: 'meera', emote: 'heart' }], who: 'meera', t: 'Best. Game. Ever.' },
            {
              cam: { full: 'ro' }, act: [
                { do: 'expr', who: 'ro', expr: 'laugh' }, { do: 'cycle', who: 'ro', cycle: 'laugh' }, { do: 'cycle', who: 'ro', cycle: null, at: 1.4 },
                { do: 'pose', who: 'ro', pose: 'lie', at: 1.4 }, { do: 'sfx', snd: 'thud', at: 1.5 }, { do: 'fx', fx: { kind: 'dust', who: 'ro' }, at: 1.5 },
                { do: 'cam', to: { at: [LOLLI_X[4] + 170, 600, 1] }, dur: 0.8, at: 1.4 },
              ], n: 'Even Ro laughs so hard that he falls over.',
            },
            { cam: { close: 'fizz' }, act: [{ do: 'expr', who: 'fizz', expr: 'shock' }, { do: 'emote', who: 'fizz', emote: '!' }], who: 'fizz', t: 'Nobody wins? That has NEVER happened before!' },
            { cam: { close: 'fizz' }, act: [{ do: 'expr', who: 'fizz', expr: 'wink' }], who: 'fizz', t: 'Fine! I hid one Star for each of you in this garden.' },
            { gate: { id: 'g-c4-garden', title: 'Lollipop Garden', ask: 'Help the crew find their hidden Stars among the giant lollipops!', by: 'fizz' } },
            {
              cam: { wide: 1260, zoom: 0.7 }, mood: 'triumph', act: [
                ...LINE.map((id) => ({ do: 'cycle' as const, who: id, cycle: null })),
                ...[1, 2, 3, 4, 5].map((n, i) => ({ do: 'el' as const, el: `st${n}`, to: { opacity: 1, scale: 1 }, dur: 0.4, ease: 'back' as const, at: 0.2 + i * 0.15 })),
                ...LINE.map((id, i) => ({ do: 'prop' as const, who: id, prop: 'star' as const, at: 1.6 + i * 0.1 })),
                ...LINE.map((id, i) => ({ do: 'pose' as const, who: id, pose: 'hold' as const, at: 1.6 + i * 0.1 })),
                ...LINE.map((id, i) => ({ do: 'expr' as const, who: id, expr: 'happy' as const, at: 1.6 + i * 0.1 })),
                ...[1, 2, 3, 4, 5].map((n, i) => ({ do: 'el' as const, el: `st${n}`, to: { opacity: 0 }, dur: 0.2, at: 1.6 + i * 0.1 })),
                { do: 'sfx', snd: 'sparkle', at: 0.3 }, { do: 'sfx', snd: 'chime', at: 1.6 },
              ], n: 'One Star each. Five Stars, five smiles.',
            },
          ],
        },
        {
          id: 'c4-night', set: 'camp', mood: 'night', trans: 'fade', cam: { at: [900, 230, 1] },
          cast: [
            { id: 'ro', x: 560, pose: 'lie', expr: 'sleepy' }, { id: 'kiki', x: 720, pose: 'lie', expr: 'sleepy', face: -1 }, { id: 'you', x: 880, pose: 'lie', expr: 'closed' },
            { id: 'meera', x: 1040, pose: 'lie', expr: 'sleepy', face: -1 }, { id: 'bunty', x: 1200, pose: 'lie', expr: 'sleepy', face: -1 },
          ],
          shots: [
            { cam: { at: [900, 230, 1] }, move: { wide: 900, zoom: 0.75 }, moveDur: 6, act: [{ do: 'emote', who: 'bunty', emote: 'zzz', at: 2.6 }, { do: 'emote', who: 'ro', emote: 'zzz', at: 3.6 }, { do: 'emote', who: 'kiki', emote: 'zzz', at: 4.6 }], n: 'That night they sleep under the lollipops. Tomorrow is the Big Prize!', lineAt: 1.2 },
          ],
        },
      ],
    },

    /* ======================= Chapter 5: The Giant Lollipop ======================= */
    {
      id: 'c-5',
      title: 'The Giant Lollipop',
      teaser: 'The Big Prize waits at the top of Sugar Mountain.',
      recap: 'Ro won the Giant Lollipop, and shared it with everyone. World 1 is done!',
      scenes: [
        {
          id: 'c5-view', set: 'vista', mood: 'wonder', cam: { el: 'peak', zoom: 0.75, dy: 330 },
          cast: [],
          shots: [
            { title: { ep: 'WORLD 1', name: 'The Giant Lollipop', sub: 'The Candy Nebula · Chapter 5 · The Big Prize' } },
            { cam: { el: 'peak', zoom: 0.75, dy: 330 }, move: { el: 'peak', zoom: 1.3, dy: 60 }, moveDur: 7, act: [{ do: 'fx', fx: { kind: 'sparkle', el: 'peak', n: 10 }, at: 4 }, { do: 'sfx', snd: 'chime', at: 4 }], n: 'The last day. The Giant Lollipop shines on top of Sugar Mountain.' },
          ],
        },
        {
          id: 'c5-base', set: 'mountain', mood: 'triumph', trans: 'fade', cam: { at: [700, 2200, 0.75] },
          cast: [
            { id: 'meera', x: 240, y: 2440 }, { id: 'you', x: 310, y: 2440 }, { id: 'kiki', x: 380, y: 2440 }, { id: 'bunty', x: 450, y: 2440 }, { id: 'ro', x: 520, y: 2440 },
            { id: 'fizz', x: 760, y: 2440, lift: 260 },
          ],
          shots: [
            { cam: { at: [700, 2200, 0.75] }, move: { at: [800, 480, 0.75] }, moveDur: 6, act: [{ do: 'expr', who: 'fizz', expr: 'excited' }, { do: 'sfx', snd: 'fanfare', at: 5 }], who: 'fizz', t: 'The BIG PRIZE! The Giant Lollipop at the top of Sugar Mountain!' },
            { cam: { wide: 450, y: 2150, zoom: 0.8 }, act: [{ do: 'expr', who: 'fizz', expr: 'happy' }, ...all(['meera', 'you', 'kiki', 'bunty', 'ro'], (id) => [{ do: 'face', who: id, dir: 1 } as Action, { do: 'expr', who: id, expr: 'determined' } as Action])], who: 'fizz', t: 'The first one to touch the Lollipop wins the Candy Nebula!' },
            {
              cam: { wide: 700, y: 2200, zoom: 0.8 }, mood: 'race', act: [
                { do: 'move', who: 'ro', to: PATH[1][0], y: PATH[1][1], gait: 'climb', dur: 3.6 }, { do: 'track', who: 'ro', lead: 0 }, { do: 'fx', fx: { kind: 'speedlines', on: true } },
                { do: 'fx', fx: { kind: 'speedlines', on: false }, at: 1.4 }, { do: 'sfx', snd: 'whoosh' },
                ...all(['meera', 'you', 'kiki', 'bunty'], (id) => [{ do: 'expr', who: id, expr: 'shock', at: 0.4 } as Action]),
              ], n: 'Ro has the most Stars. He starts climbing before Fizz even finishes!', lineAt: 0.4,
            },
            { cam: { close: 'ro' }, act: [{ do: 'face', who: 'ro', dir: -1 }, { do: 'pose', who: 'ro', pose: 'wave' }, { do: 'expr', who: 'ro', expr: 'grin' }], who: 'ro', t: 'Sorry! It’s a race!' },
            { cam: { medium: ['meera', 'you', 'kiki'] }, act: [{ do: 'expr', who: 'meera', expr: 'sad' }, { do: 'pose', who: 'meera', pose: 'slump' }], who: 'meera', t: 'He didn’t even look back.' },
            { cam: { medium: ['meera', 'you', 'kiki'] }, act: [{ do: 'expr', who: 'kiki', expr: 'determined' }, { do: 'pose', who: 'kiki', pose: 'yay' }, { do: 'pose', who: 'meera', pose: 'stand' }], who: 'kiki', t: 'Then let’s catch up!' },
            { cam: { low: 'you' }, act: [{ do: 'pose', who: 'you', pose: 'pointUp' }, { do: 'expr', who: 'you', expr: 'determined' }, { do: 'look', who: 'you', gaze: 'cam' }, { do: 'pose', who: 'kiki', pose: 'stand' }], who: 'you', t: 'Together! Hold hands, crew. Nobody gets left behind.' },
            {
              cam: { wide: 650, y: 2200, zoom: 0.78 }, act: [
                { do: 'look', who: 'you', gaze: 'fwd' },
                { do: 'move', who: 'you', to: 700, y: 2290, gait: 'climb', dur: 3 }, { do: 'move', who: 'kiki', to: 640, y: 2312, gait: 'climb', dur: 3 }, { do: 'move', who: 'meera', to: 580, y: 2334, gait: 'climb', dur: 3 },
                { do: 'move', who: 'bunty', to: 520, y: 2356, gait: 'climb', dur: 2.8 },
                { do: 'move', who: 'bunty', to: 400, y: 2440, gait: 'walk', dur: 0.6, at: 3.0 }, { do: 'expr', who: 'bunty', expr: 'dizzy', at: 3.1 }, { do: 'squash', who: 'bunty', amt: 0.2, at: 3.5 },
                { do: 'sfx', snd: 'boing', at: 3.1 }, { do: 'fx', fx: { kind: 'word', text: 'SLIP!', color: '#8fc8ff' }, at: 3.1 },
              ], n: 'The mountain is steep and slippery. Icing everywhere!', lineAt: 0.8,
            },
            {
              cam: { medium: ['meera', 'bunty'] }, act: [
                { do: 'move', who: 'meera', to: 440, y: 2410, gait: 'walk', dur: 0.8 }, { do: 'pose', who: 'meera', pose: 'carry', at: 0.9 }, { do: 'expr', who: 'meera', expr: 'determined', at: 0.9 },
                { do: 'ride', who: 'bunty', on: 'meera', dx: 0, dy: 245, at: 1.0 }, { do: 'pose', who: 'bunty', pose: 'ride', at: 1.0 }, { do: 'expr', who: 'bunty', expr: 'love', at: 1.0 },
                { do: 'fx', fx: { kind: 'backdrop', style: 'rays', color: '#9fe08a' }, at: 1.0 }, { do: 'fx', fx: { kind: 'backdrop', style: null }, at: 3.6 },
              ], who: 'meera', t: 'I’ve got you, Bunty. Climb on my back!', lineAt: 1.1,
            },
            { gate: { id: 'g-c5-climb', title: 'Sugar Mountain Climb', ask: 'Help the crew climb Sugar Mountain together, one icy step at a time!', by: 'meera' } },
          ],
        },
        {
          id: 'c5-summit', set: 'summit', mood: 'triumph', trans: 'fade', cam: { wide: 800, zoom: 0.8 },
          cast: [{ id: 'ro', x: 520, face: 1, expr: 'determined', cycle: 'climb' }, { id: 'fizz', x: 1180, lift: 240, hidden: true }],
          shots: [
            {
              cam: { medium: 'ro', dx: 120 }, act: [
                { do: 'cycle', who: 'ro', cycle: null }, { do: 'move', who: 'ro', to: 660, gait: 'walk', dur: 1.2, then: 'reach' }, { do: 'fx', fx: { kind: 'glow' }, at: 1.5 },
                { do: 'fx', fx: { kind: 'confetti' }, at: 1.6 }, { do: 'fx', fx: { kind: 'word', text: 'WINNER!', color: '#ffd36e' }, at: 1.6 }, { do: 'sfx', snd: 'tada', at: 1.6 },
                { do: 'el', el: 'giant', to: { scale: 1.04 }, dur: 0.25, yoyo: 2, at: 1.6 },
              ], n: 'At the very top, Ro reaches out... and touches the Giant Lollipop.',
            },
            { cam: { wide: 900, zoom: 0.8 }, act: [{ do: 'show', who: 'fizz' }, { do: 'enter', who: 'fizz', from: 'right', to: 1100, gait: 'fly', dur: 0.8 }, { do: 'expr', who: 'fizz', expr: 'excited' }, { do: 'fx', fx: { kind: 'sparkle', who: 'fizz', n: 10 }, at: 0.8 }], who: 'fizz', t: 'RO WINS THE CANDY NEBULA!', lineAt: 0.8 },
            { cam: { low: 'ro' }, act: [{ do: 'pose', who: 'ro', pose: 'cheer' }, { do: 'cycle', who: 'ro', cycle: 'cheer' }, { do: 'expr', who: 'ro', expr: 'laugh' }, { do: 'fx', fx: { kind: 'backdrop', style: 'rays' } }], who: 'ro', t: 'YES! I won! I won, I won, I...' },
            {
              cam: { wide: 800, zoom: 0.75 }, mood: 'sad', act: [
                { do: 'fx', fx: { kind: 'backdrop', style: null } }, { do: 'cycle', who: 'ro', cycle: null }, { do: 'pose', who: 'ro', pose: 'stand' },
                { do: 'face', who: 'ro', dir: -1, at: 0.6 }, { do: 'expr', who: 'ro', expr: 'normal', at: 0.6 }, { do: 'fx', fx: { kind: 'vignette', on: true }, at: 0.8 },
                { do: 'hide', who: 'fizz' }, { do: 'fx', fx: { kind: 'tint', color: '#3b2f86', opacity: 0.25 }, at: 0.8 },
              ], n: 'Ro turns around. Nobody is cheering. His friends are far below.', lineAt: 0.9,
            },
            { cam: { close: 'ro' }, act: [{ do: 'expr', who: 'ro', expr: 'sad' }, { do: 'pose', who: 'ro', pose: 'slump' }], who: 'ro', t: '...Guys?' },
            { cam: { wide: 800, zoom: 0.7 }, act: [{ do: 'emote', who: 'ro', emote: 'gloom', at: 0.5 }], n: 'The biggest lollipop in the galaxy. And nobody to share it with.' },
            {
              cam: { close: 'ro' }, mood: 'triumph', act: [
                { do: 'fx', fx: { kind: 'vignette', on: false } }, { do: 'fx', fx: { kind: 'tint', color: null } }, { do: 'pose', who: 'ro', pose: 'stand' },
                { do: 'expr', who: 'ro', expr: 'determined' }, { do: 'fx', fx: { kind: 'backdrop', style: 'speed', color: '#ff9b85' } }, { do: 'fx', fx: { kind: 'backdrop', style: null }, at: 2.4 },
              ], who: 'ro', t: 'Hold on. I’m coming!',
            },
          ],
        },
        {
          id: 'c5-ladder', set: 'mountain', mood: 'triumph', trans: 'wipe', cam: { at: [700, 600, 0.8] },
          cast: [
            { id: 'ro', x: 690, y: 520, face: -1, expr: 'determined' },
            { id: 'you', x: 600, y: 1150, expr: 'shock' }, { id: 'kiki', x: 520, y: 1160, expr: 'shock' },
            { id: 'meera', x: 760, y: 1140, face: -1, pose: 'carry', expr: 'determined' }, { id: 'bunty', x: 760, y: 1140.5, pose: 'ride', expr: 'shock' },
          ],
          shots: [
            {
              move: { at: [640, 1000, 0.72] }, moveDur: 2.6, act: [
                { do: 'ride', who: 'bunty', on: 'meera', dx: 0, dy: 245 }, { do: 'pose', who: 'ro', pose: 'reachDown' }, { do: 'stretch', who: 'ro', len: 17, dur: 2.4, at: 0.3 },
                { do: 'sfx', snd: 'stretch', at: 0.3 }, { do: 'sfx', snd: 'stretch', at: 1.3 }, { do: 'fx', fx: { kind: 'word', text: 'STREEETCH!', color: '#ff9b85' }, at: 1.0 },
              ], n: 'Ro stretches his toffee arm all the way down Sugar Mountain.', lineAt: 0.4,
            },
            { cam: { medium: ['bunty', 'you'] }, act: [{ do: 'pose', who: 'you', pose: 'pointUp' }, { do: 'emote', who: 'bunty', emote: '!' }], who: 'bunty', t: 'Ro’s arm is a LADDER!' },
            {
              cam: { at: [620, 1000, 0.72] }, move: { at: [680, 640, 0.8] }, moveDur: 4.5, act: [
                { do: 'move', who: 'you', to: 610, y: 600, gait: 'climb', dur: 4 }, { do: 'move', who: 'kiki', to: 540, y: 612, gait: 'climb', dur: 4.2, at: 0.2 },
                { do: 'move', who: 'meera', to: 800, y: 585, gait: 'climb', dur: 4.6, at: 0.4 }, { do: 'expr', who: 'kiki', expr: 'laugh', at: 1 },
                ...all(['you', 'kiki', 'meera'], (id) => [{ do: 'pose', who: id, pose: 'stand', at: 4.8 } as Action]),
              ], n: 'One by one, the crew climbs up Ro’s arm to the top.',
            },
            { cam: { close: 'kiki' }, act: [{ do: 'expr', who: 'kiki', expr: 'laugh' }, { do: 'look', who: 'kiki', gaze: 'cam' }], who: 'kiki', t: 'This is the weirdest ladder in the whole universe!' },
          ],
        },
        {
          id: 'c5-share', set: 'summit', mood: 'playful', trans: 'fade', cam: { wide: 800, zoom: 0.75 },
          cast: [
            { id: 'you', x: 500, expr: 'happy' }, { id: 'ro', x: 620, face: -1, expr: 'normal' },
            { id: 'kiki', x: 980, face: -1, expr: 'happy' }, { id: 'bunty', x: 1070, face: -1, expr: 'happy' }, { id: 'meera', x: 1160, face: -1, expr: 'happy' },
            { id: 'fizz', x: 1300, lift: 260, hidden: true },
          ],
          shots: [
            { cam: { medium: ['you', 'ro'] }, act: [{ do: 'pose', who: 'ro', pose: 'slump' }, { do: 'expr', who: 'ro', expr: 'worried' }], who: 'ro', t: 'I won. But it wasn’t much fun up here by myself.' },
            { cam: { medium: ['you', 'ro'] }, act: [{ do: 'expr', who: 'you', expr: 'happy' }, { do: 'pose', who: 'you', pose: 'present' }], who: 'you', t: 'Well, now we’re all here.' },
            { cam: { close: 'ro' }, act: [{ do: 'pose', who: 'you', pose: 'stand' }, { do: 'pose', who: 'ro', pose: 'stand' }, { do: 'expr', who: 'ro', expr: 'grin' }, { do: 'look', who: 'ro', gaze: 'cam' }], who: 'ro', t: 'So... who wants some lollipop?' },
            {
              cam: { wide: 800, zoom: 0.75 }, act: [
                { do: 'look', who: 'ro', gaze: 'fwd' },
                { do: 'el', el: 'giant', to: { scale: 1.1 }, dur: 0.2, yoyo: 1 }, { do: 'el', el: 'giant', to: { opacity: 0 }, dur: 0.2, at: 0.5 }, { do: 'el', el: 'pieces', to: { opacity: 1 }, dur: 0.3, at: 0.5 },
                { do: 'fx', fx: { kind: 'sparkle', el: 'pieces', n: 12 }, at: 0.5 }, { do: 'sfx', snd: 'chime', at: 0.5 }, { do: 'fx', fx: { kind: 'word', text: 'CRACK!', color: '#ff9fcf' }, at: 0.4 },
                { do: 'el', el: 'pieces', to: { opacity: 0 }, dur: 0.3, at: 2.0 },
                ...all(['you', 'kiki', 'bunty', 'meera', 'ro'], (id, i) => [{ do: 'prop', who: id, prop: 'lollipiece', at: 2.0 + i * 0.1 } as Action, { do: 'pose', who: id, pose: 'holdFront', at: 2.0 + i * 0.1 } as Action, { do: 'expr', who: id, expr: 'happy', at: 2.0 + i * 0.1 } as Action]),
              ], n: 'Ro breaks the lollipop into five pieces. He keeps the smallest one.',
            },
            { cam: { close: 'ro' }, act: [{ do: 'mess', who: 'ro', color: '#ff9fcf' }, { do: 'expr', who: 'ro', expr: 'munch' }], who: 'kiki', t: 'Ro! You have lollipop in your EYEBROWS!' },
            {
              cam: { wide: 800, zoom: 0.75 }, act: [
                ...all(['you', 'kiki', 'bunty', 'meera', 'ro'], (id, i) => [{ do: 'cycle', who: id, cycle: 'laugh', at: i * 0.07 } as Action, { do: 'expr', who: id, expr: 'laugh', at: i * 0.07 } as Action]),
                { do: 'sfx', snd: 'cheer' },
              ], n: 'Everybody laughs. Ro laughs the loudest.',
            },
            {
              cam: { wide: 900, zoom: 0.78 }, mood: 'triumph', act: [
                ...all(['you', 'kiki', 'bunty', 'meera', 'ro'], (id) => [{ do: 'cycle', who: id, cycle: 'cheer' } as Action]),
                { do: 'show', who: 'fizz' }, { do: 'enter', who: 'fizz', from: 'right', to: 1180, gait: 'fly', dur: 0.8 }, { do: 'expr', who: 'fizz', expr: 'excited' },
                { do: 'fx', fx: { kind: 'confetti' }, at: 0.8 }, { do: 'sfx', snd: 'fanfare', at: 0.8 }, { do: 'fx', fx: { kind: 'word', text: 'STAGE CLEAR!', color: '#7fe6c9' }, at: 0.9 },
              ], who: 'fizz', t: 'STAGE CLEAR! The whole crew goes on to WORLD TWO!', lineAt: 0.9,
            },
            { reward: 'lollipop-stick' },
          ],
        },
        {
          // The whole Candy Nebula at sunset, seen from the top of the mountain.
          id: 'c5-sunset', set: 'vista', mood: 'wonder', trans: 'fade', tint: { color: '#ff8f6e', opacity: 0.2 }, cam: { el: 'peak', zoom: 1.3, dy: 60 },
          cast: [],
          shots: [
            { cam: { el: 'peak', zoom: 1.3, dy: 60 }, move: { at: [2000, 1356, 0.72] }, moveDur: 8, n: 'From the top, they can see the whole Candy Nebula.', lineAt: 1.2 },
          ],
        },
        {
          id: 'c5-camp', set: 'camp', mood: 'night', trans: 'fade', cam: { at: [900, 230, 1] },
          cast: [
            { id: 'meera', x: SEATS[1], y: 741, pose: 'perch', expr: 'happy' },
            { id: 'ro', x: SEATS[2], y: 741, pose: 'perch', face: -1, expr: 'happy', prop: 'lollipiece' },
            { id: 'you', x: 910, pose: 'sit', expr: 'happy' }, { id: 'kiki', x: 650, pose: 'sit', expr: 'sleepy' }, { id: 'bunty', x: 1170, pose: 'sit', face: -1, expr: 'sleepy' },
            { id: 'fizz', x: 1500, lift: 120 },
          ],
          shots: [
            { cam: { at: [900, 230, 1] }, move: { wide: 900, zoom: 0.75 }, moveDur: 5, act: [{ do: 'emote', who: 'bunty', emote: 'zzz', at: 3 }], n: 'That night, under candy stars, the crew sits close together.', lineAt: 1.2 },
            { cam: { medium: 'bunty' }, act: [{ do: 'expr', who: 'bunty', expr: 'sad' }], who: 'bunty', t: 'I miss home a little.' },
            { cam: { medium: 'meera' }, act: [{ do: 'expr', who: 'meera', expr: 'happy' }, { do: 'face', who: 'meera', dir: 1 }], who: 'meera', t: 'Me too. But this is a good kind of far away.' },
            { cam: { close: 'you' }, act: [{ do: 'expr', who: 'you', expr: 'happy' }, { do: 'look', who: 'you', gaze: 'cam' }, { do: 'expr', who: 'bunty', expr: 'happy' }], who: 'you', t: 'Rest up, crew. Next stop: Wizzlewick, the magic kingdom!' },
            { cam: { wide: 900, zoom: 0.75 }, move: { el: 'next', zoom: 1.3, dy: 60 }, moveDur: 5, act: [{ do: 'look', who: 'you', gaze: 'fwd' }, { do: 'fx', fx: { kind: 'sparkle', el: 'next', n: 8 }, at: 3.2 }, { do: 'sfx', snd: 'chime', at: 3.2 }], n: 'High above them, the next world is already twinkling.', lineAt: 1.0 },
            { cam: { medium: 'fizz' }, mood: 'none', act: [{ do: 'expr', who: 'fizz', expr: 'sing' }, { do: 'fx', fx: { kind: 'notes', who: 'fizz' } }, { do: 'fx', fx: { kind: 'notes', who: 'fizz' }, at: 2.5 }, { do: 'spin', who: 'fizz', turns: 1, dur: 1.2, at: 3 }], who: 'fizz', t: '♪ Magic and fun, coming up soon! ♪' },
            { cam: { close: 'meera' }, mood: 'night', act: [{ do: 'expr', who: 'meera', expr: 'smug' }, { do: 'look', who: 'meera', gaze: 'cam' }], who: 'meera', t: 'Still doesn’t rhyme.' },
          ],
        },
      ],
    },
  ],
};
