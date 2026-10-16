// The screenplay format. A chapter is a list of scenes; a scene is one place (a "set") with its
// cast placed in it; a shot is one beat: the camera frames something, characters act, and the
// storyteller or a character speaks. Content is data, separate from the engine, so later chapters
// (and AI-generated ones) can be written without touching code.
import type { Expr } from '@/art/face';
import type { FizzExpr } from '@/art/portrait';
import type { PoseName, CycleName } from '@/art/poses';
import type { SoundId } from '@/lib/sfx';
import type { Mood } from '@/lib/music';
import type { CrewId } from '@/art/looks';
import type { Tone } from '@/lib/tone';
import type { PowerIcon } from './powers';

export type CastId = CrewId | 'you' | 'fizz';
export type Speaker = CastId | 'narrator';
export type AnyExpr = Expr | FizzExpr;

export type EmoteKind = '!' | '?' | 'sweat' | 'note' | 'anger' | 'dots' | 'heart' | 'idea' | 'zzz' | 'sparkle' | 'gloom' | 'blush';
export type PropId = 'token' | 'paddle' | 'lollipop' | 'gumball' | 'shield' | 'map' | 'star' | 'candyfloss' | 'wafer' | 'sketchbook' | 'badge' | 'mic' | 'rulecard' | 'boots' | 'lollipiece' | 'bow' | 'gumdrop';
export type SetId = string;

/** Where a character stands when a scene starts. x/y are world units (feet position). */
export interface Placement {
  id: CastId;
  x: number;
  y?: number;          // ground line by default
  s?: number;          // scale (depth); default from y
  face?: 1 | -1;       // 1 = facing right
  pose?: PoseName;
  cycle?: CycleName;
  expr?: AnyExpr;
  lift?: number;       // height above the ground
  prop?: PropId;
  hidden?: boolean;
  look?: 'cam' | 'fwd';
}

/** Camera framing. Presets frame characters automatically; `at` gives an exact view. */
export type Frame =
  | { wide: number; y?: number; zoom?: number }                    // the whole place (zoom 0.75-1) centred on x
  | { at: [number, number, number] }                               // [x, y, zoom]
  | { full: CastId | CastId[]; dx?: number }                       // whole bodies
  | { medium: CastId | CastId[]; dx?: number }                     // waist up
  | { close: CastId; dx?: number }                                 // face
  | { xclose: CastId; dx?: number }                                // eyes
  | { low: CastId; dx?: number }                                   // heroic low angle
  | { el: string; zoom?: number; dy?: number };                    // a set element

export type Ease = 'linear' | 'in' | 'out' | 'inOut' | 'back' | 'bounce' | 'elastic';
export type Gait = 'run' | 'walk' | 'tiptoe' | 'fly' | 'climb';

/**
 * When an action starts: `at` seconds into the shot, or `atWord`: the moment the Nth word (0-based)
 * of the shot's line is spoken (then `at` is an offset from that word, and can be negative).
 * `toWord` makes a timed action (a move, a jump, an element tween) last until that word is spoken,
 * so something can leave on one word and arrive exactly on another.
 */
interface At { at?: number; atWord?: number; toWord?: number }
export type Action = At & (
  | { do: 'move'; who: CastId; to: number; y?: number; dur?: number; gait?: Gait; then?: PoseName; ease?: Ease }
  | { do: 'enter'; who: CastId; from: 'left' | 'right' | 'top'; to: number; y?: number; dur?: number; gait?: Gait | 'fall'; then?: PoseName }
  | { do: 'exit'; who: CastId; to: 'left' | 'right' | 'top' | 'bottom'; dur?: number; gait?: Gait }
  | { do: 'jump'; who: CastId; to?: number; y?: number; h?: number; dur?: number; then?: PoseName }
  | { do: 'hop'; who: CastId; n?: number; h?: number }
  | { do: 'fall'; who: CastId; from?: number; dur?: number; land?: 'feet' | 'splat' | 'sit' }
  | { do: 'lift'; who: CastId; to: number; dur?: number; ease?: Ease }
  | { do: 'pose'; who: CastId; pose: PoseName }
  | { do: 'cycle'; who: CastId; cycle: CycleName | null }
  | { do: 'expr'; who: CastId; expr: AnyExpr }
  | { do: 'face'; who: CastId; dir: 1 | -1 }
  | { do: 'look'; who: CastId; gaze: 'cam' | 'fwd' }
  | { do: 'emote'; who: CastId; emote: EmoteKind }
  | { do: 'spin'; who: CastId; turns?: number; dur?: number }
  | { do: 'squash'; who: CastId; amt?: number }
  | { do: 'stretch'; who: CastId; len: number; dur?: number; ease?: Ease }
  | { do: 'prop'; who: CastId; prop: PropId | null }
  | { do: 'show'; who: CastId }
  | { do: 'hide'; who: CastId }
  | { do: 'place'; who: CastId; x: number; y?: number; s?: number; lift?: number }
  | { do: 'scale'; who: CastId; s: number; dur?: number }
  | { do: 'ride'; who: CastId; on: string | null; dx?: number; dy?: number; behind?: boolean }
  | { do: 'cape'; who: CastId; on: boolean }
  | { do: 'mess'; who: CastId; color: string | null }
  | { do: 'el'; el: string; to: ElTween; dur?: number; ease?: Ease; yoyo?: number }
  | { do: 'cam'; to: Frame; dur?: number; ease?: Ease }
  | { do: 'track'; who: CastId | null; lead?: number }
  | { do: 'fx'; fx: Fx }
  | { do: 'sfx'; snd: SoundId }
  | { do: 'insert'; id: string | null }                      // switch the close-up insert mid-shot
);

