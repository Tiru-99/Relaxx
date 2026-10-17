/**
 * Buckets circles into grid cells so collision and occlusion checks only look at nearby things,
 * no matter how many trees and rocks the island has.
 */
export class SpatialGrid {
  constructor(cellSize = 8) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  key(cx, cz) {
    return cx * 73856093 ^ cz * 19349663;
  }

  /** @param {{ x: number, z: number, r: number }} item */
  insert(item) {
    const size = this.cellSize;
    for (let cx = Math.floor((item.x - item.r) / size); cx <= Math.floor((item.x + item.r) / size); cx++) {
      for (let cz = Math.floor((item.z - item.r) / size); cz <= Math.floor((item.z + item.r) / size); cz++) {
        const k = this.key(cx, cz);
        let bucket = this.cells.get(k);
        if (!bucket) this.cells.set(k, (bucket = []));
        bucket.push(item);
      }
    }
  }

  /** Calls `visit` for each item whose cell is within `radius` of (x, z). Items may repeat across cells. */
  forEachNear(x, z, radius, visit) {
    const size = this.cellSize;
    for (let cx = Math.floor((x - radius) / size); cx <= Math.floor((x + radius) / size); cx++) {
      for (let cz = Math.floor((z - radius) / size); cz <= Math.floor((z + radius) / size); cz++) {
        const bucket = this.cells.get(this.key(cx, cz));
        if (bucket) for (const item of bucket) visit(item);
      }
    }
  }

  /** True when no stored circle overlaps a circle of `radius` at (x, z). */
  isClear(x, z, radius) {
    let clear = true;
    this.forEachNear(x, z, radius + 4, (item) => {
      if (clear && Math.hypot(item.x - x, item.z - z) < item.r + radius) clear = false;
    });
    return clear;
  }
}
