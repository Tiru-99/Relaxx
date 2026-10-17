import { STORAGE_KEY } from '../config.js';

/**
 * Remembers what you found between visits: places, creatures, lit lanterns and the revealed map.
 * Storage can be unavailable (private mode, blocked cookies), so every access is guarded and the
 * game simply starts fresh when it fails.
 */

const empty = () => ({ places: [], creatures: [], lanterns: [], flowers: 0, map: '' });

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    const data = JSON.parse(raw);
    return {
      places: Array.isArray(data.places) ? data.places.filter((p) => typeof p === 'string') : [],
      creatures: Array.isArray(data.creatures) ? data.creatures.filter((c) => typeof c === 'string') : [],
      lanterns: Array.isArray(data.lanterns) ? data.lanterns.filter(Number.isInteger) : [],
      flowers: Number.isFinite(data.flowers) ? data.flowers : 0,
      map: typeof data.map === 'string' ? data.map : '',
    };
  } catch {
    return empty();
  }
}

let pending = 0;

/** Debounced save, so walking around (which reveals the map) doesn't write every frame. */
export function saveProgress(progress) {
  clearTimeout(pending);
  pending = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* storage unavailable */ }
  }, 800);
}

export function clearProgress() {
  clearTimeout(pending);
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable */ }
}
