import * as THREE from 'three';
import { sfx } from '../audio/sfx.js';
import { jitter, TAU } from '../core/math.js';
import { heightAt, nearestRiver, river } from '../world/heightfield.js';
import { riverFrame } from '../world/river.js';

/** Now and then, if you linger by the water, a fish leaps out in a little silver arc. */
const LEAP_SECONDS = 1.1;

export function createFish(scene, { player, sparks }) {
  const fish = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.5, 6).rotateX(Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xc9d6dc, metalness: 0.5, roughness: 0.3 }));
  fish.visible = false;
  scene.add(fish);

  const leap = { active: false, t: 0, from: new THREE.Vector3(), to: new THREE.Vector3(), height: 1.2 };
  let wait = jitter(5, 10), seen = false;

  /** Somewhere on the water 4–10 m from the spirit, or null if no water is near. */
  function findWater() {
    const { x, z } = player.state;
    const near = nearestRiver(x, z, 3);
    if (near && near.distance < 14) {
      const index = Math.max(0, Math.min(river.count - 2, near.index + Math.round(jitter(-4, 4))));
      const frame = riverFrame(index);
      return { x: frame.x, y: frame.y, z: frame.z, ax: frame.az, az: -frame.ax };
    }
    for (let tries = 0; tries < 10; tries++) {
      const a = jitter(0, TAU), r = jitter(5, 12), wx = x + Math.cos(a) * r, wz = z + Math.sin(a) * r;
      if (heightAt(wx, wz) < -0.8) return { x: wx, y: 0, z: wz, ax: Math.cos(a + 1.5), az: Math.sin(a + 1.5) };
    }
    return null;
  }

  function splash(at) {
    sparks.burst(at.x, at.y, at.z, 0xe8fbff, 6, { size: 0.35, rise: 1.2, life: 0.7 });
    sfx.splash();
  }

  function update(dt) {
    if (!leap.active) {
      wait -= dt;
      if (wait > 0) return;
      wait = jitter(6, 14);
      const water = findWater();
      if (!water) return;
      leap.from.set(water.x - water.ax * 0.9, water.y, water.z - water.az * 0.9);
      leap.to.set(water.x + water.ax * 0.9, water.y, water.z + water.az * 0.9);
      leap.height = jitter(0.8, 1.4);
      leap.active = true;
      leap.t = 0;
      fish.visible = true;
      splash(leap.from);
      seen = true;
      return;
    }
    leap.t += dt / LEAP_SECONDS;
    const t = Math.min(1, leap.t);
    fish.position.lerpVectors(leap.from, leap.to, t);
    fish.position.y += Math.sin(t * Math.PI) * leap.height;
    fish.lookAt(leap.to.x, leap.from.y + Math.cos(t * Math.PI) * leap.height, leap.to.z);
    if (t >= 1) {
      leap.active = false;
      fish.visible = false;
      splash(leap.to);
    }
  }

  return { update, isSeen: () => seen };
}
