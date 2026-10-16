// Positions in the world-view sets that the screenplay also needs (kept apart from the art, so
// loading the story data does not load the drawings).

/** The eight worlds of the Party Galaxy, left to right (zig-zag, so a tall phone frame always shows one high and one low). */
export const GALAXY_X = [340, 760, 1180, 1600, 2020, 2440, 2860, 3280];
export const GALAXY_Y = [270, 600, 270, 600, 270, 600, 270, 600];
/** Fizz's game board, floating in the middle of the ring. */
export const BOARD = { x: 1810, y: 930 };

/** Landmarks of the Candy Nebula seen from the sky. */
export const VISTA = { fields: [520, 1580], river: [1290, 1640], course: [2250, 1480], garden: [2620, 1790], peak: [3150, 960] } as const;
