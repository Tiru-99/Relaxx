import * as THREE from 'three';
import { jitter, TAU } from '../core/math.js';
import { heightAt } from '../world/heightfield.js';

/** Two small flocks of seabirds wheel slowly above the coast during the day. */
const FLOCKS = [{ x: 60, z: 70, radius: 18 }, { x: -80, z: 10, radius: 22 }];
const PER_FLOCK = 6;

export function createSeabirds(scene, { env, player }) {
  const wingGeometry = new THREE.BufferGeometry();
  wingGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, -0.12, 0, 0, 0.12, 0.7, 0.05, 0]), 3));
  wingGeometry.computeVertexNormals();
  const material = new THREE.MeshBasicMaterial({ color: 0xf6f3ec, side: THREE.DoubleSide });

  const birds = [];
  for (const flock of FLOCKS) {
    for (let i = 0; i < PER_FLOCK; i++) {
      const group = new THREE.Group();
      const left = new THREE.Mesh(wingGeometry, material), right = new THREE.Mesh(wingGeometry, material);
      right.scale.x = -1;
      group.add(left, right);
      scene.add(group);
      birds.push({ group, left, right, flock, angle: (i / PER_FLOCK) * TAU, lift: jitter(14, 22), speed: jitter(0.12, 0.2), phase: jitter(0, TAU) });
    }
  }

  let seen = false;
  function update(dt, time) {
    const day = env.night < 0.5;
    for (const bird of birds) {
      bird.group.visible = day;
      if (!day) continue;
      bird.angle += bird.speed * dt;
      const { flock } = bird, r = flock.radius + Math.sin(time * 0.3 + bird.phase) * 4;
      const x = flock.x + Math.cos(bird.angle) * r, z = flock.z + Math.sin(bird.angle) * r;
      bird.group.position.set(x, Math.max(2, heightAt(x, z)) + bird.lift + Math.sin(time + bird.phase), z);
      bird.group.rotation.y = -bird.angle;
      const flap = Math.sin(time * 4 + bird.phase) * 0.5;
      bird.left.rotation.z = flap;
      bird.right.rotation.z = -flap;
    }
    seen = day && FLOCKS.some((f) => Math.hypot(f.x - player.state.x, f.z - player.state.z) < f.radius + 20);
  }

  return { update, isSeen: () => seen };
}
