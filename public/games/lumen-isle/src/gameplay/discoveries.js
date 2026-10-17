import { sfx } from '../audio/sfx.js';
import { glowSprite } from '../core/glow.js';
import { smoothstep } from '../core/math.js';
import { heightAt } from '../world/heightfield.js';
import { PLACES } from '../world/layout.js';

/**
 * Builds every landmark and notices when the spirit reaches one. Unfound places carry a faint
 * floating wisp that becomes visible from a distance: a quiet invitation, never a waypoint arrow.
 */
export function createDiscoveries(landmarks, context, { journal, toast }) {
  const { scene, sparks, player, env } = context;

  const places = landmarks.map((landmark, index) => {
    const spot = PLACES[landmark.id];
    const update = landmark.build(context);
    const wisp = glowSprite(0xd8f5d0, 0, 3);
    wisp.position.set(spot.x, heightAt(spot.x, spot.z) + 4.5, spot.z);
    scene.add(wisp);
    return { ...landmark, ...spot, index, update, wisp, pulse: 0 };
  });

  function discover(place) {
    if (!journal.addPlace(place.id)) return;
    place.pulse = 1;
    sfx.discovery(place.index);
    toast.show(place.name, 5.5, place.message);
    sparks.burst(place.x, heightAt(place.x, place.z) + 0.5, place.z, 0xd8f5d0, 12, { size: 0.45, rise: 0.8, life: 1.8 });
    if (places.every((p) => journal.hasPlace(p.id))) {
      setTimeout(() => toast.show('the island knows your footsteps', 7, 'every quiet place has welcomed you'), 6000);
    }
  }

  function update(dt, time) {
    const { x, z } = player.state;
    for (const place of places) {
      place.update?.(dt, time);
      const distance = Math.hypot(place.x - x, place.z - z);
      const found = journal.hasPlace(place.id);
      if (!found && distance < place.radius) discover(place);

      place.pulse = Math.max(0, place.pulse - dt * 0.35);
      // Wisps fade in between 18 m and 70 m away, and fade out once you're close or the place is found.
      const visible = found ? place.pulse : smoothstep(10, 18, distance) * (1 - smoothstep(55, 70, distance));
      place.wisp.material.opacity = visible * (0.12 + env.night * 0.25) + place.pulse * 0.4;
      place.wisp.position.y = heightAt(place.x, place.z) + 4.5 + Math.sin(time * 0.8 + place.index) * 0.4;
      place.wisp.visible = place.wisp.material.opacity > 0.005;
    }
  }

  /** The closest place not yet found, for the "listen" hint. */
  function nearestUnfound(x, z) {
    let best = null, bestDistance = Infinity;
    for (const place of places) {
      if (journal.hasPlace(place.id)) continue;
      const d = Math.hypot(place.x - x, place.z - z);
      if (d < bestDistance) { best = place; bestDistance = d; }
    }
    return best;
  }

  return { places, update, nearestUnfound };
}
