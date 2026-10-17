import * as THREE from 'three';
import { sfx } from '../audio/sfx.js';
import { BUDGET } from '../config.js';
import { glowSprite } from '../core/glow.js';
import { jitter, TAU } from '../core/math.js';
import { heightAt } from '../world/heightfield.js';
import { isKeptClear } from '../world/regions.js';

/**
 * Motes of light drift near the spirit. Collected or far-away motes reappear somewhere new
 * within reach, so the big island never feels empty and you never have to backtrack.
 */
const NEAR = 12, FAR = 55, TOO_FAR = 90;

export function createMotes({ scene, solids, sparks, player }, { journal }) {
  const coreGeometry = new THREE.OctahedronGeometry(0.13, 0);
  const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

  function place(mote) {
    const { x: px, z: pz } = player.state;
    for (let tries = 0; tries < 60; tries++) {
      const a = jitter(0, TAU), r = jitter(NEAR, FAR), x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r;
      if (heightAt(x, z) > 0.8 && solids.isClear(x, z, 0.8) && !isKeptClear(x, z, -1)) {
        mote.x = x; mote.z = z; mote.baseY = heightAt(x, z) + 1.1;
        return;
      }
    }
  }

  const motes = Array.from({ length: BUDGET.motes }, () => {
    const group = new THREE.Group();
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    const halo = glowSprite(0xaee4ff, 0.9, 1.6);
    group.add(core, halo);
    scene.add(group);
    const mote = { group, core, halo, phase: jitter(0, TAU), active: true, respawn: 0, x: 0, z: 0, baseY: 0 };
    place(mote);
    return mote;
  });

  return (dt, time) => {
    const { x: px, y: py, z: pz } = player.state;
    for (const mote of motes) {
      if (!mote.active) {
        mote.respawn -= dt;
        if (mote.respawn <= 0) { place(mote); mote.active = true; mote.group.visible = true; }
        continue;
      }
      const distance = Math.hypot(mote.x - px, mote.z - pz);
      if (distance > TOO_FAR) { place(mote); continue; }
      const y = mote.baseY + Math.sin(time * 1.5 + mote.phase) * 0.25;
      mote.group.position.set(mote.x, y, mote.z);
      mote.core.rotation.y += dt * 1.5;
      mote.core.rotation.x += dt * 0.7;
      mote.halo.material.opacity = 0.65 + Math.sin(time * 3 + mote.phase) * 0.25;
      if (distance < 1.3 && Math.abs(y - py) < 1.8) {
        mote.active = false;
        mote.group.visible = false;
        mote.respawn = jitter(6, 14);
        journal.addMotes(1);
        sfx.mote();
        sparks.burst(mote.x, y - 0.5, mote.z, 0xaee4ff, 10, { size: 0.5, rise: 1, life: 1.4 });
      }
    }
  };
}
