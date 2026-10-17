/**
 * Tuning knobs for Lumen Isle. Change numbers here rather than in the systems.
 * BUDGET caps everything that scales with the island so memory and frame time stay predictable.
 */

export const WORLD = {
  size: 300,             // terrain square edge, in metres
  segments: 220,         // terrain grid resolution (size / segments ≈ 1.36 m per cell)
  seaLevel: 0,
  walkableMin: 0.35,     // the spirit stays on ground higher than this
  oceanSize: 1000,
};

export const BUDGET = {
  trees: 720,
  rocks: 180,
  grass: 15000,
  flowers: 900,
  fireflies: 240,
  motes: 26,
  sparks: 72,
  butterflies: 16,
};

export const PLAYER = {
  walkSpeed: 5.4,
  driftSpeed: 10.5,      // hold Shift to drift across the big island faster
  jumpVelocity: 6.5,
  gravity: 16,
  radius: 0.4,
};

export const CAMERA = { minDistance: 5, maxDistance: 26, startDistance: 11, startPitch: 0.42 };

export const RENDER = {
  maxPixelRatio: 2,
  minPixelRatio: 0.75,
  targetFrameMs: 18,     // adaptive resolution steps down when frames get slower than this
  shadowMapSize: 2048,
  shadowExtent: 36,      // shadows follow the spirit, so they only need to cover the nearby area
  fogNear: 60,
  fogFar: 200,
  farClip: 700,
};

export const DAY_LENGTH_SECONDS = 480;
export const START_DAY_PHASE = 0.3;

export const MOTES_PER_LANTERN = 3;
export const LISTEN_COOLDOWN = 6;
export const MAP_REVEAL_RADIUS = 26;

export const STORAGE_KEY = 'lumen-isle:progress:v2';
