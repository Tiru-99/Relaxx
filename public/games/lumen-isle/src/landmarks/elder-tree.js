import * as THREE from 'three';
import { glowMaterial } from '../core/glow.js';
import { jitter, rand, TAU } from '../core/math.js';
import { heightAt } from '../world/heightfield.js';
import { addMesh, addSolid, anchorAt, flat } from './shared.js';

/** The Elder Tree: an ancient blossoming tree alone in the meadow, letting petals go. */
export const elderTree = {
  id: 'elderTree',
  name: 'the elder tree',
  message: 'it has been growing here longer than the paths',
  build({ scene, solids }) {
    const group = anchorAt(scene, 'elderTree', { yOffset: -0.2 });
    const bark = flat(0x6d5240);
    addMesh(group, new THREE.CylinderGeometry(0.7, 1.15, 5, 8), bark, { position: [0, 2.5, 0] });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      addMesh(group, new THREE.CylinderGeometry(0.12, 0.35, 2.4, 5), bark, { position: [Math.cos(a) * 1, 0.5, Math.sin(a) * 1], rotation: [Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9] });
    }
    const blossom = [0xf5c4d2, 0xf2b8c6, 0xfadde5].map((c) => flat(c, { roughness: 0.8 }));
    const puff = new THREE.IcosahedronGeometry(1, 1);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU, r = i === 0 ? 0 : rand(1.8, 3);
      addMesh(group, puff, blossom[i % 3], { position: [Math.cos(a) * r, 6 + rand(-0.6, 1.2), Math.sin(a) * r], scale: [rand(1.6, 2.4), rand(1.2, 1.7), rand(1.6, 2.4)] });
    }
    addSolid(solids, group, 0, 0, 1.3);

    const petals = Array.from({ length: 30 }, () => {
      const sprite = new THREE.Sprite(glowMaterial(0xffd6e2, 0.7));
      sprite.scale.setScalar(0.18);
      scene.add(sprite);
      return { sprite, y: 0, ground: 0, sway: jitter(0, TAU), speed: jitter(0.4, 0.8) };
    });
    const reset = (petal, anywhere) => {
      const a = jitter(0, TAU), r = jitter(0, 4.5);
      const x = group.position.x + Math.cos(a) * r, z = group.position.z + Math.sin(a) * r;
      petal.ground = heightAt(x, z);
      petal.y = anywhere ? jitter(petal.ground, group.position.y + 6) : group.position.y + jitter(4.5, 6.5);
      petal.sprite.position.set(x, petal.y, z);
    };
    petals.forEach((p) => reset(p, true));

    return (dt, time) => {
      for (const petal of petals) {
        petal.y -= petal.speed * dt;
        petal.sprite.position.y = petal.y;
        petal.sprite.position.x += Math.sin(time * 1.3 + petal.sway) * dt * 0.4;
        if (petal.y < petal.ground) reset(petal, false);
      }
    };
  },
};
