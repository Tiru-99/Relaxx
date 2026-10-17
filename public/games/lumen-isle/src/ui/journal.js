import { CREATURES } from '../creatures/index.js';
import { clearProgress } from '../gameplay/progress.js';
import { LANTERNS } from '../world/layout.js';
import { createIslandMap } from './island-map.js';

/**
 * The field journal (J): a map of everywhere you've wandered, the places you've found and the
 * creatures you've met. Unfound entries show a gentle hint about where to look.
 */
export function createJournal(root, journal, { places, getSpirit }) {
  const map = createIslandMap(root.querySelector('canvas'), journal);
  const placeList = root.querySelector('[data-places]'), creatureList = root.querySelector('[data-creatures]');
  const summary = root.querySelector('[data-summary]');
  let open = false, revealTimer = 0;

  const entry = (found, title, text) => {
    const li = document.createElement('li');
    li.className = found ? 'found' : '';
    li.innerHTML = '<b></b><span></span>';
    li.querySelector('b').textContent = found ? title : 'an unvisited place';
    li.querySelector('span').textContent = text;
    return li;
  };

  function render() {
    if (!open) return;
    placeList.replaceChildren(...places.map((p) => entry(journal.hasPlace(p.id), p.name, journal.hasPlace(p.id) ? p.message : p.region)));
    creatureList.replaceChildren(...CREATURES.map((c) => {
      const met = journal.hasCreature(c.id), li = entry(met, c.name, met ? c.message : c.hint);
      if (!met) li.querySelector('b').textContent = 'someone you have not met';
      return li;
    }));
    const { progress } = journal;
    summary.textContent = `${progress.places.length} of ${places.length} places · ${progress.creatures.length} of ${CREATURES.length} creatures · ${progress.lanterns.length} of ${LANTERNS.length} lanterns`;
  }
  journal.onChange(render);

  root.querySelector('[data-close]').addEventListener('click', () => toggle(false));
  root.querySelector('[data-reset]').addEventListener('click', () => {
    if (confirm('Forget everything you have found and begin again?')) { clearProgress(); location.reload(); }
  });

  function toggle(force) {
    open = force ?? !open;
    root.classList.toggle('open', open);
    render();
  }

  return {
    toggle,
    get isOpen() { return open; },
    update(dt) {
      revealTimer -= dt;
      const spirit = getSpirit();
      if (revealTimer <= 0) {
        revealTimer = 0.5;
        if (map.reveal(spirit.x, spirit.z)) journal.changed();
      }
      if (open) map.draw(spirit, places, LANTERNS);
    },
  };
}
