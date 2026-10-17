import { sfx } from '../audio/sfx.js';
import { createButterflies } from './butterflies.js';
import { createFish } from './fish.js';
import { createSeabirds } from './seabirds.js';

/** Creatures the journal keeps track of. `hint` is shown until you've met them. */
export const CREATURES = [
  { id: 'butterflies', name: 'meadow butterflies', hint: 'on bright days, out in the open grass', message: 'they never land for long' },
  { id: 'seabirds', name: 'seabirds', hint: 'wheeling high above the shore', message: 'they circle the island like a slow clock' },
  { id: 'fish', name: 'leaping fish', hint: 'linger quietly beside the water', message: 'a flash of silver, and gone' },
  { id: 'fireflies', name: 'fireflies', hint: 'after the sun goes down', message: 'the meadow lights its own small stars' },
];

export function createCreatures(scene, context, { journal, toast }) {
  const watchers = {
    butterflies: createButterflies(scene, context),
    seabirds: createSeabirds(scene, context),
    fish: createFish(scene, context),
    fireflies: { update() {}, isSeen: () => context.env.night > 0.7 },
  };

  return (dt, time) => {
    for (const creature of CREATURES) {
      const watcher = watchers[creature.id];
      watcher.update(dt, time);
      if (!journal.hasCreature(creature.id) && watcher.isSeen() && journal.addCreature(creature.id)) {
        sfx.creature();
        toast.show(`you noticed ${creature.name}`, 4.5, creature.message);
      }
    }
  };
}
