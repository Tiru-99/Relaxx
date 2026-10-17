/** Small math helpers shared across the game. Pure functions only. */

export const TAU = Math.PI * 2;

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const lerp = (a, b, t) => a + (b - a) * t;

export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Shortest signed angle from `from` to `to`, in radians. */
export const angleDelta = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

/** Seeded PRNG (mulberry32) so the island is laid out the same way on every visit. */
export function createRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const worldRng = createRng(20261017);

/** Deterministic random number in [min, max). Use for world placement. */
export const rand = (min, max) => min + worldRng() * (max - min);

/** Non-deterministic random number in [min, max). Use for moment-to-moment effects. */
export const jitter = (min, max) => min + Math.random() * (max - min);

export const pick = (items) => items[Math.floor(worldRng() * items.length)];

function hash2(ix, iz) {
  let h = Math.imul(ix, 374761393) + Math.imul(iz, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** Smooth 2D value noise in [-1, 1]. */
export function noise2(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz), b = hash2(ix + 1, iz), c = hash2(ix, iz + 1), d = hash2(ix + 1, iz + 1);
  return (lerp(lerp(a, b, ux), lerp(c, d, ux), uz)) * 2 - 1;
}

/** Fractal noise: a few octaves of value noise for natural-looking terrain. */
export function fbm(x, z, octaves = 4) {
  let sum = 0, amp = 0.5, freq = 1, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += noise2(x * freq, z * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

/** Distance from point (px, pz) to segment (ax, az)–(bx, bz), plus the 0..1 position along it. */
export function segmentDistance(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const lengthSq = dx * dx + dz * dz || 1;
  const t = clamp(((px - ax) * dx + (pz - az) * dz) / lengthSq, 0, 1);
  return { distance: Math.hypot(px - (ax + dx * t), pz - (az + dz * t)), t };
}
