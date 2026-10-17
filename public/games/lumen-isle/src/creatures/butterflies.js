import * as THREE from 'three';
import { BUDGET } from '../config.js';
import { jitter, TAU } from '../core/math.js';
import { heightAt } from '../world/heightfield.js';
import { forestDensity } from '../world/regions.js';

/** Butterflies flutter over open grass on bright days, staying in a loose ring around the spirit. */
const COLORS = [0xf7c873, 0xf2a6c1, 0xbfd9ff, 0xffffff];
const RANGE = 32;

export function createButterflies(scene, { env, player }) {
  const wing = new THREE.PlaneGeometry(0.16, 0.12).translate(0.08, 0, 0);
  const materials = COLORS.map((color) => new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true }));

  function relocate(b) {
    const { x: px, z: pz } = player.state;
    for (let tries = 0; tries < 20; tries++) {
      const a = jitter(0, TAU), r = jitter(6, RANGE), x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r;
      if (heightAt(x, z) > 1.2 && forestDensity(x, z) < 0.5) { b.homeX = x; b.homeZ = z; return; }
    }
  }

  const butterflies = Array.from({ length: BUDGET.butterflies }, (_, i) => {
    const group = new THREE.Group(), material = materials[i % materials.length];
    const left = new THREE.Mesh(wing, material), right = new THREE.Mesh(wing, material);
    right.scale.x = -1;
    group.add(left, right);
    group.visible = false;
    scene.add(group);
    const b = { group, left, right, phase: jitter(0, TAU), speed: jitter(0.4, 0.9), homeX: 0, homeZ: 0 };
    relocate(b);
    return b;
  });

  const state = { active: false, nearest: Infinity };
  function update(dt, time) {
    state.active = env.night < 0.35;
    state.nearest = Infinity;
    for (const b of butterflies) {
      b.group.visible = state.active;
      if (!state.active) continue;
      if (Math.hypot(b.homeX - player.state.x, b.homeZ - player.state.z) > RANGE * 1.4) relocate(b);
      const t = time * b.speed + b.phase;
      const x = b.homeX + Math.sin(t) * 2.5 + Math.sin(t * 2.3) * 0.6, z = b.homeZ + Math.cos(t * 0.8) * 2.5;
      b.group.position.set(x, heightAt(x, z) + 0.8 + Math.sin(t * 3) * 0.3, z);
      b.group.rotation.y = t + Math.PI / 2;
      const flap = Math.sin(time * 18 + b.phase) * 1.1;
      b.left.rotation.z = flap;
      b.right.rotation.z = -flap;
      state.nearest = Math.min(state.nearest, Math.hypot(x - player.state.x, z - player.state.z));
    }
  }

  return { update, isSeen: () => state.active && state.nearest < 5 };
}
