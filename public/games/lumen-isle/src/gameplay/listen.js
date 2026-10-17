import * as THREE from 'three';
import { sfx } from '../audio/sfx.js';
import { LISTEN_COOLDOWN } from '../config.js';
import { glowSprite } from '../core/glow.js';
import { clamp } from '../core/math.js';
import { heightAt } from '../world/heightfield.js';

/**
 * Listen (Q): the island answers with a chime from the direction of the nearest unfound place,
 * and a small wisp drifts that way. A nudge, not a quest marker.
 */
const COMPASS = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];

export function createListen(scene, { player, cameraRig, discoveries, toast }) {
  const wisp = glowSprite(0xe8fff4, 0, 1.4);
  scene.add(wisp);
  const flight = { t: 1, from: new THREE.Vector3(), to: new THREE.Vector3() };
  let cooldown = 0;

  function listen() {
    if (cooldown > 0) return;
    cooldown = LISTEN_COOLDOWN;
    const { x, z, y } = player.state;
    const target = discoveries.nearestUnfound(x, z);
    if (!target) {
      toast.show('only the wind answers', 3.5, 'you have found every quiet place');
      return;
    }
    const dx = target.x - x, dz = target.z - z, distance = Math.hypot(dx, dz);
    // Pan relative to where the camera faces, so "left" sounds left.
    const yaw = cameraRig.rig.yaw, rightX = Math.cos(yaw), rightZ = -Math.sin(yaw);
    sfx.listen((dx * rightX + dz * rightZ) / distance, clamp(distance / 150, 0, 1));
    const bearing = COMPASS[Math.round((Math.atan2(dz, dx) / (Math.PI * 2)) * 8 + 8) % 8];
    toast.show(`something calls from the ${bearing}`, 4, distance < 40 ? 'it feels close' : distance < 90 ? 'a fair walk away' : 'far across the island');

    const reach = Math.min(distance, 22);
    flight.from.set(x, y + 0.5, z);
    flight.to.set(x + (dx / distance) * reach, 0, z + (dz / distance) * reach);
    flight.to.y = heightAt(flight.to.x, flight.to.z) + 2.5;
    flight.t = 0;
  }

  function update(dt) {
    cooldown -= dt;
    if (flight.t >= 1) { wisp.visible = false; return; }
    flight.t = Math.min(1, flight.t + dt / 3.5);
    wisp.visible = true;
    wisp.position.lerpVectors(flight.from, flight.to, 1 - Math.pow(1 - flight.t, 2));
    wisp.position.y += Math.sin(flight.t * Math.PI) * 1.5;
    wisp.material.opacity = Math.sin(flight.t * Math.PI) * 0.9;
  }

  return { listen, update };
}
