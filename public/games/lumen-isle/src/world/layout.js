/**
 * The island's map: every hand-placed position lives here so the terrain, landmarks,
 * lanterns, paths and journal all agree. x grows east, z grows south (north is -z).
 */

export const START = { x: 0, z: 48 };

/** Extra landforms layered on top of the noise terrain. */
export const HILLS = [
  { name: 'heart hill', x: 0, z: 0, radius: 20, height: 5 },
  { name: 'northern highlands', x: 5, z: -62, radius: 26, height: 11, plateau: true },
  { name: 'eastern bluff', x: 76, z: -42, radius: 15, height: 6 },
  { name: 'stargazer knoll', x: -42, z: -62, radius: 13, height: 5 },
  { name: 'lighthouse cape', x: 52, z: 74, radius: 11, height: 3 },
];

/** Headlands that push the coastline outwards at a given compass angle (atan2(z, x)). */
export const CAPES = [
  { angle: Math.atan2(86, 60), width: 0.32, reach: 16 },
  { angle: Math.atan2(-42, 76), width: 0.28, reach: 10 },
  { angle: Math.atan2(-62, -42), width: 0.3, reach: 8 },
];

/** The stream: from the highland spring, over the falls, west through the woods to the sea. */
export const RIVER = [
  { x: 6, z: -68 }, { x: 3, z: -56 }, { x: 0, z: -44 }, { x: -2, z: -36 },
  { x: -12, z: -28 }, { x: -24, z: -22 }, { x: -35, z: -11 }, { x: -44, z: 3 },
  { x: -58, z: 13 }, { x: -74, z: 17 }, { x: -92, z: 21 }, { x: -116, z: 24 },
];

/** Where trees grow thickly. Density 0..1 is blended over the base meadow density. */
export const FORESTS = [
  { name: 'eastern wood', x: 52, z: -12, radius: 40, density: 0.95 },
  { name: 'western woods', x: -56, z: 34, radius: 26, density: 0.7 },
  { name: 'highland pines', x: 5, z: -62, radius: 30, density: 0.35 },
];

/** Clearings keep trees away from landmarks and the start. */
export const CLEARINGS = [
  { x: START.x, z: START.z, radius: 9 },
  { x: 0, z: 0, radius: 8 },
];

/** Worn footpaths that gently suggest a route between places. */
export const PATHS = [
  [{ x: 0, z: 48 }, { x: 2, z: 30 }, { x: 0, z: 12 }, { x: 0, z: 4 }],
  [{ x: 0, z: 0 }, { x: -14, z: -8 }, { x: -30, z: -6 }, { x: -44, z: 3 }, { x: -54, z: 22 }, { x: -60, z: 38 }],
  [{ x: 0, z: 0 }, { x: 20, z: 14 }, { x: 34, z: 30 }, { x: 46, z: 54 }, { x: 52, z: 74 }],
  [{ x: 0, z: 0 }, { x: 18, z: -12 }, { x: 40, z: -10 }, { x: 58, z: -14 }, { x: 74, z: -38 }],
  [{ x: 0, z: 0 }, { x: -4, z: -18 }, { x: -6, z: -32 }, { x: -2, z: -40 }],
  [{ x: 2, z: 30 }, { x: -8, z: 52 }, { x: -18, z: 70 }],
];

/** Nine lanterns, spread so that lighting them leads you around the whole island. */
export const LANTERNS = [
  { x: 9, z: 32 }, { x: -22, z: 12 }, { x: 22, z: -20 }, { x: -30, z: -38 }, { x: 48, z: 46 },
  { x: -62, z: 26 }, { x: 14, z: -58 }, { x: 64, z: -2 }, { x: -6, z: 58 },
];

/**
 * Discoverable places. `region` is shown in the journal before a place is found,
 * so curious players know roughly where to wander.
 */
export const PLACES = {
  spring: { x: 6, z: -68, radius: 4, region: 'high in the northern highlands' },
  falls: { x: -1, z: -40, radius: 5, region: 'where the highlands end' },
  crossing: { x: -44, z: 3, radius: 4, region: 'along the western stream' },
  mooncap: { x: 58, z: -16, radius: 4.5, region: 'deep in the eastern wood' },
  overlook: { x: 76, z: -42, radius: 4.5, region: 'on the eastern bluff' },
  mossGate: { x: -60, z: 38, radius: 4.5, region: 'in the quiet western woods' },
  elderTree: { x: 34, z: 30, radius: 6, region: 'in the open southern meadow' },
  lighthouse: { x: 52, z: 74, radius: 6, region: 'out on the southern cape' },
  tidePools: { x: -18, z: 70, radius: 5, region: 'on the southern shore' },
  stones: { x: 0, z: 0, radius: 5, region: 'on top of the heart hill' },
  stargazer: { x: -42, z: -62, radius: 4.5, region: 'on a north-western knoll' },
  wreck: { x: 73, z: 19, radius: 6, region: 'on the eastern beach' },
};
