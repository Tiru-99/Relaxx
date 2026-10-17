import * as THREE from 'three';
import { BUDGET } from '../config.js';
import { GLOW_TEXTURE } from '../core/glow.js';
import { jitter, TAU } from '../core/math.js';
import { heightAt } from './heightfield.js';

/**
 * Fireflies live in a ring around the spirit and wrap around as it moves,
 * so a small budget feels like the whole island is glowing at night.
 */
const RANGE = 40;

export function createFireflies(scene, env) {
  const count = BUDGET.fireflies, positions = new Float32Array(count * 3);
  const flies = Array.from({ length: count }, () => {
    const a = jitter(0, TAU), r = Math.sqrt(Math.random()) * RANGE;
    return { x: Math.cos(a) * r, z: Math.sin(a) * r, lift: jitter(0.5, 3), phase: jitter(0, 100), speed: jitter(0.3, 0.8) };
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    map: GLOW_TEXTURE, color: 0xfff1a0, size: 0.45, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);

  return (dt, time, focus) => {
    material.opacity = 0.05 + env.night * 0.9;
    points.visible = material.opacity > 0.08;
    if (!points.visible) return;
    for (let i = 0; i < count; i++) {
      const fly = flies[i];
      if (fly.x - focus.x > RANGE) fly.x -= RANGE * 2; else if (focus.x - fly.x > RANGE) fly.x += RANGE * 2;
      if (fly.z - focus.z > RANGE) fly.z -= RANGE * 2; else if (focus.z - fly.z > RANGE) fly.z += RANGE * 2;
      const t = time * fly.speed + fly.phase, x = fly.x + Math.sin(t) * 1.5, z = fly.z + Math.cos(t * 0.9) * 1.5;
      positions[i * 3] = x;
      positions[i * 3 + 1] = Math.max(0.5, heightAt(x, z)) + fly.lift + Math.sin(t * 1.3) * 0.6;
      positions[i * 3 + 2] = z;
    }
    geometry.attributes.position.needsUpdate = true;
  };
}
