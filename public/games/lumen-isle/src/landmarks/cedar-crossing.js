import * as THREE from 'three';
import { rand } from '../core/math.js';
import { addPlatform } from '../world/ground.js';
import { heightAt, nearestRiver } from '../world/heightfield.js';
import { PLACES } from '../world/layout.js';
import { riverFrame } from '../world/river.js';
import { flat } from './shared.js';

/** The Cedar Crossing: a low footbridge, and the only dry way over the lower stream. */
export const cedarCrossing = {
  id: 'crossing',
  name: 'the cedar crossing',
  message: 'the stream is never in a hurry',
  build({ scene }) {
    const near = nearestRiver(PLACES.crossing.x, PLACES.crossing.z);
    const frame = riverFrame(near.index);
    const span = frame.width * 2 + 4;
    const bankY = Math.max(heightAt(frame.x + frame.ax * span / 2, frame.z + frame.az * span / 2), heightAt(frame.x - frame.ax * span / 2, frame.z - frame.az * span / 2));
    const deckY = Math.max(bankY, frame.y) + 0.25;
    const angle = Math.atan2(frame.ax, frame.az); // planks run across the stream

    const bridge = new THREE.Group();
    bridge.position.set(frame.x, deckY, frame.z);
    bridge.rotation.y = angle;
    scene.add(bridge);

    const wood = flat(0x8b6748, { roughness: 0.95 });
    const PLANK_THICKNESS = 0.14, ARCH = 0.25, RAIL_OFFSET = 1.05;
    const plank = new THREE.BoxGeometry(2.2, PLANK_THICKNESS, 0.34);
    const planks = Math.ceil(span / 0.36);
    for (let i = 0; i < planks; i++) {
      const z = (i - planks / 2) * 0.36, arch = Math.cos((z / span) * Math.PI) * ARCH;
      const mesh = new THREE.Mesh(plank, wood);
      mesh.position.set(0, arch, z);
      mesh.rotation.y = rand(-0.02, 0.02);
      mesh.castShadow = mesh.receiveShadow = true;
      bridge.add(mesh);
    }
    const rail = new THREE.BoxGeometry(0.08, 0.08, span), post = new THREE.CylinderGeometry(0.05, 0.06, 0.8, 5);
    for (const side of [-1, 1]) {
      const r = new THREE.Mesh(rail, wood);
      r.position.set(side * RAIL_OFFSET, 0.75, 0);
      bridge.add(r);
      for (let k = -2; k <= 2; k++) {
        const p = new THREE.Mesh(post, wood);
        p.position.set(side * RAIL_OFFSET, 0.35, (k / 2) * (span / 2 - 0.3));
        p.castShadow = true;
        bridge.add(p);
      }
    }
    // The walkable deck follows the planks' arch, and both railings are solid (see world/ground.js).
    addPlatform({
      x: frame.x, z: frame.z, angle, halfLength: span / 2, halfWidth: RAIL_OFFSET,
      y: deckY + PLANK_THICKNESS / 2, arch: ARCH, rails: true,
    });
    return null;
  },
};
