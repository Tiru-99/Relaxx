import * as THREE from 'three';
import { glowMaterial } from '../core/glow.js';
import { jitter, rand } from '../core/math.js';
import { heightAt, nearestRiver, river } from '../world/heightfield.js';
import { PLACES } from '../world/layout.js';
import { riverFrame } from '../world/river.js';
import { flat } from './shared.js';

/** The Falls: where the stream tumbles off the highlands. Mist drifts up from the plunge pool. */
export const falls = {
  id: 'falls',
  name: 'the white falls',
  message: 'the highland water lets go, and is caught',
  build({ scene, solids }) {
    // Find the steepest drop near the mapped spot: that's where the water falls.
    const near = nearestRiver(PLACES.falls.x, PLACES.falls.z);
    let steepest = near.index;
    for (let i = Math.max(1, near.index - 12); i < Math.min(river.count - 1, near.index + 12); i++) {
      if (river.bed[i - 1] - river.bed[i] > river.bed[steepest - 1] - river.bed[steepest]) steepest = i;
    }
    const base = riverFrame(steepest + 3), top = riverFrame(steepest - 3);

    const rockMaterial = flat(0xa7a49c);
    const rockGeometry = new THREE.DodecahedronGeometry(0.9, 0);
    for (let i = 0; i < 6; i++) {
      const side = i % 2 ? 1 : -1, along = rand(0, 0.35); // boulders gather at the foot of the falls
      const x = base.x + (top.x - base.x) * along + base.ax * (base.width + rand(0.4, 1.6)) * side;
      const z = base.z + (top.z - base.z) * along + base.az * (base.width + rand(0.4, 1.6)) * side;
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(x, heightAt(x, z) + 0.2, z);
      rock.scale.set(rand(0.7, 1.2), rand(0.6, 1.1), rand(0.7, 1.1));
      rock.rotation.set(rand(0, 2), rand(0, 6), 0);
      rock.castShadow = rock.receiveShadow = true;
      scene.add(rock);
      solids.insert({ x, z, r: 0.8 });
    }

    const mist = Array.from({ length: 14 }, () => {
      const sprite = new THREE.Sprite(glowMaterial(0xf4fbff, 0));
      scene.add(sprite);
      return { sprite, age: jitter(0, 3), life: jitter(2.5, 4) };
    });

    return (dt) => {
      for (const puff of mist) {
        puff.age += dt;
        if (puff.age > puff.life) {
          puff.age = 0;
          puff.sprite.position.set(base.x + jitter(-1, 1), base.y + 0.2, base.z + jitter(-1, 1));
        }
        const f = puff.age / puff.life;
        puff.sprite.position.y += dt * 0.6;
        puff.sprite.scale.setScalar(1 + f * 2.5);
        puff.sprite.material.opacity = Math.sin(f * Math.PI) * 0.32;
      }
    };
  },
};
