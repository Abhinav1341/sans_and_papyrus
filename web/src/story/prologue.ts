// PROLOGUE: "Press Start". Two chapters, written as a screenplay for the cinema engine.
// Story-skill notes: open in the middle of the action (the fair is on, the volcano is about to go);
// grow the comedy step by step (calm volcano, pink Ro, Kiki pressing things, a mystery machine);
// plant and pay off (Meera: "Nobody presses anything", and in the end nobody does: the token
// jumps in by itself); end every chapter calmly, with wonder rather than a cliffhanger.
// Language for ages 6-10: short lines read aloud, everyday words, present tense, sound words,
// and one refrain the Captain repeats ("Nobody gets left behind").
// Every shot is one beat: the camera frames it, characters act, then someone speaks.
import type { World, Action, CastId } from '@/cinema/types';
import { GALAXY_X } from '@/cinema/sets/galaxy-layout';
import { HALL, MACHINE } from '@/cinema/sets/school-layout';

/** Fizz flies past four worlds while the camera glides along; each world glows as Fizz passes. */
function songTour(worlds: number[]): Action[] {
  const acts: Action[] = [
    { do: 'expr', who: 'fizz', expr: 'sing' }, { do: 'move', who: 'fizz', to: GALAXY_X[worlds[worlds.length - 1]] + 60, y: 560, gait: 'fly', dur: 6.4 },
    { do: 'fx', fx: { kind: 'notes', who: 'fizz' }, at: 0.4 }, { do: 'fx', fx: { kind: 'notes', who: 'fizz' }, at: 3.2 },
  ];
  worlds.forEach((w, i) => {
    const t = 0.5 + i * 1.6;
    acts.push({ do: 'el', el: `g${w + 1}`, to: { scale: 1.12 }, dur: 0.5, yoyo: 1, at: t }, { do: 'fx', fx: { kind: 'sparkle', el: `g${w + 1}`, n: 6 }, at: t }, { do: 'sfx', snd: 'sparkle', at: t });
  });
  return acts;
}

/** How far the game board tips at the end of chapter 2 (degrees, right side down), round its middle (1200, 720). */
const TIP = 16;
/** Where a point on the tipped board ends up: `y` is the ground line someone stands on (720, or 760 for the Captain at the front). */
const onTilt = (x: number, y: number) => Math.round(y + (x - 1200) * Math.tan((TIP * Math.PI) / 180));
/** Who slides off the board, from their spot after the hands-in (x, ground line). */
const SLIDERS: [CastId, number, number][] = [['ro', 1305, 720], ['bunty', 1255, 720], ['you', 1200, 760], ['kiki', 1145, 720], ['meera', 1095, 720]];

