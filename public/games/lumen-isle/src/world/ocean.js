import * as THREE from 'three';
import { WORLD } from '../config.js';
import { addOceanWaves } from '../core/wind.js';

/** The sea around the island. Waves are animated on the GPU (see core/wind.js). */
export function createOcean(scene) {
  const geometry = new THREE.PlaneGeometry(WORLD.oceanSize, WORLD.oceanSize, 150, 150);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshStandardMaterial({
    color: 0x6fc3d0, transparent: true, opacity: 0.82, roughness: 0.18, metalness: 0.1, flatShading: true,
  });
  addOceanWaves(material);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = WORLD.seaLevel;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return { mesh, material };
}
