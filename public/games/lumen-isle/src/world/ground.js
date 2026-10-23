import { WORLD } from '../config.js';
import { clamp } from '../core/math.js';
import { heightAt, nearestRiver, RIVER_DEPTH } from './heightfield.js';

/**
 * Walkable surface = terrain, the stream's surface (the spirit skims across it) and platforms like the bridge.
 * Landmarks register platforms; the spirit and camera only ever ask groundAt().
 */

/**
 * A rectangular deck. `along` runs the length of the deck, `across` its width. The surface rises
 * by `arch` in the middle. With `rails`, both long sides are solid: you can only get on or off at the ends.
 * @typedef {{ x: number, z: number, angle: number, halfLength: number, halfWidth: number, y: number, arch?: number, rails?: boolean }} Platform
 */

/** @type {Platform[]} */
const platforms = [];

export function addPlatform(platform) {
  platforms.push(platform);
}

/** World position → the platform's own along/across axes. */
function toLocal(p, x, z) {
  const dx = x - p.x, dz = z - p.z, c = Math.cos(p.angle), s = Math.sin(p.angle);
  return { along: dx * s + dz * c, across: dx * c - dz * s };
}

function toWorld(p, along, across) {
  const c = Math.cos(p.angle), s = Math.sin(p.angle);
  return [p.x + along * s + across * c, p.z + along * c - across * s];
}

function platformHeight(x, z) {
  for (const p of platforms) {
    const { along, across } = toLocal(p, x, z);
    if (Math.abs(along) <= p.halfLength && Math.abs(across) <= p.halfWidth) {
      return p.y + (p.arch ?? 0) * Math.cos((along / (p.halfLength * 2)) * Math.PI);
    }
  }
  return -Infinity;
}

// The carved bank just outside the water can dip lower than the water itself; extending the surface
// a little past the edge fills that dip, so wading in and out never hits an invisible gap.
const BANK_MARGIN = 1.5;

/** The stream's water surface at (x, z), or -Infinity outside its channel. */
function streamSurface(x, z) {
  const river = nearestRiver(x, z);
  return river && river.distance < river.width + BANK_MARGIN ? river.bed + RIVER_DEPTH : -Infinity;
}

export const groundAt = (x, z) => Math.max(heightAt(x, z), streamSurface(x, z), platformHeight(x, z));

/** Only the sea stops the spirit; the stream can be waded anywhere except where it meets the sea. */
export const canStandAt = (x, z) => groundAt(x, z) >= WORLD.walkableMin;

export const isOnPlatform = (x, z) => platformHeight(x, z) > -Infinity;

/**
 * Stops a move of a body with `radius` from passing through any railing, from either side.
 * Whichever side of a rail the body started on is the side it stays on.
 * @returns {[number, number]} the corrected destination
 */
export function keepOffRails(fromX, fromZ, toX, toZ, radius) {
  for (const p of platforms) {
    if (!p.rails) continue;
    const to = toLocal(p, toX, toZ);
    if (Math.abs(to.along) > p.halfLength) continue; // past the ends, where there are no rails
    const from = toLocal(p, fromX, fromZ);
    const inner = p.halfWidth - radius, outer = p.halfWidth + radius;
    let across = to.across;
    if (Math.abs(from.across) < p.halfWidth) across = clamp(across, -inner, inner);
    else if (Math.abs(across) < outer) across = Math.sign(from.across) * outer;
    if (across !== to.across) [toX, toZ] = toWorld(p, to.along, across);
  }
  return [toX, toZ];
}
