import * as THREE from 'three';
import { jitter, rand, TAU } from '../core/math.js';

/** Slow puffy clouds circling the island. All puffs share one instanced mesh (one draw call). */

const CLOUDS = 12, PUFFS = 5;
const WHITE = new THREE.Color(0xffffff);

export function createClouds(scene, env) {
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, transparent: true, opacity: 0.92 });
  const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), material, CLOUDS * PUFFS);
  mesh.frustumCulled = false;
  scene.add(mesh);

  const clouds = Array.from({ length: CLOUDS }, () => ({
    angle: rand(0, TAU), radius: rand(50, 150), y: rand(28, 44), speed: rand(0.003, 0.008), scale: rand(1.2, 2.2),
    puffs: Array.from({ length: PUFFS }, (_, k) => ({ x: k * 1.6 - 3.2, y: jitter(-0.3, 0.6), z: jitter(-1, 1), s: jitter(1.2, 2.2) * (k === 2 ? 1.3 : 1) })),
  }));

  const dummy = new THREE.Object3D(), parent = new THREE.Object3D();
  return (dt, time) => {
    material.color.copy(env.skyBottom).lerp(WHITE, 0.6 - env.night * 0.3);
    let i = 0;
    for (const cloud of clouds) {
      cloud.angle += cloud.speed * dt;
      parent.position.set(Math.cos(cloud.angle) * cloud.radius, cloud.y + Math.sin(time * 0.2 + cloud.radius) * 0.6, Math.sin(cloud.angle) * cloud.radius);
      parent.rotation.y = -cloud.angle;
      parent.scale.setScalar(cloud.scale);
      parent.updateMatrix();
      for (const puff of cloud.puffs) {
        dummy.position.set(puff.x, puff.y, puff.z);
        dummy.scale.setScalar(puff.s);
        dummy.updateMatrix();
        dummy.matrix.premultiply(parent.matrix);
        mesh.setMatrixAt(i++, dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
}
