import * as THREE from 'three';
import { glowMaterial } from '../core/glow.js';
import { clamp, jitter, lerp, rand, smoothstep } from '../core/math.js';
import { addWindSway } from '../core/wind.js';
import { heightAt, river, RIVER_DEPTH } from './heightfield.js';

/** The stream's water surface, foam on the falls, drifting glints, reeds, pebbles and lily pads. */

const DEEP = new THREE.Color(0x6aaebb), PALE = new THREE.Color(0xb8e2dc), FOAM = new THREE.Color(0xf4fbfa);

/** Position and sideways direction at a fractional sample index along the stream. */
export function riverFrame(u, out = { x: 0, y: 0, z: 0, ax: 0, az: 0, width: 1 }) {
  const i = clamp(Math.floor(u), 0, river.count - 2), f = u - i;
  const dx = river.xs[i + 1] - river.xs[i], dz = river.zs[i + 1] - river.zs[i], len = Math.hypot(dx, dz) || 1;
  out.x = lerp(river.xs[i], river.xs[i + 1], f);
  out.z = lerp(river.zs[i], river.zs[i + 1], f);
  out.y = lerp(river.bed[i], river.bed[i + 1], f) + RIVER_DEPTH;
  out.ax = -dz / len;
  out.az = dx / len;
  out.width = lerp(river.width[i], river.width[i + 1], f);
  return out;
}

function createSurface(scene) {
  const count = river.count, positions = new Float32Array(count * 2 * 3), colors = new Float32Array(count * 2 * 3);
  const indices = [], frame = {}, color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    riverFrame(i, frame);
    const drop = i > 0 ? river.bed[i - 1] - river.bed[i] : 0;
    color.copy(DEEP).lerp(PALE, 0.35 + Math.sin(i * 0.4) * 0.08).lerp(FOAM, smoothstep(0.15, 0.6, drop));
    for (const side of [-1, 1]) {
      const v = i * 2 + (side + 1) / 2;
      positions.set([frame.x + frame.ax * frame.width * side, frame.y, frame.z + frame.az * frame.width * side], v * 3);
      colors.set([color.r, color.g, color.b], v * 3);
    }
    if (i < count - 1) indices.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: 0.86, roughness: 0.2, metalness: 0.08, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  scene.add(mesh);
}

/** Scatter instances just beside the banks. `place(dummy, x, y, z)` sets rotation/scale. */
function scatterOnBanks(mesh, { from, to, gap, spread }, place) {
  const dummy = new THREE.Object3D(), frame = {};
  let n = 0;
  for (let tries = 0; n < mesh.count && tries < mesh.count * 6; tries++) {
    riverFrame(rand(from, to) * (river.count - 1), frame);
    const side = rand(0, 1) < 0.5 ? -1 : 1, offset = frame.width + gap + rand(0, spread);
    const x = frame.x + frame.ax * offset * side, z = frame.z + frame.az * offset * side, y = heightAt(x, z);
    if (y < 0.2) continue;
    dummy.position.set(x, y, z);
    place(dummy);
    dummy.updateMatrix();
    mesh.setMatrixAt(n++, dummy.matrix);
  }
  mesh.count = n;
}

function createBanks(scene) {
  const reedMaterial = new THREE.MeshStandardMaterial({ color: 0x668b62, flatShading: true });
  addWindSway(reedMaterial, { strength: 0.12, speed: 1.3 });
  const reedGeometry = new THREE.CylinderGeometry(0.018, 0.028, 0.8, 4);
  reedGeometry.translate(0, 0.4, 0);
  const reeds = new THREE.InstancedMesh(reedGeometry, reedMaterial, 420);
  scatterOnBanks(reeds, { from: 0.15, to: 0.95, gap: 0.05, spread: 0.6 }, (d) => {
    d.rotation.set(rand(-0.08, 0.08), rand(0, 6.28), rand(-0.08, 0.08));
    d.scale.setScalar(rand(0.65, 1.4));
  });

  const pebbles = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.22, 0),
    new THREE.MeshStandardMaterial({ color: 0xa9b7ad, flatShading: true, roughness: 0.95 }), 260);
  scatterOnBanks(pebbles, { from: 0.02, to: 0.95, gap: 0.05, spread: 0.7 }, (d) => {
    d.position.y += 0.05;
    d.rotation.set(rand(0, 2), rand(0, 6.28), 0);
    d.scale.set(rand(0.45, 1.35), rand(0.25, 0.65), rand(0.5, 1.2));
  });
  pebbles.receiveShadow = true;

  const lilyGeometry = new THREE.CircleGeometry(0.25, 10, 0.35, Math.PI * 1.82);
  lilyGeometry.rotateX(-Math.PI / 2);
  const lilies = new THREE.InstancedMesh(lilyGeometry, new THREE.MeshStandardMaterial({ color: 0x76a66f, roughness: 0.8, side: THREE.DoubleSide }), 60);
  const dummy = new THREE.Object3D(), frame = {};
  let n = 0;
  for (let tries = 0; n < lilies.count && tries < 400; tries++) {
    const u = rand(0.35, 0.92) * (river.count - 1), i = Math.floor(u);
    if (river.bed[i] - river.bed[i + 1] > 0.05) continue; // no lilies on rapids
    riverFrame(u, frame);
    const s = rand(-0.6, 0.6);
    dummy.position.set(frame.x + frame.ax * frame.width * s, frame.y + 0.03, frame.z + frame.az * frame.width * s);
    dummy.rotation.set(0, rand(0, 6.28), 0);
    dummy.scale.setScalar(rand(0.65, 1.3));
    dummy.updateMatrix();
    lilies.setMatrixAt(n++, dummy.matrix);
  }
  lilies.count = n;
  scene.add(reeds, pebbles, lilies);
}

export function createRiver(scene, env) {
  createSurface(scene);
  createBanks(scene);

  const glints = Array.from({ length: 28 }, (_, i) => {
    const sprite = new THREE.Sprite(glowMaterial(0xd9fff2, 0));
    sprite.scale.set(jitter(0.35, 0.8), jitter(0.06, 0.12), 1);
    scene.add(sprite);
    return { sprite, u: (i / 28) * (river.count - 2), speed: jitter(2.5, 4.5), side: jitter(-0.55, 0.55), phase: jitter(0, 6.28) };
  });

  const frame = {};
  return (dt, time) => {
    for (const glint of glints) {
      glint.u = (glint.u + glint.speed * dt) % (river.count - 2);
      riverFrame(glint.u, frame);
      const sway = glint.side + Math.sin(time * 0.8 + glint.phase) * 0.08;
      glint.sprite.position.set(frame.x + frame.ax * frame.width * sway, frame.y + 0.1, frame.z + frame.az * frame.width * sway);
      glint.sprite.material.opacity = (0.12 + env.night * 0.12) * (0.65 + Math.sin(time * 1.4 + glint.phase) * 0.35);
    }
  };
}
