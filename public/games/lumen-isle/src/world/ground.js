import { WORLD } from '../config.js';
import { heightAt } from './heightfield.js';

/**
 * Walkable surface = terrain, plus platforms like the bridge that span water.
 * Landmarks register platforms; the spirit and camera only ever ask groundAt().
 */

/** @type {{ x: number, z: number, angle: number, halfLength: number, halfWidth: number, y: number }[]} */
const platforms = [];

export function addPlatform(platform) {
  platforms.push(platform);
}

function platformHeight(x, z) {
  for (const p of platforms) {
    const dx = x - p.x, dz = z - p.z, c = Math.cos(p.angle), s = Math.sin(p.angle);
    const along = dx * s + dz * c, across = dx * c - dz * s;
    if (Math.abs(along) <= p.halfLength && Math.abs(across) <= p.halfWidth) return p.y;
  }
  return -Infinity;
}

export const groundAt = (x, z) => Math.max(heightAt(x, z), platformHeight(x, z));

export const canStandAt = (x, z) => groundAt(x, z) >= WORLD.walkableMin;
