import * as THREE from 'three';
import { WORLD } from '../config.js';
import { fbm, smoothstep } from '../core/math.js';
import { GRID, gridHeight, slopeAt } from './heightfield.js';
import { forestDensity, pathDistance } from './regions.js';

/** Ground colours, from the sea floor up to the highland heath. */
const PALETTE = {
  seabed: new THREE.Color(0xc9b484),
  sand: new THREE.Color(0xf0dcae),
  grass: new THREE.Color(0x93c97c),
  meadow: new THREE.Color(0x6eab6b),
  forestFloor: new THREE.Color(0x5b8a57),
  heath: new THREE.Color(0xa9b98c),
  heather: new THREE.Color(0xb3a3c4),
  rock: new THREE.Color(0x9d9a90),
  path: new THREE.Color(0xd8c9a0),
};

function groundColor(x, y, z, out) {
  if (y < -0.2) return out.copy(PALETTE.seabed);
  if (y < 0.6) return out.copy(PALETTE.sand);
  if (y < 1.2) return out.copy(PALETTE.sand).lerp(PALETTE.grass, (y - 0.6) / 0.6);

  out.copy(PALETTE.grass).lerp(PALETTE.meadow, smoothstep(1, 6, y) * 0.8 + fbm(x * 0.05, z * 0.05, 2) * 0.25);
  out.lerp(PALETTE.forestFloor, forestDensity(x, z) * 0.8);
  if (y > 9) {
    out.lerp(PALETTE.heath, smoothstep(9, 13, y));
    out.lerp(PALETTE.heather, Math.max(0, fbm(x * 0.08 + 40, z * 0.08, 2)) * smoothstep(10, 14, y) * 0.9);
  }
  out.lerp(PALETTE.rock, smoothstep(0.55, 0.95, slopeAt(x, z)));
  out.lerp(PALETTE.path, smoothstep(1.7, 0.6, pathDistance(x, z)) * 0.7);
  return out;
}

/** The island mesh, built from the same baked grid that heightAt() samples. */
export function createTerrain(scene) {
  const geometry = new THREE.PlaneGeometry(WORLD.size, WORLD.size, GRID.segments, GRID.segments);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), z = position.getZ(i);
    const y = gridHeight(Math.round((x + GRID.half) / GRID.step), Math.round((z + GRID.half) / GRID.step));
    position.setY(i, y);
    groundColor(x, y, z, color).offsetHSL(0, 0, (Math.sin(x * 12.9898 + z * 78.233) * 0.5) * 0.03);
    colors.set([color.r, color.g, color.b], i * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  const material = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}
