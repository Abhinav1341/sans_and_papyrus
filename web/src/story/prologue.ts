// PROLOGUE: "Press Start". Two chapters, written as a screenplay for the cinema engine.
// Story-skill notes: open in the middle of the action (the fair is on, the volcano is about to go);
// grow the comedy step by step (calm volcano, pink Ro, Kiki pressing things, a mystery machine);
// plant and pay off (Meera: "Nobody presses anything", and in the end nobody does: the token
// jumps in by itself); end every chapter calmly, with wonder rather than a cliffhanger.
// Language for ages 6-10: short lines read aloud, everyday words, present tense, sound words,
// and one refrain the Captain repeats ("Nobody gets left behind").
// Every shot is one beat: the camera frames it, characters act, then someone speaks.
import type { World, Action } from '@/cinema/types';
import { GALAXY_X } from '@/cinema/sets/galaxy-layout';

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
            { id: 'meera', x: 290, pose: 'present', expr: 'happy' },
            { id: 'ro', x: 900, face: -1, hidden: true },
            { id: 'kiki', x: 170, hidden: true },
            { id: 'you', x: 770, face: -1, expr: 'happy' },
            { id: 'bunty', x: 1520, face: -1, hidden: true },
          ],
          shots: [
            { title: { ep: 'PROLOGUE', name: 'Press Start', sub: 'Chapter 1 · The Mystery Machine' } },
            { cam: { wide: 300, zoom: 0.75 }, move: { wide: 1260, zoom: 0.75 }, moveDur: 7, n: 'Science fair day! The hall smells of glue and paint.' },
            { cam: { full: 'meera', dx: 40 }, act: [{ do: 'fx', fx: { kind: 'sparkle', el: 'volcano' }, at: 0.3 }, { do: 'sfx', snd: 'sparkle', at: 0.3 }, { do: 'emote', who: 'meera', emote: 'sparkle', at: 0.5 }], who: 'meera', t: 'Ta-da! The calmest volcano in the whole world.' },
            { cam: { medium: 'meera', dx: 150 }, act: [{ do: 'enter', who: 'ro', from: 'right', to: 530, gait: 'walk', then: 'hips' }, { do: 'expr', who: 'ro', expr: 'smug' }], who: 'ro', t: 'Calm? Meera, it’s just a cup of baking soda.', lineAt: 1.1 },
            { cam: { close: 'meera' }, act: [{ do: 'pose', who: 'meera', pose: 'armsCrossed' }, { do: 'expr', who: 'meera', expr: 'smug' }], who: 'meera', t: 'Just watch. Three... two... one...' },
            { cam: { el: 'volcano', zoom: 2.4, dy: -70 }, act: [{ do: 'el', el: 'volcano', to: { rot: 3 }, dur: 0.12, yoyo: 4 }, { do: 'sfx', snd: 'wobble' }], n: 'The volcano gives a tiny gurgle.' },
            {
              cam: { medium: ['meera', 'ro'] }, act: [
                { do: 'el', el: 'foam', to: { scale: 1.6, y: -30 }, dur: 0.35, ease: 'back' }, { do: 'sfx', snd: 'whoosh' },
                { do: 'fx', fx: { kind: 'word', text: 'FWOOSH!', color: '#ff9fcf' } }, { do: 'fx', fx: { kind: 'speedlines', on: true } },
                { do: 'fx', fx: { kind: 'splash', who: 'ro', color: '#ff9fcf' }, at: 0.3 }, { do: 'expr', who: 'ro', expr: 'shock' }, { do: 'expr', who: 'meera', expr: 'shock' },
                { do: 'jump', who: 'ro', h: 70, dur: 0.45 }, { do: 'mess', who: 'ro', color: '#ff9fcf', at: 0.35 }, { do: 'fx', fx: { kind: 'speedlines', on: false }, at: 1.4 },
              ], n: 'Then... it is not calm at all!', lineAt: 0.9,
            },
            { cam: { close: 'ro' }, act: [{ do: 'expr', who: 'ro', expr: 'dizzy' }, { do: 'emote', who: 'ro', emote: 'sweat', at: 0.3 }], who: 'ro', t: 'I’m pink. Why am I PINK?' },
            { cam: { close: 'meera' }, act: [{ do: 'expr', who: 'meera', expr: 'grin' }, { do: 'pose', who: 'meera', pose: 'present' }], who: 'meera', t: 'Food colouring. For science!' },
            { cam: { full: ['meera', 'ro'], dx: -110 }, act: [{ do: 'enter', who: 'kiki', from: 'left', to: 170, gait: 'run' }, { do: 'expr', who: 'kiki', expr: 'love', at: 0.6 }, { do: 'hop', who: 'kiki', n: 2, at: 1.0 }], who: 'kiki', t: 'Ro looks like a strawberry! Can I press the volcano too?', lineAt: 0.9 },
            { panels: [{ who: 'meera', expr: 'grumpy', bg: 'gloom' }, { who: 'kiki', expr: 'grin', bg: 'sparkle' }], who: 'meera', t: 'Nobody presses ANYTHING! Kiki, you pressed the fire alarm last week.' },
            { cam: { close: 'kiki' }, act: [{ do: 'expr', who: 'kiki', expr: 'grin' }, { do: 'emote', who: 'kiki', emote: 'note', at: 0.2 }], who: 'kiki', t: 'It had a little red lid! I just HAD to.' },
            {
              cam: { wide: 640, zoom: 0.75 }, act: [
                { do: 'move', who: 'kiki', to: 1050, gait: 'tiptoe', dur: 2.6 }, { do: 'track', who: 'kiki', lead: 40 }, { do: 'expr', who: 'kiki', expr: 'grin' },
                { do: 'sfx', snd: 'patter' }, { do: 'expr', who: 'meera', expr: 'normal' },
              ], n: 'When nobody is looking, Kiki tiptoes over to a robot.', lineAt: 0.4,
            },
            {
              cam: { at: [1120, 540, 1.5] }, act: [
                { do: 'track', who: null }, { do: 'face', who: 'kiki', dir: 1 }, { do: 'pose', who: 'kiki', pose: 'point', at: 0.3 },
                { do: 'el', el: 'robot', to: { scale: 1.15, rot: -8 }, dur: 0.14, yoyo: 1, at: 1.7 }, { do: 'sfx', snd: 'pop', at: 1.7 }, { do: 'fx', fx: { kind: 'word', text: 'ACHOO!', color: '#8fc8ff' }, at: 1.7 },
                { do: 'fx', fx: { kind: 'burst', el: 'robot' }, at: 1.7 }, { do: 'expr', who: 'kiki', expr: 'shock', at: 1.7 }, { do: 'squash', who: 'kiki', amt: 0.2, at: 1.75 },
              ], n: 'She presses its nose...', lineAt: 0.2, hold: 0.6,
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
            { cam: { low: 'you' }, act: [{ do: 'face', who: 'you', dir: 1 }, { do: 'expr', who: 'you', expr: 'determined' }, { do: 'sfx', snd: 'hum', at: 0.3 }], n: '{name} looks at the store-room door. Something behind it is humming.' },
            {
              cam: { wide: 1700, zoom: 0.75 }, act: [
                { do: 'exit', who: 'bunty', to: 'right' }, { do: 'exit', who: 'you', to: 'right', at: 0.15 }, { do: 'exit', who: 'ro', to: 'right', at: 0.2 },
                { do: 'exit', who: 'kiki', to: 'right', at: 0.3 }, { do: 'exit', who: 'meera', to: 'right', at: 0.45 }, { do: 'sfx', snd: 'patter' },
              ], n: 'Five pairs of feet race across the hall.',
            },
          ],
        },
        {
          id: 'p1-store', set: 'storeroom', mood: 'mystery', trans: 'iris', cam: { wide: 620, zoom: 0.75 },
          cast: [
            { id: 'meera', x: 400, hidden: true }, { id: 'you', x: 510, hidden: true }, { id: 'bunty', x: 620, hidden: true },
            { id: 'kiki', x: 730, hidden: true }, { id: 'ro', x: 840, hidden: true },
          ],
          shots: [
            {
              act: [
                { do: 'enter', who: 'ro', from: 'left', to: 840, gait: 'tiptoe' }, { do: 'enter', who: 'kiki', from: 'left', to: 730, gait: 'tiptoe', at: 0.3 },
                { do: 'enter', who: 'bunty', from: 'left', to: 620, gait: 'tiptoe', at: 0.6 }, { do: 'enter', who: 'you', from: 'left', to: 510, gait: 'tiptoe', at: 0.9 },
                { do: 'enter', who: 'meera', from: 'left', to: 400, gait: 'tiptoe', at: 1.2 },
              ], n: 'The store room is dark and dusty. Sunlight falls on something big.', lineAt: 0.6,
            },
            { cam: { el: 'machine', zoom: 1.35, dy: -260 }, move: { el: 'machine', zoom: 1.7, dy: -280 }, moveDur: 4, act: [{ do: 'sfx', snd: 'hum' }], n: 'An old arcade machine. It hums. It glows.' },
            { cam: { medium: 'kiki' }, act: [{ do: 'expr', who: 'kiki', expr: 'love' }, { do: 'emote', who: 'kiki', emote: 'heart', at: 0.3 }], who: 'kiki', t: 'Party... Galaxy? It looks SO fun.' },
            { cam: { medium: 'meera' }, act: [{ do: 'pose', who: 'meera', pose: 'point' }, { do: 'expr', who: 'meera', expr: 'determined' }], who: 'meera', t: 'But it’s not even plugged in. Look at the wire!' },
            { cam: { close: 'you' }, act: [{ do: 'expr', who: 'you', expr: 'shock' }, { do: 'sfx', snd: 'clink', at: 0.4 }, { do: 'fx', fx: { kind: 'sparkle', who: 'you' }, at: 0.4 }, { do: 'emote', who: 'you', emote: '?', at: 0.6 }], n: 'Clink! A golden token appears in {name}’s pocket. Nobody put it there.' },
            { insert: 'token', act: [{ do: 'sfx', snd: 'magic', at: 0.3 }], hold: 1.8 },
            { reward: 'golden-token' },
            { cam: { el: 'machine', zoom: 3, dy: -110 }, act: [{ do: 'el', el: 'machine', to: { scale: 1.02 }, dur: 0.5, yoyo: 2 }], who: 'ro', t: 'Whoa. {name}, the coin slot is glowing. It’s glowing for YOU.' },
            { cam: { full: 'you' }, act: [{ do: 'pose', who: 'you', pose: 'holdFront' }, { do: 'prop', who: 'you', prop: 'token' }, { do: 'expr', who: 'you', expr: 'worried' }, { do: 'face', who: 'you', dir: 1 }], n: '{name} holds up the token. It pulls, like a magnet.' },
            {
              cam: { wide: 760, zoom: 0.8 }, act: [
                { do: 'prop', who: 'you', prop: null }, { do: 'el', el: 'token', to: { x: -480, y: -40, opacity: 1 }, dur: 0.01 },
                { do: 'el', el: 'token', to: { x: 0, y: 20 }, dur: 1.0, ease: 'inOut', at: 0.1 }, { do: 'el', el: 'token', to: { opacity: 0 }, dur: 0.1, at: 1.1 },
                { do: 'sfx', snd: 'swoosh' }, { do: 'sfx', snd: 'coin', at: 1.1 }, { do: 'fx', fx: { kind: 'glow' }, at: 1.1 }, { do: 'expr', who: 'you', expr: 'shock' },
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
              cam: { wide: 620, zoom: 0.75 }, act: [
                { do: 'expr', who: 'kiki', expr: 'grin' }, { do: 'expr', who: 'ro', expr: 'grin' }, { do: 'expr', who: 'bunty', expr: 'happy' },
                { do: 'hop', who: 'bunty', n: 1, at: 0.4 }, { do: 'hop', who: 'kiki', n: 1, at: 0.6 }, { do: 'expr', who: 'meera', expr: 'happy', at: 2.2 }, { do: 'hop', who: 'meera', n: 1, h: 18, at: 2.3 },
              ], n: 'Everyone nods. Even Meera. Slowly.',
            },
            { insert: 'button', who: 'you', t: 'On three. One... two...' },
            { cam: { el: 'machine', zoom: 1.6, dy: -260 }, act: [{ do: 'fx', fx: { kind: 'whiteout', dur: 2.2 } }, { do: 'sfx', snd: 'vortex' }, { do: 'fx', fx: { kind: 'speedlines', on: true } }], n: 'Three!', hold: 0.6 },
          ],
        },
        {
          id: 'p1-vortex', set: 'vortex', mood: 'wonder', trans: 'white', cam: { wide: 500 },
          cast: [
            { id: 'you', x: 470, y: 700, lift: 260, cycle: 'flail', expr: 'shock' }, { id: 'kiki', x: 330, y: 680, lift: 380, cycle: 'flail', expr: 'laugh' },
            { id: 'ro', x: 690, y: 690, lift: 420, cycle: 'flail', expr: 'shock' }, { id: 'meera', x: 610, y: 710, lift: 160, cycle: 'flail', expr: 'shock' },
            { id: 'bunty', x: 540, y: 700, lift: 600, cycle: 'flail', expr: 'love' },
          ],
          shots: [
            {
              act: [{ do: 'fx', fx: { kind: 'fall', on: true } }, { do: 'spin', who: 'bunty', turns: 2, dur: 2 }, { do: 'spin', who: 'kiki', turns: 1, dur: 1.6, at: 0.4 }, { do: 'sfx', snd: 'swirl' }],
              n: 'The floor disappears. The whole crew falls into the screen!',
            },
            { cam: { medium: 'kiki' }, who: 'kiki', t: 'WHEEEE! I didn’t even press it this time!' },
            { cam: { medium: 'meera' }, who: 'meera', t: 'I would like a seatbelt, please!' },
          ],
        },
        {
          id: 'p1-sky', set: 'sky', mood: 'wonder', trans: 'fade', cam: { at: [600, 760, 0.85] },
          cast: [
            { id: 'kiki', x: 330, y: 760, cycle: 'float', expr: 'happy' }, { id: 'ro', x: 520, y: 700, cycle: 'float', expr: 'grin' },
            { id: 'you', x: 640, y: 820, cycle: 'float', expr: 'happy' }, { id: 'meera', x: 800, y: 740, cycle: 'float', expr: 'shock' },
            { id: 'bunty', x: 460, y: 960, cycle: 'float', expr: 'love' },
          ],
          shots: [
            {
              move: { at: [600, 900, 0.85] }, moveDur: 6,
              act: [
                { do: 'move', who: 'kiki', to: 330, y: 900, gait: 'fly', dur: 6 }, { do: 'move', who: 'ro', to: 520, y: 840, gait: 'fly', dur: 6 }, { do: 'move', who: 'you', to: 640, y: 960, gait: 'fly', dur: 6 },
                { do: 'move', who: 'meera', to: 800, y: 880, gait: 'fly', dur: 6 }, { do: 'move', who: 'bunty', to: 460, y: 1100, gait: 'fly', dur: 6 },
              ],
              n: 'Then everything slows down. They float through a sky full of planets.',
            },
            { cam: { medium: 'bunty' }, act: [{ do: 'expr', who: 'bunty', expr: 'happy' }, { do: 'look', who: 'bunty', gaze: 'cam' }], who: 'bunty', t: 'We’re falling slowly. Like feathers!' },
            { cam: { close: 'meera' }, act: [{ do: 'expr', who: 'meera', expr: 'love' }, { do: 'fx', fx: { kind: 'sparkle', who: 'meera' } }], who: 'meera', t: 'Look! That planet down there is made of CANDY.' },
            { cam: { at: [600, 1300, 0.8] }, move: { at: [600, 2600, 0.8] }, moveDur: 7, act: [{ do: 'sfx', snd: 'chime', at: 4 }], n: 'Far below, a pink planet sparkles. And somewhere, somebody is singing.' },
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
            { id: 'meera', x: 870, hidden: true }, { id: 'kiki', x: 980, hidden: true }, { id: 'you', x: 1200, y: 760, hidden: true },
            { id: 'ro', x: 1420, face: -1, hidden: true }, { id: 'bunty', x: 1530, face: -1, hidden: true },
            { id: 'fizz', x: 1200, y: 640, lift: 900, hidden: true },
          ],
          shots: [
            {
              act: [
                { do: 'enter', who: 'ro', from: 'top', to: 1420, dur: 0.9 }, { do: 'enter', who: 'kiki', from: 'top', to: 980, dur: 0.9, at: 0.2 },
                { do: 'enter', who: 'you', from: 'top', to: 1200, dur: 0.9, at: 0.35 }, { do: 'enter', who: 'meera', from: 'top', to: 870, dur: 0.9, at: 0.5 },
                { do: 'fall', who: 'bunty', from: 900, dur: 1.0, land: 'splat', at: 0.8 },
                { do: 'sfx', snd: 'boing', at: 0.8 }, { do: 'fx', fx: { kind: 'word', text: 'BOING!', color: '#7fe6c9' }, at: 0.9 },
              ],
              n: 'BOING! Five kids bounce onto the giant game board.', lineAt: 1.2,
            },
            { cam: { close: 'bunty' }, act: [{ do: 'pose', who: 'bunty', pose: 'stand', at: 0.3 }, { do: 'expr', who: 'bunty', expr: 'dizzy' }, { do: 'look', who: 'bunty', gaze: 'cam' }], who: 'bunty', t: 'I bounced on my face. It was GREAT!' },
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
          id: 'p2-song', set: 'galaxy', mood: 'triumph', trans: 'fade', cam: { at: [560, 440, 0.85] },
          cast: [{ id: 'fizz', x: GALAXY_X[0] - 60, y: 560, s: 0.6, expr: 'sing' }],
          shots: [
            { cam: { at: [560, 440, 0.85] }, move: { at: [1660, 440, 0.85] }, moveDur: 6.4, act: songTour([0, 1, 2, 3]), who: 'fizz', t: '♪ Eight big worlds, in a great big ring! ♪', lineAt: 0.6 },
            { cam: { at: [1660, 440, 0.85] }, move: { at: [3080, 440, 0.85] }, moveDur: 6.4, act: songTour([4, 5, 6, 7]), who: 'fizz', t: '♪ Win the Big Prize, and then... go to the next world! ♪', lineAt: 0.6 },
          ],
        },
        {
          id: 'p2-stage', set: 'station', mood: 'playful', trans: 'fade', cam: { close: 'meera' },
          cast: [
            { id: 'meera', x: 870, expr: 'smug' }, { id: 'kiki', x: 980, expr: 'grin' }, { id: 'you', x: 1200, y: 760, expr: 'happy' },
            { id: 'ro', x: 1420, face: -1, expr: 'grumpy' }, { id: 'bunty', x: 1530, face: -1, expr: 'happy' },
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
            {
              cam: { full: ['meera', 'ro'], dx: 0 }, act: [
                { do: 'move', who: 'meera', to: 1090, gait: 'walk' }, { do: 'move', who: 'kiki', to: 1140, gait: 'walk' },
                { do: 'move', who: 'ro', to: 1280, gait: 'walk' }, { do: 'move', who: 'bunty', to: 1320, gait: 'walk' },
                { do: 'pose', who: 'meera', pose: 'reach', at: 2.6 }, { do: 'pose', who: 'kiki', pose: 'reach', at: 2.7 },
                { do: 'pose', who: 'ro', pose: 'reach', at: 2.8 }, { do: 'pose', who: 'bunty', pose: 'reach', at: 2.9 }, { do: 'pose', who: 'you', pose: 'reach', at: 2.6 },
                { do: 'sfx', snd: 'chime', at: 3.0 }, { do: 'fx', fx: { kind: 'sparkle', who: 'you', n: 10 }, at: 3.0 },
              ], n: 'One by one, the crew puts their hands in.', lineAt: 1.5,
            },
            { cam: { close: 'bunty' }, act: [{ do: 'expr', who: 'bunty', expr: 'laugh' }, { do: 'pose', who: 'bunty', pose: 'cheer' }, { do: 'hop', who: 'bunty', n: 2 }], who: 'bunty', t: 'DEAL!' },
            { reward: 'captains-call' },
            { cam: { medium: 'fizz' }, act: [{ do: 'expr', who: 'fizz', expr: 'happy' }, { do: 'pose', who: 'bunty', pose: 'stand' }, { do: 'pose', who: 'you', pose: 'stand' }], who: 'fizz', t: 'Wonderful! First, a warm-up. Show me you’re ready, Captain!' },
            { gate: { id: 'g-p-warmup', title: 'Captain Warm-Up', ask: 'Fizz wants to see what the new Captain can do!', by: 'fizz' } },
            { cam: { medium: 'fizz' }, act: [{ do: 'expr', who: 'fizz', expr: 'excited' }, { do: 'fx', fx: { kind: 'sparkle', who: 'fizz' } }, { do: 'sfx', snd: 'sparkle' }], who: 'fizz', t: 'Super! Here is your Rule Card, Captain.' },
            { reward: 'rule-card' },
            { cam: { wide: 1200, zoom: 0.8 }, mood: 'triumph', act: [{ do: 'expr', who: 'fizz', expr: 'excited' }, { do: 'spin', who: 'fizz', turns: 2, dur: 1.2 }, { do: 'fx', fx: { kind: 'speedlines', on: true } }], who: 'fizz', t: 'Next stop... the CANDY NEBULA!' },
            {
              cam: { wide: 1200, zoom: 0.75 }, act: [
                { do: 'fx', fx: { kind: 'speedlines', on: false } }, { do: 'expr', who: 'kiki', expr: 'laugh' }, { do: 'expr', who: 'bunty', expr: 'love' }, { do: 'expr', who: 'meera', expr: 'shock' },
                { do: 'exit', who: 'kiki', to: 'bottom', at: 0.4 }, { do: 'exit', who: 'bunty', to: 'bottom', at: 0.55 }, { do: 'exit', who: 'ro', to: 'bottom', at: 0.7 },
                { do: 'exit', who: 'you', to: 'bottom', at: 0.85 }, { do: 'exit', who: 'meera', to: 'bottom', at: 1.0 }, { do: 'sfx', snd: 'whoosh', at: 0.4 },
              ], n: 'The board tips like a slide. Wheee! Down to a pink planet!',
            },
          ],
        },
      ],
    },
  ],
};
