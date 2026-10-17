import { MAP_REVEAL_RADIUS } from '../config.js';
import { heightAt } from '../world/heightfield.js';

/**
 * The journal's hand-drawn map. The island is painted once into an offscreen canvas;
 * a 64×64 mask remembers where you've walked, and only those parts are shown.
 */
const CELLS = 64, EXTENT = 125; // map covers -EXTENT..EXTENT on both axes

function paintIsland(size) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d'), image = ctx.createImageData(size, size);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const x = (px / size) * EXTENT * 2 - EXTENT, z = (py / size) * EXTENT * 2 - EXTENT, h = heightAt(x, z);
      const [r, g, b] = h < 0 ? [126, 170, 184] : h < 0.6 ? [232, 214, 170] : h < 8 ? [148 - h * 4, 186 - h * 3, 128 - h * 2] : [176, 172, 160];
      image.data.set([r, g, b, 255], (py * size + px) * 4);
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

const encode = (mask) => btoa(String.fromCharCode(...mask));
function decode(text) {
  const mask = new Uint8Array(CELLS * CELLS);
  try { const raw = atob(text); if (raw.length === mask.length) for (let i = 0; i < raw.length; i++) mask[i] = raw.charCodeAt(i); } catch { /* fresh map */ }
  return mask;
}

export function createIslandMap(canvas, journal) {
  const size = canvas.width;
  const island = paintIsland(size);
  const mask = decode(journal.progress.map);
  const toCell = (v) => Math.floor(((v + EXTENT) / (EXTENT * 2)) * CELLS);
  const toPixel = (v) => ((v + EXTENT) / (EXTENT * 2)) * size;

  /** Mark cells around the spirit as seen. Returns true if anything new was revealed. */
  function reveal(x, z) {
    const reach = Math.ceil((MAP_REVEAL_RADIUS / (EXTENT * 2)) * CELLS);
    const cx = toCell(x), cz = toCell(z);
    let changed = false;
    for (let j = cz - reach; j <= cz + reach; j++) {
      for (let i = cx - reach; i <= cx + reach; i++) {
        if (i < 0 || j < 0 || i >= CELLS || j >= CELLS || mask[j * CELLS + i]) continue;
        if (Math.hypot(i - cx, j - cz) > reach) continue;
        mask[j * CELLS + i] = 1;
        changed = true;
      }
    }
    if (changed) journal.progress.map = encode(mask);
    return changed;
  }

  function dot(ctx, x, z, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(toPixel(x), toPixel(z), radius, 0, Math.PI * 2);
    ctx.fill();
  }

  /** @param {{ x: number, z: number, facing: number }} spirit */
  function draw(spirit, places, lanterns) {
    const ctx = canvas.getContext('2d'), cell = size / CELLS;
    ctx.fillStyle = '#e9dfc8';
    ctx.fillRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    for (let j = 0; j < CELLS; j++) for (let i = 0; i < CELLS; i++) if (mask[j * CELLS + i]) ctx.rect(i * cell - 0.5, j * cell - 0.5, cell + 1, cell + 1);
    ctx.clip();
    ctx.drawImage(island, 0, 0);
    for (const place of places) if (journal.hasPlace(place.id)) dot(ctx, place.x, place.z, 3.5, '#4d6b58');
    lanterns.forEach((l, i) => dot(ctx, l.x, l.z, 2.5, journal.isLanternLit(i) ? '#e7a64a' : '#8aa4c4'));
    ctx.restore();

    ctx.save();
    ctx.translate(toPixel(spirit.x), toPixel(spirit.z));
    ctx.rotate(-spirit.facing + Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2b2a40';
    ctx.beginPath();
    ctx.moveTo(0, -6); ctx.lineTo(4, 4); ctx.lineTo(-4, 4); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  return { reveal, draw };
}
