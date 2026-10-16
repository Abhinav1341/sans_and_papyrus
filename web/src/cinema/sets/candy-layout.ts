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

/** The lollipop garden: one giant lollipop per child. */
export const LOLLI_X = [910, 1070, 1230, 1390, 1550];
/** The zig-zag icing path up Sugar Mountain, bottom to top, as feet positions. */
export const PATH: [number, number][] = [[260, 2440], [1080, 2140], [480, 1800], [1120, 1460], [560, 1120], [1060, 800], [800, 520]];
export const SEATS = [520, 780, 1040, 1300];
