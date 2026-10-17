import * as THREE from 'three';
import { glowSprite } from '../core/glow.js';
import { rand, TAU } from '../core/math.js';
import { riverFrame } from '../world/river.js';
import { flat } from './shared.js';

/** The First Spring: a clear pool high in the highlands where the stream begins. */
export const spring = {
  id: 'spring',
  name: 'the first spring',
  message: 'clear water gathers beneath the hill',
  build({ scene, env }) {
    const source = riverFrame(0);
    const group = new THREE.Group();
    group.position.set(source.x, source.y, source.z);
    scene.add(group);

    const pool = new THREE.Mesh(new THREE.CircleGeometry(1.6, 28), new THREE.MeshStandardMaterial({
      color: 0x9fd7cf, emissive: 0x5a9b91, emissiveIntensity: 0.18, transparent: true, opacity: 0.9, roughness: 0.15,
    }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.04;
    group.add(pool);

    const stoneMaterial = flat(0xb7b8ad);
    const stoneGeometry = new THREE.DodecahedronGeometry(0.22, 0);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU, stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
      stone.position.set(Math.cos(a) * 1.7, rand(-0.02, 0.08), Math.sin(a) * 1.7);
      stone.scale.set(rand(1, 1.6), rand(0.55, 0.9), rand(0.8, 1.25));
      stone.rotation.set(rand(0, 1), a, 0);
      stone.castShadow = true;
      group.add(stone);
    }
    const glow = glowSprite(0xbfffea, 0.2, 1);
    glow.scale.set(3.4, 0.8, 1);
    glow.position.y = 0.3;
    group.add(glow);

    return (dt, time) => {
      glow.material.opacity = 0.14 + env.night * 0.2 + Math.sin(time * 1.2) * 0.04;
    };
  },
};
