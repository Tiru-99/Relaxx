import * as THREE from 'three';
import { TAU } from '../core/math.js';
import { addMesh, addSolid, anchorAt, flat } from './shared.js';

/** Stargazer's Rest: a bench and an old telescope. After dark, a constellation draws itself above. */
const CONSTELLATION = [[0, 0], [2, 1.4], [4.5, 1], [6, 2.8], [8.5, 2.2], [6, 2.8], [5.4, 5.2], [7.8, 6.6]];

export const stargazer = {
  id: 'stargazer',
  name: "stargazer's rest",
  message: 'come back after dark and look up',
  build({ scene, solids, env }) {
    const group = anchorAt(scene, 'stargazer', { rotation: 2.4 });
    const wood = flat(0x80604a), brass = new THREE.MeshStandardMaterial({ color: 0xc9a86a, metalness: 0.6, roughness: 0.4 });
    addMesh(group, new THREE.BoxGeometry(2, 0.12, 0.6), wood, { position: [0, 0.55, 0] });
    addMesh(group, new THREE.BoxGeometry(2, 0.5, 0.1), wood, { position: [0, 0.9, -0.3] });
    for (const x of [-0.85, 0.85]) addMesh(group, new THREE.BoxGeometry(0.1, 0.55, 0.5), wood, { position: [x, 0.27, 0] });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU;
      addMesh(group, new THREE.CylinderGeometry(0.03, 0.03, 1.4, 4), wood, { position: [2 + Math.cos(a) * 0.3, 0.65, Math.sin(a) * 0.3], rotation: [Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25] });
    }
    addMesh(group, new THREE.CylinderGeometry(0.09, 0.13, 1.1, 8), brass, { position: [2, 1.45, 0], rotation: [0.9, 0, 0] });
    addSolid(solids, group, 0, 0, 1);
    addSolid(solids, group, 2, 0, 0.4);

    // Faint lines between bright points, only visible at night.
    const points = [];
    for (let i = 0; i < CONSTELLATION.length - 1; i++) {
      const [ax, ay] = CONSTELLATION[i], [bx, by] = CONSTELLATION[i + 1];
      points.push(new THREE.Vector3(ax * 3 - 12, 40 + ay * 3, -30), new THREE.Vector3(bx * 3 - 12, 40 + by * 3, -30));
    }
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0, fog: false });
    const lines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), lineMaterial);
    group.add(lines);

    return (dt, time) => {
      lineMaterial.opacity = Math.max(0, env.night - 0.5) * 1.2 * (0.8 + Math.sin(time * 0.5) * 0.2);
      lines.visible = lineMaterial.opacity > 0.01;
    };
  },
};
