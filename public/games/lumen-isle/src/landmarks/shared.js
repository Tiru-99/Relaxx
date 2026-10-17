import * as THREE from 'three';
import { heightAt } from '../world/heightfield.js';
import { PLACES } from '../world/layout.js';

/** Helpers every landmark uses: anchor a group on the ground at its place, flat-shaded materials. */

/** A group standing on the ground at the landmark's mapped position. */
export function anchorAt(scene, placeId, { yOffset = 0, rotation = 0 } = {}) {
  const place = PLACES[placeId];
  const group = new THREE.Group();
  group.position.set(place.x, heightAt(place.x, place.z) + yOffset, place.z);
  group.rotation.y = rotation;
  scene.add(group);
  return group;
}

export const flat = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9, ...extra });

/** Add a mesh to a group with shadows on. */
export function addMesh(group, geometry, material, { position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] } = {}) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

/** Register a landmark's footprint (in world space) so the spirit walks around it. */
export function addSolid(solids, group, localX, localZ, radius) {
  const c = Math.cos(group.rotation.y), s = Math.sin(group.rotation.y);
  solids.insert({ x: group.position.x + localX * c + localZ * s, z: group.position.z - localX * s + localZ * c, r: radius });
}
