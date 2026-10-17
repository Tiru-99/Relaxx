import * as THREE from 'three';
import { rand, TAU } from '../core/math.js';
import { anchorAt } from './shared.js';

/** Mooncap Glade: a ring of mushrooms deep in the eastern wood that glows after dusk. */
export const mooncapGlade = {
  id: 'mooncap',
  name: 'mooncap glade',
  message: 'small lights keep their own kind of dusk',
  build({ scene, env }) {
    const group = anchorAt(scene, 'mooncap');
    const count = 17;
    const stems = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.055, 0.09, 0.48, 7).translate(0, 0.24, 0),
      new THREE.MeshStandardMaterial({ color: 0xf0e4d0, roughness: 0.8 }), count);
    const capMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x9d8ac7, emissiveIntensity: 0.08, roughness: 0.65, flatShading: true });
    const caps = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.25, 9, 5, 0, TAU, 0, Math.PI / 2).scale(1.15, 0.5, 1.15).translate(0, 0.47, 0), capMaterial, count);
    const colors = [0x9d8ac7, 0xb583a9, 0x7fa6aa].map((c) => new THREE.Color(c));
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + rand(-0.16, 0.16), r = rand(1.3, 2.6);
      dummy.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      dummy.scale.setScalar(rand(0.6, 1.3));
      dummy.updateMatrix();
      stems.setMatrixAt(i, dummy.matrix);
      caps.setMatrixAt(i, dummy.matrix);
      caps.setColorAt(i, colors[i % colors.length]);
    }
    stems.castShadow = caps.castShadow = true;
    group.add(stems, caps);

    return (dt, time) => {
      capMaterial.emissiveIntensity = 0.06 + env.night * 0.6 + Math.sin(time * 1.1) * 0.03;
    };
  },
};
