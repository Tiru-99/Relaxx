import * as THREE from 'three';
import { rand, TAU } from '../core/math.js';
import { heightAt } from '../world/heightfield.js';
import { PLACES } from '../world/layout.js';
import { flat } from './shared.js';

/** The Tide Pools: little mirrors on the southern shore, each keeping a starfish or two. */
function starfishGeometry() {
  const shape = new THREE.Shape();
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * TAU, r = i % 2 ? 0.07 : 0.2;
    if (i === 0) shape.moveTo(r, 0);
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  return new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2);
}

export const tidePools = {
  id: 'tidePools',
  name: 'the tide pools',
  message: 'the sea leaves small gifts and comes back for them',
  build({ scene }) {
    const water = new THREE.MeshStandardMaterial({ color: 0x8fd0d6, roughness: 0.1, transparent: true, opacity: 0.85 });
    const rim = flat(0x9d9a90);
    const rimGeometry = new THREE.DodecahedronGeometry(0.3, 0);
    const star = starfishGeometry();
    const starColors = [0xf2a07b, 0xe98fa8, 0xf5c66b].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }));
    const spot = PLACES.tidePools;

    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * TAU + rand(-0.3, 0.3), d = rand(1.5, 4);
      const x = spot.x + Math.cos(a) * d, z = spot.z + Math.sin(a) * d, y = heightAt(x, z), size = rand(0.6, 1.1);
      const pool = new THREE.Mesh(new THREE.CircleGeometry(size, 16), water);
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(x, y + 0.06, z);
      scene.add(pool);
      for (let i = 0; i < 9; i++) {
        const b = (i / 9) * TAU, stone = new THREE.Mesh(rimGeometry, rim);
        stone.position.set(x + Math.cos(b) * size, y + 0.05, z + Math.sin(b) * size);
        stone.scale.set(rand(0.8, 1.3), rand(0.4, 0.7), rand(0.8, 1.2));
        stone.rotation.set(rand(0, 1), b, 0);
        stone.receiveShadow = true;
        scene.add(stone);
      }
      const starfish = new THREE.Mesh(star, starColors[p % 3]);
      starfish.position.set(x + rand(-0.3, 0.3), y + 0.08, z + rand(-0.3, 0.3));
      starfish.rotation.y = rand(0, TAU);
      scene.add(starfish);
    }
    return null;
  },
};
