/** Pure lookups describing what kind of place a point is: forest, clearing, footpath. */
import { segmentDistance, smoothstep } from '../core/math.js';
import { CLEARINGS, FORESTS, PATHS, PLACES } from './layout.js';

/** 0..1 how thickly trees grow here. Open meadow is ~0.06. */
export function forestDensity(x, z) {
  let density = 0.06;
  for (const forest of FORESTS) {
    const d = Math.hypot(x - forest.x, z - forest.z);
    density = Math.max(density, forest.density * smoothstep(forest.radius, forest.radius * 0.45, d));
  }
  return density;
}

/** True where nothing should grow: around the start, landmarks and footpaths. */
export function isKeptClear(x, z, margin = 0) {
  for (const c of CLEARINGS) if (Math.hypot(x - c.x, z - c.z) < c.radius + margin) return true;
  for (const place of Object.values(PLACES)) if (Math.hypot(x - place.x, z - place.z) < place.radius + 2.5 + margin) return true;
  return pathDistance(x, z) < 1.6 + margin;
}

/** Distance to the nearest footpath. */
export function pathDistance(x, z) {
  let nearest = Infinity;
  for (const path of PATHS) {
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i + 1];
      if (Math.abs(x - a.x) > 40 && Math.abs(x - b.x) > 40) continue;
      nearest = Math.min(nearest, segmentDistance(x, z, a.x, a.z, b.x, b.z).distance);
    }
  }
  return nearest;
}
