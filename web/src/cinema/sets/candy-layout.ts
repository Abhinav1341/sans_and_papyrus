// Positions in the Candy Nebula sets that the screenplay also needs (kept apart from the art,
// so loading the story data does not load the drawings).

/**
 * The Jelly Bean Bounce, start to finish: beans b1-b10, the Big Gap, beans b11-b15, three sinking
 * beans, beans b16-b17, then the finish. Candy-cane poles stick out of the pudding (Ro grabs them
 * with his toffee arm to swing ahead).
 */
export const BEAN_X = [620, 880, 1140, 1400, 1660, 1920, 2180, 2440, 2700, 2960, 3760, 4020, 4280, 4540, 4800, 5840, 6100];
export const SINK_X = [5060, 5320, 5580];
export const POLE_X = [1270, 2570, 3360, 5190];
export const COURSE = { w: 7000, start: 420, gapFrom: 2960, gapTo: 3760, finish: 6360, arch: 6620, booth: 1700 };
/** Feet on top of a bean, and on top of a floating gumball. */
export const BEAN_TOP = 715, GUMBALL_TOP = 696;
/** Meera's shield laid flat on the last bean before the Big Gap, and where feet go on top of it. */
export const SHIELD = { x: 2980, top: 697 };

/**
 * The Chocolate River (chapter 3). The crew's raft is five wafer planks wide (`PLANK_DX` from its middle):
 * it starts at `raft`, splits apart (and Bunty glues it) at `split`, pulls Ro out of the whirlpool from
 * `rescue`, and docks at `dock` beside the finish ledge. Ro's own small raft starts at `roRaft` and goes
 * down the near lane (`lane`), in front of the big raft, until a fish eats it over the whirlpool.
 */
export const RIVER = { raft: 930, split: 1700, rescue: 1940, whirl: 2560, dock: 2600, ledge: 2840, cave: 3180, roRaft: 560, lane: 812 };
export const PLANK_DX = [-208, -104, 0, 104, 208];

/**
 * The lollipop garden (chapter 4). Each child stands just right of their own giant lollipop, facing it,
 * with its candy at the height of their mouth (`mouth`: above the feet), so a lick lands on the candy.
 * Left to right: Kiki, Meera, the Captain, Bunty, Ro. `stars`: where Fizz hid the five Stars.
 */
export const GARDEN = {
  w: 3600, cx: 1224, kidDx: 106,
  candy: ['#7fe6c9', '#ffd36e', '#ff9fcf', '#c9b6ff', '#ff8f7e'],
  spots: [
    { who: 'kiki', x: 760, y: 715, r: 56, mouth: 204 }, { who: 'meera', x: 960, y: 715, r: 56, mouth: 220 }, { who: 'you', x: 1160, y: 715, r: 56, mouth: 204 },
    { who: 'bunty', x: 1360, y: 715, r: 50, mouth: 163 }, { who: 'ro', x: 1560, y: 715, r: 56, mouth: 204 },
  ],
  stars: [[300, 668], [700, 548], [2010, 380], [2640, 650], [3160, 470]] as [number, number][],
} as const;
/** The garden's depth: further back (smaller y) is smaller. */
export const gardenScale = (y: number) => Math.max(0.6, Math.min(1.2, 1 + (y - 715) * 0.0022));
/**
 * Sugar Mountain (chapter 5): the zig-zag icing road from the base to the summit (`PATH`: its corners,
 * as feet positions). Ro's shortcut: from corner 1 his toffee arm grabs the candy-cane post above corner 3
 * (`GRIPS[0]`, straight above his shoulder), then the one above corner 5. The ramp from corner 4 to 5
 * (`ICY_RAMP`) is glazed with slippery ice: the crew gets stuck at corner 4, straight below the summit
 * corner, where Ro kneels (`SUMMIT.ro`) and hangs his arm down as a ladder.
 */
export const PATH: [number, number][] = [[560, 2440], [1150, 2150], [450, 1820], [1150, 1490], [450, 1160], [1150, 830], [450, 520]];
export const GRIPS: [number, number][] = [[1177, 1440], [1177, 780]];
export const ICY_RAMP = 4;
export const SUMMIT = { giant: 660, ro: 420 };
/** Sharing the Giant Lollipop on the summit: who stands where, and the size of their piece (Ro keeps the smallest). */
export const SHARE: [string, number, number][] = [['you', 560, 40], ['kiki', 680, 40], ['ro', 800, 26], ['bunty', 920, 40], ['meera', 1040, 40]];
export const SEATS = [520, 780, 1040, 1300];
