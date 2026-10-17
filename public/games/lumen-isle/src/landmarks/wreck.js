import * as THREE from 'three';
import { addMesh, addSolid, anchorAt, flat } from './shared.js';

/** The Sleeping Boat: a small wreck on the eastern beach, slowly becoming part of the sand. */
export const wreck = {
  id: 'wreck',
  name: 'the sleeping boat',
  message: 'whoever sailed it must have stayed',
  build({ scene, solids }) {
    const group = anchorAt(scene, 'wreck', { yOffset: -0.25, rotation: 0.9 });
    const hull = flat(0x7c5f4a), pale = flat(0xb59a7c), sail = flat(0xe9e0cf, { side: THREE.DoubleSide });
    const hullGeometry = new THREE.CylinderGeometry(1.3, 1.3, 5, 10, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2);
    const shell = addMesh(group, hullGeometry, hull, { position: [0, 0.9, 0], rotation: [0, 0, 0.35] });
    shell.material.side = THREE.DoubleSide;
    for (let i = -2; i <= 2; i++) addMesh(group, new THREE.BoxGeometry(2.3, 0.08, 0.25), pale, { position: [0.1, 0.55, i * 0.9], rotation: [0, 0, 0.35] });
    addMesh(group, new THREE.CylinderGeometry(0.08, 0.1, 4.5, 6), pale, { position: [2.4, 0.2, 0.5], rotation: [0, 0.3, Math.PI / 2.2] });
    addMesh(group, new THREE.PlaneGeometry(2.4, 1.6), sail, { position: [3.2, 0.12, 1.4], rotation: [-Math.PI / 2, 0, 0.4] });
    for (const [x, z, s] of [[-2, 2.2, 0.6], [-2.6, 1.4, 0.45]]) addMesh(group, new THREE.BoxGeometry(s, s, s), pale, { position: [x, s / 2, z], rotation: [0, x, 0] });
    addSolid(solids, group, 0, 0, 1.6);
    addSolid(solids, group, 0, 1.8, 1.2);
    addSolid(solids, group, 0, -1.8, 1.2);
    return null;
  },
};
