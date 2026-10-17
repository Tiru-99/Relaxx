import * as THREE from 'three';
import { rand } from '../core/math.js';
import { addMesh, addSolid, anchorAt, flat } from './shared.js';

/** The Moss Gate: an old stone arch in the western woods, half reclaimed by vines. */
export const mossGate = {
  id: 'mossGate',
  name: 'the moss gate',
  message: 'old stones open onto a slower path',
  build({ scene, solids }) {
    const group = anchorAt(scene, 'mossGate', { rotation: -0.5 });
    const stone = flat(0x929b8c, { roughness: 1 });
    const block = new THREE.DodecahedronGeometry(0.65, 0);
    const pieces = [
      [-0.85, 0.75, 0.5, 1.5], [0.85, 0.75, 0.5, 1.5],
      [-0.55, 1.75, 0.65, 0.45], [0.55, 1.75, 0.65, 0.45], [0, 2.02, 0.65, 0.38],
    ];
    for (const [x, y, sx, sy] of pieces) {
      addMesh(group, block, stone, { position: [x, y, 0], scale: [sx, sy, 0.55], rotation: [rand(-0.12, 0.12), rand(-0.12, 0.12), rand(-0.12, 0.12)] });
    }
    const vine = flat(0x5f8d5b);
    const leaf = new THREE.SphereGeometry(0.16, 6, 5);
    for (let i = 0; i < 9; i++) addMesh(group, leaf, vine, { position: [-0.8 + i * 0.2, 2.25 - Math.abs(i - 4) * 0.12, 0.42], scale: [1.4, 0.55, 0.6] });
    addSolid(solids, group, -0.85, 0, 0.45);
    addSolid(solids, group, 0.85, 0, 0.45);
    return null;
  },
};
