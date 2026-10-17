import * as THREE from 'three';
import { sfx } from '../audio/sfx.js';
import { MOTES_PER_LANTERN } from '../config.js';
import { GLOW_TEXTURE, glowSprite } from '../core/glow.js';
import { jitter, rand, TAU } from '../core/math.js';
import { heightAt } from '../world/heightfield.js';
import { LANTERNS } from '../world/layout.js';

/** Nine sleeping lanterns. Bring three motes of light to wake each one; flowers bloom around it. */

const LIT_MESSAGES = ['a warm light returns', 'the flowers wake up', 'softly, softly', 'the island remembers', 'one more glow', 'the paths grow warmer', 'nearly home', 'almost whole'];

function buildLantern(scene, x, z) {
  const y = heightAt(x, z);
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rand(0, TAU);
  scene.add(group);
  const post = new THREE.MeshStandardMaterial({ color: 0x6b4a35, flatShading: true, roughness: 0.9 });
  const roof = new THREE.MeshStandardMaterial({ color: 0x3e3550, flatShading: true });
  const body = new THREE.MeshStandardMaterial({ color: 0xf3e3c3, emissive: 0xffb05a, emissiveIntensity: 0, flatShading: true });
  const parts = [
    [new THREE.CylinderGeometry(0.09, 0.13, 2.2, 6), post, [0, 1.1, 0]],
    [new THREE.BoxGeometry(0.7, 0.08, 0.08), post, [0.3, 2.1, 0]],
    [new THREE.CylinderGeometry(0.2, 0.24, 0.45, 6), body, [0.6, 1.75, 0]],
    [new THREE.ConeGeometry(0.32, 0.25, 6), roof, [0.6, 2.08, 0]],
  ];
  for (const [geometry, material, position] of parts) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    group.add(mesh);
  }
  const glow = glowSprite(0xffc27a, 0, 4);
  const hint = glowSprite(0xbfe3ff, 0.3, 1.2);
  glow.position.set(0.6, 1.75, 0);
  hint.position.copy(glow.position);
  // A soft pool of light on the ground stands in for a real point light (much cheaper).
  const pool = new THREE.Mesh(new THREE.CircleGeometry(4, 20), new THREE.MeshBasicMaterial({
    map: GLOW_TEXTURE, color: 0xffb36b, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0.6, 0.08, 0);
  group.add(glow, hint, pool);
  return { group, body, glow, hint, pool, x, z };
}

export function createLanterns({ scene, solids, env, player, flowers }, { journal, toast, onAllLit }) {
  const lanterns = LANTERNS.map((spot, index) => {
    const lantern = { ...buildLantern(scene, spot.x, spot.z), index, litAt: -Infinity, warned: false };
    solids.insert({ x: spot.x, z: spot.z, r: 0.3 });
    if (journal.isLanternLit(index)) lantern.litAt = -10; // already lit on a previous visit
    return lantern;
  });

  const bloomAround = (lantern, delay) => {
    for (let i = 0; i < 16; i++) {
      const a = jitter(0, TAU), r = jitter(1.3, 4.2);
      flowers.plant(lantern.x + Math.cos(a) * r, lantern.z + Math.sin(a) * r, delay ? jitter(0.2, 2.5) : 0);
    }
  };
  lanterns.filter((l) => journal.isLanternLit(l.index)).forEach((l) => bloomAround(l, false));

  function light(lantern, time) {
    journal.addMotes(-MOTES_PER_LANTERN);
    journal.lightLantern(lantern.index);
    lantern.litAt = time;
    sfx.lantern();
    bloomAround(lantern, true);
    const lit = journal.progress.lanterns.length;
    if (lit === LANTERNS.length) onAllLit();
    else toast.show(`${LIT_MESSAGES[(lit - 1) % LIT_MESSAGES.length]}  ·  ${lit}/${LANTERNS.length}`);
  }

  return (dt, time) => {
    for (const lantern of lanterns) {
      const lit = journal.isLanternLit(lantern.index);
      if (!lit) {
        lantern.hint.material.opacity = 0.18 + Math.sin(time * 1.6 + lantern.x) * 0.12;
        const distance = Math.hypot(lantern.x - player.state.x, lantern.z - player.state.z);
        if (distance < 2.4) {
          if (journal.motes >= MOTES_PER_LANTERN) light(lantern, time);
          else if (!lantern.warned) {
            lantern.warned = true;
            toast.show(`this lantern needs ${MOTES_PER_LANTERN} motes of light`, 3.5, `you are carrying ${journal.motes}`);
          }
        } else if (distance > 4) lantern.warned = false;
        continue;
      }
      lantern.hint.visible = false;
      const f = Math.min(1, (time - lantern.litAt) / 2.5);
      const flicker = 1 + Math.sin(time * 7 + lantern.x) * 0.04 + Math.sin(time * 13 + lantern.z) * 0.03;
      const level = f * (0.55 + env.night * 0.6) * flicker;
      lantern.body.emissiveIntensity = 1.6 * f * flicker;
      lantern.glow.material.opacity = level * 0.9;
      lantern.pool.material.opacity = level * 0.35 * (0.3 + env.night);
    }
  };
}