/** Tween of a named element in the set (x/y offsets in world units, rotation in degrees). */
export interface ElTween { x?: number; y?: number; rot?: number; scale?: number; opacity?: number }

export type Fx =
  | { kind: 'speedlines'; on: boolean }                          // radial focus lines (anime)
  | { kind: 'motion'; on: boolean; dir?: 'left' | 'right' }      // horizontal action lines
  | { kind: 'fall'; on: boolean }                                // vertical falling lines
  | { kind: 'word'; text: string; x?: number; y?: number; color?: string }   // onomatopoeia (screen %)
  | { kind: 'burst'; who?: CastId; el?: string }                 // comic impact star
  | { kind: 'sparkle'; who?: CastId; el?: string; n?: number }
  | { kind: 'confetti' }
  | { kind: 'sprinkles'; dur?: number }
  | { kind: 'dust'; who: CastId }
  | { kind: 'splash'; who?: CastId; el?: string; color?: string }
  | { kind: 'hearts'; who: CastId }
  | { kind: 'notes'; who: CastId }
  | { kind: 'glow'; color?: string }                             // soft full-screen glow (never a flash)
  | { kind: 'whiteout'; dur?: number }                           // slow fade to white and back
  | { kind: 'tint'; color: string | null; opacity?: number }     // lasting colour grade (evening, night)
  | { kind: 'vignette'; on: boolean }
  | { kind: 'backdrop'; style: Backdrop | null; color?: string } // anime reaction background
  | { kind: 'letterbox'; on: boolean }
  | { kind: 'aura'; who: CastId; color: string; on: boolean }         // a glowing power aura behind someone
  | { kind: 'power'; name: string; color: string; icon: PowerIcon };   // an anime power banner

export type Backdrop = 'rays' | 'sparkle' | 'gloom' | 'dots' | 'speed' | 'hearts' | 'shock' | 'flat';

export type Transition = 'cut' | 'fade' | 'white' | 'iris' | 'wipe';

export interface LineShot {
  cam?: Frame;              // framing at the start of the shot (a cut)
  move?: Frame;             // camera glides to this framing during the shot
  moveDur?: number;
  trans?: Transition;
  act?: Action[];
  n?: string;               // storyteller line
  who?: Speaker;            // dialogue speaker
  t?: string;               // dialogue line
  lineAt?: number;          // seconds before the line starts (default 0.25)
  hold?: number;            // extra seconds after everything ends
  mood?: Mood;              // change the music
  insert?: string | null;   // show an insert (object close-up) over the scene
  panels?: Panel[] | null;  // manga split panels over the scene
  tone?: Tone;              // how the line is spoken, when the speaker's face and the words do not say it
}

/** A manga panel: a close-up face; `lolli` (a candy colour) holds a lollipop right at the mouth, being licked. */
export interface Panel { who: CastId; expr: AnyExpr; bg?: Backdrop; color?: string; lolli?: string }

export interface TitleShot { title: { ep: string; name: string; sub: string } }
export interface GateShot { gate: { id: string; title: string; ask: string; by: CastId } }
export interface RewardShot { reward: string; by?: CastId }
export type Shot = LineShot | TitleShot | GateShot | RewardShot;

export interface Scene {
  id: string;
  set: SetId;
  cast: Placement[];
  mood?: Mood;
  tint?: { color: string; opacity?: number };
  trans?: Transition;       // how the scene opens
  cam?: Frame;              // opening framing
  shots: Shot[];
}

export interface Chapter {
  id: string;
  title: string;
  teaser: string;
  recap: string;
  scenes: Scene[];
}

export interface World {
  id: string;
  kind: 'prologue' | 'candy' | 'magic' | 'space' | 'dino' | 'ocean' | 'noir' | 'pirate' | 'glitch';
  label: string;
  title: string;
  locked?: boolean;
  chapters: Chapter[];
}

export const isTitle = (s: Shot): s is TitleShot => 'title' in s;
export const isGate = (s: Shot): s is GateShot => 'gate' in s;
export const isReward = (s: Shot): s is RewardShot => 'reward' in s;
export const isLine = (s: Shot): s is LineShot => !isTitle(s) && !isGate(s) && !isReward(s);
