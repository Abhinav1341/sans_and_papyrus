// A set is one place in the story, drawn as layers at different depths (parallax).
// Layer p: 0 = infinitely far (sky), 1 = the ground plane where characters stand, >1 = foreground.
export interface SetLayer { p: number; svg: string; front?: boolean }

export interface SetDef {
  id: string;
  w: number;               // world width
  h: number;               // world height (1000 = one screen tall at zoom 1)
  ground: number;          // default feet line
  top?: number;            // highest y the camera may show (art is drawn above 0 for zoomed-out shots)
  bottom?: number;         // lowest y the camera may show
  bg: string;              // colour behind everything
  defs?: string;           // shared gradients
  layers: SetLayer[];      // back to front; `front` layers are drawn over the characters
  els?: Record<string, { x: number; y: number; init?: { rot?: number; scale?: number; opacity?: number } }>; // movable elements (data-el)
  scale?: (y: number) => number; // character size for a feet line (depth); default 1
}
