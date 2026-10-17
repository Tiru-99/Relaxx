import * as THREE from 'three';
import { BUDGET } from '../config.js';
import { jitter } from '../core/math.js';
import { addWindSway } from '../core/wind.js';
import { heightAt } from './heightfield.js';

/** Flowers planted by the spirit or woken by lanterns. Oldest flowers are recycled past the budget. */

const COLORS = [0xffb3c7, 0xd9b8ff, 0xfff1f5, 0xffcf9e, 0xa8d8ff, 0xfff0a0, 0xff9eae];
const GROW_SECONDS = 1.1;

export function createFlowers(scene) {
  const stemGeometry = new THREE.CylinderGeometry(0.02, 0.03, 0.5, 4).translate(0, 0.25, 0);
  const headGeometry = new THREE.IcosahedronGeometry(0.17, 0).scale(1, 0.6, 1).translate(0, 0.53, 0);
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x5c9a4e, flatShading: true });
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.6 });
  addWindSway(stemMaterial, { strength: 0.15, speed: 1.4 });
  addWindSway(headMaterial, { strength: 0.15, speed: 1.4 });
  const stems = new THREE.InstancedMesh(stemGeometry, stemMaterial, BUDGET.flowers);
  const heads = new THREE.InstancedMesh(headGeometry, headMaterial, BUDGET.flowers);
  stems.count = heads.count = 0;
  scene.add(stems, heads);

  const growing = new Set();
  const flowers = [];
  const dummy = new THREE.Object3D(), color = new THREE.Color();
  let cursor = 0, clock = 0;

  function writeMatrix(i, flower, scale) {
    dummy.position.set(flower.x, flower.y - 0.05, flower.z);
    dummy.rotation.set(0, flower.rotation, 0);
    dummy.scale.setScalar(Math.max(0.0001, scale));
    dummy.updateMatrix();
    stems.setMatrixAt(i, dummy.matrix);
    heads.setMatrixAt(i, dummy.matrix);
    stems.instanceMatrix.needsUpdate = heads.instanceMatrix.needsUpdate = true;
  }

  /** @returns {boolean} whether a flower could grow here */
  function plant(x, z, delay = 0) {
    const y = heightAt(x, z);
    if (y < 0.4) return false;
    const i = cursor % BUDGET.flowers;
    cursor++;
    flowers[i] = { x, y, z, born: clock + delay, size: jitter(0.8, 1.3), rotation: jitter(0, 6.28) };
    heads.setColorAt(i, color.set(COLORS[Math.floor(Math.random() * COLORS.length)]));
    heads.instanceColor.needsUpdate = true;
    writeMatrix(i, flowers[i], 0);
    stems.count = heads.count = Math.min(BUDGET.flowers, cursor);
    growing.add(i);
    return true;
  }

  // Only flowers that are still growing are touched each frame; grown ones are left alone.
  function update(dt) {
    clock += dt;
    for (const i of growing) {
      const flower = flowers[i];
      const g = Math.min(1, Math.max(0, (clock - flower.born) / GROW_SECONDS));
      const overshoot = g <= 0 ? 0 : 1 + 2.2 * Math.pow(g - 1, 3) + 1.2 * Math.pow(g - 1, 2);
      writeMatrix(i, flower, flower.size * overshoot);
      if (g >= 1) growing.delete(i);
    }
  }

  return { plant, update };
}
