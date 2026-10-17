import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BUDGET } from '../config.js';
import { rand } from '../core/math.js';
import { addWindSway } from '../core/wind.js';
import { heightAt, nearestRiver, slopeAt } from './heightfield.js';
import { forestDensity, isKeptClear } from './regions.js';

/**
 * Trees, rocks and grass. Each kind is a single InstancedMesh, so the whole forest costs a handful
 * of draw calls. Crowns and grass sway in the vertex shader.
 */

const LEAF_COLORS = [0x6fae6a, 0x5d9c6b, 0x8cc47a, 0x7cb46f, 0xf2b8c6, 0xf5c98e, 0xb7d77e];

function conifer() {
  const tiers = [0, 1, 2].map((k) => new THREE.ConeGeometry(1.15 - k * 0.28, 1.4, 7).translate(0, 1.6 + k * 0.65, 0));
  return mergeGeometries(tiers);
}

function roundCrown() {
  const main = new THREE.IcosahedronGeometry(1, 0).scale(1.1, 0.95, 1.1).translate(0, 1.9, 0);
  const side = new THREE.IcosahedronGeometry(0.65, 0).translate(0.5, 1.6, 0.2);
  return mergeGeometries([main, side]);
}

function canPlaceTree(x, z, solids) {
  const y = heightAt(x, z);
  if (y < 1.2 || slopeAt(x, z) > 0.75 || isKeptClear(x, z)) return false;
  const river = nearestRiver(x, z, 2);
  if (river && river.distance < river.width + 2) return false;
  return solids.isClear(x, z, 1.6);
}

function createTrees(scene, solids, canopy) {
  const trunkGeometry = new THREE.CylinderGeometry(0.13, 0.2, 1.2, 6).translate(0, 0.6, 0);
  const crownMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.85 });
  addWindSway(crownMaterial, { strength: 0.018, speed: 1, fadeNearCamera: true });

  const trunks = new THREE.InstancedMesh(trunkGeometry, new THREE.MeshStandardMaterial({ color: 0x7a5a44, flatShading: true }), BUDGET.trees);
  const conifers = new THREE.InstancedMesh(conifer(), crownMaterial, BUDGET.trees);
  const rounds = new THREE.InstancedMesh(roundCrown(), crownMaterial, BUDGET.trees);
  const dummy = new THREE.Object3D(), color = new THREE.Color();
  let trunkCount = 0, coniferCount = 0, roundCount = 0;

  for (let tries = 0; trunkCount < BUDGET.trees && tries < BUDGET.trees * 30; tries++) {
    const x = rand(-110, 110), z = rand(-110, 110);
    if (rand(0, 1) > forestDensity(x, z) || !canPlaceTree(x, z, solids)) continue;
    const scale = rand(0.8, 1.6), y = heightAt(x, z) - 0.1;
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, rand(0, 6.28), 0);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    trunks.setMatrixAt(trunkCount++, dummy.matrix);

    // Highland and dense forest lean to conifers; the meadow to round, blossoming trees.
    const coniferChance = y > 8 ? 0.85 : forestDensity(x, z) > 0.5 ? 0.6 : 0.3;
    const useConifer = rand(0, 1) < coniferChance;
    const palette = useConifer ? LEAF_COLORS.slice(0, 4) : LEAF_COLORS;
    color.set(palette[Math.floor(rand(0, palette.length))]).offsetHSL(rand(-0.02, 0.02), 0, rand(-0.04, 0.04));
    const target = useConifer ? conifers : rounds;
    const index = useConifer ? coniferCount++ : roundCount++;
    target.setMatrixAt(index, dummy.matrix);
    target.setColorAt(index, color);

    solids.insert({ x, z, r: 0.28 * scale });
    canopy.insert({ x, z, r: 1.15 * scale, bottom: y + 1.2 * scale, top: y + 3.4 * scale });
  }

  trunks.count = trunkCount;
  conifers.count = coniferCount;
  rounds.count = roundCount;
  for (const mesh of [trunks, conifers, rounds]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
}

function createRocks(scene, solids) {
  const rocks = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.6, 0),
    new THREE.MeshStandardMaterial({ color: 0xa9a6b5, flatShading: true, roughness: 0.9 }), BUDGET.rocks);
  const dummy = new THREE.Object3D();
  let n = 0;
  for (let tries = 0; n < BUDGET.rocks && tries < BUDGET.rocks * 20; tries++) {
    const x = rand(-110, 110), z = rand(-110, 110), y = heightAt(x, z);
    // Rocks gather on beaches and cliffs, and are rare in the meadow.
    const likes = y < 1.6 && y > -0.6 ? 0.8 : slopeAt(x, z) > 0.5 ? 0.6 : 0.06;
    if (rand(0, 1) > likes || isKeptClear(x, z) || !solids.isClear(x, z, 1)) continue;
    const s = rand(0.5, 1.7);
    dummy.position.set(x, y + 0.1, z);
    dummy.rotation.set(rand(0, 3), rand(0, 3), 0);
    dummy.scale.set(s, s * rand(0.5, 0.9), s * rand(0.8, 1.2));
    dummy.updateMatrix();
    rocks.setMatrixAt(n++, dummy.matrix);
    if (y > 0.3) solids.insert({ x, z, r: 0.45 * s });
  }
  rocks.count = n;
  rocks.castShadow = rocks.receiveShadow = true;
  scene.add(rocks);
}

function createGrass(scene) {
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true });
  addWindSway(material, { strength: 0.25, speed: 1.6 });
  const geometry = new THREE.ConeGeometry(0.06, 0.34, 3).translate(0, 0.15, 0);
  const grass = new THREE.InstancedMesh(geometry, material, BUDGET.grass);
  const dummy = new THREE.Object3D(), color = new THREE.Color();
  let n = 0;
  for (let tries = 0; n < BUDGET.grass && tries < BUDGET.grass * 6; tries++) {
    const x = rand(-110, 110), z = rand(-110, 110), y = heightAt(x, z);
    if (y < 1 || slopeAt(x, z) > 0.6) continue;
    dummy.position.set(x, y - 0.05, z);
    dummy.rotation.set(rand(-0.3, 0.3), rand(0, 6), rand(-0.3, 0.3));
    dummy.scale.setScalar(rand(0.5, 1.15));
    dummy.updateMatrix();
    grass.setMatrixAt(n, dummy.matrix);
    grass.setColorAt(n++, color.setHSL(rand(0.22, 0.3), 0.4, rand(0.48, 0.62)));
  }
  grass.count = n;
  scene.add(grass);
}

/**
 * @param {import('../core/spatial-grid.js').SpatialGrid} solids  things the spirit bumps into
 * @param {import('../core/spatial-grid.js').SpatialGrid} canopy  crowns the camera should not hide behind
 */
export function createVegetation(scene, solids, canopy) {
  createTrees(scene, solids, canopy);
  createRocks(scene, solids);
  createGrass(scene);
}
