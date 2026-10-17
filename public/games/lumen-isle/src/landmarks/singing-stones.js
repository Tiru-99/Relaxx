import * as THREE from 'three';
import { sfx } from '../audio/sfx.js';
import { glowSprite } from '../core/glow.js';
import { TAU } from '../core/math.js';
import { heightAt } from '../world/heightfield.js';
import { PLACES } from '../world/layout.js';
import { flat } from './shared.js';

/** The Singing Stones on the heart hill. Brush past one and it rings its note. */
const COLORS = [0xf6b6c8, 0xf9d39b, 0xbfe6b0, 0xa9d8f0, 0xcdb8f2];

export const singingStones = {
  id: 'stones',
  name: 'the singing stones',
  message: 'each one remembers a single note',
  build({ scene, solids, env, sparks, player }) {
    const spot = PLACES.stones;
    const geometry = new THREE.DodecahedronGeometry(0.5, 0);
    const stones = COLORS.map((color, i) => {
      const a = (i / COLORS.length) * TAU + Math.PI / 2, x = spot.x + Math.cos(a) * 3.6, z = spot.z + Math.sin(a) * 3.6;
      const material = flat(0xd8d4e2, { emissive: color, emissiveIntensity: 0.05, roughness: 0.7 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(0.8, 1.9 + i * 0.12, 0.7);
      mesh.position.set(x, heightAt(x, z) + 0.7, z);
      mesh.rotation.y = a;
      mesh.castShadow = true;
      const glow = glowSprite(color, 0, 4);
      glow.position.copy(mesh.position);
      scene.add(mesh, glow);
      solids.insert({ x, z, r: 0.55 });
      return { mesh, material, glow, x, z, color, cooldown: 0, pulse: 0, note: i };
    });

    return (dt) => {
      for (const stone of stones) {
        stone.cooldown -= dt;
        stone.pulse = Math.max(0, stone.pulse - dt * 0.6);
        if (stone.cooldown <= 0 && Math.hypot(stone.x - player.state.x, stone.z - player.state.z) < 1.25) {
          stone.cooldown = 1.2;
          stone.pulse = 1;
          sfx.stone(stone.note);
          sparks.burst(stone.x, stone.mesh.position.y, stone.z, stone.color, 8, { size: 0.5, rise: 1.2, life: 1.6 });
        }
        stone.material.emissiveIntensity = 0.08 + stone.pulse * 1.4 + env.night * 0.15;
        stone.glow.material.opacity = stone.pulse * 0.8;
      }
    };
  },
};