export const prologue: World = {
  id: 'prologue',
  kind: 'prologue',
  label: 'Prologue',
  title: 'Press Start',
  chapters: [
    {
      id: 'p-1',
      title: 'The Mystery Machine',
      teaser: 'A volcano, a pink Ro, and a humming machine.',
      recap: 'A golden token woke up a machine. The crew fell into the Party Galaxy.',
      scenes: [
        {
          id: 'p1-hall', set: 'hall', mood: 'playful', cam: { wide: 300, zoom: 0.75 },
          cast: [
            { id: 'meera', x: 260, pose: 'present', expr: 'happy' },
            { id: 'ro', x: 1000, face: -1, hidden: true },
            { id: 'kiki', x: 150, hidden: true },
            { id: 'you', x: 790, face: -1, expr: 'happy' },
            { id: 'bunty', x: 1520, face: -1, hidden: true },
          ],
          shots: [
            { title: { ep: 'PROLOGUE', name: 'Press Start', sub: 'Chapter 1 · The Mystery Machine' } },
            { cam: { wide: 300, zoom: 0.75 }, move: { wide: 1260, zoom: 0.75 }, moveDur: 7, n: 'Science fair day! The hall smells of glue and paint.' },
            // Meera and her volcano, both whole in the frame.
            { cam: { at: [345, 520, 1.25] }, act: [{ do: 'fx', fx: { kind: 'sparkle', el: 'volcano' }, at: 0.3 }, { do: 'sfx', snd: 'sparkle', at: 0.3 }, { do: 'emote', who: 'meera', emote: 'sparkle', at: 0.5 }], who: 'meera', t: 'Ta-da! The calmest volcano in the whole world.' },
            { cam: { at: [430, 520, 0.9] }, act: [{ do: 'enter', who: 'ro', from: 'right', to: HALL.roSpot, gait: 'walk', then: 'hips' }, { do: 'expr', who: 'ro', expr: 'smug' }, { do: 'pose', who: 'meera', pose: 'stand', at: 0.4 }], who: 'ro', t: 'Calm? Meera, it’s just a cup of baking soda.', lineAt: 1.4 },
            { cam: { close: 'meera' }, act: [{ do: 'pose', who: 'meera', pose: 'armsCrossed' }, { do: 'expr', who: 'meera', expr: 'smug' }], who: 'meera', t: 'Just watch. Three... two... one...' },
            {
              cam: { el: 'volcano', zoom: 2.2, dy: -50 }, act: [
                { do: 'el', el: 'volcano', to: { rot: 3 }, dur: 0.12, yoyo: 4 }, { do: 'sfx', snd: 'wobble' },
                { do: 'el', el: 'foam', to: { scale: 0.35 }, dur: 0.3, ease: 'back', at: 0.6 }, { do: 'sfx', snd: 'bubble', at: 0.6 }, { do: 'el', el: 'foam', to: { scale: 0 }, dur: 0.4, at: 1.4 },
              ], n: 'The volcano gives a tiny gurgle.',
            },
            // The eruption, in one take: the geyser shoots up, a blob of foam flies over and lands on Ro.
            {
              cam: { at: [470, 420, 0.95] }, act: [
                { do: 'el', el: 'volcano', to: { rot: 5 }, dur: 0.08, yoyo: 6 }, { do: 'sfx', snd: 'wobble' },
                { do: 'expr', who: 'meera', expr: 'shock', at: 0.3 }, { do: 'pose', who: 'meera', pose: 'scared', at: 0.4 },
                { do: 'pose', who: 'ro', pose: 'lookUp', at: 0.3 }, { do: 'expr', who: 'ro', expr: 'shock', at: 0.3 },
                { do: 'el', el: 'geyser', to: { scale: 1 }, dur: 0.45, ease: 'out', at: 0.5 }, { do: 'el', el: 'foam', to: { scale: 1.4 }, dur: 0.3, ease: 'back', at: 0.5 },
                { do: 'sfx', snd: 'whoosh', at: 0.5 }, { do: 'fx', fx: { kind: 'word', text: 'FWOOSH!', color: '#ff9fcf', x: 22, y: 22 }, at: 0.55 }, { do: 'fx', fx: { kind: 'speedlines', on: true }, at: 0.5 },
                { do: 'el', el: 'blob', to: { x: HALL.volcano - HALL.roSpot, y: -230, opacity: 1 }, dur: 0.01, at: 0.95 },
                { do: 'el', el: 'blob', to: { x: 0 }, dur: 0.76, ease: 'linear', at: 0.96 },
                { do: 'el', el: 'blob', to: { y: -330 }, dur: 0.3, ease: 'out', at: 0.96 }, { do: 'el', el: 'blob', to: { y: 0 }, dur: 0.45, ease: 'in', at: 1.27 },
                { do: 'el', el: 'blob', to: { opacity: 0 }, dur: 0.05, at: 1.72 }, { do: 'mess', who: 'ro', color: '#ff9fcf', at: 1.72 },
                { do: 'fx', fx: { kind: 'splash', who: 'ro', color: '#ff9fcf' }, at: 1.72 }, { do: 'squash', who: 'ro', amt: 0.28, at: 1.72 }, { do: 'sfx', snd: 'splat', at: 1.72 },
                { do: 'fx', fx: { kind: 'word', text: 'SPLAT!', color: '#ff7ab8', x: 60, y: 30 }, at: 1.75 }, { do: 'pose', who: 'ro', pose: 'stand', at: 1.9 },
                { do: 'el', el: 'geyser', to: { scale: 0 }, dur: 0.5, at: 1.8 }, { do: 'el', el: 'foam', to: { scale: 0.7 }, dur: 0.4, at: 1.8 }, { do: 'fx', fx: { kind: 'speedlines', on: false }, at: 1.9 },
              ], n: 'Then... it is not calm at all!', lineAt: 2.2,
            },
            { cam: { close: 'ro' }, act: [{ do: 'pose', who: 'meera', pose: 'stand' }, { do: 'expr', who: 'ro', expr: 'dizzy' }, { do: 'emote', who: 'ro', emote: 'sweat', at: 0.3 }], who: 'ro', t: 'I’m pink. Why am I PINK?' },
            { cam: { close: 'meera' }, act: [{ do: 'expr', who: 'meera', expr: 'grin' }, { do: 'pose', who: 'meera', pose: 'present' }], who: 'meera', t: 'Food colouring. For science!' },
            { cam: { at: [330, 520, 0.9] }, act: [{ do: 'enter', who: 'kiki', from: 'left', to: 150, gait: 'run' }, { do: 'expr', who: 'kiki', expr: 'love', at: 0.6 }, { do: 'hop', who: 'kiki', n: 2, at: 1.0 }], who: 'kiki', t: 'Ro looks like a strawberry! Can I press the volcano too?', lineAt: 0.9 },
            { panels: [{ who: 'meera', expr: 'grumpy', bg: 'gloom' }, { who: 'kiki', expr: 'grin', bg: 'sparkle' }], who: 'meera', t: 'Nobody presses ANYTHING! Kiki, you pressed the fire alarm last week.' },
            { cam: { close: 'kiki' }, act: [{ do: 'expr', who: 'kiki', expr: 'grin' }, { do: 'emote', who: 'kiki', emote: 'note', at: 0.2 }], who: 'kiki', t: 'It had a little red lid! I just HAD to.' },
            {
              cam: { wide: 640, zoom: 0.75 }, act: [
                { do: 'move', who: 'kiki', to: 1080, gait: 'tiptoe', dur: 3.0 }, { do: 'track', who: 'kiki', lead: 40 }, { do: 'expr', who: 'kiki', expr: 'grin' },
                { do: 'sfx', snd: 'patter' }, { do: 'expr', who: 'meera', expr: 'normal' },
              ], n: 'When nobody is looking, Kiki tiptoes over to a robot.', lineAt: 0.4,
            },
            // The robot sneezes like a cartoon: a boop on the nose, a lean back ("ah... ah..."), then ACHOO.
            {
              cam: { at: [1110, 470, 1.35] }, act: [
                { do: 'track', who: null }, { do: 'face', who: 'kiki', dir: 1 }, { do: 'pose', who: 'kiki', pose: 'point', at: 0.3 },
                { do: 'el', el: 'robotnose', to: { scale: 0.6 }, dur: 0.08, yoyo: 1, at: 0.8 }, { do: 'sfx', snd: 'pop', at: 0.8 },
                { do: 'fx', fx: { kind: 'word', text: 'BOOP!', color: '#ff5f6d', x: 62, y: 36 }, at: 0.82 },
                { do: 'el', el: 'robothead', to: { rot: -16, y: -6 }, dur: 0.8, ease: 'out', at: 1.1 }, { do: 'sfx', snd: 'creak', at: 1.1 }, { do: 'pose', who: 'kiki', pose: 'stand', at: 1.2 },
                { do: 'expr', who: 'kiki', expr: 'shock', at: 1.5 },
                { do: 'el', el: 'robothead', to: { rot: 18, y: 0 }, dur: 0.12, ease: 'out', at: 2.0 }, { do: 'el', el: 'robot', to: { rot: -4 }, dur: 0.1, yoyo: 1, at: 2.0 },
                { do: 'el', el: 'sneeze', to: { opacity: 1, scale: 1.25, x: -40 }, dur: 0.35, ease: 'out', at: 2.02 }, { do: 'el', el: 'sneeze', to: { opacity: 0 }, dur: 0.5, at: 2.6 },
                { do: 'sfx', snd: 'whoosh', at: 2.0 }, { do: 'sfx', snd: 'pop', at: 2.0 }, { do: 'fx', fx: { kind: 'word', text: 'ACHOO!', color: '#8fc8ff', x: 24, y: 24 }, at: 2.02 },
                { do: 'jump', who: 'kiki', to: 1010, h: 30, dur: 0.35, at: 2.05, then: 'scared' }, { do: 'squash', who: 'kiki', amt: 0.2, at: 2.05 },
                { do: 'el', el: 'robothead', to: { rot: 0 }, dur: 0.6, ease: 'back', at: 2.6 },
              ], n: 'She presses its nose...', lineAt: 0.15, hold: 0.4,
            },
            { cam: { close: 'kiki' }, act: [{ do: 'pose', who: 'kiki', pose: 'stand' }, { do: 'expr', who: 'kiki', expr: 'laugh' }, { do: 'look', who: 'kiki', gaze: 'cam' }], who: 'kiki', t: 'Bless you, robot!' },
            { cam: { wide: 1380, zoom: 0.8 }, act: [{ do: 'enter', who: 'bunty', from: 'right', to: 1520, gait: 'run' }, { do: 'squash', who: 'bunty', amt: 0.22, at: 0.75 }, { do: 'emote', who: 'bunty', emote: '!', at: 0.8 }, { do: 'expr', who: 'bunty', expr: 'yell', at: 0.8 }, { do: 'pose', who: 'bunty', pose: 'cheer', at: 0.8 }, { do: 'look', who: 'kiki', gaze: 'fwd' }], who: 'bunty', t: 'EVERYONE! There’s a mystery machine in the store room!', lineAt: 0.9 },
            { panels: [{ who: 'ro', expr: 'shock', bg: 'shock' }, { who: 'meera', expr: 'shock', bg: 'dots' }, { who: 'kiki', expr: 'love', bg: 'sparkle' }], who: 'kiki', t: 'A MYSTERY machine?' },
            {
              cam: { wide: 1250, zoom: 0.75 }, act: [
                { do: 'move', who: 'ro', to: 1410, gait: 'run', at: 0.1 }, { do: 'move', who: 'meera', to: 1060, gait: 'run', at: 0.2 }, { do: 'move', who: 'kiki', to: 1300, gait: 'run' },
                { do: 'move', who: 'you', to: 1180, gait: 'walk' }, { do: 'expr', who: 'ro', expr: 'grumpy', at: 0.5 }, { do: 'expr', who: 'bunty', expr: 'grin' }, { do: 'pose', who: 'bunty', pose: 'stand' },
              ], n: 'Everyone runs over to Bunty.', lineAt: 1.0,
            },
            { cam: { medium: ['ro', 'bunty'] }, act: [{ do: 'face', who: 'ro', dir: 1 }, { do: 'pose', who: 'ro', pose: 'hips' }], who: 'ro', t: 'Bunty! You’re supposed to be in Class 4.' },
            { cam: { close: 'bunty' }, act: [{ do: 'expr', who: 'bunty', expr: 'love' }, { do: 'look', who: 'bunty', gaze: 'cam' }], who: 'bunty', t: 'Class 4 is boring. This is a MYSTERY!' },
            { cam: { low: 'you' }, act: [{ do: 'face', who: 'you', dir: 1 }, { do: 'expr', who: 'you', expr: 'determined' }, { do: 'look', who: 'bunty', gaze: 'fwd' }], n: '{name} looks at the store-room door.' },
            // The door itself: light leaks round its edges, it rattles, and it hums.
            {
              cam: { el: 'door', zoom: 1.2, dy: -200 }, move: { el: 'door', zoom: 1.6, dy: -190 }, moveDur: 5, mood: 'mystery', act: [
                { do: 'el', el: 'doorglow', to: { opacity: 1 }, dur: 1.2, at: 0.2 }, { do: 'sfx', snd: 'hum', at: 0.3 }, { do: 'sfx', snd: 'hum', at: 2.4 },
                { do: 'el', el: 'door', to: { rot: 0.8 }, dur: 0.09, yoyo: 6, at: 1.0 }, { do: 'el', el: 'door', to: { rot: -0.8 }, dur: 0.09, yoyo: 4, at: 2.6 },
                { do: 'fx', fx: { kind: 'sparkle', el: 'door', n: 6 }, at: 1.6 },
              ], n: 'Something behind it is humming.', lineAt: 1.2,
            },
            {
              cam: { wide: 1500, zoom: 0.75 }, act: [
                { do: 'exit', who: 'bunty', to: 'right' }, { do: 'exit', who: 'you', to: 'right', at: 0.15 }, { do: 'exit', who: 'ro', to: 'right', at: 0.2 },
                { do: 'exit', who: 'kiki', to: 'right', at: 0.3 }, { do: 'exit', who: 'meera', to: 'right', at: 0.45 }, { do: 'sfx', snd: 'patter' },
              ], n: 'Five pairs of feet race across the hall.',
            },
          ],
        },
        {
          id: 'p1-store', set: 'storeroom', mood: 'mystery', trans: 'iris', cam: { wide: 560, zoom: 0.75 },
          cast: [
            { id: 'meera', x: 340, hidden: true }, { id: 'you', x: 450, hidden: true }, { id: 'bunty', x: 560, hidden: true },
            { id: 'kiki', x: 670, hidden: true }, { id: 'ro', x: 770, hidden: true },
          ],
          shots: [
            {
              act: [
                { do: 'enter', who: 'ro', from: 'left', to: 770, gait: 'tiptoe' }, { do: 'enter', who: 'kiki', from: 'left', to: 670, gait: 'tiptoe', at: 0.3 },
                { do: 'enter', who: 'bunty', from: 'left', to: 560, gait: 'tiptoe', at: 0.6 }, { do: 'enter', who: 'you', from: 'left', to: 450, gait: 'tiptoe', at: 0.9 },
                { do: 'enter', who: 'meera', from: 'left', to: 340, gait: 'tiptoe', at: 1.2 },
              ], n: 'The store room is dark and dusty. Sunlight falls on something big.', lineAt: 0.6,
            },
            { cam: { el: 'machine', zoom: 1.0, dy: -300 }, move: { el: 'machine', zoom: 1.4, dy: -310 }, moveDur: 5, act: [{ do: 'sfx', snd: 'hum' }, { do: 'fx', fx: { kind: 'sparkle', el: 'machine', n: 8 }, at: 1.5 }], n: 'An old arcade machine. It hums. It glows.' },
            { cam: { medium: 'kiki' }, act: [{ do: 'expr', who: 'kiki', expr: 'love' }, { do: 'emote', who: 'kiki', emote: 'heart', at: 0.3 }], who: 'kiki', t: 'Party... Galaxy? It looks SO fun.' },
            { cam: { medium: 'meera' }, act: [{ do: 'pose', who: 'meera', pose: 'point' }, { do: 'expr', who: 'meera', expr: 'determined' }], who: 'meera', t: 'But it’s not even plugged in. Look at the wire!' },
            { cam: { at: [MACHINE.x + 236, MACHINE.y - 20, 2.4] }, act: [{ do: 'sfx', snd: 'hum', at: 0.2 }], hold: 1.1 },
            // The token: a clink, a hand into the pocket, and out it comes.
            { cam: { medium: 'you' }, act: [{ do: 'pose', who: 'meera', pose: 'stand' }, { do: 'sfx', snd: 'clink', at: 0.2 }, { do: 'expr', who: 'you', expr: 'shock', at: 0.25 }, { do: 'emote', who: 'you', emote: '?', at: 0.4 }, { do: 'pose', who: 'you', pose: 'pocket', at: 1.0 }], n: 'Clink! Something is in {name}’s pocket.', lineAt: 0.5 },
            { cam: { medium: 'you' }, act: [{ do: 'prop', who: 'you', prop: 'token', at: 0.45 }, { do: 'pose', who: 'you', pose: 'holdUp', at: 0.5 }, { do: 'fx', fx: { kind: 'sparkle', who: 'you', n: 10 }, at: 0.7 }, { do: 'sfx', snd: 'magic', at: 0.6 }, { do: 'expr', who: 'you', expr: 'love', at: 0.7 }], n: 'A golden token! Nobody put it there.', lineAt: 1.0 },
            { insert: 'token', act: [{ do: 'sfx', snd: 'magic', at: 0.3 }], hold: 1.8 },
            { reward: 'golden-token' },
            { cam: { el: 'machine', zoom: 3, dy: -114 }, act: [{ do: 'el', el: 'machine', to: { scale: 1.02 }, dur: 0.5, yoyo: 2 }], who: 'ro', t: 'Whoa. {name}, the coin slot is glowing. It’s glowing for YOU.' },
            { cam: { full: 'you' }, act: [{ do: 'pose', who: 'you', pose: 'reach' }, { do: 'expr', who: 'you', expr: 'worried' }, { do: 'face', who: 'you', dir: 1 }, { do: 'move', who: 'you', to: 490, gait: 'fly', dur: 1.2, ease: 'in', at: 0.6 }], n: '{name} holds out the token. It pulls, like a magnet.' },
            {
              cam: { wide: 760, zoom: 0.8 }, act: [
                { do: 'prop', who: 'you', prop: null }, { do: 'el', el: 'token', to: { x: 535 - MACHINE.x, y: -20, opacity: 1 }, dur: 0.01 },
                { do: 'el', el: 'token', to: { x: 0 }, dur: 1.0, ease: 'inOut', at: 0.1 }, { do: 'el', el: 'token', to: { y: -90 }, dur: 0.5, ease: 'out', at: 0.1 }, { do: 'el', el: 'token', to: { y: 0 }, dur: 0.5, ease: 'in', at: 0.6 },
                { do: 'el', el: 'token', to: { opacity: 0 }, dur: 0.1, at: 1.1 },
                { do: 'sfx', snd: 'swoosh' }, { do: 'sfx', snd: 'coin', at: 1.1 }, { do: 'fx', fx: { kind: 'glow' }, at: 1.1 }, { do: 'expr', who: 'you', expr: 'shock' }, { do: 'pose', who: 'you', pose: 'stand', at: 0.3 },
                { do: 'el', el: 'machine', to: { scale: 1.04 }, dur: 0.2, yoyo: 1, at: 1.15 },
              ], n: 'The token jumps out of {name}’s hand... and into the slot. CLINK!', lineAt: 0.4,
            },
            {
              cam: { wide: 640, zoom: 0.8 }, act: [
                { do: 'sfx', snd: 'beep' }, { do: 'fx', fx: { kind: 'speedlines', on: true } },
                { do: 'expr', who: 'kiki', expr: 'love' }, { do: 'expr', who: 'ro', expr: 'shock' }, { do: 'expr', who: 'bunty', expr: 'shock' }, { do: 'expr', who: 'meera', expr: 'shock' },
                { do: 'emote', who: 'ro', emote: '!', at: 0.2 }, { do: 'emote', who: 'meera', emote: '!', at: 0.4 }, { do: 'emote', who: 'bunty', emote: '!', at: 0.5 }, { do: 'fx', fx: { kind: 'speedlines', on: false }, at: 1.6 },
              ], n: 'The machine wakes up!',
            },
            { insert: 'screen', act: [{ do: 'sfx', snd: 'ding', at: 0.3 }], who: 'meera', t: 'It says PLAYERS: 5. There are five of us!' },
            { panels: [{ who: 'kiki', expr: 'love', bg: 'sparkle' }, { who: 'ro', expr: 'grin', bg: 'rays' }], who: 'kiki', t: 'Press it, press it, PRESS IT!' },
            { cam: { medium: 'meera' }, act: [{ do: 'cycle', who: 'meera', cycle: 'tremble' }, { do: 'expr', who: 'meera', expr: 'worried' }], who: 'meera', t: 'Wait! Is it safe? What if it’s NOT safe?' },
            { cam: { close: 'you' }, act: [{ do: 'cycle', who: 'meera', cycle: null }, { do: 'pose', who: 'meera', pose: 'stand' }, { do: 'expr', who: 'you', expr: 'determined' }, { do: 'look', who: 'you', gaze: 'cam' }], who: 'you', t: 'We stick together, whatever happens. Okay, crew?' },
            {
              cam: { wide: 560, zoom: 0.75 }, act: [
                { do: 'look', who: 'you', gaze: 'fwd' }, { do: 'expr', who: 'kiki', expr: 'grin' }, { do: 'expr', who: 'ro', expr: 'grin' }, { do: 'expr', who: 'bunty', expr: 'happy' },
                { do: 'hop', who: 'bunty', n: 1, at: 0.4 }, { do: 'hop', who: 'kiki', n: 1, at: 0.6 }, { do: 'expr', who: 'meera', expr: 'happy', at: 2.2 }, { do: 'hop', who: 'meera', n: 1, h: 18, at: 2.3 },
              ], n: 'Everyone nods. Even Meera. Slowly.',
            },
            // The whole count, by the Captain; the finger presses START exactly on "THREE!".
            { insert: 'button', act: [{ do: 'insert', id: 'press', atWord: 4 }, { do: 'sfx', snd: 'beep', atWord: 4 }], who: 'you', t: 'On three. One... two... THREE!', hold: 0.5 },
            // The screen starts to pull: light pours out, everyone leans back and slides towards it.
            {
              cam: { at: [760, 470, 0.8] }, mood: 'wonder', act: [
                { do: 'el', el: 'pull', to: { opacity: 1, scale: 1 }, dur: 1.4, ease: 'out' }, { do: 'sfx', snd: 'vortex' }, { do: 'sfx', snd: 'wind', at: 0.8 },
                { do: 'fx', fx: { kind: 'motion', on: true, dir: 'right' }, at: 0.6 },
                ...(['ro', 'kiki', 'bunty', 'you', 'meera'] as const).flatMap((id, i) => [
                  { do: 'pose' as const, who: id, pose: 'brace' as const, at: 0.3 + i * 0.1 }, { do: 'expr' as const, who: id, expr: 'shock' as const, at: 0.3 + i * 0.1 },
                  { do: 'face' as const, who: id, dir: 1 as const, at: 0.2 },
                  { do: 'move' as const, who: id, to: [840, 750, 650, 550, 450][i], gait: 'fly' as const, ease: 'in' as const, dur: 3.2, at: 0.6, then: 'brace' as const },
                ]),
              ], n: 'The screen starts to pull, like a giant vacuum!', lineAt: 1.0,
            },
            // One by one they fly into the screen, shrinking and spinning.
            {
              cam: { at: [760, 470, 0.8] }, move: { el: 'machine', zoom: 1.4, dy: -330 }, moveDur: 3.4, act: [
                ...(['ro', 'kiki', 'bunty', 'you', 'meera'] as const).flatMap((id, i) => {
                  const t = 0.3 + i * 0.45;
                  return [
                    { do: 'pose' as const, who: id, pose: 'flail' as const, at: t }, { do: 'expr' as const, who: id, expr: (['shock', 'laugh', 'love', 'shock', 'scared'] as const)[i], at: t },
                    { do: 'move' as const, who: id, to: MACHINE.x, gait: 'fly' as const, ease: 'in' as const, dur: 0.75, at: t },
                    { do: 'lift' as const, who: id, to: MACHINE.y + 40 - MACHINE.screen, dur: 0.75, ease: 'in' as const, at: t },
                    { do: 'scale' as const, who: id, s: 0.06, dur: 0.75, at: t }, { do: 'spin' as const, who: id, turns: 2, dur: 0.75, at: t },
                    { do: 'hide' as const, who: id, at: t + 0.78 }, { do: 'sfx' as const, snd: 'whoosh' as const, at: t },
                  ];
                }),
                { do: 'fx', fx: { kind: 'motion', on: false }, at: 2.8 },
              ], n: 'WHOOSH! One by one, the crew flies into the screen!', lineAt: 0.5,
            },
            // The camera dives into the screen after them.
            { cam: { el: 'machine', zoom: 1.4, dy: -330 }, move: { el: 'machine', zoom: 5.5, dy: -330 }, moveDur: 1.8, act: [{ do: 'sfx', snd: 'vortex' }, { do: 'fx', fx: { kind: 'whiteout', dur: 2.0 }, at: 1.0 }], hold: 0.6 },
          ],
        },
        {
          // Down the tunnel inside the screen: each child tumbles out of the far distance towards us.
          id: 'p1-vortex', set: 'vortex', mood: 'wonder', trans: 'white', cam: { wide: 500 },
          cast: [
            { id: 'you', x: 500, y: 560, s: 0.06, cycle: 'flail', expr: 'shock' }, { id: 'kiki', x: 500, y: 560, s: 0.06, cycle: 'flail', expr: 'laugh' },
            { id: 'ro', x: 500, y: 560, s: 0.06, cycle: 'flail', expr: 'shock' }, { id: 'meera', x: 500, y: 560, s: 0.06, cycle: 'flail', expr: 'shock' },
            { id: 'bunty', x: 500, y: 560, s: 0.06, cycle: 'flail', expr: 'love' },
          ],
          shots: [
            {
              act: [
                { do: 'fx', fx: { kind: 'fall', on: true } }, { do: 'sfx', snd: 'swirl' },
                ...([['kiki', 330, 690, 380], ['ro', 690, 700, 420], ['you', 470, 720, 260], ['meera', 620, 730, 160], ['bunty', 540, 700, 560]] as const).flatMap(([id, x, y, lift], i) => [
                  { do: 'scale' as const, who: id, s: 0.95, dur: 1.8, at: i * 0.35 },
                  { do: 'move' as const, who: id, to: x, y, gait: 'fly' as const, dur: 1.8, at: i * 0.35 },
                  { do: 'lift' as const, who: id, to: lift, dur: 1.8, at: i * 0.35 },
                  { do: 'spin' as const, who: id, turns: i % 2 ? 2 : 1, dur: 1.8, at: i * 0.35 },
                ]),
              ],
              n: 'Down the twisty tunnel they tumble, round and round!', lineAt: 1.2,
            },
            { cam: { medium: 'kiki' }, who: 'kiki', t: 'WHEEEE! I didn’t even press it this time!' },
            { cam: { medium: 'meera' }, who: 'meera', t: 'I would like a seatbelt, please!' },
          ],
        },
        {
          // A wide, slow fall: small figures drifting through a big sky of planets.
          id: 'p1-sky', set: 'sky', mood: 'wonder', trans: 'fade', cam: { at: [600, 900, 0.7] },
          cast: [
            { id: 'kiki', x: 380, y: 820, s: 0.55, cycle: 'float', expr: 'happy' }, { id: 'ro', x: 540, y: 760, s: 0.55, cycle: 'float', expr: 'grin' },
            { id: 'you', x: 650, y: 860, s: 0.55, cycle: 'float', expr: 'happy' }, { id: 'meera', x: 790, y: 800, s: 0.55, cycle: 'float', expr: 'shock' },
            { id: 'bunty', x: 470, y: 940, s: 0.5, cycle: 'float', expr: 'love' },
          ],
          shots: [
            {
              cam: { at: [600, 900, 0.7] }, move: { at: [600, 1150, 0.7] }, moveDur: 8,
              act: [
                { do: 'move', who: 'kiki', to: 360, y: 1080, gait: 'fly', dur: 8 }, { do: 'move', who: 'ro', to: 560, y: 1010, gait: 'fly', dur: 8 }, { do: 'move', who: 'you', to: 640, y: 1110, gait: 'fly', dur: 8 },
                { do: 'move', who: 'meera', to: 810, y: 1060, gait: 'fly', dur: 8 }, { do: 'move', who: 'bunty', to: 480, y: 1200, gait: 'fly', dur: 8 }, { do: 'spin', who: 'bunty', turns: 1, dur: 3, at: 2 },
              ],
              n: 'Then everything slows down. They float through a sky full of planets.', lineAt: 1.0,
            },
            { cam: { medium: 'bunty' }, act: [{ do: 'expr', who: 'bunty', expr: 'happy' }, { do: 'look', who: 'bunty', gaze: 'cam' }], who: 'bunty', t: 'We’re falling slowly. Like feathers!' },
            { cam: { close: 'meera' }, act: [{ do: 'expr', who: 'meera', expr: 'love' }, { do: 'fx', fx: { kind: 'sparkle', who: 'meera' } }], who: 'meera', t: 'Look! That planet down there is made of CANDY.' },
            { cam: { at: [600, 1300, 0.7] }, move: { at: [600, 2470, 0.7] }, moveDur: 7, act: [{ do: 'look', who: 'bunty', gaze: 'fwd' }, { do: 'sfx', snd: 'chime', at: 4.5 }], n: 'Far below, a pink planet sparkles. And somewhere, somebody is singing.', lineAt: 1.0 },
          ],
        },
      ],
    },
    {
      id: 'p-2',
      title: 'Welcome to the Party Galaxy',
      teaser: 'A disco ball, a silly song, and a new Captain.',
      recap: 'Fizz told them the rules, and {name} became Team Captain.',
      scenes: [
        {
          // The reveal: the whole Party Galaxy, eight worlds in a ring, then Fizz's game board.
          id: 'p2-galaxy', set: 'galaxy', mood: 'space', cam: { at: [330, 420, 0.75] },
          cast: [],
          shots: [
            { title: { ep: 'PROLOGUE', name: 'Welcome to the Party Galaxy', sub: 'Chapter 2' } },
            {
              cam: { at: [330, 420, 0.75] }, move: { at: [1810, 584, 0.75] }, moveDur: 8,
              act: [1, 2, 3, 4].map((n, i) => ({ do: 'el' as const, el: `g${n}`, to: { scale: 1.08 }, dur: 0.6, yoyo: 1, at: 0.6 + i * 1.8 })),
              n: 'Out in space, eight worlds float in a giant ring.', lineAt: 0.8,
            },
            { cam: { el: 'board', zoom: 0.75, dy: -200 }, move: { el: 'board', zoom: 0.95, dy: -110 }, moveDur: 4.5, act: [{ do: 'sfx', snd: 'chime', at: 1 }, { do: 'fx', fx: { kind: 'sparkle', el: 'board', n: 8 }, at: 1 }], n: 'In the middle floats a giant game board.' },
          ],
        },
        {
          id: 'p2-station', set: 'station', mood: 'space', trans: 'fade', cam: { wide: 1200, zoom: 0.75 },
          cast: [
            { id: 'meera', x: 960, hidden: true }, { id: 'kiki', x: 1070, hidden: true }, { id: 'you', x: 1200, y: 760, hidden: true },
            { id: 'bunty', x: 1310, face: -1, hidden: true }, { id: 'ro', x: 1430, face: -1, hidden: true },
            { id: 'fizz', x: 1200, y: 640, lift: 900, hidden: true },
          ],
          shots: [
            {
              act: [
                { do: 'enter', who: 'ro', from: 'top', to: 1430, dur: 0.9 }, { do: 'enter', who: 'kiki', from: 'top', to: 1070, dur: 0.9, at: 0.2 },
                { do: 'enter', who: 'you', from: 'top', to: 1200, dur: 0.9, at: 0.35 }, { do: 'enter', who: 'meera', from: 'top', to: 960, dur: 0.9, at: 0.5 },
                { do: 'fall', who: 'bunty', from: 900, dur: 1.0, land: 'splat', at: 0.8 },
                { do: 'sfx', snd: 'boing', at: 0.8 }, { do: 'fx', fx: { kind: 'word', text: 'BOING!', color: '#7fe6c9' }, at: 0.9 },
              ],
              n: 'BOING! Five kids bounce onto the giant game board.', lineAt: 1.2,
            },
            { cam: { close: 'bunty' }, act: [{ do: 'pose', who: 'bunty', pose: 'stand' }, { do: 'expr', who: 'bunty', expr: 'dizzy' }, { do: 'look', who: 'bunty', gaze: 'cam' }, { do: 'emote', who: 'bunty', emote: 'sparkle', at: 0.4 }, { do: 'hop', who: 'bunty', n: 1, at: 1.2 }], who: 'bunty', t: 'I bounced on my face. It was GREAT!' },
            {
              cam: { wide: 1200, zoom: 0.8 }, mood: 'playful', act: [
                { do: 'el', el: 'spotL', to: { rot: 6 }, dur: 0.7, yoyo: 2 }, { do: 'el', el: 'spotR', to: { rot: -6 }, dur: 0.7, yoyo: 2 },
                { do: 'show', who: 'fizz' }, { do: 'lift', who: 'fizz', to: 150, dur: 1.1, ease: 'back' }, { do: 'expr', who: 'fizz', expr: 'excited' },
                { do: 'fx', fx: { kind: 'speedlines', on: true }, at: 0.9 }, { do: 'fx', fx: { kind: 'confetti' }, at: 1.0 }, { do: 'sfx', snd: 'fanfare', at: 1.0 },
                { do: 'fx', fx: { kind: 'sparkle', who: 'fizz', n: 10 }, at: 1.1 }, { do: 'fx', fx: { kind: 'speedlines', on: false }, at: 3 },
              ], who: 'fizz', t: 'WELCOME, everybody, to the PARTY GALAXYYYY!', lineAt: 1.1,
            },
            { panels: [{ who: 'ro', expr: 'shock', bg: 'shock' }, { who: 'kiki', expr: 'shock', bg: 'dots' }], who: 'ro', t: 'Is that... a talking disco ball?' },
            { cam: { close: 'fizz' }, act: [{ do: 'expr', who: 'fizz', expr: 'smug' }, { do: 'spin', who: 'fizz', turns: 1, dur: 0.7, at: 1.2 }, { do: 'sfx', snd: 'swoosh', at: 1.2 }], who: 'fizz', t: 'I am FIZZ! I’m the host. And a super good dancer!' },
            { cam: { medium: 'meera' }, act: [{ do: 'pose', who: 'meera', pose: 'hips' }, { do: 'expr', who: 'meera', expr: 'determined' }], who: 'meera', t: 'Where are we? And how do we get home?' },
            { cam: { medium: 'fizz' }, act: [{ do: 'expr', who: 'fizz', expr: 'happy' }], who: 'fizz', t: 'Great question! I will answer it with a SONG.' },
            {
              cam: { wide: 1200, zoom: 0.8 }, act: [
                { do: 'expr', who: 'meera', expr: 'grumpy' }, { do: 'expr', who: 'ro', expr: 'grumpy' }, { do: 'expr', who: 'bunty', expr: 'sleepy' }, { do: 'expr', who: 'kiki', expr: 'grin' },
                { do: 'emote', who: 'meera', emote: 'sweat', at: 0.2 }, { do: 'emote', who: 'ro', emote: 'dots', at: 0.4 }, { do: 'emote', who: 'kiki', emote: 'note', at: 0.6 },
              ], n: 'Everyone groans. Except Kiki.',
            },
          ],
        },
        {
          // Fizz's song is a tour of the eight worlds the crew will visit.
          id: 'p2-song', set: 'galaxy', mood: 'none', trans: 'fade', cam: { at: [560, 440, 0.85] },
          cast: [{ id: 'fizz', x: GALAXY_X[0] - 60, y: 560, s: 0.6, expr: 'sing' }],
          shots: [
            { cam: { at: [560, 440, 0.85] }, move: { at: [1660, 440, 0.85] }, moveDur: 6.4, act: songTour([0, 1, 2, 3]), who: 'fizz', t: '♪ Eight big worlds, in a great big ring! ♪', lineAt: 0.6 },
            { cam: { at: [1660, 440, 0.85] }, move: { at: [3080, 440, 0.85] }, moveDur: 6.4, act: songTour([4, 5, 6, 7]), who: 'fizz', t: '♪ Win the Big Prize, and then... go to the next world! ♪', lineAt: 0.6 },
          ],
        },
        {
          id: 'p2-stage', set: 'station', mood: 'playful', trans: 'fade', cam: { close: 'meera' },
          cast: [
            { id: 'meera', x: 960, expr: 'smug' }, { id: 'kiki', x: 1070, expr: 'grin' }, { id: 'you', x: 1200, y: 760, expr: 'happy' },
            { id: 'bunty', x: 1310, face: -1, expr: 'happy' }, { id: 'ro', x: 1430, face: -1, expr: 'grumpy' },
            { id: 'fizz', x: 1200, y: 640, lift: 150, expr: 'happy' },
          ],
          shots: [
            { cam: { close: 'meera' }, act: [{ do: 'look', who: 'meera', gaze: 'cam' }], who: 'meera', t: 'That didn’t rhyme.' },
            { cam: { close: 'fizz' }, act: [{ do: 'expr', who: 'fizz', expr: 'shock' }, { do: 'fx', fx: { kind: 'backdrop', style: 'shock' } }, { do: 'fx', fx: { kind: 'backdrop', style: null }, at: 2.4 }], who: 'fizz', t: 'It ALMOST rhymed!' },
            { insert: 'rulecard', act: [{ do: 'expr', who: 'fizz', expr: 'happy' }, { do: 'look', who: 'meera', gaze: 'fwd' }], who: 'fizz', t: 'Rule one! Every world gives you new powers.' },
            { insert: 'rulecard', who: 'fizz', t: 'Rule two! Play silly games. Win shiny Stars.' },
            { cam: { wide: 1200, zoom: 0.8 }, act: [{ do: 'expr', who: 'fizz', expr: 'excited' }, { do: 'fx', fx: { kind: 'sparkle', who: 'fizz', n: 10 } }, { do: 'sfx', snd: 'sparkle' }], who: 'fizz', t: 'Rule three! Win the Big Prize, and EVERYONE goes on together!' },
            { cam: { medium: 'bunty' }, act: [{ do: 'expr', who: 'bunty', expr: 'worried' }, { do: 'pose', who: 'bunty', pose: 'scared' }], who: 'bunty', t: 'But what about our families? Won’t they worry?' },
            { cam: { close: 'fizz' }, act: [{ do: 'expr', who: 'fizz', expr: 'happy' }], who: 'fizz', t: 'Time at home is frozen! Not one second will pass.' },
            { cam: { medium: 'bunty' }, act: [{ do: 'pose', who: 'bunty', pose: 'relaxed' }, { do: 'expr', who: 'bunty', expr: 'happy' }], who: 'bunty', t: 'Oh. Okay. That’s actually really nice.' },
            { cam: { medium: 'ro' }, act: [{ do: 'pose', who: 'ro', pose: 'yay' }, { do: 'expr', who: 'ro', expr: 'grin' }, { do: 'fx', fx: { kind: 'backdrop', style: 'rays', color: '#ff9b85' } }, { do: 'fx', fx: { kind: 'backdrop', style: null }, at: 2.6 }], who: 'ro', t: 'Games? I’m going to win EVERY world!' },
            { cam: { medium: 'kiki' }, act: [{ do: 'expr', who: 'kiki', expr: 'grin' }, { do: 'hop', who: 'kiki', n: 2 }], who: 'kiki', t: 'Not if I press more buttons than you!' },
            { cam: { medium: 'fizz' }, act: [{ do: 'expr', who: 'fizz', expr: 'shock' }, { do: 'emote', who: 'fizz', emote: '?', at: 0.3 }], who: 'fizz', t: 'Oh! One more thing. Who pressed START?' },
            {
              cam: { wide: 1200, zoom: 0.8 }, act: [
                { do: 'pose', who: 'ro', pose: 'stand' }, { do: 'pose', who: 'bunty', pose: 'stand' },
                { do: 'face', who: 'meera', dir: 1 }, { do: 'face', who: 'kiki', dir: 1, at: 0.15 }, { do: 'face', who: 'ro', dir: -1, at: 0.3 }, { do: 'face', who: 'bunty', dir: -1, at: 0.45 },
                { do: 'sfx', snd: 'swoosh', at: 0.1 },
              ], n: 'Everyone turns to look at {name}.', lineAt: 0.8,
            },
            { cam: { close: 'you' }, act: [{ do: 'expr', who: 'you', expr: 'shock' }, { do: 'emote', who: 'you', emote: 'sweat', at: 0.2 }, { do: 'look', who: 'you', gaze: 'cam' }], who: 'you', t: 'Um. Me?' },
            {
              cam: { full: 'you' }, mood: 'triumph', act: [
                { do: 'fx', fx: { kind: 'backdrop', style: 'rays' } }, { do: 'cape', who: 'you', on: true, at: 0.6 }, { do: 'fx', fx: { kind: 'sparkle', who: 'you', n: 12 }, at: 0.6 },
                { do: 'sfx', snd: 'fanfare', at: 0.6 }, { do: 'fx', fx: { kind: 'confetti' }, at: 0.7 }, { do: 'pose', who: 'you', pose: 'cheer', at: 0.7 }, { do: 'expr', who: 'you', expr: 'laugh', at: 0.7 },
                { do: 'fx', fx: { kind: 'backdrop', style: null }, at: 4.2 },
              ], who: 'fizz', t: 'Then YOU are the TEAM CAPTAIN! Captain {name}!', lineAt: 0.8,
            },
            { reward: 'captain-badge' },
            { cam: { medium: 'ro' }, mood: 'playful', act: [{ do: 'pose', who: 'ro', pose: 'armsCrossed' }, { do: 'expr', who: 'ro', expr: 'grumpy' }], who: 'ro', t: 'Captain? But I wanted to be captain.' },
            { cam: { medium: 'meera' }, act: [{ do: 'expr', who: 'meera', expr: 'smug' }, { do: 'pose', who: 'meera', pose: 'hips' }], who: 'meera', t: 'And I wanted a calm volcano. Things change!' },
            { cam: { low: 'you' }, act: [{ do: 'pose', who: 'you', pose: 'hips' }, { do: 'expr', who: 'you', expr: 'determined' }, { do: 'look', who: 'you', gaze: 'cam' }], who: 'you', t: 'We stick together. Nobody gets left behind. Deal?' },
            // The hands-in, seen from straight above (a side view of hands stacking reads poorly in 2D).
            {
              insert: 'hands', act: [
                { do: 'move', who: 'meera', to: 1095, gait: 'walk' }, { do: 'move', who: 'kiki', to: 1145, gait: 'walk' },
                { do: 'move', who: 'bunty', to: 1255, gait: 'walk' }, { do: 'move', who: 'ro', to: 1305, gait: 'walk' },
                ...[0.62, 1.04, 1.46, 1.88, 2.3].map((at) => ({ do: 'sfx' as const, snd: 'tap' as const, at })),
                { do: 'sfx', snd: 'chime', at: 2.45 }, { do: 'sfx', snd: 'sparkle', at: 2.6 },
              ], n: 'One by one, the crew puts their hands in.', lineAt: 0.3, hold: 0.9,
            },
            {
              cam: { wide: 1200, zoom: 0.8 }, act: [
                ...(['meera', 'kiki', 'you', 'bunty', 'ro'] as const).flatMap((id, i) => [{ do: 'pose', who: id, pose: 'cheer', at: i * 0.06 } as Action, { do: 'expr', who: id, expr: 'laugh' } as Action]),
                { do: 'hop', who: 'bunty', n: 2 }, { do: 'expr', who: 'ro', expr: 'grin' }, { do: 'fx', fx: { kind: 'confetti' }, at: 0.2 }, { do: 'sfx', snd: 'cheer', at: 0.1 },
              ], who: 'bunty', t: 'DEAL!',
            },
            { reward: 'captains-call' },
            { cam: { medium: 'fizz' }, act: [{ do: 'expr', who: 'fizz', expr: 'happy' }, ...(['meera', 'kiki', 'you', 'bunty', 'ro'] as const).map((id) => ({ do: 'pose', who: id, pose: 'stand' }) as Action)], who: 'fizz', t: 'Wonderful! First, a warm-up. Show me you’re ready, Captain!' },
            { gate: { id: 'g-p-warmup', title: 'Captain Warm-Up', ask: 'Fizz wants to see what the new Captain can do!', by: 'fizz' } },
            { cam: { medium: 'fizz' }, act: [{ do: 'expr', who: 'fizz', expr: 'excited' }, { do: 'fx', fx: { kind: 'sparkle', who: 'fizz' } }, { do: 'sfx', snd: 'sparkle' }], who: 'fizz', t: 'Super! Here is your Rule Card, Captain.' },
            { reward: 'rule-card' },
            { cam: { wide: 1200, zoom: 0.8 }, mood: 'triumph', act: [{ do: 'expr', who: 'fizz', expr: 'excited' }, { do: 'spin', who: 'fizz', turns: 2, dur: 1.2 }, { do: 'fx', fx: { kind: 'speedlines', on: true } }], who: 'fizz', t: 'Next stop... the CANDY NEBULA!' },
            // The board really tips: it tilts round its middle, the crew plops down and slides off the low end.
            {
              cam: { wide: 1200, zoom: 0.75 }, act: [
                { do: 'fx', fx: { kind: 'speedlines', on: false } }, { do: 'sfx', snd: 'creak', at: 0.2 },
                { do: 'el', el: 'board', to: { rot: TIP }, dur: 1.0, ease: 'inOut', at: 0.3 },
                { do: 'expr', who: 'kiki', expr: 'laugh' }, { do: 'expr', who: 'bunty', expr: 'love' }, { do: 'expr', who: 'meera', expr: 'shock' }, { do: 'expr', who: 'ro', expr: 'shock' }, { do: 'expr', who: 'you', expr: 'laugh' },
                ...SLIDERS.flatMap(([id, x, y], i) => [
                  { do: 'move', who: id, to: x, y: onTilt(x, y), gait: 'fly', ease: 'inOut', dur: 1.0, then: 'sit', at: 0.3 } as Action,
                  { do: 'pose', who: id, pose: 'sit', at: 0.5 + i * 0.08 } as Action,
                  { do: 'move', who: id, to: 1960, y: onTilt(1960, y), gait: 'fly', ease: 'in', dur: 1.1, then: 'sit', at: 1.25 + i * 0.14 } as Action,
                ]),
                { do: 'sfx', snd: 'whoosh', at: 1.3 }, { do: 'sfx', snd: 'whoosh', at: 1.7 },
              ], n: 'The board tips like a slide. Wheee! Down to a pink planet!', lineAt: 0.5,
            },
          ],
        },
      ],
    },
  ],
};
