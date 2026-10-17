import { loadProgress, saveProgress } from './progress.js';

/**
 * The single record of what the player has discovered. Gameplay systems write to it;
 * the HUD and journal read from it and re-render when `onChange` fires.
 */
export function createJournalState() {
  const progress = loadProgress();
  const listeners = [];
  const state = {
    progress,
    motes: 0,
    hasPlace: (id) => progress.places.includes(id),
    hasCreature: (id) => progress.creatures.includes(id),
    isLanternLit: (index) => progress.lanterns.includes(index),
    onChange(listener) { listeners.push(listener); },
    changed(save = true) {
      if (save) saveProgress(progress);
      for (const listener of listeners) listener(state);
    },
  };

  const record = (list, value) => {
    if (list.includes(value)) return false;
    list.push(value);
    state.changed();
    return true;
  };
  state.addPlace = (id) => record(progress.places, id);
  state.addCreature = (id) => record(progress.creatures, id);
  state.lightLantern = (index) => record(progress.lanterns, index);
  state.addFlower = () => { progress.flowers++; state.changed(); };
  state.addMotes = (n) => { state.motes += n; state.changed(false); };
  return state;
}
