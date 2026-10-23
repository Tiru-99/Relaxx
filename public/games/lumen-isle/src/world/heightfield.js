/**
 * The island's shape as a pure height function, baked once into a grid for fast lookups.
 * No three.js here, so this module can be tested on its own.
 */
import { WORLD } from '../config.js';
import { clamp, fbm, lerp, smoothstep, segmentDistance, TAU } from '../core/math.js';
import { CAPES, HILLS, RIVER } from './layout.js';

const N = WORLD.segments;
const HALF = WORLD.size / 2;
const STEP = WORLD.size / N;

/** Coastline radius for a compass angle: noise for coves plus a few headlands. */
function coastRadius(angle) {
  let radius = 94 + fbm(Math.cos(angle) * 2.2 + 7, Math.sin(angle) * 2.2 + 3, 3) * 18;
  for (const cape of CAPES) {
    const d = Math.abs(Math.atan2(Math.sin(angle - cape.angle), Math.cos(angle - cape.angle)));
    radius += cape.reach * Math.exp(-((d / cape.width) ** 2));
  }
  return radius;
}

/** Terrain before the stream carves its channel. */
function baseHeight(x, z) {
  const r = Math.hypot(x, z);
  const coast = smoothstep(coastRadius(Math.atan2(z, x)) + 4, coastRadius(Math.atan2(z, x)) - 16, r);
  const rolling = fbm(x * 0.018 + 11, z * 0.018 - 4, 4) * 3.2 + fbm(x * 0.06, z * 0.06, 2) * 0.6;

  let h = -6 + coast * (8 + rolling);
  for (const hill of HILLS) {
    const d = Math.hypot(x - hill.x, z - hill.z) / hill.radius;
    // Plateaus have a flat top and a steeper edge; ordinary hills are soft domes.
    h += hill.plateau ? hill.height * smoothstep(1.05, 0.7, d) : hill.height * Math.exp(-d * d * 2.2);
  }
  // Well inland, never dip to sea level: the sea plane would show through as a small pool that
  // rises and falls with the waves. The stream is carved later, so it isn't affected.
  if (coast > 0.95) h = Math.max(h, 0.6);
  return h * coast + (1 - coast) * Math.min(h, -1.5);
}

/** How deep the stream's water is above its bed. */
export const RIVER_DEPTH = 0.28;

// ---- stream: sampled once along a smooth curve, with a bed that only ever flows downhill
const RIVER_SAMPLES = 180;
export const river = sampleRiver();

function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

function sampleRiver() {
  const xs = new Float32Array(RIVER_SAMPLES), zs = new Float32Array(RIVER_SAMPLES);
  const bed = new Float32Array(RIVER_SAMPLES), width = new Float32Array(RIVER_SAMPLES);
  const last = RIVER.length - 1;
  for (let i = 0; i < RIVER_SAMPLES; i++) {
    const u = (i / (RIVER_SAMPLES - 1)) * last, k = Math.min(last - 1, Math.floor(u)), t = u - k;
    const p = (j) => RIVER[clamp(j, 0, last)];
    xs[i] = catmull(p(k - 1).x, p(k).x, p(k + 1).x, p(k + 2).x, t);
    zs[i] = catmull(p(k - 1).z, p(k).z, p(k + 1).z, p(k + 2).z, t);
  }
  let lowest = Infinity;
  for (let i = 0; i < RIVER_SAMPLES; i++) {
    lowest = Math.min(lowest, baseHeight(xs[i], zs[i]) - 0.35);
    bed[i] = lowest;
    const t = i / (RIVER_SAMPLES - 1);
    width[i] = 0.9 + t * 2.4 + Math.sin(t * TAU * 3) * 0.2;
  }
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < RIVER_SAMPLES; i++) {
    minX = Math.min(minX, xs[i]); maxX = Math.max(maxX, xs[i]); minZ = Math.min(minZ, zs[i]); maxZ = Math.max(maxZ, zs[i]);
  }
  return { count: RIVER_SAMPLES, xs, zs, bed, width, bounds: { minX, maxX, minZ, maxZ } };
}

/**
 * Nearest point on the stream: distance, sample index and bed height there.
 * `stride` > 1 trades accuracy for speed (used every frame by audio).
 */
export function nearestRiver(x, z, stride = 1) {
  const { bounds: b } = river;
  if (x < b.minX - 12 || x > b.maxX + 12 || z < b.minZ - 12 || z > b.maxZ + 12) return null;
  let best = { distance: Infinity, index: 0, t: 0 };
  for (let i = 0; i < river.count - stride; i += stride) {
    const seg = segmentDistance(x, z, river.xs[i], river.zs[i], river.xs[i + stride], river.zs[i + stride]);
    if (seg.distance < best.distance) best = { distance: seg.distance, index: i, t: seg.t, stride };
  }
  const j = Math.min(river.count - 1, best.index + stride);
  return {
    distance: best.distance,
    index: best.index,
    bed: lerp(river.bed[best.index], river.bed[j], best.t),
    width: lerp(river.width[best.index], river.width[j], best.t),
  };
}

function carvedHeight(x, z) {
  const base = baseHeight(x, z);
  const near = nearestRiver(x, z);
  if (!near) return base;
  const carve = smoothstep(near.width + 3.5, near.width * 0.7, near.distance);
  return lerp(base, Math.min(base, near.bed), carve);
}

// ---- baked grid
const heights = new Float32Array((N + 1) * (N + 1));
for (let iz = 0; iz <= N; iz++) {
  for (let ix = 0; ix <= N; ix++) heights[iz * (N + 1) + ix] = carvedHeight(ix * STEP - HALF, iz * STEP - HALF);
}

/** Height at a grid vertex (used to build the terrain mesh so it matches heightAt exactly). */
export const gridHeight = (ix, iz) => heights[clamp(iz, 0, N) * (N + 1) + clamp(ix, 0, N)];
export const GRID = { segments: N, step: STEP, half: HALF };

/** Ground height anywhere, bilinearly interpolated from the baked grid. Cheap enough to call every frame. */
export function heightAt(x, z) {
  const gx = clamp((x + HALF) / STEP, 0, N - 0.0001), gz = clamp((z + HALF) / STEP, 0, N - 0.0001);
  const ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz;
  const row = N + 1, i = iz * row + ix;
  return lerp(lerp(heights[i], heights[i + 1], fx), lerp(heights[i + row], heights[i + row + 1], fx), fz);
}

/** Steepness (0 flat … ~1 cliff) from neighbouring heights. */
export function slopeAt(x, z) {
  const dx = heightAt(x + 1, z) - heightAt(x - 1, z), dz = heightAt(x, z + 1) - heightAt(x, z - 1);
  return clamp(Math.hypot(dx, dz) / 2, 0, 1.5);
}

export const isWalkable = (x, z) => heightAt(x, z) >= WORLD.walkableMin;
